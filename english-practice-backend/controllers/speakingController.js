const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { z } = require("zod");
const { getChatModel, getStructuredModel } = require("../services/llm");

// Prompt template: tạo chủ đề luyện nói
const topicPrompt = ChatPromptTemplate.fromMessages([
  ["system", "Bạn là một giáo viên tiếng Anh."],
  [
    "human",
    "Tạo một chủ đề ngẫu nhiên để luyện nói bằng tiếng Anh. Chủ đề nên thú vị và không quá phức tạp. Chỉ trả về chủ đề, không có gì khác.",
  ],
]);

// Khuôn dữ liệu cho kết quả chấm bài nói (giữ đúng tên trường frontend đang dùng)
const score = z.number().min(1).max(10);
const evaluationSchema = z.object({
  scores: z.object({
    fluency: score.describe("Độ trôi chảy: nói liền mạch, tốc độ tự nhiên"),
    grammar: score.describe("Ngữ pháp: dùng đúng cấu trúc câu"),
    vocabulary: score.describe("Từ vựng: phong phú và phù hợp"),
    pronunciation: score.describe(
      "Phát âm: ước lượng mức độ dễ hiểu dựa trên transcript",
    ),
  }),
  overallScore: score.describe("Điểm tổng kết trên thang 10"),
  feedback: z
    .string()
    .describe(
      "Nhận xét bằng tiếng Việt: điểm mạnh, điểm yếu và gợi ý cải thiện, tối đa khoảng 80 từ",
    ),
});

const evaluationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Bạn là giám khảo chấm thi nói tiếng Anh. Chấm điểm từ 1 đến 10 cho từng tiêu chí và nhận xét bằng tiếng Việt.",
  ],
  ["human", "Chủ đề: {topic}\nBài nói của thí sinh: {transcription}"],
]);

// Chain: prompt -> model -> parser
const topicChain = topicPrompt
  .pipe(getChatModel(0.9))
  .pipe(new StringOutputParser());
const evaluationChain = evaluationPrompt.pipe(
  getStructuredModel(evaluationSchema, 0.2),
);

const getSpeakingTopic = async (req, res) => {
  try {
    const topic = await topicChain.invoke({});
    res.json({ topic: topic.trim() });
  } catch (error) {
    console.error("Error generating speaking topic:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo chủ đề nói" });
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
    const evaluation = await evaluationChain.invoke({ topic, transcription });
    res.json(evaluation);
  } catch (error) {
    console.error("Error evaluating speaking:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi đánh giá bài nói" });
  }
};

module.exports = {
  getSpeakingTopic,
  evaluateSpeaking,
};
