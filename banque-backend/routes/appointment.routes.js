const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const appointmentController = require("../controllers/appointment.controller");

router.get("/", authMiddleware, appointmentController.getMyAppointments);
router.get("/disponibilites", authMiddleware, appointmentController.getDisponibilites);
router.post("/", authMiddleware, appointmentController.createAppointmentWithDispo);
router.post("/manual", authMiddleware, appointmentController.createAppointment);
router.put("/:id", authMiddleware, appointmentController.updateAppointment);
router.delete("/:id", authMiddleware, appointmentController.deleteAppointment);

module.exports = router;