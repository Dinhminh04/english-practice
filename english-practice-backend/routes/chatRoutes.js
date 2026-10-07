const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require("../middleware/authMiddleware");

// Route cho tin nhắn thường
router.post("/", auth, chatController.sendMessage);

// Route mới cho voice feedback (không cần upload file)
router.post("/voice-feedback", auth, chatController.handleVoiceFeedback);

module.exports = router;