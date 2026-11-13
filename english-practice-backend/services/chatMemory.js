const { BaseListChatMessageHistory } = require("@langchain/core/chat_history");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { getChatModel } = require("./llm");
const AiChat = require("../models/aiChatModel");

// Memory for the AI tutor = MySQL chat history + running summary.
// - Recent messages are sent to the model word for word.
// - When too many unsummarized messages pile up, the oldest ones are folded into
//   ai_conversations.summary, so long chats stay small but the tutor still remembers them.

const MAX_UNSUMMARIZED = 12; // summarize when more messages than this are not in the summary
const KEEP_RECENT = 6; // always keep the last 3 turns word for word
const MAX_LOADED = 20; // safety cap if summarizing keeps failing
const MAX_LINE_CHARS = 600;

const toMessage = (row) =>
  row.role === "user" ? new HumanMessage(row.content) : new AIMessage(row.content);

// LangChain chat history stored in the ai_messages table
class MySQLChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ["englishmaster", "stores", "message", "mysql"];

  // afterId: only read messages newer than this id (the part not in the summary)
  constructor(conversationId, { afterId = 0 } = {}) {
    super();
    this.conversationId = conversationId;
    this.afterId = afterId;
  }

  async getMessages() {
    const rows = await AiChat.getMessagesAfter(this.conversationId, this.afterId);
    return rows.slice(-MAX_LOADED).map(toMessage);
  }

  async addMessage(message) {
    const role = message.getType() === "human" ? "user" : "assistant";
    await AiChat.addMessage(this.conversationId, role, message.text);
  }

  async clear() {
    await AiChat.clearMessages(this.conversationId);
  }
}

const summaryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Bạn tóm tắt cuộc trò chuyện giữa học viên và gia sư tiếng Anh để gia sư nhớ ngữ cảnh.
Gộp "Tóm tắt cũ" với "Tin nhắn mới" thành MỘT bản tóm tắt tiếng Việt, tối đa 120 từ, dạng gạch đầu dòng.
Giữ lại: trình độ, mục tiêu, điểm yếu và lỗi sai của học viên; các chủ đề đã học; câu hỏi còn dang dở; điều học viên muốn gia sư ghi nhớ.
Bỏ: lời chào, câu cảm ơn, nội dung giải thích chi tiết đã trả lời xong.`,
  ],
  ["human", "Tóm tắt cũ:\n{summary}\n\nTin nhắn mới:\n{lines}"],
]);

const summaryChain = summaryPrompt.pipe(getChatModel(0.2)).pipe(new StringOutputParser());

// Load memory for one request: { summary, messages: BaseMessage[] }
const loadMemory = async (conversationId) => {
  const state = await AiChat.getMemoryState(conversationId);
  const history = new MySQLChatMessageHistory(conversationId, { afterId: state.summarized_until });
  return { summary: state.summary || "", messages: await history.getMessages() };
};

// Save one turn (user question + AI reply) through the LangChain history interface
const saveTurn = async (conversationId, userText, aiText) => {
  const history = new MySQLChatMessageHistory(conversationId);
  await history.addMessages([new HumanMessage(userText), new AIMessage(aiText)]);
};

// Fold old messages into the summary when there are too many. Runs after the reply is sent.
const summarizeIfNeeded = async (conversationId) => {
  const state = await AiChat.getMemoryState(conversationId);
  const rows = await AiChat.getMessagesAfter(conversationId, state.summarized_until);
  if (rows.length <= MAX_UNSUMMARIZED) return false;

  const old = rows.slice(0, rows.length - KEEP_RECENT);
  const lines = old
    .map((r) => `${r.role === "user" ? "Học viên" : "Gia sư"}: ${r.content.slice(0, MAX_LINE_CHARS)}`)
    .join("\n");
  const summary = await summaryChain.invoke({
    summary: state.summary || "(chưa có)",
    lines,
  });
  return AiChat.saveSummary(
    conversationId,
    summary.trim(),
    old[old.length - 1].id,
    state.summarized_until
  );
};

module.exports = { MySQLChatMessageHistory, loadMemory, saveTurn, summarizeIfNeeded };
