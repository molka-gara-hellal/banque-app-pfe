const db = require("../config/db");

exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { datetime, reason } = req.body;

    if (!datetime || !reason) {
      return res.status(400).json({ message: "Date et motif requis" });
    }

    await db.query(
      "INSERT INTO appointments (user_id, datetime, reason) VALUES (?, ?, ?)",
      [userId, datetime, reason]
    );

    res.status(201).json({ message: "Rendez-vous créé ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM appointments WHERE user_id = ? ORDER BY datetime DESC",
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
exports.updateAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { datetime, reason } = req.body;

    const [result] = await db.query(
      "UPDATE appointments SET datetime = ?, reason = ? WHERE id = ? AND user_id = ?",
      [datetime, reason, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    res.json({ message: "Rendez-vous modifié ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
exports.deleteAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM appointments WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    res.json({ message: "Rendez-vous supprimé ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};