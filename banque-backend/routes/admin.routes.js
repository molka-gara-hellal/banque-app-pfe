const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const agentMiddleware = require("../middlewares/agentMiddleware");

const {
  getAllClients,
  getClientById,
  getAllAppointments,
  updateAppointmentStatus,
  getStats,
  getSegmentation,
} = require("../controllers/admin.controller");

// Tous ces endpoints sont accessibles aux agents ET à l'admin
router.get("/clients",              authMiddleware, agentMiddleware, getAllClients);
router.get("/clients/:id",          authMiddleware, agentMiddleware, getClientById);
router.get("/appointments",         authMiddleware, agentMiddleware, getAllAppointments);
router.put("/appointments/:id",     authMiddleware, agentMiddleware, updateAppointmentStatus);
router.get("/stats",                authMiddleware, agentMiddleware, getStats);
router.get("/segmentation",         authMiddleware, agentMiddleware, getSegmentation);

module.exports = router;