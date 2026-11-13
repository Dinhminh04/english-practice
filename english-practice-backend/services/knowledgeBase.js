const { QdrantVectorStore } = require("@langchain/qdrant");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");
const pool = require("../config/database");
const { embeddings } = require("./llm");

// RAG knowledge base: app content from MySQL -> Documents -> embeddings -> Qdrant.

const COLLECTION = "english_knowledge";

const vectorStore = new QdrantVectorStore(embeddings, {
  url: process.env.QDRANT_URL || "http://qdrant:6333",
  collectionName: COLLECTION,
  collectionConfig: { vectors: { size: 768, distance: "Cosine" } },
});

// Split long texts into overlapping chunks so each vector covers one idea
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 150 });

const sourceFilter = (source) => ({
  must: [{ key: "metadata.source", match: { value: source } }],
});

const parseJsonList = (value) => {
  if (!value) return [];
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const lines = (...parts) => parts.filter(Boolean).join("\n");

// ---- Document loaders (one per source) --------------------------------

const loadGrammarLessons = async () => {
  const [rows] = await pool.query(
    `SELECT gl.id, gl.title, gt.title AS topic, gl.difficulty_level, gl.explanation,
            gl.structure, gl.\`usage\`, gl.example_sentence, gl.meaning
     FROM grammar_lessons gl
     JOIN grammar_topics gt ON gt.id = gl.topic_id
     WHERE gl.is_active = 1`
  );
  const docs = rows.map(
    (r) =>
      new Document({
        pageContent: lines(
          `Bài ngữ pháp: ${r.title}`,
          `Chủ đề: ${r.topic}`,
          r.explanation && `Giải thích: ${r.explanation}`,
          r.structure && `Cấu trúc: ${r.structure}`,
          r.usage && `Cách dùng: ${r.usage}`,
          r.example_sentence && `Ví dụ: ${r.example_sentence}`,
          r.meaning && `Nghĩa: ${r.meaning}`
        ),
        metadata: {
          source: "grammar_lesson",
          source_id: r.id,
          title: r.title,
          link: `/grammar/learn/${r.id}`,
        },
      })
  );
  return splitter.splitDocuments(docs);
};

const loadFlashcards = async () => {
  const [rows] = await pool.query(
    `SELECT vf.id, vf.word, vf.meaning, vf.pronunciation, vf.part_of_speech,
            vf.example_sentence, vf.example_meaning, vf.synonyms, vf.antonyms,
            vc.id AS collection_id, vc.title AS collection
     FROM vocabulary_flashcards vf
     JOIN vocabulary_collections vc ON vc.id = vf.collection_id
     WHERE vf.is_active = 1`
  );
  return rows.map((r) => {
    const synonyms = parseJsonList(r.synonyms);
    const antonyms = parseJsonList(r.antonyms);
    return new Document({
      pageContent: lines(
        `Từ vựng: ${r.word}${r.part_of_speech ? ` (${r.part_of_speech})` : ""}${r.pronunciation ? ` ${r.pronunciation}` : ""}`,
        `Nghĩa: ${r.meaning}`,
        r.example_sentence && `Ví dụ: ${r.example_sentence}${r.example_meaning ? ` (${r.example_meaning})` : ""}`,
        synonyms.length > 0 && `Đồng nghĩa: ${synonyms.join(", ")}`,
        antonyms.length > 0 && `Trái nghĩa: ${antonyms.join(", ")}`,
        `Bộ từ vựng: ${r.collection}`
      ),
      metadata: {
        source: "flashcard",
        source_id: r.id,
        title: r.word,
        link: `/vocabulary-collections/${r.collection_id}/study`,
      },
    });
  });
};

// Exam questions are indexed WITHOUT their correct answers,
// so learners cannot ask the tutor for answers while taking an exam.
const loadExamQuestions = async () => {
  const [rows] = await pool.query(
    `SELECT q.id, q.question_text, q.options, e.id AS exam_id, e.title AS exam_title,
            e.exam_type, e.difficulty
     FROM questions q
     JOIN exams e ON e.id = q.exam_id`
  );
  return rows.map((r) => {
    const options = parseJsonList(r.options);
    return new Document({
      pageContent: lines(
        `Câu hỏi luyện thi (${r.exam_title}, ${r.exam_type}, độ khó ${r.difficulty}):`,
        r.question_text,
        options.length > 0 && `Các lựa chọn: ${options.join(" | ")}`
      ),
      metadata: {
        source: "exam_question",
        source_id: r.id,
        title: r.exam_title,
        link: `/exams/${r.exam_id}/take`,
      },
    });
  });
};

const LOADERS = {
  grammar_lesson: loadGrammarLessons,
  flashcard: loadFlashcards,
  exam_question: loadExamQuestions,
};

// ---- Indexing ----------------------------------------------------------

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// LangChain's Gemini embeddings return EMPTY vectors instead of throwing when the
// free-tier quota is exceeded (HTTP 429), so check every vector and retry with backoff.
const embedWithRetry = async (texts) => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const vectors = await embeddings.embedDocuments(texts);
    if (vectors.length === texts.length && vectors.every((v) => v.length > 0)) return vectors;
    if (attempt < MAX_ATTEMPTS) await sleep(15000 * attempt);
  }
  throw new Error("Embedding API trả về vector rỗng (có thể đã vượt giới hạn quota)");
};

