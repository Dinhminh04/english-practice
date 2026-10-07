const { GoogleGenerativeAI } = require("@google/generative-ai");

const sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "No message provided" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `[Bạn là trợ lý tiếng Anh] Trả lời ngắn gọn (dưới 150 từ) bằng tiếng Việt: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("Error sending message with AI:", error);
    res.status(500).json({
      message: "Lỗi máy chủ khi gửi tin nhắn với AI",
      error: error.message,
    });
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  handleVoiceFeedback, // Thay thế handleVoiceMessage
};