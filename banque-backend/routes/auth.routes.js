const router = require("express").Router();

const {
  register, login, me, sendOtpEmail, verifyOtp,
  forgotPassword, resetPassword, changePassword,
  updateProfile, checkStatus
} = require("../controllers/auth.controller");
const { getSessions, deleteSession, deleteAllOtherSessions } = require("../controllers/session.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/check-status", checkStatus); // ✅ polling depuis l'app

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/send-otp-email", sendOtpEmail);
router.post("/verify-otp", verifyOtp);

router.get("/me", authMiddleware, me);
router.put("/change-password", authMiddleware, changePassword);
router.put("/profile", authMiddleware, updateProfile);

// ✅ Sessions / Appareils connectés
router.get("/sessions", authMiddleware, getSessions);
router.delete("/sessions/:id", authMiddleware, deleteSession);
router.delete("/sessions", authMiddleware, deleteAllOtherSessions);

module.exports = router;