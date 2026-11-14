const {
  GrammarTopic,
  GrammarLesson,
  GrammarExercise,
  GrammarExample,
  GrammarPractice,
  UserGrammarProgress,
} = require("../models/grammarModel");
const grammarService = require("../services/grammarService");
const { isOxfordConfigured, lookupOxford } = require("../services/dictionaryService");
const { analyzeWrongAnswers } = require("../services/analysisChain");

const serverError = (res, label, err) => {
  console.error(label, err);
  res.status(500).json({ message: "Lỗi server", error: err.message });
};

// ---- Chủ đề ngữ pháp -----------------------------------------------------------

exports.createTopic = async (req, res) => {
  const { title, description, level, display_order } = req.body;

  try {
    const results = await GrammarTopic.create({
      title,
      description,
      level,
      display_order,
      created_by: req.user.userId,
    });
    res.status(201).json({ message: "Chủ đề ngữ pháp đã được tạo", topicId: results.insertId });
  } catch (err) {
    serverError(res, "Error creating grammar topic:", err);
  }
};

// Danh sách chủ đề có phân trang
exports.getAllTopics = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const topics = await GrammarTopic.findAll({ limit, offset: (page - 1) * limit });
    const totalTopics = await GrammarTopic.countAll();
    res.json({ topics, totalTopics, totalPages: Math.ceil(totalTopics / limit), currentPage: page });
  } catch (err) {
    serverError(res, "Error fetching grammar topics:", err);
  }
};

exports.updateTopic = async (req, res) => {
  const { title, description, level, display_order } = req.body;

  try {
    const results = await GrammarTopic.update(req.params.id, { title, description, level, display_order });
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Chủ đề không tồn tại" });
    }
    res.json({ message: "Chủ đề đã được cập nhật" });
  } catch (err) {
    serverError(res, "Error updating grammar topic:", err);
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const results = await GrammarTopic.delete(req.params.id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Chủ đề không tồn tại" });
    }
    res.json({ message: "Chủ đề đã được xóa" });
  } catch (err) {
    serverError(res, "Error deleting grammar topic:", err);
  }
};

// ---- Bài học -------------------------------------------------------------------

exports.createLesson = async (req, res) => {
  try {
    const results = await GrammarLesson.create({
      ...grammarService.lessonFields(req.body),
      ...grammarService.lessonMedia(req.files),
      created_by: req.user.userId,
    });
    res.status(201).json({ message: "Bài học ngữ pháp đã được tạo", lessonId: results.insertId });
  } catch (err) {
    serverError(res, "Error creating grammar lesson:", err);
  }
};

