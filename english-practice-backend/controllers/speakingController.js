const { GoogleGenerativeAI } = require("@google/generative-ai");

const getSpeakingTopic = async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `[Bạn là một giáo viên tiếng Anh] Tạo một chủ đề ngẫu nhiên để luyện nói bằng tiếng Anh. Chủ đề nên thú vị và không quá phức tạp. Chỉ trả về chủ đề, không có gì khác.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const topic = await response.text();

    res.json({ topic: topic.trim() });
  } catch (error) {
    console.error("Error generating speaking topic:", error);
    res.status(500).json({
      message: "Lỗi máy chủ khi tạo chủ đề nói",
      error: error.message,
    });
  }
};

const evaluateSpeaking = async (req, res) => {
  const { transcription, topic } = req.body;

  if (!transcription || !topic) {
    return res
      .status(400)
      .json({ message: "No transcription or topic provided" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `[Bạn là một giám khảo chấm thi nói tiếng Anh]
    Chủ đề: "${topic}"
    Bài nói của thí sinh: "${transcription}"

    Hãy đánh giá bài nói trên theo các tiêu chí sau và cho điểm từ 1 đến 10 cho mỗi tiêu chí:
    1.  **Fluency (Độ trôi chảy):** (Luôn nói, không ngập ngừng, tốc độ tự nhiên)
    2.  **Grammar (Ngữ pháp):** (Sử dụng đúng cấu trúc câu)
    3.  **Vocabulary (Từ vựng):** (Sử dụng từ vựng phong phú và phù hợp)
    4.  **Pronunciation (Phát âm):** (Dựa trên phiên âm, đánh giá mức độ dễ hiểu)

    Sau đó, đưa ra một điểm tổng kết (Overall Score) trên thang điểm 10.
    Cuối cùng, cung cấp "Detailed Feedback" (Nhận xét chi tiết) về điểm mạnh, điểm yếu và gợi ý cải thiện.

    Trả lời bằng tiếng Việt theo định dạng JSON sau, không có bất kỳ văn bản nào khác:
    {
      "scores": {
        "fluency": "<điểm>",
        "grammar": "<điểm>",
        "vocabulary": "<điểm>",
        "pronunciation": "<điểm>"
      },
      "overallScore": "<điểm tổng kết>",
      "feedback": "<nhận xét chi tiết>"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the response to get only the JSON part
    const jsonResponse = text.substring(
      text.indexOf("{"),
      text.lastIndexOf("}") + 1
    );

    res.json(JSON.parse(jsonResponse));
  } catch (error) {
    console.error("Error evaluating speaking:", error);
    res.status(500).json({
      message: "Lỗi máy chủ khi đánh giá bài nói",
      error: error.message,
    });
  }
};

module.exports = {
  getSpeakingTopic,
  evaluateSpeaking,
};
