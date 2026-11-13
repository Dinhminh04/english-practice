const {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} = require("@langchain/google-genai");

const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";
const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

const createChatModel = (model, temperature = 0.4) =>
  new ChatGoogleGenerativeAI({
    model,
    apiKey: process.env.GEMINI_API_KEY,
    temperature,
    maxRetries: 1,
  });

// Model trả về văn bản, tự chuyển sang model dự phòng khi model chính lỗi (ví dụ 503)
const getChatModel = (temperature) =>
  createChatModel(CHAT_MODEL, temperature).withFallbacks([
    createChatModel(FALLBACK_MODEL, temperature),
  ]);

// Model trả về JSON đúng khuôn zod schema, cũng có model dự phòng
const getStructuredModel = (schema, temperature) =>
  createChatModel(CHAT_MODEL, temperature)
    .withStructuredOutput(schema)
    .withFallbacks([
      createChatModel(FALLBACK_MODEL, temperature).withStructuredOutput(schema),
    ]);

// Model embedding: biến văn bản thành vector 768 chiều (dùng cho RAG ở bước 4)
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: EMBEDDING_MODEL,
  apiKey: process.env.GEMINI_API_KEY,
  outputDimensionality: 768,
});

module.exports = {
  createChatModel,
  getChatModel,
  getStructuredModel,
  embeddings,
  CHAT_MODEL,
  FALLBACK_MODEL,
};
