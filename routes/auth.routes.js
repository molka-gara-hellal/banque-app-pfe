const router = require("express").Router();

const { register, login, me } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes publiques
router.post("/register", register);
router.post("/login", login);

// Route protégée (token obligatoire)
router.get("/me", authMiddleware, me);

module.exports = router;