const {
  VocabularyCollection,
  VocabularyFlashcard,
  UserVocabularyLearning,
  VocabularyQuestion,
} = require("../models/vocabularyModel");
const vocabularyService = require("../services/vocabularyService");
const { lookupWord } = require("../services/dictionaryService");
const { analyzeWrongAnswers } = require("../services/analysisChain");
const { parseList } = require("../utils/parseFields");

const serverError = (res, label, err) => {
  console.error(label, err);
  res.status(500).json({ message: "Lỗi server", error: err.message });
};

// ---- Bộ từ vựng ------------------------------------------------------------

exports.createCollection = async (req, res) => {
  const { title, description, level, category, tags, is_public, display_order } = req.body;

  try {
    const results = await VocabularyCollection.create({
      title,
      description,
      level,
      category,
      tags: parseList(tags),
      is_public: is_public !== undefined ? is_public : true,
      display_order: display_order || 0,
      created_by: req.user.userId,
    });
    res.status(201).json({ message: "Bộ từ vựng đã được tạo", collectionId: results.insertId });
  } catch (err) {
    serverError(res, "Error creating vocabulary collection:", err);
  }
};

// Lấy tất cả bộ từ vựng, có lọc
exports.getAllCollections = async (req, res) => {
  const { level, category, created_by, is_public } = req.query;

  try {
    const filters = {};
    if (level) filters.level = level;
    if (category) filters.category = category;
    if (created_by) filters.created_by = created_by;
    if (is_public !== undefined) filters.is_public = is_public === "true";

    res.json(await VocabularyCollection.findAll(filters));
  } catch (err) {
    serverError(res, "Error fetching vocabulary collections:", err);
  }
};

// Chi tiết bộ từ vựng kèm flashcards
exports.getCollectionDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const collections = await VocabularyCollection.findById(id);
    if (collections.length === 0) {
      return res.status(404).json({ message: "Bộ từ vựng không tồn tại" });
    }
    const flashcards = await VocabularyFlashcard.findByCollectionId(id);
    res.json(vocabularyService.formatCollection(collections[0], flashcards));
  } catch (err) {
    serverError(res, "Error fetching vocabulary collection details:", err);
  }
};

exports.updateCollection = async (req, res) => {
  const { title, description, level, category, tags, is_public, display_order } = req.body;

  try {
    const results = await VocabularyCollection.update(req.params.id, {
      title,
      description,
      level,
      category,
      tags: parseList(tags),
      is_public,
      display_order,
    });
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bộ từ vựng không tồn tại" });
    }
    res.json({ message: "Bộ từ vựng đã được cập nhật" });
  } catch (err) {
    serverError(res, "Error updating vocabulary collection:", err);
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const results = await VocabularyCollection.delete(req.params.id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bộ từ vựng không tồn tại" });
    }
    res.json({ message: "Bộ từ vựng đã được xóa" });
  } catch (err) {
    serverError(res, "Error deleting vocabulary collection:", err);
  }
};

// ---- Flashcards --------------------------------------------------------------

exports.addFlashcard = async (req, res) => {
  try {
    const flashcard = await vocabularyService.buildNewFlashcard(req.body, req.files);
    const results = await VocabularyFlashcard.create(flashcard);
    res.status(201).json({ message: "Flashcard đã được thêm", flashcardId: results.insertId });
  } catch (err) {
    serverError(res, "Error adding vocabulary flashcard:", err);
  }
};

// Tất cả flashcards trong một bộ từ vựng
exports.getFlashcards = async (req, res) => {
  const { collection_id } = req.query;
  if (!collection_id) {
    return res.status(400).json({ message: "Thiếu collection_id" });
  }

  try {
    const cards = await VocabularyFlashcard.findByCollectionId(collection_id);
    res.json(cards.map(vocabularyService.formatFlashcard));
  } catch (err) {
    serverError(res, "Error fetching vocabulary flashcards:", err);
  }
};

exports.updateFlashcard = async (req, res) => {
  const { id } = req.params;

  try {
    const current = await VocabularyFlashcard.findById(id);
    if (current.length === 0) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }

    const flashcard = await vocabularyService.buildUpdatedFlashcard(req.body, req.files, current[0]);
    const results = await VocabularyFlashcard.update(id, flashcard);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }
    res.json({ message: "Flashcard đã được cập nhật" });
  } catch (err) {
    serverError(res, "Error updating vocabulary flashcard:", err);
  }
};

exports.deleteFlashcard = async (req, res) => {
  try {
    const results = await VocabularyFlashcard.delete(req.params.id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }
    res.json({ message: "Flashcard đã được xóa" });
  } catch (err) {
    serverError(res, "Error deleting vocabulary flashcard:", err);
  }
};

exports.searchVocabulary = async (req, res) => {
  const { q, collection_id } = req.query;
  if (!q) {
    return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
  }

  try {
    const cards = await VocabularyFlashcard.search(q, collection_id);
    res.json(cards.map(vocabularyService.formatFlashcard));
  } catch (err) {
    serverError(res, "Error searching vocabulary:", err);
  }
};

// ---- Tiến độ học (spaced repetition) ----------------------------------------------

