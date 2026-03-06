const db = require("../config/db");

exports.getMyAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      "SELECT * FROM accounts WHERE user_id = $1",
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Aucun compte trouvé" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};