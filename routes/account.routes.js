const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getMyAccount } = require("../controllers/account.controller");

router.get("/me", authMiddleware, getMyAccount);

module.exports = router;