// Danh sách bài học có phân trang và lọc; topic_id lấy từ /topics/:id/lessons hoặc query string
exports.getLessons = async (req, res) => {
  const topic_id = req.params.id || req.query.topic_id;
  const { level, difficulty, page = 1, limit = 10 } = req.query;

  try {
    const filters = {};
    if (topic_id) filters.topic_id = topic_id;
    if (level) filters.level = level;
    if (difficulty) filters.difficulty = difficulty;

    const lessons = await GrammarLesson.findAll({
      ...filters,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    const totalLessons = await GrammarLesson.countAll(filters);
    res.json({
      lessons,
      totalLessons,
      totalPages: Math.ceil(totalLessons / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    serverError(res, "Error fetching grammar lessons:", err);
  }
};

// Chi tiết bài học kèm bài tập, ví dụ và bài thực hành
exports.getLessonDetail = async (req, res) => {
  try {
    const lesson = await grammarService.getLessonDetail(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Bài học không tồn tại" });
    }
    res.json(lesson);
  } catch (err) {
    serverError(res, "Error fetching grammar lesson details:", err);
  }
};

exports.updateLesson = async (req, res) => {
  const { id } = req.params;

  try {
    const current = await GrammarLesson.findById(id);
    if (current.length === 0) {
      return res.status(404).json({ message: "Bài học không tồn tại" });
    }
    await GrammarLesson.update(id, {
      ...grammarService.lessonFields(req.body),
      ...grammarService.lessonMedia(req.files, current[0]),
    });
    res.json({ message: "Bài học đã được cập nhật" });
  } catch (err) {
    serverError(res, "Error updating grammar lesson:", err);
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const results = await GrammarLesson.delete(req.params.id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bài học không tồn tại" });
    }
    res.json({ message: "Bài học đã được xóa" });
  } catch (err) {
    serverError(res, "Error deleting grammar lesson:", err);
  }
};

// ---- Bài tập -------------------------------------------------------------------

exports.addExercise = async (req, res) => {
  const { lesson_id, question_type, question_text, options, correct_answer, explanation, points, display_order } =
    req.body;

  try {
    const results = await GrammarExercise.create({
      lesson_id,
      question_type,
      question_text,
      options,
      correct_answer,
      explanation,
      points,
      display_order,
    });
    res.status(201).json({ message: "Bài tập đã được thêm", exerciseId: results.insertId });
  } catch (err) {
    serverError(res, "Error adding grammar exercise:", err);
  }
};

exports.deleteExercise = async (req, res) => {
  try {
    const results = await GrammarExercise.delete(req.params.id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }
    res.json({ message: "Bài tập đã được xóa" });
  } catch (err) {
    serverError(res, "Error deleting grammar exercise:", err);
  }
};

// ---- Import / Export CSV -----------------------------------------------------

exports.exportLessonsCSV = async (req, res) => {
  try {
    const csv = await grammarService.exportLessonsCsv();
    res.header("Content-Type", "text/csv");
    res.attachment("grammar-lessons.csv");
    res.send(csv);
  } catch (err) {
    serverError(res, "Error exporting CSV:", err);
  }
};

exports.importLessonsCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file CSV" });
  }

  try {
    const count = await grammarService.importLessonsCsv(req.file.path, req.user.userId);
    res.json({ message: `Đã import thành công ${count} bài học`, count });
  } catch (err) {
    serverError(res, "Error importing lessons CSV:", err);
  }
};

// ---- Từ điển Oxford ----------------------------------------------------------

exports.getWordDefinition = async (req, res) => {
  if (!isOxfordConfigured()) {
    return res.status(400).json({ message: "Oxford Dictionary API chưa được cấu hình" });
  }

  try {
    res.json(await lookupOxford(req.params.word));
  } catch (err) {
    console.error("Error fetching word definition:", err);
    res.status(500).json({ message: "Lỗi khi lấy định nghĩa từ", error: err.message });
  }
};

// ---- Ví dụ minh họa ------------------------------------------------------------

exports.addExample = async (req, res) => {
  const { lesson_id, example_sentence, meaning, notes, display_order } = req.body;

  try {
    const results = await GrammarExample.create({
      lesson_id,
      example_sentence,
      meaning,
      ...grammarService.exampleMedia(req.files),
      notes,
      display_order,
    });
    res.status(201).json({ message: "Ví dụ đã được thêm", exampleId: results.insertId });
  } catch (err) {
    serverError(res, "Error adding grammar example:", err);
  }
};

exports.getExamples = async (req, res) => {
  const { lesson_id } = req.query;
  if (!lesson_id) {
    return res.status(400).json({ message: "Thiếu lesson_id" });
  }

  try {
    res.json(await GrammarExample.findByLessonId(lesson_id));
  } catch (err) {
    serverError(res, "Error fetching grammar examples:", err);
  }
};

exports.updateExample = async (req, res) => {
  const { id } = req.params;
  const { example_sentence, meaning, notes, display_order } = req.body;

  try {
    const current = await GrammarExample.findById(id);
    if (current.length === 0) {
      return res.status(404).json({ message: "Ví dụ không tồn tại" });
    }

    const results = await GrammarExample.update(id, {
      example_sentence,
      meaning,
      ...grammarService.exampleMedia(req.files, current[0]),
      notes,
      display_order,
    });
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Ví dụ không tồn tại" });
    }
    res.json({ message: "Ví dụ đã được cập nhật" });
  } catch (err) {
    serverError(res, "Error updating grammar example:", err);
  }
};

exports.deleteExample = async (req, res) => {
  try {
    const results = await GrammarExample.delete(req.params.id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Ví dụ không tồn tại" });
    }
    res.json({ message: "Ví dụ đã được xóa" });
  } catch (err) {
    serverError(res, "Error deleting grammar example:", err);
  }
};

// ---- Bài thực hành -------------------------------------------------------------

exports.addPractice = async (req, res) => {
  const { lesson_id, title, instructions, content, practice_type, difficulty_level, time_limit, points, display_order } =
    req.body;

  try {
    const results = await GrammarPractice.create({
      lesson_id,
      title,
      instructions,
      content: grammarService.parsePracticeContent(content),
      practice_type,
      difficulty_level,
      time_limit,
      points,
      display_order,
    });
    res.status(201).json({ message: "Bài thực hành đã được thêm", practiceId: results.insertId });
  } catch (err) {
    serverError(res, "Error adding grammar practice:", err);
  }
};

exports.getPractices = async (req, res) => {
  const { lesson_id } = req.query;
  if (!lesson_id) {
    return res.status(400).json({ message: "Thiếu lesson_id" });
  }

  try {
    const practices = await GrammarPractice.findByLessonId(lesson_id);
    res.json(practices.map(grammarService.formatPractice));
  } catch (err) {
    serverError(res, "Error fetching grammar practices:", err);
  }
};

exports.getPracticeDetail = async (req, res) => {
  try {
    const practices = await GrammarPractice.findById(req.params.id);
    if (practices.length === 0) {
      return res.status(404).json({ message: "Bài thực hành không tồn tại" });
    }
    res.json(grammarService.formatPractice(practices[0]));
  } catch (err) {
    serverError(res, "Error fetching grammar practice details:", err);
  }
};

exports.updatePractice = async (req, res) => {
  const { title, instructions, content, practice_type, difficulty_level, time_limit, points, display_order } = req.body;

  try {
    const results = await GrammarPractice.update(req.params.id, {
      title,
      instructions,
      content,
      practice_type,
      difficulty_level,
      time_limit,
      points,
      display_order,
    });
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bài thực hành không tồn tại" });
    }
    res.json({ message: "Bài thực hành đã được cập nhật" });
  } catch (err) {
    serverError(res, "Error updating grammar practice:", err);
  }
};

// Nộp bài thực hành: chấm điểm và lưu kết quả
exports.submitPractice = async (req, res) => {
  const { practice_id, answers, time_spent } = req.body;

  try {
    const result = await grammarService.submitPractice({
      userId: req.user.userId,
      practiceId: practice_id,
      answers,
      timeSpent: time_spent,
    });
    if (!result) {
      return res.status(404).json({ message: "Bài thực hành không tồn tại" });
    }
    res.json({ message: "Bài thực hành đã được nộp", score: result.score, resultId: result.resultId });
  } catch (err) {
    serverError(res, "Error submitting grammar practice:", err);
  }
};

exports.getPracticeHistory = async (req, res) => {
  try {
    res.json(await grammarService.getPracticeHistory(req.user.userId, req.query.lesson_id));
  } catch (err) {
    serverError(res, "Error fetching practice history:", err);
  }
};

// ---- Tiến độ học ---------------------------------------------------------------

exports.saveGrammarProgress = async (req, res) => {
  const { lesson_id, score, time_spent, completed } = req.body;

  try {
    await UserGrammarProgress.save({ user_id: req.user.userId, lesson_id, score, time_spent, completed });
    res.json({ message: "Đã lưu tiến độ" });
  } catch (err) {
    serverError(res, "Error saving grammar progress:", err);
  }
};

// Tiến độ của một bài học (mặc định chưa học nếu chưa có dữ liệu)
exports.getGrammarProgress = async (req, res) => {
  try {
    const progress = await UserGrammarProgress.findByUserAndLesson(req.user.userId, req.params.lessonId);
    if (progress.length === 0) {
      return res.json({ completed: false, score: 0, time_spent: 0 });
    }
    res.json({ ...progress[0], completed: !!progress[0].completed });
  } catch (err) {
    serverError(res, "Error fetching grammar progress:", err);
  }
};

exports.getAllGrammarProgress = async (req, res) => {
  try {
    res.json(await UserGrammarProgress.findByUser(req.user.userId));
  } catch (err) {
    serverError(res, "Error fetching all grammar progress:", err);
  }
};

// Phân tích kết quả ngữ pháp với AI
exports.analyzeGrammarResult = async (req, res) => {
  const { quiz, results } = req.body;
  if (!quiz || !results || !Array.isArray(quiz.exercises) || !Array.isArray(results)) {
    return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ" });
  }

  try {
    const analysis = await analyzeWrongAnswers(
      grammarService.toWrongAnswerItems(quiz, results),
      "Đây là bài luyện ngữ pháp, hãy tập trung vào quy tắc ngữ pháp."
    );
    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing grammar result with AI:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi phân tích kết quả với AI", error: error.message });
  }
};
