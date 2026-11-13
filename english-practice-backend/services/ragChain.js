const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const {
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} = require("@langchain/core/runnables");
const { getChatModel } = require("./llm");
const { searchKnowledge } = require("./knowledgeBase");

// RAG = Retriever (Qdrant) -> context with citations -> prompt -> LLM.
// Each group is searched separately and the results are merged, so exam questions
// that share keywords ("since", "for") cannot push the theory out of the context.

const GROUPS = {
  documents: { sources: ["document"], k: 3 },
  lessons: { sources: ["grammar_lesson"], k: 2 },
  flashcards: { sources: ["flashcard"], k: 2 },
  questions: { sources: ["exam_question"], k: 2 },
};
// Teacher documents get their own slots so lessons cannot push them out (and vice versa)
const SCOPE_GROUPS = {
  all: [GROUPS.documents, GROUPS.lessons, GROUPS.flashcards, GROUPS.questions],
  theory: [GROUPS.documents, GROUPS.lessons],
  vocabulary: [GROUPS.flashcards],
  practice: [GROUPS.questions],
};
const SCOPES = Object.keys(SCOPE_GROUPS);

// Below this cosine score a chunk is usually unrelated to the question
const MIN_SCORE = 0.55;

// Citation shown to the learner, e.g. "Ghi chú ngữ pháp, trang 2"
const formatCitation = ({ source, title, page }) => {
  if (source === "document") return page ? `${title}, trang ${page}` : title;
  if (source === "grammar_lesson") return `Bài ngữ pháp: ${title}`;
  if (source === "flashcard") return `Flashcard: ${title}`;
  if (source === "exam_question") return `Đề luyện thi: ${title}`;
  return title || "Kho kiến thức";
};

// Retriever: { query, scope } -> [{ citation, link, source, score, content }]
const knowledgeRetriever = RunnableLambda.from(async ({ query, scope = "all" }) => {
  const groups = SCOPE_GROUPS[scope] || SCOPE_GROUPS.all;
  const perGroup = await Promise.all(groups.map((g) => searchKnowledge(query, g.k, g.sources)));

  const seen = new Set();
  return perGroup
    .flat()
    .filter((hit) => hit.score >= MIN_SCORE)
    .filter((hit) => {
      const key = hit.content;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((hit) => ({
      citation: formatCitation(hit.metadata),
      link: hit.metadata.link || null,
      source: hit.metadata.source,
      score: hit.score,
      content: hit.content,
    }));
}).withConfig({ runName: "KnowledgeRetriever" });

// Numbered context block the model can cite as [1], [2], ...
const formatContext = (hits) =>
  hits.map((h, i) => `[${i + 1}] (Nguồn: ${h.citation})\n${h.content}`).join("\n\n");

const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Bạn là trợ lý tiếng Anh của EnglishMaster. Trả lời câu hỏi CHỈ dựa trên phần "Tài liệu" bên dưới.
- Trả lời bằng tiếng Việt, ngắn gọn (tối đa khoảng 120 từ), dùng **in đậm** và gạch đầu dòng khi cần.
- Sau mỗi ý lấy từ tài liệu, ghi số nguồn trong ngoặc vuông, ví dụ [1].
- Nếu tài liệu không đủ để trả lời, chỉ viết đúng câu "Kho tài liệu chưa có thông tin này." (không ghi số nguồn) và không tự bịa.
- Câu hỏi đề luyện thi trong tài liệu không có đáp án; không đoán đáp án của chúng.`,
  ],
  ["human", "Tài liệu:\n{context}\n\nCâu hỏi: {question}"],
]);

const NO_CONTEXT_ANSWER = "Kho tài liệu chưa có thông tin liên quan đến câu hỏi này.";

// RAG chain: { question, scope? } -> { answer, sources }
const ragChain = RunnableSequence.from([
  RunnablePassthrough.assign({
    hits: RunnableLambda.from(({ question, scope }) =>
      knowledgeRetriever.invoke({ query: question, scope })
    ),
  }),
  RunnableLambda.from(async ({ question, hits }) => {
    if (hits.length === 0) return { answer: NO_CONTEXT_ANSWER, sources: [] };
    const answer = await ragPrompt
      .pipe(getChatModel(0.2))
      .pipe(new StringOutputParser())
      .invoke({ question, context: formatContext(hits) });
    // The model found nothing useful in the context: no sources to show
    // (only when the whole answer is that refusal, not when one point is missing)
    if (/^kho tài liệu chưa có thông tin/i.test(answer.trim())) {
      return { answer: NO_CONTEXT_ANSWER, sources: [] };
    }
    // Sources are built by code (not by the model), so every citation is real.
    // Keep only the numbers the answer actually cites, e.g. [1] or [1, 2].
    const cited = new Set(
      [...answer.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap((m) => m[1].split(",").map(Number))
    );
    const sources = hits
      .map((h, i) => ({ number: i + 1, citation: h.citation, link: h.link }))
      .filter((s) => cited.has(s.number));
    return { answer: answer.trim(), sources };
  }),
]).withConfig({ runName: "KnowledgeRAG" });

const answerFromKnowledge = (question, scope = "all") => ragChain.invoke({ question, scope });

module.exports = { knowledgeRetriever, answerFromKnowledge, formatContext, SCOPES };
