const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { getChatModel } = require("../services/llm");
const AiChat = require("../models/aiChatModel");
const User = require("../models/userModel");
const { askTutor } = require("../services/aiTutor");
const { loadMemory, saveTurn, summarizeIfNeeded } = require("../services/chatMemory");

const MAX_MESSAGE_LENGTH = 2000;

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
    let memory = { summary: "", messages: [] };

    if (conversationId) {
      const conversation = await AiChat.findConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
      }
      // Memory = summary of old messages + recent messages
      memory = await loadMemory(conversationId);
    }

    const users = await User.findById(userId);
    const displayName = users[0]?.display_name || "bạn";

    const { reply, toolsUsed } = await askTutor({
      userId,
      displayName,
      summary: memory.summary,
      history: memory.messages,
      message: message.trim(),
    });

    if (!conversationId) {
      conversationId = await AiChat.createConversation(userId, makeTitle(message));
    }
    await saveTurn(conversationId, message.trim(), reply);

    res.json({ reply, conversation_id: conversationId, tools_used: toolsUsed });

    // After responding: fold old messages into the summary (does not slow down the reply)
    summarizeIfNeeded(conversationId).catch((err) =>
      console.error("Không tóm tắt được cuộc trò chuyện:", err.message)
    );
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

// Chain nhận xét câu nói: prompt -> model -> text
const voiceFeedbackChain = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Bạn là một giáo viên tiếng Anh. Nhận xét câu nói của người học về: 1. Ngữ pháp, 2. Từ vựng, 3. Độ tự nhiên, 4. Gợi ý cải thiện. Trả lời bằng tiếng Việt, ngắn gọn (khoảng 80 từ) và thân thiện.",
  ],
  ["human", "Câu người học vừa nói: {transcription}"],
])
  .pipe(getChatModel(0.4))
  .pipe(new StringOutputParser());

// API mới cho voice feedback (nhận transcript từ frontend)
const handleVoiceFeedback = async (req, res) => {
  const { transcription } = req.body;

  if (!transcription) {
    return res.status(400).json({ message: "No transcription provided" });
  }

  try {
    const text = await voiceFeedbackChain.invoke({ transcription });
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