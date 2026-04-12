const db = require("../config/db");
const crypto = require("crypto");

// ─── Enregistrer une session lors du login ────────────────────────────────────
exports.createSession = async (userId, token, req) => {
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Détecter le type d'appareil depuis User-Agent
    const ua = req.headers["user-agent"] || "";
    let deviceName = "Appareil inconnu";
    let deviceType = "other";

    if (ua.includes("iPhone")) { deviceName = "iPhone"; deviceType = "mobile"; }
    else if (ua.includes("iPad")) { deviceName = "iPad"; deviceType = "tablet"; }
    else if (ua.includes("Android") && ua.includes("Mobile")) { deviceName = "Android Mobile"; deviceType = "mobile"; }
    else if (ua.includes("Android")) { deviceName = "Android Tablet"; deviceType = "tablet"; }
    else if (ua.includes("Windows")) { deviceName = "Windows PC"; deviceType = "desktop"; }
    else if (ua.includes("Macintosh")) { deviceName = "Mac"; deviceType = "desktop"; }
    else if (ua.includes("Linux")) { deviceName = "Linux PC"; deviceType = "desktop"; }
    else if (ua.includes("Expo") || ua.includes("okhttp")) { deviceName = "Mobile App"; deviceType = "mobile"; }

    // Récupérer IP
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "Inconnue";

    // Localisation simplifiée (basée sur IP — toujours Tunisie pour un PFE local)
    const location = "Tunisie";

    // Désactiver les anciennes sessions du même appareil/IP si elles existent
    await db.query(
      `UPDATE sessions SET is_active = false
       WHERE user_id = $1 AND ip_address = $2 AND device_type = $3`,
      [userId, ip, deviceType]
    );

    // Créer la nouvelle session
    await db.query(
      `INSERT INTO sessions (user_id, device_name, device_type, location, ip_address, token_hash, last_active, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)`,
      [userId, deviceName, deviceType, location, ip, tokenHash]
    );
  } catch (err) {
    console.error("Erreur createSession ❌", err.message);
  }
};

// ─── GET /api/sessions — liste des appareils connectés ───────────────────────
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.headers.authorization?.replace("Bearer ", "") || "";
    const currentTokenHash = crypto.createHash("sha256").update(currentToken).digest("hex");

    const result = await db.query(
      `SELECT id, device_name, device_type, location, ip_address, last_active, token_hash
       FROM sessions
       WHERE user_id = $1 AND is_active = true
       ORDER BY last_active DESC`,
      [userId]
    );

    const sessions = result.rows.map(s => ({
      id: s.id,
      device_name: s.device_name,
      device_type: s.device_type,
      location: s.location,
      ip_address: s.ip_address,
      last_active: s.last_active,
      current: s.token_hash === currentTokenHash,
    }));

    res.json(sessions);
  } catch (err) {
    console.error("Erreur getSessions ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── DELETE /api/sessions/:id — déconnecter un appareil ──────────────────────
exports.deleteSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE sessions SET is_active = false
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Session introuvable" });
    }

    res.json({ message: "Appareil déconnecté ✅" });
  } catch (err) {
    console.error("Erreur deleteSession ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── DELETE /api/sessions — déconnecter tous les autres appareils ─────────────
exports.deleteAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.headers.authorization?.replace("Bearer ", "") || "";
    const currentTokenHash = crypto.createHash("sha256").update(currentToken).digest("hex");

    await db.query(
      `UPDATE sessions SET is_active = false
       WHERE user_id = $1 AND token_hash != $2`,
      [userId, currentTokenHash]
    );

    res.json({ message: "Tous les autres appareils déconnectés ✅" });
  } catch (err) {
    console.error("Erreur deleteAllOtherSessions ❌", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};