const db = require("../config/db");

// POST /api/support/messages — client envoie un message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sujet, message } = req.body;
    if (!sujet || !message) {
      return res.status(400).json({ message: "Sujet et message requis" });
    }
    await db.query(
      `INSERT INTO support_messages (user_id, sujet, message) VALUES ($1, $2, $3)`,
      [userId, sujet, message]
    );
    res.status(201).json({ message: "Message envoyé ✅" });
  } catch (err) {
    console.error("Erreur sendMessage ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /api/support/messages — agent voit tous les messages
exports.getAllMessages = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT sm.id, sm.sujet, sm.message, sm.statut, sm.reponse, sm.created_at,
              u.prenom, u.nom, u.email, u.telephone
       FROM support_messages sm
       JOIN users u ON u.id = sm.user_id
       ORDER BY sm.created_at DESC`
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      sujet: r.sujet,
      message: r.message,
      statut: r.statut,
      reponse: r.reponse,
      date: r.created_at,
      client: `${r.prenom} ${r.nom}`,
      email: r.email,
      phone: r.telephone,
    })));
  } catch (err) {
    console.error("Erreur getAllMessages ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /api/support/messages/:id — agent répond
exports.replyMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reponse } = req.body;
    await db.query(
      `UPDATE support_messages SET reponse = $1, statut = 'traité', updated_at = NOW() WHERE id = $2`,
      [reponse, id]
    );
    res.json({ message: "Réponse envoyée ✅" });
  } catch (err) {
    console.error("Erreur replyMessage ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
// GET /api/support/my-messages — client voit ses messages et les réponses
exports.getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT id, sujet, message, statut, reponse, created_at, updated_at
       FROM support_messages
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur getMyMessages ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};