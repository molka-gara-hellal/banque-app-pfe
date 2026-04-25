const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getMyAccount, getMyAccounts, getRelevedPDF } = require("../controllers/account.controller");

router.get("/me", authMiddleware, getMyAccount);
router.get("/all", authMiddleware, getMyAccounts);
router.get("/releve-pdf", authMiddleware, getRelevedPDF);

module.exports = router;