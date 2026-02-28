const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const {
  getAllClients,
  getClientById,
  getStats
} = require("../controllers/admin.controller");

router.get("/clients", authMiddleware, adminMiddleware, getAllClients);
router.get("/clients/:id", authMiddleware, adminMiddleware, getClientById);
router.get("/stats", authMiddleware, adminMiddleware, getStats);

module.exports = router;