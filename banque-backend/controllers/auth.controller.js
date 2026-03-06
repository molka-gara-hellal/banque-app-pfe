const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// ✅ REGISTER
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const exists = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (exists.rows.length) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (nom, prenom, email, password, telephone, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [nom || "", prenom || "", email, hashedPassword, telephone || "", "client"]
    );

    return res.status(201).json({ message: "Utilisateur créé ✅" });
  } catch (err) {
    console.error("Erreur register ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const result = await db.query(
      "SELECT id, email, password, role FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    const user = result.rows[0];

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login réussi ✅",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erreur login ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ ME
exports.me = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      "SELECT id, email, role, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur me ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ SEND OTP BY EMAIL
exports.sendOtpEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash("sha256").update(otp).digest("hex");

    const ttl = Number(process.env.OTP_TTL_SECONDS || 300);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await db.query(
      "INSERT INTO otp_codes (identifier, code_hash, expires_at) VALUES ($1, $2, $3)",
      [email, codeHash, expiresAt]
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log("Connexion SMTP OK ✅");
    console.log("Envoi vers :", email);
    console.log("MAIL_FROM :", process.env.MAIL_FROM);

    const info = await transporter.sendMail({
      from: `"Wifak Bank" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: "Votre code OTP - Wifak Bank",
      text: `Votre code OTP est : ${otp}. Il est valable ${Math.floor(ttl / 60)} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Wifak Bank</h2>
          <p>Votre code OTP est :</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>Ce code est valable ${Math.floor(ttl / 60)} minutes.</p>
        </div>
      `,
    });

    console.log("Email envoyé ✅");
    console.log("Message ID :", info.messageId);
    console.log("SMTP response :", info.response);

    return res.status(200).json({
      message: "OTP envoyé par email ✅",
      response: info.response,
    });
  } catch (err) {
    console.error("Erreur envoi OTP ❌", err);
    return res.status(500).json({
      message: "Erreur envoi OTP",
      error: err.message,
    });
  }
};

// ✅ FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    // Vérifier que l'utilisateur existe
    const result = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    // On répond toujours avec succès (sécurité : ne pas révéler si l'email existe)
    if (!result.rows.length) {
      return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé ✅" });
    }

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Supprimer les anciens tokens de cet email et sauvegarder le nouveau
    await db.query("DELETE FROM password_reset_tokens WHERE email = $1", [email]);
    await db.query(
      "INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)",
      [email, token, expiresAt]
    );

    // Construire le lien de réinitialisation
    const resetLink = `${process.env.APP_URL || "http://localhost:8081"}/(auth)/reset-password?token=${token}`;

    // Envoyer l'email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Wifak Bank" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe - Wifak Bank",
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}\nCe lien expire dans 1 heure.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 500px; margin: auto;">
          <h2 style="color: #1a3c6e;">Wifak Bank</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetLink}" style="
            display: inline-block;
            background-color: #1a3c6e;
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
          ">Réinitialiser mon mot de passe</a>
          <p style="color: #888; font-size: 13px;">Ce lien est valable <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });

    console.log("Email reset envoyé à :", email);
    return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé ✅" });
  } catch (err) {
    console.error("Erreur forgotPassword ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token et nouveau mot de passe requis" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    // Vérifier le token
    const result = await db.query(
      "SELECT email, expires_at FROM password_reset_tokens WHERE token = $1",
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Lien invalide ou déjà utilisé" });
    }

    const row = result.rows[0];

    // Vérifier l'expiration
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
      return res.status(400).json({ message: "Lien expiré. Veuillez refaire une demande." });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await db.query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [hashedPassword, row.email]
    );

    // Supprimer le token (usage unique)
    await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);

    console.log("Mot de passe réinitialisé pour :", row.email);
    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès ✅" });
  } catch (err) {
    console.error("Erreur resetPassword ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email et OTP requis" });
    }

    const result = await db.query(
      "SELECT id, code_hash, expires_at FROM otp_codes WHERE identifier = $1 ORDER BY id DESC LIMIT 1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "OTP introuvable" });
    }

    const row = result.rows[0];

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expiré" });
    }

    const incomingHash = crypto
      .createHash("sha256")
      .update(String(otp))
      .digest("hex");

    if (incomingHash !== row.code_hash) {
      return res.status(400).json({ message: "OTP incorrect" });
    }

    await db.query("DELETE FROM otp_codes WHERE id = $1", [row.id]);

    return res.json({ message: "OTP vérifié ✅" });
  } catch (err) {
    console.error("Erreur verify OTP ❌", err);
    return res.status(500).json({ message: "Erreur vérification OTP" });
  }
};