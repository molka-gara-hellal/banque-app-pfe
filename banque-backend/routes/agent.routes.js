const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// POST /api/agents/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Chercher l'agent dans la table users avec un rôle agent
    const result = await db.query(
      `SELECT id, nom, prenom, email, password, role
       FROM users
       WHERE email = $1
       AND role IN ('chef_agence', 'charge_clientele', 'guichet_accueil', 'responsable_guichet')`,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Compte agent introuvable" });
    }

    const agent = result.rows[0];

    const valid = await bcrypt.compare(password, agent.password);
    if (!valid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: agent.id, role: agent.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      agent: {
        id: agent.id,
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        role: agent.role,
        fullName: `${agent.prenom} ${agent.nom}`,
      },
    });
  } catch (err) {
    console.error("Erreur login agent ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;