const db = require("../config/db");

// ─── Middleware agent (tous les rôles agents autorisés) ───────────────────────
// Utilisé dans les routes pour autoriser les agents (pas seulement admin)
const AGENT_ROLES = ['chef_agence', 'charge_clientele', 'guichet_accueil', 'responsable_guichet', 'admin'];

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

// GET /api/admin/clients — tous les clients avec leurs comptes
exports.getAllClients = async (req, res) => {
  try {
    const usersResult = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.created_at,
              a.id as account_id, a.iban, a.balance, a.account_type, a.currency
       FROM users u
       LEFT JOIN accounts a ON a.user_id = u.id
       WHERE u.role = 'client'
       ORDER BY u.created_at DESC`
    );

    // Grouper les comptes par client
    const clientsMap = {};
    for (const row of usersResult.rows) {
      if (!clientsMap[row.id]) {
        clientsMap[row.id] = {
          id: row.id,
          name: `${row.prenom} ${row.nom}`,
          prenom: row.prenom,
          nom: row.nom,
          email: row.email,
          phone: row.telephone,
          created_at: row.created_at,
          accounts: [],
        };
      }
      if (row.account_id) {
        clientsMap[row.id].accounts.push({
          id: row.account_id,
          num: row.iban,
          balance: parseFloat(row.balance || 0),
          iban: row.iban,
          type: row.account_type || 'Compte Courant',
        });
      }
    }

    res.json(Object.values(clientsMap));
  } catch (err) {
    console.error("Erreur getAllClients ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /api/admin/clients/:id — détail client avec transactions
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.created_at
       FROM users u WHERE u.id = $1 AND u.role = 'client'`,
      [id]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    const user = userResult.rows[0];

    // Comptes
    const accountsResult = await db.query(
      `SELECT id, iban, balance, account_type FROM accounts WHERE user_id = $1`,
      [id]
    );

    // Transactions (10 dernières)
    const txnsResult = await db.query(
      `SELECT t.id, t.type, t.amount, t.description, t.created_at, a.account_number
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE a.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      id: user.id,
      name: `${user.prenom} ${user.nom}`,
      email: user.email,
      phone: user.telephone,
      created_at: user.created_at,
      accounts: accountsResult.rows.map(a => ({
        num: a.iban,
        balance: parseFloat(a.balance || 0),
        iban: a.iban,
        type: a.account_type || 'Compte Courant',
      })),
      txns: txnsResult.rows.map(t => ({
        id: t.id,
        date: t.created_at,
        type: t.type,
        amount: parseFloat(t.amount),
        desc: t.description,
        acc: t.account_number,
      })),
    });
  } catch (err) {
    console.error("Erreur getClientById ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── RENDEZ-VOUS ──────────────────────────────────────────────────────────────

// GET /api/admin/appointments — tous les RDV
exports.getAllAppointments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.id, a.datetime, a.reason, a.status, a.agence, a.conseiller,
              u.nom, u.prenom, u.email, u.telephone
       FROM appointments a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.datetime DESC`
    );

    const rdvs = result.rows.map(r => ({
      id: r.id,
      name: `${r.prenom} ${r.nom}`,
      email: r.email,
      phone: r.telephone,
      date: r.datetime ? new Date(r.datetime).toISOString().split('T')[0] : '',
      time: r.datetime ? new Date(r.datetime).toTimeString().slice(0,5) : '',
      reason: r.reason,
      status: r.status || 'pending',
      agence: r.agence,
    }));

    res.json(rdvs);
  } catch (err) {
    console.error("Erreur getAllAppointments ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /api/admin/appointments/:id — confirmer/annuler RDV
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query(
      `UPDATE appointments SET status = $1 WHERE id = $2`,
      [status, id]
    );

    res.json({ message: "Statut mis à jour ✅" });
  } catch (err) {
    console.error("Erreur updateAppointmentStatus ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── STATS ────────────────────────────────────────────────────────────────────

// GET /api/admin/stats — stats dashboard
exports.getStats = async (req, res) => {
  try {
    const [clients, accounts, transactions, appointments] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM users WHERE role = 'client'`),
      db.query(`SELECT COUNT(*) as total, COALESCE(SUM(balance), 0) as total_balance FROM accounts`),
      db.query(`SELECT COUNT(*) as total FROM transactions`),
      db.query(`SELECT COUNT(*) as total FROM appointments WHERE status = 'pending'`),
    ]);

    res.json({
      total_clients: parseInt(clients.rows[0].total),
      total_accounts: parseInt(accounts.rows[0].total),
      total_balance: parseFloat(accounts.rows[0].total_balance),
      total_transactions: parseInt(transactions.rows[0].total),
      pending_appointments: parseInt(appointments.rows[0].total),
    });
  } catch (err) {
    console.error("Erreur getStats ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── SEGMENTATION ML ─────────────────────────────────────────────────────────

// GET /api/admin/segmentation — clients avec score et segment
exports.getSegmentation = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nom, u.prenom,
              a.iban, a.balance,
              COUNT(t.id) as txn_count
       FROM users u
       JOIN accounts a ON a.user_id = u.id
       LEFT JOIN transactions t ON t.account_id = a.id
         AND t.created_at >= NOW() - INTERVAL '30 days'
       WHERE u.role = 'client'
       GROUP BY u.id, u.nom, u.prenom, a.iban, a.balance
       ORDER BY a.balance DESC`
    );

    const clients = result.rows.map(r => {
      const balance = parseFloat(r.balance || 0);
      const txn = parseInt(r.txn_count || 0);

      let cls, score;
      if (balance > 75000 && txn > 35)      { cls = 'fidèle';   score = Math.min(95, 70 + Math.floor(balance / 5000)); }
      else if (balance > 30000 && txn > 15) { cls = 'actif';    score = Math.min(80, 50 + Math.floor(balance / 3000)); }
      else if (balance > 5000)              { cls = 'inactif';  score = Math.min(60, 30 + Math.floor(balance / 1000)); }
      else                                  { cls = 'à risque'; score = Math.max(10, Math.floor(balance / 500)); }

      return {
        id: r.id,
        name: `${r.prenom} ${r.nom}`,
        acc: r.iban,
        balance,
        txn,
        cls,
        score,
      };
    });

    res.json(clients);
  } catch (err) {
    console.error("Erreur getSegmentation ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};