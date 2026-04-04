const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const assistantController = require("../controllers/assistant.controller");

router.post("/chat", authMiddleware, assistantController.chat);

module.exports = router;
