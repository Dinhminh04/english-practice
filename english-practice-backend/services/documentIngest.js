const fs = require("fs/promises");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const AiDocument = require("../models/aiDocumentModel");
const { indexUploadedDocument } = require("./knowledgeBase");

// Admin documents are stored outside the public /uploads folder (they may be
// copyrighted or internal), in a folder backed by its own Docker volume.
const DOCS_DIR = path.join(__dirname, "..", "storage", "ai-docs");

const TEXT_TYPES = ["text/plain", "text/markdown"];

// Extract text page by page: PDF -> one entry per page, TXT/MD -> a single page
const extractPages = async (buffer, mimeType) => {
  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.pages.map((p) => ({ num: p.num, text: p.text }));
    } finally {
      await parser.destroy();
    }
  }
  if (TEXT_TYPES.includes(mimeType)) {
    return [{ num: 1, text: buffer.toString("utf8") }];
  }
  throw new Error("Định dạng tài liệu chưa được hỗ trợ");
};

// Background job: read the stored file, index it into Qdrant, update its status
const ingestDocument = async (document) => {
  try {
    const buffer = await fs.readFile(path.join(DOCS_DIR, document.stored_name));
    const pages = await extractPages(buffer, document.mime_type);
    const totalChars = pages.reduce((sum, p) => sum + p.text.trim().length, 0);
    if (totalChars === 0) {
      throw new Error("Không đọc được chữ trong tài liệu (có thể là PDF dạng ảnh scan)");
    }
    const chunkCount = await indexUploadedDocument(document.id, document.title, pages);
    await AiDocument.markReady(document.id, pages.length, chunkCount);
  } catch (err) {
    console.error(`Lỗi khi xử lý tài liệu AI #${document.id}:`, err.message);
    await AiDocument.markFailed(document.id, err.message);
  }
};

module.exports = { DOCS_DIR, TEXT_TYPES, ingestDocument };
