const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getMyTransactions } = require("../controllers/transaction.controller");

router.get("/", authMiddleware, getMyTransactions);

module.exports = router;