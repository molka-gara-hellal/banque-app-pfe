const db = require("../config/db");

exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le compte du user
    const [accounts] = await db.query(
      "SELECT id FROM accounts WHERE user_id = ?",
      [userId]
    );

    if (!accounts.length) {
      return res.status(404).json({ message: "Aucun compte trouvé" });
    }

    const accountId = accounts[0].id;

    // Récupérer transactions
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC",
      [accountId]
    );

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};