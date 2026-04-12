const db = require("../config/db");
const { sendPushNotification } = require("./notification.controller");

// ✅ VIREMENT
exports.virement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { iban_destinataire, nom_destinataire, montant, motif } = req.body;

    if (!iban_destinataire || !nom_destinataire || !montant) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      return res.status(400).json({ message: "Montant invalide" });
    }

    // Récupérer le compte source
    const sourceResult = await db.query(
      "SELECT id, balance FROM accounts WHERE user_id = $1",
      [userId]
    );

    if (!sourceResult.rows.length) {
      return res.status(404).json({ message: "Compte source introuvable" });
    }

    const sourceAccount = sourceResult.rows[0];

    if (parseFloat(sourceAccount.balance) < montantNum) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }

    // Chercher le compte destinataire par IBAN
    const destResult = await db.query(
      "SELECT id FROM accounts WHERE iban = $1",
      [iban_destinataire.replace(/\s/g, "")]
    );

    // Débiter le compte source
    await db.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [montantNum, sourceAccount.id]
    );

    // Enregistrer la transaction débit
    await db.query(
      `INSERT INTO transactions (account_id, type, amount, description, created_at)
       VALUES ($1, 'debit', $2, $3, NOW())`,
      [
        sourceAccount.id,
        montantNum,
        motif || `Virement vers ${nom_destinataire}`,
      ]
    );

    // Si le destinataire est dans la même banque → créditer
    if (destResult.rows.length) {
      const destAccountId = destResult.rows[0].id;

      await db.query(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        [montantNum, destAccountId]
      );

      await db.query(
        `INSERT INTO transactions (account_id, type, amount, description, created_at)
         VALUES ($1, 'credit', $2, $3, NOW())`,
        [
          destAccountId,
          montantNum,
          motif || `Virement reçu de compte ${sourceAccount.id}`,
        ]
      );
    }

    // ✅ Envoyer notification push
    await sendPushNotification(
      userId,
      "virement",
      "Virement effectué",
      `Votre virement de ${montantNum} TND vers ${nom_destinataire} a été effectué.`
    );

    return res.status(200).json({
      message: "Virement effectué avec succès ✅",
      montant: montantNum,
      destinataire: nom_destinataire,
    });
  } catch (err) {
    console.error("Erreur virement ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le compte du user
    const accountResult = await db.query(
      "SELECT id FROM accounts WHERE user_id = $1",
      [userId]
    );

    if (!accountResult.rows.length) {
      return res.status(404).json({ message: "Aucun compte trouvé" });
    }

    const accountId = accountResult.rows[0].id;

    // Récupérer transactions
    const txResult = await db.query(
      "SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC",
      [accountId]
    );

    res.json(txResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};