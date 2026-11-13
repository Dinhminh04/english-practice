const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { z } = require("zod");
const { getStructuredModel } = require("./llm");

// Khuôn dữ liệu của một câu hỏi trích từ PDF
const questionSchema = z.object({
  number: z.number().int().describe("Số thứ tự câu hỏi trong đề"),
  part: z
    .string()
    .describe("Tên phần chứa câu hỏi, ví dụ 'PART 1 - LISTENING'"),
  is_listening: z.boolean().describe("true nếu câu hỏi thuộc phần nghe"),
  question_type: z
    .enum(["multiple_choice", "unsupported"])
    .describe(
      "multiple_choice nếu có các lựa chọn A/B/C/D; unsupported cho điền từ, viết, nối, tự luận",
    ),
  question_text: z.string().describe("Nội dung câu hỏi, không kèm số thứ tự"),
  options: z
    .array(z.string())
    .describe(
      "Nội dung từng lựa chọn, bỏ ký hiệu A./B./C./D.; rỗng nếu không có",
    ),
  correct_answer: z
    .string()
    .describe(
      "Nội dung đáp án đúng; với trắc nghiệm phải trùng chính xác một phần tử trong options; chuỗi rỗng nếu không xác định được",
    ),
  answer_source: z
    .enum(["answer_key", "ai_suggested"])
    .describe(
      "answer_key nếu lấy từ bảng đáp án trong đề; ai_suggested nếu tự suy ra",
    ),
});

// Khuôn dữ liệu của cả đề thi
const examDraftSchema = z.object({
  title: z.string(),
  description: z.string().describe("Mô tả ngắn về đề thi bằng tiếng Việt"),
  exam_type: z
    .enum(["listening", "reading", "writing", "speaking", "full_test"])
    .describe("full_test nếu đề có nhiều kỹ năng"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  duration: z.number().int().describe("Thời gian làm bài (phút)"),
  passages: z
    .array(z.object({ part: z.string(), text: z.string() }))
    .describe("Các đoạn văn đọc hiểu, kèm tên phần sử dụng đoạn văn đó"),
  questions: z.array(questionSchema),
});

// Prompt có cả chữ và file PDF; {pdf} sẽ được thay bằng nội dung base64
const extractPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Bạn trích xuất đề thi tiếng Anh từ file PDF thành dữ liệu có cấu trúc. Chép chính xác nội dung, không tự thêm câu hỏi. Ưu tiên đáp án trong bảng đáp án của đề; chỉ tự suy ra khi đề không có đáp án.",
  ],
  [
    "human",
    [
      { type: "text", text: "Trích xuất toàn bộ đề thi trong file PDF sau." },
      { type: "file", mimeType: "application/pdf", data: "{pdf}" },
    ],
  ],
]);

// temperature 0: chép lại chính xác, không sáng tạo
const extractChain = extractPrompt.pipe(getStructuredModel(examDraftSchema, 0));

// Đọc PDF (Buffer) và trả về bản nháp đề thi để admin duyệt
const extractExamFromPdf = async (pdfBuffer) => {
  const draft = await extractChain.invoke({
    pdf: pdfBuffer.toString("base64"),
  });

  // Đánh dấu những câu admin cần xem kỹ trước khi lưu
  draft.questions = draft.questions.map((q) => ({
    ...q,
    needs_review:
      q.question_type !== "multiple_choice" ||
      q.answer_source === "ai_suggested" ||
      !q.options.includes(q.correct_answer),
  }));
  return draft;
};

module.exports = { extractExamFromPdf, examDraftSchema };
