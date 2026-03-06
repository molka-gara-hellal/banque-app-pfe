const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createAppointment,
  getMyAppointments,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointment.controller");

router.post("/", authMiddleware, createAppointment);
router.get("/", authMiddleware, getMyAppointments);
router.put("/:id", authMiddleware, updateAppointment);
router.delete("/:id", authMiddleware, deleteAppointment);

module.exports = router;