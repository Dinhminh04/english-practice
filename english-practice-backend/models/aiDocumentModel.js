const pool = require("../config/database");

// Reference documents uploaded by admins for the AI knowledge base (RAG)
const CREATE_DOCUMENTS = `
  CREATE TABLE IF NOT EXISTS ai_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INT NOT NULL,
    page_count INT NULL,
    chunk_count INT NULL,
    status ENUM('processing', 'ready', 'failed') NOT NULL DEFAULT 'processing',
    error VARCHAR(500) NULL,
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const AiDocument = {
  // Tạo bảng nếu chưa có; tài liệu đang xử lý dở khi server tắt thì đánh dấu lỗi
  ensureTable: async () => {
    await pool.query(CREATE_DOCUMENTS);
    await pool.query(
      "UPDATE ai_documents SET status = 'failed', error = 'Quá trình xử lý bị gián đoạn, hãy tải lên lại' WHERE status = 'processing'"
    );
  },

  create: async (doc) => {
    const [result] = await pool.query(
      `INSERT INTO ai_documents (title, original_name, stored_name, mime_type, size_bytes, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [doc.title, doc.original_name, doc.stored_name, doc.mime_type, doc.size_bytes, doc.uploaded_by]
    );
    return result.insertId;
  },

  markReady: async (id, pageCount, chunkCount) => {
    await pool.query(
      "UPDATE ai_documents SET status = 'ready', page_count = ?, chunk_count = ?, error = NULL WHERE id = ?",
      [pageCount, chunkCount, id]
    );
  },

  markFailed: async (id, message) => {
    await pool.query("UPDATE ai_documents SET status = 'failed', error = ? WHERE id = ?", [
      String(message).slice(0, 500),
      id,
    ]);
  },

  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT d.id, d.title, d.original_name, d.mime_type, d.size_bytes, d.page_count, d.chunk_count,
              d.status, d.error, d.created_at, u.display_name AS uploaded_by_name
       FROM ai_documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       ORDER BY d.created_at DESC`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM ai_documents WHERE id = ?", [id]);
    return rows[0] || null;
  },

  delete: async (id) => {
    await pool.query("DELETE FROM ai_documents WHERE id = ?", [id]);
  },
};

module.exports = AiDocument;
