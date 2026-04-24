const db = require("../config/db");
const crypto = require("crypto");

// ─── Enregistrer une session lors du login ────────────────────────────────────
exports.createSession = async (userId, token, req) => {
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const ua = req.headers["user-agent"] || "";
    const xDeviceName = req.headers["x-device-name"] || "";
    const xDeviceType = req.headers["x-device-type"] || "";
    const xDeviceModel = req.headers["x-device-model"] || "";
    const xDeviceOS = req.headers["x-device-os"] || "";

    let deviceName = "Appareil inconnu";
    let deviceType = "other";

    // Priorité 1 : headers envoyés explicitement par l'app mobile
    if (xDeviceName) {
      deviceName = xDeviceName;
      deviceType = xDeviceType || "mobile";
      if (xDeviceModel) deviceName = xDeviceModel;
      if (xDeviceOS) deviceName = `${xDeviceModel || xDeviceName} (${xDeviceOS})`;
    }
    // Priorité 2 : User-Agent
    else if (ua.includes("iPhone")) {
      const match = ua.match(/iPhone OS (\d+[_\d]*)/);
      const ios = match ? "iOS " + match[1].replace(/_/g, ".") : "iOS";
      deviceName = `iPhone (${ios})`;
      deviceType = "mobile";
    } else if (ua.includes("iPad")) {
      deviceName = "iPad";
      deviceType = "tablet";
    } else if (ua.includes("SM-") || ua.includes("Samsung")) {
      const match = ua.match(/SM-([A-Z0-9]+)/);
      deviceName = match ? `Samsung Galaxy (${match[1]})` : "Samsung";
      deviceType = "mobile";
    } else if (ua.includes("Xiaomi") || ua.includes("Redmi") || ua.includes("MI ")) {
      const match = ua.match(/Xiaomi ([^;)]+)|Redmi ([^;)]+)/);
      deviceName = match ? (match[1] || match[2]).trim() : "Xiaomi";
      deviceType = "mobile";
    } else if (ua.includes("Huawei") || ua.includes("HUAWEI")) {
      const match = ua.match(/HUAWEI ([^;) ]+)/);
      deviceName = match ? `Huawei ${match[1]}` : "Huawei";
      deviceType = "mobile";
    } else if (ua.includes("Android") && ua.includes("Mobile")) {
      const match = ua.match(/; ([^;)]+) Build/);
      deviceName = match ? match[1].trim() : "Android";
      deviceType = "mobile";
    } else if (ua.includes("Android")) {
      deviceName = "Tablette Android";
      deviceType = "tablet";
    } else if (ua.includes("Windows NT")) {
      const match = ua.match(/Windows NT ([\d.]+)/);
      const ver = match ? match[1] : "";
      const name = ver === "10.0" ? "Windows 10/11" : `Windows (NT ${ver})`;
      deviceName = name;
      deviceType = "desktop";
    } else if (ua.includes("Macintosh")) {
      deviceName = "Mac";
      deviceType = "desktop";
    } else if (ua.includes("Linux")) {
      deviceName = "Linux PC";
      deviceType = "desktop";
    } else if (ua.includes("Expo") || ua.includes("okhttp") || ua.includes("Dart")) {
      deviceName = "Application Mobile";
      deviceType = "mobile";
    } else {
      deviceName = "Appareil inconnu";
      deviceType = "other";
    }

    const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "Inconnue")
      .split(",")[0].trim();

    const location = "Tunisie";

    // Désactiver les anciennes sessions du même appareil/IP
    await db.query(
      `UPDATE sessions SET is_active = false WHERE user_id = $1 AND ip_address = $2 AND device_type = $3`,
      [userId, ip, deviceType]
    );

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