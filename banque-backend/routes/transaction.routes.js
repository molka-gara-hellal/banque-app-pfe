const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getMyTransactions, virement } = require("../controllers/transaction.controller");

router.get("/", authMiddleware, getMyTransactions);
router.post("/virement", authMiddleware, virement);

module.exports = router;