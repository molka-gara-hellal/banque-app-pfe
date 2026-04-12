const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getPreferences, savePreferences } = require("../controllers/notification.controller");

router.get("/preferences", authMiddleware, getPreferences);
router.post("/preferences", authMiddleware, savePreferences);

module.exports = router;