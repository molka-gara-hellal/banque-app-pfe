const db = require("../config/db");

// Liste clients
exports.getAllClients = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, role, created_at FROM users WHERE role = 'client'"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Détail client
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT id, email, role, created_at FROM users WHERE id = ?",
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Client non trouvé" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Stats simples
exports.getStats = async (req, res) => {
  try {
    const [[users]] = await db.query(
      "SELECT COUNT(*) as total_users FROM users"
    );

    const [[transactions]] = await db.query(
      "SELECT COUNT(*) as total_transactions FROM transactions"
    );

    res.json({
      total_users: users.total_users,
      total_transactions: transactions.total_transactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};