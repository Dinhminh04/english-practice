const pool = require("../config/database");

const Vocabulary = {};

Vocabulary.getHistoryByUserId = async (userId) => {
  return await UserVocabularyLearning.findByUser(userId);
};

const VocabularyCollection = {
  // Tạo bộ từ vựng mới
  create: async (collectionData) => {
    const sql = `
      INSERT INTO vocabulary_collections 
      (title, description, level, category, tags, is_public, display_order, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      collectionData.title,
      collectionData.description,
      collectionData.level,
      collectionData.category || null,
      JSON.stringify(collectionData.tags || []),
      collectionData.is_public !== undefined ? collectionData.is_public : true,
      collectionData.display_order || 0,
      collectionData.created_by,
    ]);
    return result;
  },

  // Lấy tất cả bộ từ vựng
  findAll: async (filters = {}) => {
    let sql = `
      SELECT vc.*, u.display_name as creator_name,
             COUNT(vf.id) as total_cards
      FROM vocabulary_collections vc
      LEFT JOIN users u ON vc.created_by = u.id
      LEFT JOIN vocabulary_flashcards vf ON vc.id = vf.collection_id AND vf.is_active = TRUE
      WHERE 1=1
    `;
    const params = [];

    if (filters.level) {
      sql += ` AND vc.level = ?`;
      params.push(filters.level);
    }

    if (filters.category) {
      sql += ` AND vc.category = ?`;
      params.push(filters.category);
    }

    if (filters.created_by) {
      sql += ` AND vc.created_by = ?`;
      params.push(filters.created_by);
    }

    if (filters.is_public !== undefined) {
      sql += ` AND vc.is_public = ?`;
      params.push(filters.is_public);
    }

    sql += ` GROUP BY vc.id ORDER BY vc.display_order ASC, vc.created_at DESC`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // Tìm bộ từ vựng theo ID
  findById: async (id) => {
    const sql = `
      SELECT vc.*, u.display_name as creator_name,
             COUNT(vf.id) as total_cards
      FROM vocabulary_collections vc
      LEFT JOIN users u ON vc.created_by = u.id
      LEFT JOIN vocabulary_flashcards vf ON vc.id = vf.collection_id AND vf.is_active = TRUE
      WHERE vc.id = ?
      GROUP BY vc.id
    `;
    const [rows] = await pool.execute(sql, [id]);
    return rows;
  },

  // Cập nhật bộ từ vựng
  update: async (id, collectionData) => {
    const sql = `
      UPDATE vocabulary_collections 
      SET title = ?, description = ?, level = ?, category = ?, tags = ?, 
          is_public = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [
      collectionData.title,
      collectionData.description,
      collectionData.level,
      collectionData.category,
      JSON.stringify(collectionData.tags || []),
      collectionData.is_public,
      collectionData.display_order,
      id,
    ]);
    return result;
  },

  // Xóa bộ từ vựng
  delete: async (id) => {
    const sql = "DELETE FROM vocabulary_collections WHERE id = ?";
    const [result] = await pool.execute(sql, [id]);
    return result;
  },
};

