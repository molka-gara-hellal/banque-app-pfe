const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ✅ REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Vérifier email
    const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Role: si fourni ET valide -> sinon client
    const finalRole = role === "admin" ? "admin" : "client";

    // Insert user
    await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, finalRole]
    );

    return res.status(201).json({ message: "Utilisateur créé ✅" });
  } catch (err) {
    console.error(err);
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

    // Récupérer user + role
    const [rows] = await db.query(
      "SELECT id, email, password, role FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    const user = rows[0];

    // Compare password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // JWT avec role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login réussi ✅",
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ ME (profil connecté)
exports.me = async (req, res) => {
  try {
    // req.user vient du token (authMiddleware)
    const userId = req.user.id;

    // Optionnel mais mieux: recharger depuis DB (au cas où role change)
    const [rows] = await db.query(
      "SELECT id, email, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};