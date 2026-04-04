const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getMyAccount, getRelevedPDF } = require("../controllers/account.controller");

router.get("/me", authMiddleware, getMyAccount);
router.get("/releve-pdf", authMiddleware, getRelevedPDF);

module.exports = router;