// Embed and store documents in small batches to stay under the rate limit
const addDocumentsInBatches = async (docs) => {
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const vectors = await embedWithRetry(batch.map((d) => d.pageContent));
    await vectorStore.addVectors(vectors, batch);
  }
};

// Re-index one source: delete its old vectors, load fresh content, embed and store
const indexSource = async (source) => {
  await vectorStore.ensureCollection();
  await vectorStore.delete({ filter: sourceFilter(source) });
  const docs = await LOADERS[source]();
  await addDocumentsInBatches(docs);
  return docs.length;
};

// Indexing can take a minute or two, so it runs in the background and
// reports its progress here (read by getKnowledgeStats)
const indexing = { running: false, startedAt: null, finishedAt: null, result: null, error: null };

const runIndexing = async (sources) => {
  if (indexing.running) return false;
  Object.assign(indexing, { running: true, startedAt: new Date(), finishedAt: null, result: {}, error: null });
  try {
    for (const s of sources) indexing.result[s] = await indexSource(s);
  } catch (err) {
    indexing.error = err.message;
    console.error("Lỗi khi nạp kho kiến thức AI:", err.message);
  } finally {
    indexing.running = false;
    indexing.finishedAt = new Date();
  }
  return true;
};

// Start re-indexing app content (all sources, or only the given one) in the background.
// Returns false if an indexing job is already running.
const rebuildKnowledgeBase = (source) => {
  if (indexing.running) return false;
  runIndexing(source ? [source] : Object.keys(LOADERS));
  return true;
};

// ---- Admin-uploaded documents ------------------------------------------

const DOCUMENT_SOURCE = "document";

const documentFilter = (documentId) => ({
  must: [
    { key: "metadata.source", match: { value: DOCUMENT_SOURCE } },
    { key: "metadata.source_id", match: { value: documentId } },
  ],
});

// Index one uploaded document. pages = [{ num, text }]; each chunk keeps its page number
// so the tutor can cite "title, page N".
const indexUploadedDocument = async (documentId, title, pages) => {
  await vectorStore.ensureCollection();
  await vectorStore.delete({ filter: documentFilter(documentId) });

  const pageDocs = pages
    .filter((p) => p.text.trim().length > 0)
    .map(
      (p) =>
        new Document({
          pageContent: p.text,
          metadata: { source: DOCUMENT_SOURCE, source_id: documentId, title, page: p.num, link: null },
        })
    );
  const chunks = await splitter.splitDocuments(pageDocs);
  // Put the document title in every chunk so a chunk still makes sense on its own
  chunks.forEach((c) => {
    c.pageContent = `Tài liệu: ${title} (trang ${c.metadata.page})\n${c.pageContent}`;
  });

  await addDocumentsInBatches(chunks);
  return chunks.length;
};

const deleteDocumentChunks = async (documentId) => {
  await vectorStore.ensureCollection();
  await vectorStore.delete({ filter: documentFilter(documentId) });
};

// Number of chunks stored per source
const getKnowledgeStats = async () => {
  await vectorStore.ensureCollection();
  const stats = {};
  for (const source of [...Object.keys(LOADERS), DOCUMENT_SOURCE]) {
    const { count } = await vectorStore.client.count(COLLECTION, {
      filter: sourceFilter(source),
      exact: true,
    });
    stats[source] = count;
  }
  const { count: total } = await vectorStore.client.count(COLLECTION, { exact: true });
  return { collection: COLLECTION, total, by_source: stats, indexing };
};

// Semantic search: returns [{ content, metadata, score }]
// source: one source name, an array of sources, or empty for all sources
const searchKnowledge = async (query, k = 4, source) => {
  let filter;
  if (Array.isArray(source) && source.length > 0) {
    filter = { must: [{ key: "metadata.source", match: { any: source } }] };
  } else if (typeof source === "string" && source) {
    filter = sourceFilter(source);
  }
  const results = await vectorStore.similaritySearchWithScore(query, k, filter);
  return results.map(([doc, score]) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
    score: Number(score.toFixed(4)),
  }));
};

// On startup: index every app-content source that is still empty (e.g. first start,
// or a failed run). Uploaded documents are indexed when they are uploaded.
const initKnowledgeBase = async () => {
  const { by_source } = await getKnowledgeStats();
  const emptySources = Object.keys(LOADERS).filter((s) => by_source[s] === 0);
  if (emptySources.length === 0) return;
  await runIndexing(emptySources);
  console.log("Đã nạp kho kiến thức AI:", indexing.result, indexing.error || "");
};

module.exports = {
  vectorStore,
  SOURCES: Object.keys(LOADERS),
  SEARCHABLE_SOURCES: [...Object.keys(LOADERS), DOCUMENT_SOURCE],
  rebuildKnowledgeBase,
  getKnowledgeStats,
  searchKnowledge,
  initKnowledgeBase,
  indexUploadedDocument,
  deleteDocumentChunks,
};
