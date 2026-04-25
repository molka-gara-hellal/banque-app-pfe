const db = require("../config/db");
const PDFDocument = require("pdfkit");

exports.getMyAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      "SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Aucun compte trouvé" });
    }
    // Return first account for backward compatibility
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ GET ALL ACCOUNTS
exports.getMyAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      "SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ GÉNÉRER RELEVÉ PDF
exports.getRelevedPDF = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le compte
    const accountResult = await db.query(
      "SELECT * FROM accounts WHERE user_id = $1",
      [userId]
    );

    if (!accountResult.rows.length) {
      return res.status(404).json({ message: "Aucun compte trouvé" });
    }

    const account = accountResult.rows[0];

    // Récupérer l'utilisateur
    const userResult = await db.query(
      "SELECT nom, prenom, email FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0] || {};

    // Récupérer les transactions (30 derniers jours)
    const txResult = await db.query(
      `SELECT * FROM transactions
       WHERE account_id = $1
       AND created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC`,
      [account.id]
    );
    const transactions = txResult.rows;

    // ── Créer le PDF ──
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Headers HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="releve-wifak-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    const blue = "#1a3c6e";
    const lightBlue = "#EBF5FF";
    const gray = "#666666";
    const lightGray = "#F2F4F8";
    const green = "#16a34a";
    const red = "#dc2626";
    const pageWidth = 595 - 100; // A4 - marges

    // ── HEADER BANDEAU ──
    doc.rect(0, 0, 595, 90).fill(blue);
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("WIFAK BANK", 50, 28);
    doc
      .fillColor("rgba(255,255,255,0.7)")
      .fontSize(10)
      .font("Helvetica")
      .text("Relevé de Compte", 50, 55);

    const dateNow = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
    doc
      .fillColor("#ffffff")
      .fontSize(10)
      .text(`Édité le ${dateNow}`, 350, 38, { width: 200, align: "right" });

    doc.moveDown(4);

    // ── INFOS CLIENT ──
    doc
      .fillColor(blue)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Informations du titulaire", 50, 110);

    doc.moveTo(50, 126).lineTo(545, 126).strokeColor("#dde3ed").lineWidth(1).stroke();

    const nomComplet = `${user.prenom || ""} ${user.nom || ""}`.trim() || "Client";
    const infoY = 135;

    doc.fillColor(gray).fontSize(10).font("Helvetica");
    doc.text("Titulaire :", 50, infoY);
    doc.text("Email :", 50, infoY + 18);
    doc.text("N° de compte :", 50, infoY + 36);
    doc.text("IBAN :", 50, infoY + 54);

    doc.fillColor("#111111").font("Helvetica-Bold");
    doc.text(nomComplet, 160, infoY);
    doc.text(user.email || "—", 160, infoY + 18);
    doc.text(account.account_number || account.id, 160, infoY + 36);
    doc.text(account.iban || "—", 160, infoY + 54);

    // ── SOLDE ──
    const soldeY = 220;
    doc.rect(50, soldeY, pageWidth, 56).fill(lightBlue);
    doc
      .fillColor(gray)
      .fontSize(10)
      .font("Helvetica")
      .text("SOLDE DISPONIBLE", 70, soldeY + 10);
    doc
      .fillColor(blue)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(
        `${parseFloat(account.balance || 0).toLocaleString("fr-TN", {
          minimumFractionDigits: 3,
        })} TND`,
        70,
        soldeY + 25
      );

    // ── TRANSACTIONS ──
    const txTitleY = 295;
    doc
      .fillColor(blue)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Transactions des 30 derniers jours", 50, txTitleY);

    doc.moveTo(50, txTitleY + 16).lineTo(545, txTitleY + 16).strokeColor("#dde3ed").stroke();

    if (transactions.length === 0) {
      doc
        .fillColor(gray)
        .fontSize(10)
        .font("Helvetica")
        .text("Aucune transaction sur cette période.", 50, txTitleY + 28);
    } else {
      // Entêtes tableau
      const colDate = 50;
      const colDesc = 150;
      const colType = 370;
      const colMontant = 460;
      const headerY = txTitleY + 22;

      doc.rect(50, headerY, pageWidth, 20).fill("#e8edf5");
      doc
        .fillColor(blue)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("DATE", colDate, headerY + 6)
        .text("DESCRIPTION", colDesc, headerY + 6)
        .text("TYPE", colType, headerY + 6)
        .text("MONTANT", colMontant, headerY + 6);

      let rowY = headerY + 24;
      transactions.forEach((tx, i) => {
        if (rowY > 750) {
          doc.addPage();
          rowY = 50;
        }

        const bg = i % 2 === 0 ? "#ffffff" : lightGray;
        doc.rect(50, rowY - 3, pageWidth, 18).fill(bg);

        const txDate = new Date(tx.created_at || tx.date).toLocaleDateString("fr-FR", {
          day: "2-digit", month: "2-digit", year: "numeric",
        });
        const description = (tx.description || tx.label || tx.type || "Transaction").substring(0, 28);
        const type = tx.type === "credit" ? "Crédit" : "Débit";
        const amount = parseFloat(tx.amount || 0);
        const amountStr = (amount >= 0 ? "+" : "") +
          amount.toLocaleString("fr-TN", { minimumFractionDigits: 3 }) + " TND";

        doc
          .fillColor("#333333")
          .fontSize(9)
          .font("Helvetica")
          .text(txDate, colDate, rowY)
          .text(description, colDesc, rowY, { width: 200 })
          .text(type, colType, rowY);

        doc
          .fillColor(amount >= 0 ? green : red)
          .font("Helvetica-Bold")
          .text(amountStr, colMontant, rowY, { width: 80, align: "right" });

        rowY += 20;
      });

      // Total ligne
      doc.moveTo(50, rowY + 4).lineTo(545, rowY + 4).strokeColor("#dde3ed").stroke();
      const totalDebit = transactions
        .filter(t => parseFloat(t.amount) < 0)
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalCredit = transactions
        .filter(t => parseFloat(t.amount) > 0)
        .reduce((s, t) => s + parseFloat(t.amount), 0);

      doc
        .fillColor(blue)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(`Total crédits : +${totalCredit.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND`, 50, rowY + 10)
        .fillColor(red)
        .text(`Total débits : ${totalDebit.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND`, 300, rowY + 10);
    }

    // ── FOOTER ──
    const footerY = 800;
    doc.rect(0, footerY, 595, 42).fill(blue);
    doc
      .fillColor("rgba(255,255,255,0.7)")
      .fontSize(8)
      .font("Helvetica")
      .text("Wifak Bank — Document généré automatiquement — Non contractuel", 50, footerY + 10, {
        width: 495, align: "center",
      })
      .text("www.wifakbank.com.tn  |  71 000 000", 50, footerY + 22, {
        width: 495, align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("Erreur PDF ❌", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Erreur génération PDF" });
    }
  }
};