const db = require("../config/db");

// ─── GET préférences ──────────────────────────────────────────────────────────
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT transactions, virements, rendez_vous, offres, securite, push_token
       FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      // Retourner les valeurs par défaut
      return res.json({
        transactions: true,
        virements: true,
        rendez_vous: true,
        offres: true,
        securite: true,
        push_token: null,
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur getPreferences ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── SAVE préférences ─────────────────────────────────────────────────────────
exports.savePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactions, virements, rendez_vous, offres, securite, push_token } = req.body;

    await db.query(
      `INSERT INTO notification_preferences
         (user_id, transactions, virements, rendez_vous, offres, securite, push_token, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         transactions = $2,
         virements    = $3,
         rendez_vous  = $4,
         offres       = $5,
         securite     = $6,
         push_token   = COALESCE($7, notification_preferences.push_token),
         updated_at   = NOW()`,
      [userId, transactions ?? true, virements ?? true,
       rendez_vous ?? true, offres ?? true, securite ?? true,
       push_token || null]
    );

    res.json({ message: "Préférences enregistrées ✅" });
  } catch (err) {
    console.error("Erreur savePreferences ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── Envoyer une notification push (appelé en interne) ───────────────────────
exports.sendPushNotification = async (userId, type, title, body) => {
  try {
    // Vérifier si l'utilisateur a activé ce type de notif
    const result = await db.query(
      `SELECT push_token, transactions, virements, rendez_vous, offres, securite
       FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows.length) return;

    const prefs = result.rows[0];
    const pushToken = prefs.push_token;

    // Vérifier préférence selon le type
    const typeMap = {
      transaction: prefs.transactions,
      virement: prefs.virements,
      rdv: prefs.rendez_vous,
      offre: prefs.offres,
      securite: prefs.securite,
    };

    if (!typeMap[type]) return; // notif désactivée
    if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;

    // Envoyer via Expo Push API
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title,
        body,
        data: { type },
      }),
    });

    console.log(`✅ Notification envoyée à user ${userId}: ${title}`);
  } catch (err) {
    console.error("Erreur sendPushNotification ❌", err.message);
  }
};