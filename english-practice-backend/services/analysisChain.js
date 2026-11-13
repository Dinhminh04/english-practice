const { ChatPromptTemplate } = require("@langchain/core/prompts");
const {
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} = require("@langchain/core/runnables");
const { z } = require("zod");
const { getStructuredModel } = require("./llm");

// Shared LCEL chain for every "analyze my wrong answers" feature
// (exam result, grammar quiz, vocabulary quiz, learner weaknesses).
// The code writes the wrong/correct answers itself; the AI only explains them,
// so it can never copy an answer wrongly.

const MAX_MISTAKES = 5;

const analysisSchema = z.object({
  mistakes: z
    .array(
      z.object({
        number: z.number().int().describe("Số thứ tự của câu trong danh sách"),
        reason: z.string().describe("Vì sao học sinh sai và quy tắc đúng, 1 câu ngắn bằng tiếng Việt"),
      })
    )
    .describe("Một mục cho mỗi câu trong danh sách"),
  summary: z.string().describe("1–2 câu nhận xét về điểm yếu chính, bằng tiếng Việt"),
  review_topics: z.array(z.string()).describe("1–3 chủ đề cụ thể nên ôn tập"),
});

const analysisPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Bạn là một giáo viên tiếng Anh. Với mỗi câu học sinh trả lời sai, giải thích ngắn gọn vì sao sai. Sau đó nhận xét điểm yếu chính và gợi ý chủ đề nên ôn. Viết bằng tiếng Việt. {focus}",
  ],
  ["human", "Danh sách câu học sinh trả lời sai:\n\n{wrong_answers}"],
]);

// Keep only the question line (imported reading questions start with the passage)
const shortQuestion = (text) => {
  const line = String(text).trim().split("\n").pop().trim();
  return line.length > 70 ? `${line.slice(0, 67)}...` : line;
};

// Step 1: drop duplicate mistakes and keep the most recent ones
const prepareItems = RunnableLambda.from(({ items, focus }) => {
  const seen = new Set();
  const unique = items.filter((q) => {
    const key = `${q.question}|${q.userAnswer}|${q.correctAnswer}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { items: unique.slice(0, MAX_MISTAKES), focus };
});

// Step 2: turn the items into prompt variables (learner data is a variable value,
// never part of the template text)
const toPromptInput = RunnableLambda.from(({ items, focus }) => ({
  focus,
  wrong_answers: items
    .map((q, index) => {
      const lines = [`Câu ${index + 1}:`, `- Đề bài: ${q.question}`];
      if (q.options && q.options.length > 0) lines.push(`- Các lựa chọn: ${q.options.join(" | ")}`);
      lines.push(`- Câu trả lời của học sinh: "${q.userAnswer}"`);
      lines.push(`- Đáp án đúng: "${q.correctAnswer}"`);
      return lines.join("\n");
    })
    .join("\n\n"),
}));

// Step 4: build the markdown shown to the learner from real data + AI explanations
const toMarkdown = RunnableLambda.from(({ items, result }) => {
  const reasons = new Map(result.mistakes.map((m) => [m.number, m.reason]));
  const mistakeLines = items.map((q, index) => {
    const reason = reasons.get(index + 1);
    return `- "${shortQuestion(q.question)}": bạn chọn **${q.userAnswer}**, đúng là **${q.correctAnswer}**.${reason ? ` ${reason}` : ""}`;
  });
  return [
    "**Lỗi sai**",
    ...mistakeLines,
    "",
    "**Nhận xét**",
    result.summary,
    "",
    "**Nên ôn**",
    ...result.review_topics.map((t) => `- ${t}`),
  ].join("\n");
});

const analysisChain = RunnableSequence.from([
  prepareItems,
  // Step 3: run the AI branch and keep the original items next to its result
  RunnablePassthrough.assign({
    result: toPromptInput.pipe(analysisPrompt).pipe(getStructuredModel(analysisSchema, 0.2)),
  }),
  toMarkdown,
]);

const ALL_CORRECT_MESSAGE =
  "Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi. Không có gì cần phân tích thêm.";

// items: [{ question, options?, userAnswer, correctAnswer }]
// focus: one sentence telling the model what to focus on
const analyzeWrongAnswers = async (items, focus = "") => {
  if (items.length === 0) return ALL_CORRECT_MESSAGE;
  return analysisChain.invoke({ items, focus });
};

module.exports = { analyzeWrongAnswers, ALL_CORRECT_MESSAGE };
