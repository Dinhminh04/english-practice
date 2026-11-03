const { GoogleGenerativeAI } = require("@google/generative-ai");
const AiChat = require("../models/aiChatModel");
const User = require("../models/userModel");
const { askTutor } = require("../services/aiTutor");

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 20;

const makeTitle = (message) => {
  const text = message.replace(/\s+/g, " ").trim();
  return text.length > 60 ? text.slice(0, 57) + "..." : text;
};

// Gửi tin nhắn cho trợ lý AI (có lưu lịch sử và nhớ ngữ cảnh)
const sendMessage = async (req, res) => {
  const { message, conversation_id } = req.body;
  const userId = req.user.userId;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "No message provided" });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({ message: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự` });
  }

  try {
    let conversationId = conversation_id ? parseInt(conversation_id, 10) : null;
    let history = [];

    if (conversationId) {
      const conversation = await AiChat.findConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
      }
      history = await AiChat.getRecentMessages(conversationId, HISTORY_LIMIT);
    }

    const users = await User.findById(userId);
    const displayName = users[0]?.display_name || "bạn";

    const reply = await askTutor({ userId, displayName, history, message: message.trim() });

    if (!conversationId) {
      conversationId = await AiChat.createConversation(userId, makeTitle(message));
    }
    await AiChat.addMessage(conversationId, "user", message.trim());
    await AiChat.addMessage(conversationId, "assistant", reply);

    res.json({ reply, conversation_id: conversationId });
  } catch (error) {
    console.error("Error sending message with AI:", error);
    res.status(503).json({
      message: "Trợ lý AI đang bận hoặc quá tải, vui lòng thử lại sau ít phút.",
    });
  }
};

// Danh sách cuộc trò chuyện của user
const listConversations = async (req, res) => {
  try {
    const conversations = await AiChat.listConversations(req.user.userId);
    res.json({ conversations });
  } catch (error) {
    console.error("Error listing AI conversations:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lịch sử tin nhắn của một cuộc trò chuyện
const getConversationMessages = async (req, res) => {
  const conversationId = parseInt(req.params.id, 10);
  try {
    const conversation = await AiChat.findConversation(conversationId, req.user.userId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }
    const messages = await AiChat.getRecentMessages(conversationId, 200);
    res.json({ conversation, messages });
  } catch (error) {
    console.error("Error fetching AI messages:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa một cuộc trò chuyện
const deleteConversation = async (req, res) => {
  const conversationId = parseInt(req.params.id, 10);
  try {
    const deleted = await AiChat.deleteConversation(conversationId, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }
    res.json({ message: "Đã xóa cuộc trò chuyện" });
  } catch (error) {
    console.error("Error deleting AI conversation:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// API mới cho voice feedback (nhận transcript từ frontend)
const handleVoiceFeedback = async (req, res) => {
  const { transcription } = req.body;

  if (!transcription) {
    return res.status(400).json({ message: "No transcription provided" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite" });

    const prompt = `[Bạn là một giáo viên tiếng Anh] Người dùng đã nói: "${transcription}". Hãy đưa ra nhận xét về:
    1. Ngữ pháp (Grammar)
    2. Từ vựng (Vocabulary) 
    3. Độ tự nhiên (Naturalness)
    4. Gợi ý cải thiện
    
    Trả lời bằng tiếng Việt, ngắn gọn và thân thiện.`;

    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const text = await aiResponse.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("Error handling voice feedback:", error);
    res.status(500).json({
      message: "Lỗi máy chủ khi xử lý phản hồi giọng nói",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  listConversations,
  getConversationMessages,
  deleteConversation,
  handleVoiceFeedback, // Thay thế handleVoiceMessage
};