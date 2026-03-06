const router = require("express").Router();

const { register, login, me, sendOtpEmail, verifyOtp, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/send-otp-email", sendOtpEmail);
router.post("/verify-otp", verifyOtp);

router.get("/me", authMiddleware, me);

module.exports = router;