const VocabularyFlashcard = {
  // Tạo flashcard mới
  create: async (flashcardData) => {
    const sql = `
      INSERT INTO vocabulary_flashcards 
      (collection_id, word, meaning, pronunciation, pronunciation_audio, 
       example_sentence, example_meaning, example_image, part_of_speech, 
       synonyms, antonyms, tags, difficulty_level, display_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      flashcardData.collection_id,
      flashcardData.word,
      flashcardData.meaning,
      flashcardData.pronunciation || null,
      flashcardData.pronunciation_audio || null,
      flashcardData.example_sentence || null,
      flashcardData.example_meaning || null,
      flashcardData.example_image || null,
      flashcardData.part_of_speech,
      JSON.stringify(flashcardData.synonyms || []),
      JSON.stringify(flashcardData.antonyms || []),
      JSON.stringify(flashcardData.tags || []),
      flashcardData.difficulty_level || "medium",
      flashcardData.display_order || 0,
    ]);
    return result;
  },

  // Lấy tất cả flashcards theo collection
  findByCollectionId: async (collectionId) => {
    const sql = `
      SELECT * FROM vocabulary_flashcards 
      WHERE collection_id = ? AND is_active = TRUE
      ORDER BY display_order ASC, created_at ASC
    `;
    const [rows] = await pool.execute(sql, [collectionId]);
    return rows;
  },

  // Tìm flashcard theo ID
  findById: async (id) => {
    const sql = "SELECT * FROM vocabulary_flashcards WHERE id = ?";
    const [rows] = await pool.execute(sql, [id]);
    return rows;
  },

  // Cập nhật flashcard
  update: async (id, flashcardData) => {
    const sql = `
      UPDATE vocabulary_flashcards 
      SET word = ?, meaning = ?, pronunciation = ?, pronunciation_audio = ?,
          example_sentence = ?, example_meaning = ?, example_image = ?,
          part_of_speech = ?, synonyms = ?, antonyms = ?, tags = ?,
          difficulty_level = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [
      flashcardData.word,
      flashcardData.meaning,
      flashcardData.pronunciation,
      flashcardData.pronunciation_audio,
      flashcardData.example_sentence,
      flashcardData.example_meaning,
      flashcardData.example_image,
      flashcardData.part_of_speech,
      JSON.stringify(flashcardData.synonyms || []),
      JSON.stringify(flashcardData.antonyms || []),
      JSON.stringify(flashcardData.tags || []),
      flashcardData.difficulty_level,
      flashcardData.display_order,
      id,
    ]);
    return result;
  },

  // Xóa flashcard (soft delete)
  delete: async (id) => {
    const sql =
      "UPDATE vocabulary_flashcards SET is_active = FALSE WHERE id = ?";
    const [result] = await pool.execute(sql, [id]);
    return result;
  },

  // Import từ CSV
  bulkCreate: async (flashcards) => {
    const sql = `
      INSERT INTO vocabulary_flashcards 
      (collection_id, word, meaning, pronunciation, example_sentence, 
       example_meaning, part_of_speech, synonyms, antonyms, tags, 
       difficulty_level, display_order) 
      VALUES ?
    `;

    const values = flashcards.map((flashcard) => [
      flashcard.collection_id,
      flashcard.word,
      flashcard.meaning,
      flashcard.pronunciation || null,
      flashcard.example_sentence || null,
      flashcard.example_meaning || null,
      flashcard.part_of_speech || "noun",
      JSON.stringify(flashcard.synonyms || []),
      JSON.stringify(flashcard.antonyms || []),
      JSON.stringify(flashcard.tags || []),
      flashcard.difficulty_level || "medium",
      flashcard.display_order || 0,
    ]);

    const [result] = await pool.execute(sql, [values]);
    return result;
  },

  // Tìm kiếm từ vựng
  search: async (searchTerm, collectionId = null) => {
    let sql = `
      SELECT * FROM vocabulary_flashcards 
      WHERE is_active = TRUE AND (word LIKE ? OR meaning LIKE ?)
    `;
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];

    if (collectionId) {
      sql += ` AND collection_id = ?`;
      params.push(collectionId);
    }

    sql += ` ORDER BY word ASC LIMIT 50`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  },
};

