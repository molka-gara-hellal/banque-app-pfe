const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const agentMiddleware = require("../middlewares/agentMiddleware");
const { sendMessage, getAllMessages, replyMessage, getMyMessages } = require("../controllers/support.controller");

router.post("/messages", authMiddleware, sendMessage);
router.get("/my-messages", authMiddleware, getMyMessages);
router.get("/messages", authMiddleware, agentMiddleware, getAllMessages);
router.put("/messages/:id", authMiddleware, agentMiddleware, replyMessage);

module.exports = router;