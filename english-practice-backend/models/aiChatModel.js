const pool = require("../config/database");

const CREATE_CONVERSATIONS = `
  CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Cuộc trò chuyện mới',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ai_conversations_user (user_id, updated_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_MESSAGES = `
  CREATE TABLE IF NOT EXISTS ai_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ai_messages_conversation (conversation_id, id),
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const AiChat = {
  // Tạo bảng nếu chưa có (chạy khi server khởi động)
  ensureTables: async () => {
    await pool.query(CREATE_CONVERSATIONS);
    await pool.query(CREATE_MESSAGES);
  },

  // Tạo cuộc trò chuyện mới
  createConversation: async (userId, title) => {
    const [result] = await pool.query(
      "INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)",
      [userId, title]
    );
    return result.insertId;
  },

  // Lấy cuộc trò chuyện, chỉ khi thuộc về user
  findConversation: async (conversationId, userId) => {
    const [rows] = await pool.query(
      "SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?",
      [conversationId, userId]
    );
    return rows[0] || null;
  },

  // Danh sách cuộc trò chuyện của user, mới nhất trước
  listConversations: async (userId, limit = 50) => {
    const [rows] = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM ai_conversations
       WHERE user_id = ?
       ORDER BY updated_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  // Lấy N tin nhắn gần nhất, trả về theo thứ tự thời gian
  getRecentMessages: async (conversationId, limit = 20) => {
    const [rows] = await pool.query(
      `SELECT * FROM (
         SELECT id, role, content, created_at
         FROM ai_messages
         WHERE conversation_id = ?
         ORDER BY id DESC
         LIMIT ?
       ) recent
       ORDER BY id ASC`,
      [conversationId, limit]
    );
    return rows;
  },

  // Lưu một tin nhắn và cập nhật thời gian của cuộc trò chuyện
  addMessage: async (conversationId, role, content) => {
    await pool.query(
      "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)",
      [conversationId, role, content]
    );
    await pool.query(
      "UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [conversationId]
    );
  },

  // Xóa cuộc trò chuyện (tin nhắn bị xóa theo nhờ ON DELETE CASCADE)
  deleteConversation: async (conversationId, userId) => {
    const [result] = await pool.query(
      "DELETE FROM ai_conversations WHERE id = ? AND user_id = ?",
      [conversationId, userId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = AiChat;