const VocabularyQuestion = {
  // Create a new question
  create: async (questionData) => {
    const sql = `
      INSERT INTO vocabulary_questions
      (collection_id, flashcard_id, question_type, question_text, options, correct_answer)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      questionData.collection_id,
      questionData.flashcard_id,
      questionData.question_type,
      questionData.question_text,
      JSON.stringify(questionData.options || []),
      questionData.correct_answer,
    ]);
    return result;
  },

  // Get all questions for a collection
  findByCollectionId: async (collectionId) => {
    const sql = `
      SELECT * FROM vocabulary_questions
      WHERE collection_id = ?
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.execute(sql, [collectionId]);
    return rows;
  },

  // Find a question by ID
  findById: async (id) => {
    const sql = "SELECT * FROM vocabulary_questions WHERE id = ?";
    const [rows] = await pool.execute(sql, [id]);
    return rows;
  },

  // Update a question
  update: async (id, questionData) => {
    const sql = `
      UPDATE vocabulary_questions
      SET flashcard_id = ?, question_type = ?, question_text = ?, options = ?, correct_answer = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [
      questionData.flashcard_id,
      questionData.question_type,
      questionData.question_text,
      JSON.stringify(questionData.options || []),
      questionData.correct_answer,
      id,
    ]);
    return result;
  },

  // Delete a question
  delete: async (id) => {
    const sql = "DELETE FROM vocabulary_questions WHERE id = ?";
    const [result] = await pool.execute(sql, [id]);
    return result;
  },
};

const UserVocabularyLearning = {
  // Lưu tiến độ học tập
  saveProgress: async (progressData) => {
    // Kiểm tra xem đã có bản ghi chưa
    const checkSql = `SELECT id FROM user_vocabulary_learning WHERE user_id = ? AND flashcard_id = ?`;
    const [existing] = await pool.execute(checkSql, [
      progressData.user_id,
      progressData.flashcard_id,
    ]);

    if (existing.length > 0) {
      // Cập nhật bản ghi hiện có
      const updateSql = `
        UPDATE user_vocabulary_learning 
        SET status = ?, confidence_level = ?, next_review_date = ?, 
            review_count = review_count + 1, last_reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND flashcard_id = ?
      `;
      const [result] = await pool.execute(updateSql, [
        progressData.status,
        progressData.confidence_level,
        progressData.next_review_date,
        progressData.user_id,
        progressData.flashcard_id,
      ]);
      return result;
    } else {
      // Tạo bản ghi mới
      const insertSql = `
        INSERT INTO user_vocabulary_learning 
        (user_id, flashcard_id, collection_id, status, confidence_level, next_review_date, review_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(insertSql, [
        progressData.user_id,
        progressData.flashcard_id,
        progressData.collection_id,
        progressData.status,
        progressData.confidence_level,
        progressData.next_review_date,
        1,
      ]);
      return result;
    }
  },

  // Lấy tiến độ học tập của người dùng
  findByUser: async (userId, collectionId = null) => {
    let sql = `
      SELECT uvl.*, vf.word, vf.meaning, vf.pronunciation, vc.title as collection_title
      FROM user_vocabulary_learning uvl
      LEFT JOIN vocabulary_flashcards vf ON uvl.flashcard_id = vf.id
      LEFT JOIN vocabulary_collections vc ON uvl.collection_id = vc.id
      WHERE uvl.user_id = ?
    `;

    const params = [userId];

    if (collectionId) {
      sql += ` AND uvl.collection_id = ?`;
      params.push(collectionId);
    }

    sql += ` ORDER BY uvl.next_review_date ASC, uvl.created_at DESC`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // Cập nhật tổng tiến độ
  updateOverallProgress: async (userId, collectionId) => {
    const progressSql = `
      INSERT INTO user_vocabulary_progress 
      (user_id, collection_id, total_cards, learned_cards, mastered_cards, total_reviews, average_confidence, last_studied_at)
      SELECT 
        ? as user_id,
        ? as collection_id,
        COUNT(vf.id) as total_cards,
        COUNT(uvl.id) as learned_cards,
        SUM(CASE WHEN uvl.status = 'mastered' THEN 1 ELSE 0 END) as mastered_cards,
        SUM(uvl.review_count) as total_reviews,
        AVG(uvl.confidence_level) as average_confidence,
        MAX(uvl.last_reviewed_at) as last_studied_at
      FROM vocabulary_flashcards vf
      LEFT JOIN user_vocabulary_learning uvl ON vf.id = uvl.flashcard_id AND uvl.user_id = ?
      WHERE vf.collection_id = ? AND vf.is_active = TRUE
      ON DUPLICATE KEY UPDATE
        total_cards = VALUES(total_cards),
        learned_cards = VALUES(learned_cards),
        mastered_cards = VALUES(mastered_cards),
        total_reviews = VALUES(total_reviews),
        average_confidence = VALUES(average_confidence),
        last_studied_at = VALUES(last_studied_at),
        updated_at = CURRENT_TIMESTAMP
    `;

    const [result] = await pool.execute(progressSql, [
      userId,
      collectionId,
      userId,
      collectionId,
    ]);
    return result;
  },

  // Lưu hàng loạt tiến độ học tập
  saveBulkProgress: async (progressDataArray) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `
        INSERT INTO user_vocabulary_learning 
        (user_id, flashcard_id, collection_id, status, confidence_level, next_review_date, review_count, last_reviewed_at) 
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          confidence_level = VALUES(confidence_level),
          next_review_date = VALUES(next_review_date),
          review_count = review_count + 1,
          last_reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `;

      for (const progressData of progressDataArray) {
        await connection.execute(sql, [
          progressData.user_id,
          progressData.flashcard_id,
          progressData.collection_id,
          progressData.status,
          progressData.confidence_level,
          progressData.next_review_date,
        ]);
      }

      await connection.commit();
      return { message: "Bulk progress saved successfully." };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

// Utility functions cho CSV
const VocabularyCSV = {
  exportFlashcards: async (collectionId) => {
    const sql = `
      SELECT 
        vf.word,
        vf.meaning,
        vf.pronunciation,
        vf.example_sentence,
        vf.example_meaning,
        vf.part_of_speech,
        vf.difficulty_level,
        vf.display_order,
        vc.title as collection_title
      FROM vocabulary_flashcards vf
      LEFT JOIN vocabulary_collections vc ON vf.collection_id = vc.id
      WHERE vf.collection_id = ? AND vf.is_active = TRUE
      ORDER BY vf.display_order ASC, vf.word ASC
    `;
    const [rows] = await pool.execute(sql, [collectionId]);
    return rows;
  },
};

module.exports = {
  Vocabulary,
  VocabularyCollection,
  VocabularyFlashcard,
  VocabularyQuestion,
  UserVocabularyLearning,
  VocabularyCSV,
};
