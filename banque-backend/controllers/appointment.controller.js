const db = require("../config/db");

// ✅ GET DISPONIBILITÉS
exports.getDisponibilites = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') as date, heure
       FROM disponibilites
       WHERE est_disponible = true
         AND date >= CURRENT_DATE
       ORDER BY date ASC, heure ASC`
    );

    // Grouper par date
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.date]) grouped[row.date] = [];
      grouped[row.date].push({ id: row.id, heure: row.heure });
    });

    const dates = Object.entries(grouped).map(([date, creneaux]) => ({ date, creneaux }));
    res.json(dates);
  } catch (err) {
    console.error("Erreur getDisponibilites ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ CRÉER RDV avec créneau dispo
exports.createAppointmentWithDispo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { disponibilite_id, reason, agence, conseiller } = req.body;

    if (!disponibilite_id || !reason) {
      return res.status(400).json({ message: "Créneau et motif requis" });
    }

    // Vérifier que le créneau est encore disponible
    const dispoResult = await db.query(
      "SELECT * FROM disponibilites WHERE id = $1 AND est_disponible = true",
      [disponibilite_id]
    );

    if (!dispoResult.rows.length) {
      return res.status(400).json({ message: "Ce créneau n'est plus disponible" });
    }

    const dispo = dispoResult.rows[0];
    const dateStr = typeof dispo.date === 'string'
      ? dispo.date.slice(0, 10)
      : dispo.date.toISOString().slice(0, 10);
    const datetime = `${dateStr}T${dispo.heure}`;

    // Créer le RDV
    await db.query(
      `INSERT INTO appointments (user_id, datetime, reason, agence, conseiller, status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
      [userId, datetime, reason,
       agence || "Wifak Bank Ksar Hellal",
       conseiller || "Conseiller Clientèle"]
    );

    // Marquer créneau indisponible
    await db.query(
      "UPDATE disponibilites SET est_disponible = false WHERE id = $1",
      [disponibilite_id]
    );

    res.status(201).json({ message: "Rendez-vous confirmé ✅" });
  } catch (err) {
    console.error("Erreur createAppointmentWithDispo ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ MES RDV
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      "SELECT * FROM appointments WHERE user_id = $1 ORDER BY datetime DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ MODIFIER RDV
exports.updateAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { datetime, reason } = req.body;

    const result = await db.query(
      "UPDATE appointments SET datetime = $1, reason = $2 WHERE id = $3 AND user_id = $4",
      [datetime, reason, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }
    res.json({ message: "Rendez-vous modifié ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ ANNULER RDV
exports.deleteAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { raison_annulation } = req.body;

    const result = await db.query(
      "UPDATE appointments SET status = 'cancelled', raison_annulation = $1 WHERE id = $2 AND user_id = $3",
      [raison_annulation || "Non précisé", id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }
    res.json({ message: "Rendez-vous annulé ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ FALLBACK - ancienne méthode sans dispo
exports.createAppointment = exports.createAppointmentWithDispo;
