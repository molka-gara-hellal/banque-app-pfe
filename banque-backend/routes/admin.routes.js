const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const agentMiddleware = require("../middlewares/agentMiddleware");

const {
  getAllClients,
  getClientById,
  getAllAppointments,
  updateAppointmentStatus,
  getConseillerSuggestions,
  getStats,
  getSegmentation,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  createAccountForClient,
} = require("../controllers/admin.controller");

// Tous ces endpoints sont accessibles aux agents ET à l'admin
router.get("/clients",              authMiddleware, agentMiddleware, getAllClients);
router.get("/clients/:id",          authMiddleware, agentMiddleware, getClientById);
router.get("/appointments",                      authMiddleware, agentMiddleware, getAllAppointments);
router.put("/appointments/:id",                  authMiddleware, agentMiddleware, updateAppointmentStatus);
router.get("/appointments/:id/suggestions",      authMiddleware, agentMiddleware, getConseillerSuggestions);
router.get("/stats",                authMiddleware, agentMiddleware, getStats);
router.get("/segmentation",         authMiddleware, agentMiddleware, getSegmentation);

// ✅ Inscriptions
router.get("/registrations",              authMiddleware, agentMiddleware, getPendingRegistrations);
router.post("/registrations/:id/approve", authMiddleware, agentMiddleware, approveRegistration);
router.post("/registrations/:id/reject",  authMiddleware, agentMiddleware, rejectRegistration);

// ✅ Créer compte supplémentaire
router.post("/accounts", authMiddleware, agentMiddleware, createAccountForClient);

module.exports = router;