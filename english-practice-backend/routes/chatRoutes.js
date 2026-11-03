const express = require("express");
const { rateLimit } = require("express-rate-limit");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require("../middleware/authMiddleware");

// Giới hạn số tin nhắn gửi cho AI: 20 tin / phút cho mỗi user
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user.userId),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Bạn gửi quá nhanh, vui lòng đợi một chút rồi thử lại." },
});

// Route cho tin nhắn thường (trợ lý AI có lưu lịch sử)
router.post("/", auth, aiLimiter, chatController.sendMessage);

// Lịch sử cuộc trò chuyện
router.get("/conversations", auth, chatController.listConversations);
router.get("/conversations/:id/messages", auth, chatController.getConversationMessages);
router.delete("/conversations/:id", auth, chatController.deleteConversation);

// Route mới cho voice feedback (không cần upload file)
router.post("/voice-feedback", auth, aiLimiter, chatController.handleVoiceFeedback);

module.exports = router;