exports.saveLearningProgress = async (req, res) => {
  const { flashcard_id, collection_id, status, confidence_level } = req.body;

  try {
    const nextReviewDate = await vocabularyService.saveCardProgress({
      userId: req.user.userId,
      collectionId: collection_id,
      flashcardId: flashcard_id,
      status,
      confidenceLevel: confidence_level,
    });
    res.json({ message: "Tiến độ học tập đã được lưu", next_review_date: nextReviewDate });
  } catch (err) {
    serverError(res, "Error saving learning progress:", err);
  }
};

exports.saveQuizProgress = async (req, res) => {
  const { collection_id, answers } = req.body;

  try {
    await vocabularyService.saveQuizProgress({
      userId: req.user.userId,
      collectionId: collection_id,
      answers,
    });
    res.status(200).json({ message: "Quiz progress saved successfully" });
  } catch (err) {
    serverError(res, "Error saving quiz progress:", err);
  }
};

// Hoàn thành phiên học: gộp kết quả tự đánh giá flashcard và bài quiz
exports.completeSession = async (req, res) => {
  const { collection_id, study_progress, quiz_answers } = req.body;

  try {
    await vocabularyService.completeSession({
      userId: req.user.userId,
      collectionId: collection_id,
      studyProgress: study_progress,
      quizAnswers: quiz_answers,
    });
    res.status(200).json({ message: "Session completed and progress saved" });
  } catch (err) {
    serverError(res, "Error completing session:", err);
  }
};

exports.getLearningProgress = async (req, res) => {
  try {
    res.json(await UserVocabularyLearning.findByUser(req.user.userId, req.query.collection_id));
  } catch (err) {
    serverError(res, "Error fetching learning progress:", err);
  }
};

// ---- Câu hỏi từ vựng ---------------------------------------------------------

exports.createVocabularyQuestion = async (req, res) => {
  const { collection_id, flashcard_id, question_type, question_text, options, correct_answer } = req.body;

  try {
    const results = await VocabularyQuestion.create({
      collection_id,
      flashcard_id: flashcard_id || null,
      question_type,
      question_text,
      options: parseList(options),
      correct_answer,
    });
    res.status(201).json({ message: "Câu hỏi đã được tạo", questionId: results.insertId });
  } catch (err) {
    serverError(res, "Error creating vocabulary question:", err);
  }
};

exports.getVocabularyQuestions = async (req, res) => {
  const { collection_id } = req.query;
  if (!collection_id) {
    return res.status(400).json({ message: "Thiếu collection_id" });
  }

  try {
    const questions = await VocabularyQuestion.findByCollectionId(collection_id);
    res.json(questions.map(vocabularyService.formatQuestion));
  } catch (err) {
    serverError(res, "Error fetching vocabulary questions:", err);
  }
};

exports.updateVocabularyQuestion = async (req, res) => {
  const { flashcard_id, question_type, question_text, options, correct_answer } = req.body;

  try {
    const results = await VocabularyQuestion.update(req.params.id, {
      flashcard_id: flashcard_id || null,
      question_type,
      question_text,
      options: parseList(options),
      correct_answer,
    });
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại" });
    }
    res.json({ message: "Câu hỏi đã được cập nhật" });
  } catch (err) {
    serverError(res, "Error updating vocabulary question:", err);
  }
};

exports.deleteVocabularyQuestion = async (req, res) => {
  try {
    const results = await VocabularyQuestion.delete(req.params.id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại" });
    }
    res.json({ message: "Câu hỏi đã được xóa" });
  } catch (err) {
    serverError(res, "Error deleting vocabulary question:", err);
  }
};

// ---- Import / Export CSV -----------------------------------------------------

exports.exportFlashcardsCSV = async (req, res) => {
  const { collection_id } = req.query;
  if (!collection_id) {
    return res.status(400).json({ message: "Thiếu collection_id" });
  }

  try {
    const csv = await vocabularyService.exportFlashcardsCsv(collection_id);
    res.header("Content-Type", "text/csv");
    res.attachment(`vocabulary-${collection_id}.csv`);
    res.send(csv);
  } catch (err) {
    serverError(res, "Error exporting CSV:", err);
  }
};

exports.importFlashcardsCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file CSV" });
  }
  const { collection_id } = req.body;
  if (!collection_id) {
    return res.status(400).json({ message: "Thiếu collection_id" });
  }

  try {
    const count = await vocabularyService.importFlashcardsCsv(req.file.path, collection_id);
    res.json({ message: `Đã import thành công ${count} flashcards`, count });
  } catch (err) {
    serverError(res, "Error importing flashcards CSV:", err);
  }
};

// ---- Từ điển và AI ------------------------------------------------------------

exports.getWordDefinition = async (req, res) => {
  try {
    res.json(await lookupWord(req.params.word));
  } catch (err) {
    console.error("Error fetching word definition:", err);
    res.status(500).json({ message: err.message || "Lỗi khi lấy định nghĩa từ", error: err.message });
  }
};

// Phân tích kết quả bài quiz với AI
exports.analyzeQuizResult = async (req, res) => {
  const { detailedResults } = req.body;
  if (!detailedResults || !Array.isArray(detailedResults)) {
    return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ" });
  }

  try {
    const analysis = await analyzeWrongAnswers(
      vocabularyService.toWrongAnswerItems(detailedResults),
      "Đây là bài kiểm tra từ vựng, hãy tập trung vào nghĩa và cách dùng từ."
    );
    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing quiz result with AI:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi phân tích kết quả với AI", error: error.message });
  }
};
