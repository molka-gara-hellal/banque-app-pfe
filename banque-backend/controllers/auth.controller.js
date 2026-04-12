const bcrypt = require("bcryptjs");
const { createSession } = require("./session.controller");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// ✅ REGISTER — crée le compte avec status='pending'
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

    // ✅ status = 'pending' — en attente de validation agent
    await db.query(
      "INSERT INTO users (nom, prenom, email, password, telephone, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [nom || "", prenom || "", email, hashedPassword, telephone || "", "client", "pending"]
    );

    return res.status(201).json({ message: "Compte créé — en attente de validation ✅" });
  } catch (err) {
    console.error("Erreur register ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ LOGIN — vérifie que le compte est actif
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const result = await db.query(
      "SELECT id, email, password, role, status FROM users WHERE email = $1",
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

    // ✅ Bloquer si compte en attente
    if (user.status === "pending") {
      return res.status(403).json({
        message: "Votre compte est en attente de validation par un agent Wifak Bank.",
        status: "pending"
      });
    }

    // ✅ Bloquer si compte rejeté
    if (user.status === "rejected") {
      return res.status(403).json({
        message: "Votre demande d'inscription a été refusée. Contactez votre agence.",
        status: "rejected"
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Enregistrer la session (appareil connecté)
    await createSession(user.id, token, req);

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
      "SELECT id, nom, prenom, email, role, status, created_at FROM users WHERE id = $1",
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

// ✅ CHECK STATUS — vérifie si le compte a été activé (polling depuis l'app)
exports.checkStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    const result = await db.query(
      "SELECT status FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json({ status: result.rows[0].status });
  } catch (err) {
    console.error("Erreur checkStatus ❌", err);
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

    console.log("Email envoyé ✅", info.messageId);

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

    const result = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé ✅" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query("DELETE FROM password_reset_tokens WHERE email = $1", [email]);
    await db.query(
      "INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)",
      [email, token, expiresAt]
    );

    const resetLink = `${process.env.APP_URL || "http://localhost:8081"}/(auth)/reset-password?token=${token}`;

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
          <a href="${resetLink}" style="display: inline-block; background-color: #1a3c6e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Réinitialiser mon mot de passe</a>
          <p style="color: #888; font-size: 13px;">Ce lien est valable <strong>1 heure</strong>.</p>
        </div>
      `,
    });

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

    const result = await db.query(
      "SELECT email, expires_at FROM password_reset_tokens WHERE token = $1",
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Lien invalide ou déjà utilisé" });
    }

    const row = result.rows[0];

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
      return res.status(400).json({ message: "Lien expiré. Veuillez refaire une demande." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [hashedPassword, row.email]
    );

    await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);

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

    // ✅ Retourne le status du compte pour que l'app sache quoi afficher
    const userResult = await db.query(
      "SELECT status FROM users WHERE email = $1",
      [email]
    );
    const status = userResult.rows[0]?.status || "pending";

    return res.json({ message: "OTP vérifié ✅", status });
  } catch (err) {
    console.error("Erreur verify OTP ❌", err);
    return res.status(500).json({ message: "Erreur vérification OTP" });
  }
};

// ✅ CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Mot de passe actuel et nouveau requis" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    const result = await db.query("SELECT password FROM users WHERE id = $1", [userId]);
    if (!result.rows.length) return res.status(404).json({ message: "Utilisateur introuvable" });

    const ok = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!ok) return res.status(400).json({ message: "Mot de passe actuel incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, userId]);

    return res.json({ message: "Mot de passe modifié avec succès ✅" });
  } catch (err) {
    console.error("Erreur changePassword ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { prenom, nom, telephone } = req.body;
    const userId = req.user.id;

    await db.query(
      "UPDATE users SET prenom = COALESCE($1, prenom), nom = COALESCE($2, nom), telephone = COALESCE($3, telephone) WHERE id = $4",
      [prenom, nom, telephone, userId]
    );

    const result = await db.query(
      "SELECT id, nom, prenom, email, telephone, role FROM users WHERE id = $1",
      [userId]
    );

    return res.json({ message: "Profil mis à jour ✅", user: result.rows[0] });
  } catch (err) {
    console.error("Erreur updateProfile ❌", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};