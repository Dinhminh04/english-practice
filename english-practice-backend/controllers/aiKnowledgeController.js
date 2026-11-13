const fs = require("fs");
const path = require("path");
const {
  SOURCES,
  SEARCHABLE_SOURCES,
  rebuildKnowledgeBase,
  getKnowledgeStats,
  searchKnowledge,
  deleteDocumentChunks,
} = require("../services/knowledgeBase");
const { DOCS_DIR, ingestDocument } = require("../services/documentIngest");
const AiDocument = require("../models/aiDocumentModel");
const { answerFromKnowledge, SCOPES } = require("../services/ragChain");

// Thống kê kho kiến thức AI (số đoạn văn theo từng nguồn)
exports.getStats = async (req, res) => {
  try {
    res.json(await getKnowledgeStats());
  } catch (error) {
    console.error("Error reading knowledge stats:", error);
    res.status(503).json({ message: "Không kết nối được kho kiến thức AI" });
  }
};

// Nạp lại kho kiến thức từ MySQL (toàn bộ, hoặc một nguồn: ?source=flashcard).
// Chạy nền; xem tiến trình ở GET /api/admin/ai/knowledge (trường indexing).
exports.rebuild = (req, res) => {
  const { source } = req.query;
  if (source && !SOURCES.includes(source)) {
    return res.status(400).json({ message: `Nguồn không hợp lệ. Chọn một trong: ${SOURCES.join(", ")}` });
  }
  if (!rebuildKnowledgeBase(source)) {
    return res.status(409).json({ message: "Đang nạp kho kiến thức, vui lòng đợi lần nạp hiện tại xong" });
  }
  res.status(202).json({ message: "Đã bắt đầu nạp lại kho kiến thức, xem tiến trình ở trang thống kê" });
};

// Tìm thử theo ngữ nghĩa: ?q=...&source=...&k=4
exports.search = async (req, res) => {
  const { q, source } = req.query;
  const k = Math.min(parseInt(req.query.k, 10) || 4, 10);
  if (!q || !q.trim()) {
    return res.status(400).json({ message: "Thiếu câu tìm kiếm (q)" });
  }
  if (source && !SEARCHABLE_SOURCES.includes(source)) {
    return res
      .status(400)
      .json({ message: `Nguồn không hợp lệ. Chọn một trong: ${SEARCHABLE_SOURCES.join(", ")}` });
  }
  try {
    res.json({ query: q, results: await searchKnowledge(q.trim(), k, source) });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    res.status(503).json({ message: "Lỗi khi tìm trong kho kiến thức" });
  }
};

// Hỏi kho kiến thức qua RAG chain (trả lời kèm nguồn)
exports.ask = async (req, res) => {
  const question = (req.body.question || "").trim();
  const scope = req.body.scope || "all";
  if (question.length < 2 || question.length > 500) {
    return res.status(400).json({ message: "Câu hỏi phải từ 2 đến 500 ký tự" });
  }
  if (!SCOPES.includes(scope)) {
    return res.status(400).json({ message: `Phạm vi không hợp lệ. Chọn một trong: ${SCOPES.join(", ")}` });
  }
  try {
    res.json({ question, ...(await answerFromKnowledge(question, scope)) });
  } catch (error) {
    console.error("Error answering from knowledge base:", error);
    res.status(503).json({ message: "AI đang bận, vui lòng thử lại sau" });
  }
};

// ---- Tài liệu admin tải lên ------------------------------------------------

// Danh sách tài liệu
exports.listDocuments = async (req, res) => {
  try {
    res.json({ documents: await AiDocument.findAll() });
  } catch (error) {
    console.error("Error listing AI documents:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tải lên tài liệu (multipart: file, title?). Trả về ngay, xử lý (tách chữ, embedding) chạy nền.
exports.uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file PDF hoặc TXT" });
  }
  // Multer đọc tên file theo latin1; đổi lại sang UTF-8 để giữ đúng tiếng Việt
  const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
  const title = (req.body.title || "").trim() || path.parse(originalName).name;

  try {
    const id = await AiDocument.create({
      title: title.slice(0, 255),
      original_name: originalName.slice(0, 255),
      stored_name: req.file.filename,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      uploaded_by: req.user.userId,
    });
    const document = await AiDocument.findById(id);
    ingestDocument(document); // background job, status is stored in ai_documents
    res.status(202).json({ message: "Đã tải lên, đang xử lý tài liệu", document });
  } catch (error) {
    fs.unlink(req.file.path, () => {});
    console.error("Error uploading AI document:", error);
    res.status(500).json({ message: "Lỗi server khi tải lên tài liệu" });
  }
};

// Xóa tài liệu: các đoạn trong Qdrant, file gốc và bản ghi
exports.deleteDocument = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const document = await AiDocument.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    }
    if (document.status === "processing") {
      return res.status(409).json({ message: "Tài liệu đang được xử lý, vui lòng thử lại sau" });
    }
    await deleteDocumentChunks(id);
    fs.unlink(path.join(DOCS_DIR, document.stored_name), () => {});
    await AiDocument.delete(id);
    res.json({ message: "Đã xóa tài liệu" });
  } catch (error) {
    console.error("Error deleting AI document:", error);
    res.status(500).json({ message: "Lỗi server khi xóa tài liệu" });
  }
};
