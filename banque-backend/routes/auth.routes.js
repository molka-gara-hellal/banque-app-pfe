const router = require("express").Router();

const { register, login, me, sendOtpEmail, verifyOtp } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);

router.post("/send-otp-email", sendOtpEmail);
router.post("/verify-otp", verifyOtp);

router.get("/me", authMiddleware, me);

module.exports = router;