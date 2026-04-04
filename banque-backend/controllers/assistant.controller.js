const db = require("../config/db");

const SYSTEM_PROMPT = `Tu es l'assistant virtuel intelligent de Wifak Bank, une banque islamique tunisienne.

Ton rôle :
- Répondre UNIQUEMENT en français
- Aider les clients avec leurs questions bancaires
- Être poli, professionnel et concis (2-4 phrases maximum par réponse)
- Ne jamais divulguer d'informations confidentielles ou de données d'autres clients

Services disponibles dans l'application Wifak Bank :
1. 🏠 Accueil (Dashboard) — solde, résumé du compte
2. 💳 Comptes — détail des comptes, relevés PDF
3. 💸 Virement — virement entre comptes ou vers un bénéficiaire
4. 📅 Rendez-vous — prendre/annuler un RDV en agence
5. 💬 Assistant — tu es ici !
6. 👤 Profil — informations personnelles, sécurité, notifications

Pour les actions concrètes (virement, rdv, solde), guide toujours l'utilisateur vers la bonne section de l'app plutôt que d'agir toi-même.

Si l'utilisateur demande à parler à un humain, dis-lui d'aller dans Profil → Contacter le support.
Si la question n'est pas bancaire, réponds poliment que tu es spécialisé dans les services Wifak Bank.`;

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages requis" });
    }

    // Récupérer infos client pour personnaliser les réponses
    let userContext = "";
    try {
      const userResult = await db.query(
        "SELECT prenom, nom FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length > 0) {
        const { prenom, nom } = userResult.rows[0];
        userContext = `\n\nClient connecté : ${prenom} ${nom}. Tu peux l'appeler par son prénom.`;
      }
    } catch (e) {
      // Continue sans contexte utilisateur
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Clé API non configurée" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT + userContext,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Claude API error:", err);
      return res.status(502).json({ message: "Erreur API Claude" });
    }

    const data = await response.json();
    const reply = data.content[0]?.text || "Je suis désolé, je n'ai pas pu traiter votre demande.";

    res.json({ reply });
  } catch (err) {
    console.error("Erreur assistant ❌", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
