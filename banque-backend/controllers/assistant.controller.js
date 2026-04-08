const db = require("../config/db");

// ─── Détection d'intention ────────────────────────────────────────────────────
function detectIntent(message) {
  const msg = message.toLowerCase();

  if (msg.includes("solde") || msg.includes("compte") || msg.includes("argent"))
    return "SOLDE";

  if (
    msg.includes("virement") ||
    msg.includes("transférer") ||
    msg.includes("envoyer") ||
    msg.includes("payer")
  )
    return "VIREMENT";

  if (
    msg.includes("rendez-vous") ||
    msg.includes("rdv") ||
    msg.includes("agence") ||
    msg.includes("rencontrer")
  )
    return "RDV";

  if (
    msg.includes("transaction") ||
    msg.includes("historique") ||
    msg.includes("opération") ||
    msg.includes("mouvement")
  )
    return "TRANSACTIONS";

  return "GENERAL";
}

// ─── Récupération données réelles ─────────────────────────────────────────────
async function getAccountData(userId) {
  const result = await db.query(
    `SELECT a.*, u.prenom, u.nom
     FROM accounts a
     JOIN users u ON u.id = a.user_id
     WHERE a.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function getRecentTransactions(userId, limit = 5) {
  const result = await db.query(
    `SELECT t.type, t.amount, t.description, t.created_at
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     WHERE a.user_id = $1
     ORDER BY t.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

async function getNextAppointment(userId) {
  const result = await db.query(
    `SELECT date, heure, agence, motif, statut
     FROM appointments
     WHERE user_id = $1 AND date >= CURRENT_DATE
     ORDER BY date ASC, heure ASC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

// ─── Construction du contexte selon l'intention ───────────────────────────────
async function buildContextForIntent(intent, userId) {
  let dataContext = "";

  try {
    if (intent === "SOLDE") {
      const account = await getAccountData(userId);
      if (account) {
        const balance = parseFloat(account.balance).toFixed(3);
        const iban = account.iban || "N/A";
        dataContext = `
DONNÉES RÉELLES DU CLIENT (utilise ces données dans ta réponse) :
- Solde actuel : ${balance} TND
- IBAN : ${iban}
- Numéro de compte : ${account.account_number || account.id}
- Type de compte : ${account.type || "Compte courant"}
`;
      }
    } else if (intent === "TRANSACTIONS") {
      const transactions = await getRecentTransactions(userId, 5);
      if (transactions.length > 0) {
        const lines = transactions.map((t) => {
          const date = new Date(t.created_at).toLocaleDateString("fr-FR");
          const sign = t.type === "credit" ? "+" : "-";
          const amount = parseFloat(t.amount).toFixed(3);
          return `  • ${date} | ${sign}${amount} TND | ${t.description}`;
        });
        dataContext = `
DONNÉES RÉELLES DU CLIENT (affiche ces transactions dans ta réponse) :
Dernières opérations :
${lines.join("\n")}
`;
      } else {
        dataContext = `DONNÉES RÉELLES : Aucune transaction trouvée pour ce client.`;
      }
    } else if (intent === "RDV") {
      const rdv = await getNextAppointment(userId);
      if (rdv) {
        const date = new Date(rdv.date).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        dataContext = `
DONNÉES RÉELLES DU CLIENT :
- Prochain RDV : ${date} à ${rdv.heure}
- Agence : ${rdv.agence || "N/A"}
- Motif : ${rdv.motif || "N/A"}
- Statut : ${rdv.statut || "Confirmé"}
`;
      } else {
        dataContext = `DONNÉES RÉELLES : Le client n'a pas de rendez-vous à venir.`;
      }
    }
  } catch (e) {
    console.error("Erreur récupération données:", e.message);
  }

  return dataContext;
}

// ─── Prompt système ───────────────────────────────────────────────────────────
function buildSystemPrompt(intent, userContext, dataContext) {
  const basePrompt = `Tu es l'assistant virtuel de Wifak Bank, une banque islamique tunisienne.

Règles ABSOLUES :
- Réponds UNIQUEMENT en français
- Sois concis (3-5 phrases max)
- Tu as accès aux données réelles du client ci-dessous — utilise-les directement dans ta réponse
- Ne dis JAMAIS "consultez la page X" ou "allez dans l'onglet Y" si tu as déjà les données
- Pour le virement : explique le processus ET donne un lien avec le format [Aller au virement](virement)
- Pour le RDV : si le client veut en prendre un nouveau, donne le lien [Prendre un RDV](rdv)
- Si la question n'est pas bancaire, réponds poliment que tu es spécialisé Wifak Bank
${userContext}`;

  if (dataContext) {
    return basePrompt + "\n\n" + dataContext;
  }

  if (intent === "VIREMENT") {
    return (
      basePrompt +
      `

INSTRUCTION SPÉCIALE VIREMENT :
Explique comment faire un virement en 3 étapes simples avec un exemple concret :
1. Accéder à la page virement
2. Saisir IBAN destinataire + nom + montant + motif (facultatif)
3. Confirmer
Exemple : "Pour envoyer 100 TND à Mohamed Ali (IBAN : TN59 1234 5678 9012 3456 7890), ..."
Termine avec le lien : [👉 Aller à la page Virement](virement)
`
    );
  }

  return basePrompt;
}

// ─── Handler principal ────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages requis" });
    }

    // ✅ Clé Gemini (gratuite)
    const apiKey = process.env.GROQ_API_KEY;
    console.log("🔑 GROQ KEY présente ?", !!apiKey, apiKey ? apiKey.slice(0, 10) + "..." : "MANQUANTE");
    if (!apiKey) {
      return res.status(500).json({ message: "Clé Groq API non configurée" });
    }

    // Détecter l'intention du dernier message
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const intent = detectIntent(lastUserMsg);
    console.log("🎯 Intent:", intent, "| Message:", lastUserMsg);

    // Récupérer le prénom du client
    let userContext = "";
    try {
      const userResult = await db.query(
        "SELECT prenom, nom FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length > 0) {
        const { prenom, nom } = userResult.rows[0];
        userContext = `\nClient connecté : ${prenom} ${nom}. Tu peux l'appeler par son prénom.`;
      }
    } catch (_) {}

    // Récupérer les données réelles selon l'intention
    const dataContext = await buildContextForIntent(intent, userId);

    // Construire le system prompt
    const systemPrompt = buildSystemPrompt(intent, userContext, dataContext);

    // ✅ Appel Groq API (format OpenAI compatible)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 600,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("❌ Groq API error:", JSON.stringify(err));
      return res.status(502).json({ message: "Erreur API Groq" });
    }

    const data = await response.json();
    console.log("✅ Groq répondu OK");

    const reply =
      data.choices?.[0]?.message?.content ||
      "Je suis désolé, je n'ai pas pu traiter votre demande.";

    res.json({ reply, intent });
  } catch (err) {
    console.error("❌ Erreur assistant:", err.message);
    console.error(err.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
};