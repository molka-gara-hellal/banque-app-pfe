require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= ROUTES =================
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const adminRoutes = require("./routes/admin.routes");
const assistantRoutes = require("./routes/assistant.routes");
const agentRoutes = require("./routes/agent.routes");
const supportRoutes = require("./routes/support.routes");
app.use("/api/support", supportRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/agents", agentRoutes);  // ✅ ici

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("API Banque OK ✅");
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée ❌" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Erreur serveur ❌",
    error: process.env.NODE_ENV === "development" ? err.message : {}
  });
});

// ================= START =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});