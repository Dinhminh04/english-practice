const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  GrammarTopic,
  GrammarLesson,
  GrammarExercise,
  GrammarCSV,
  GrammarExample,
  GrammarPractice,
  UserGrammarPractice,
  UserGrammarProgress,
} = require("../models/grammarModel");
const csv = require("csv-parser");
const fs = require("fs");
const { Parser } = require("json2csv");

// Chủ đề ngữ pháp
exports.createTopic = async (req, res) => {
  const { title, description, level, display_order } = req.body;
  const created_by = req.user.userId;

  try {
    const results = await GrammarTopic.create({
      title,
      description,
      level,
      display_order,
      created_by,
    });
    res.status(201).json({
      message: "Chủ đề ngữ pháp đã được tạo",
      topicId: results.insertId,
    });
  } catch (err) {
    console.error("Error creating grammar topic:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy danh sách chủ đề ngữ pháp với phân trang
exports.getAllTopics = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const topics = await GrammarTopic.findAll({ limit, offset });
    const totalTopics = await GrammarTopic.countAll();

    res.json({
      topics,
      totalTopics,
      totalPages: Math.ceil(totalTopics / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching grammar topics:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Cập nhật chủ đề ngữ pháp
exports.updateTopic = async (req, res) => {
  const { id } = req.params;
  const { title, description, level, display_order } = req.body;

  try {
    const results = await GrammarTopic.update(id, {
      title,
      description,
      level,
      display_order,
    });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Chủ đề không tồn tại" });
    }

    res.json({ message: "Chủ đề đã được cập nhật" });
  } catch (err) {
    console.error("Error updating grammar topic:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xóa chủ đề ngữ pháp
exports.deleteTopic = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await GrammarTopic.delete(id);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Chủ đề không tồn tại" });
    }

    res.json({ message: "Chủ đề đã được xóa" });
  } catch (err) {
    console.error("Error deleting grammar topic:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Bài học ngữ pháp
exports.createLesson = async (req, res) => {
  const {
    topic_id,
    title,
    explanation,
    structure,
    usage,
    example_sentence,
    meaning,
    tags,
    difficulty_level,
    display_order,
  } = req.body;

  const created_by = req.user.userId;

  // Xử lý file upload
  const pronunciation_audio =
    req.files && req.files.audio
      ? `/uploads/grammar/audio/${req.files.audio[0].filename}`
      : null;

  const example_image =
    req.files && req.files.image
      ? `/uploads/grammar/images/${req.files.image[0].filename}`
      : null;

  try {
    // Parse tags nếu là string
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((tag) => tag.trim());
      }
    }

    const results = await GrammarLesson.create({
      topic_id,
      title,
      explanation,
      structure,
      usage,
      pronunciation_audio,
      example_sentence,
      example_image,
      meaning,
      tags: parsedTags,
      difficulty_level,
      display_order,
      created_by,
    });

    res.status(201).json({
      message: "Bài học ngữ pháp đã được tạo",
      lessonId: results.insertId,
    });
  } catch (err) {
    console.error("Error creating grammar lesson:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy danh sách bài học với phân trang và lọc
// FIX: Hỗ trợ topic_id từ cả params (route /topics/:id/lessons) lẫn query string
exports.getLessons = async (req, res) => {
  const topic_id = req.params.id || req.query.topic_id;
  const { level, difficulty, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const filters = {};
    if (topic_id) filters.topic_id = topic_id;
    if (level) filters.level = level;
    if (difficulty) filters.difficulty = difficulty;

    const lessons = await GrammarLesson.findAll({
      ...filters,
      limit: parseInt(limit),
      offset,
    });
    const totalLessons = await GrammarLesson.countAll(filters);

    res.json({
      lessons,
      totalLessons,
      totalPages: Math.ceil(totalLessons / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error fetching grammar lessons:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết bài học
exports.getLessonDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const lessonResults = await GrammarLesson.findById(id);
    if (lessonResults.length === 0) {
      return res.status(404).json({ message: "Bài học không tồn tại" });
    }

    const exerciseResults = await GrammarExercise.findByLessonId(id);
    const exampleResults = await GrammarExample.findByLessonId(id);
    const practiceResults = await GrammarPractice.findByLessonId(id);

    // Parse JSON fields
    const lesson = {
      ...lessonResults[0],
      tags: lessonResults[0].tags ? JSON.parse(lessonResults[0].tags) : [],
      exercises: exerciseResults.map((ex) => ({
        ...ex,
        options: ex.options ? JSON.parse(ex.options) : [],
        correct_answer: ex.correct_answer ? JSON.parse(ex.correct_answer) : {},
      })),
      examples: exampleResults,
      practices: practiceResults.map((p) => ({
        ...p,
        content: p.content ? JSON.parse(p.content) : {},
      })),
    };

    res.json(lesson);
  } catch (err) {
    console.error("Error fetching grammar lesson details:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Cập nhật bài học
exports.updateLesson = async (req, res) => {
  const { id } = req.params;
  const {
    topic_id,
    title,
    explanation,
    structure,
    usage,
    example_sentence,
    meaning,
    tags,
    difficulty_level,
    display_order,
  } = req.body;

  try {
    const currentLesson = await GrammarLesson.findById(id);
    if (currentLesson.length === 0) {
      return res.status(404).json({ message: "Bài học không tồn tại" });
    }

    // Xử lý file upload
    const pronunciation_audio =
      req.files && req.files.audio
        ? `/uploads/grammar/audio/${req.files.audio[0].filename}`
        : currentLesson[0].pronunciation_audio;

    const example_image =
      req.files && req.files.image
        ? `/uploads/grammar/images/${req.files.image[0].filename}`
        : currentLesson[0].example_image;

    // Parse tags
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((tag) => tag.trim());
      }
    }

    await GrammarLesson.update(id, {
      topic_id,
      title,
      explanation,
      structure,
      usage,
      pronunciation_audio,
      example_sentence,
      example_image,
      meaning,
      tags: parsedTags,
      difficulty_level,
      display_order,
    });

    res.json({ message: "Bài học đã được cập nhật" });
  } catch (err) {
    console.error("Error updating grammar lesson:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xóa bài học
exports.deleteLesson = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await GrammarLesson.delete(id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bài học không tồn tại" });
    }

    res.json({ message: "Bài học đã được xóa" });
  } catch (err) {
    console.error("Error deleting grammar lesson:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Bài tập ngữ pháp
exports.addExercise = async (req, res) => {
  const {
    lesson_id,
    question_type,
    question_text,
    options,
    correct_answer,
    explanation,
    points,
    display_order,
  } = req.body;

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

    res.status(201).json({
      message: "Bài tập đã được thêm",
      exerciseId: results.insertId,
    });
  } catch (err) {
    console.error("Error adding grammar exercise:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xóa bài tập
exports.deleteExercise = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await GrammarExercise.delete(id);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    res.json({ message: "Bài tập đã được xóa" });
  } catch (err) {
    console.error("Error deleting grammar exercise:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Import/Export CSV
exports.exportLessonsCSV = async (req, res) => {
  try {
    const lessons = await GrammarCSV.exportLessons();

    const fields = [
      "title",
      "explanation",
      "structure",
      "usage",
      "example_sentence",
      "meaning",
      "difficulty_level",
      "display_order",
      "topic_title",
      "topic_level",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(lessons);

    res.header("Content-Type", "text/csv");
    res.attachment("grammar-lessons.csv");
    res.send(csv);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Import CSV bài học
exports.importLessonsCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file CSV" });
  }

  const lessons = [];
  const created_by = req.user.userId;

  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => {
        const lesson = {
          topic_id: data.topic_id,
          title: data.title,
          explanation: data.explanation,
          structure: data.structure || null,
          usage: data.usage || null,
          example_sentence: data.example_sentence || null,
          meaning: data.meaning || null,
          tags: data.tags ? data.tags.split(",").map((tag) => tag.trim()) : [],
          difficulty_level: data.difficulty_level || "easy",
          display_order: parseInt(data.display_order) || 0,
          created_by,
        };
        lessons.push(lesson);
      })
      .on("end", async () => {
        try {
          await GrammarLesson.bulkCreate(lessons);
          fs.unlinkSync(req.file.path);
          res.json({
            message: `Đã import thành công ${lessons.length} bài học`,
            count: lessons.length,
          });
        } catch (err) {
          console.error("Error bulk creating lessons:", err);
          res.status(500).json({ message: "Lỗi server", error: err.message });
        }
      });
  } catch (err) {
    console.error("Error importing CSV:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Oxford Dictionary API integration
exports.getWordDefinition = async (req, res) => {
  const { word } = req.params;
  const appId = process.env.OXFORD_APP_ID;
  const appKey = process.env.OXFORD_APP_KEY;

  if (!appId || !appKey) {
    return res.status(400).json({
      message: "Oxford Dictionary API chưa được cấu hình",
    });
  }

  try {
    const response = await fetch(
      `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word}`,
      {
        headers: {
          app_id: appId,
          app_key: appKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Không tìm thấy từ trong từ điển");
    }

    const data = await response.json();

    const definition = {
      word: data.word,
      phonetic:
        data.results[0]?.lexicalEntries[0]?.pronunciations?.[0]
          ?.phoneticSpelling,
      definitions:
        data.results[0]?.lexicalEntries[0]?.entries?.[0]?.senses?.map(
          (sense) => ({
            definition: sense.definitions?.[0],
            examples: sense.examples?.map((ex) => ex.text) || [],
          })
        ) || [],
    };

    res.json(definition);
  } catch (err) {
    console.error("Error fetching word definition:", err);
    res.status(500).json({
      message: "Lỗi khi lấy định nghĩa từ",
      error: err.message,
    });
  }
};

// Ví dụ minh họa
exports.addExample = async (req, res) => {
  const { lesson_id, example_sentence, meaning, notes, display_order } =
    req.body;

  try {
    const pronunciation_audio =
      req.files && req.files.audio
        ? `/uploads/grammar/examples/audio/${req.files.audio[0].filename}`
        : null;

    const example_image =
      req.files && req.files.image
        ? `/uploads/grammar/examples/images/${req.files.image[0].filename}`
        : null;

    const results = await GrammarExample.create({
      lesson_id,
      example_sentence,
      meaning,
      pronunciation_audio,
      example_image,
      notes,
      display_order,
    });

    res.status(201).json({
      message: "Ví dụ đã được thêm",
      exampleId: results.insertId,
    });
  } catch (err) {
    console.error("Error adding grammar example:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy danh sách ví dụ theo lesson_id
exports.getExamples = async (req, res) => {
  const { lesson_id } = req.query;

  try {
    if (!lesson_id) {
      return res.status(400).json({ message: "Thiếu lesson_id" });
    }

    const results = await GrammarExample.findByLessonId(lesson_id);
    res.json(results);
  } catch (err) {
    console.error("Error fetching grammar examples:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Cập nhật ví dụ
exports.updateExample = async (req, res) => {
  const { id } = req.params;
  const { example_sentence, meaning, notes, display_order } = req.body;

  try {
    const currentExample = await GrammarExample.findById(id);
    if (currentExample.length === 0) {
      return res.status(404).json({ message: "Ví dụ không tồn tại" });
    }

    const pronunciation_audio =
      req.files && req.files.audio
        ? `/uploads/grammar/examples/audio/${req.files.audio[0].filename}`
        : currentExample[0].pronunciation_audio;

    const example_image =
      req.files && req.files.image
        ? `/uploads/grammar/examples/images/${req.files.image[0].filename}`
        : currentExample[0].example_image;

    const results = await GrammarExample.update(id, {
      example_sentence,
      meaning,
      pronunciation_audio,
      example_image,
      notes,
      display_order,
    });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Ví dụ không tồn tại" });
    }

    res.json({ message: "Ví dụ đã được cập nhật" });
  } catch (err) {
    console.error("Error updating grammar example:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xóa ví dụ
exports.deleteExample = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await GrammarExample.delete(id);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Ví dụ không tồn tại" });
    }

    res.json({ message: "Ví dụ đã được xóa" });
  } catch (err) {
    console.error("Error deleting grammar example:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Bài tập thực hành
exports.addPractice = async (req, res) => {
  const {
    lesson_id,
    title,
    instructions,
    content,
    practice_type,
    difficulty_level,
    time_limit,
    points,
    display_order,
  } = req.body;

  try {
    let parsedContent = content;
    if (typeof content === "string") {
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = {};
      }
    }

    const results = await GrammarPractice.create({
      lesson_id,
      title,
      instructions,
      content: parsedContent,
      practice_type,
      difficulty_level,
      time_limit,
      points,
      display_order,
    });

    res.status(201).json({
      message: "Bài thực hành đã được thêm",
      practiceId: results.insertId,
    });
  } catch (err) {
    console.error("Error adding grammar practice:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy danh sách bài tập theo lesson_id
exports.getPractices = async (req, res) => {
  const { lesson_id } = req.query;

  try {
    if (!lesson_id) {
      return res.status(400).json({ message: "Thiếu lesson_id" });
    }

    const results = await GrammarPractice.findByLessonId(lesson_id);

    const practices = results.map((practice) => ({
      ...practice,
      content: practice.content ? JSON.parse(practice.content) : {},
    }));

    res.json(practices);
  } catch (err) {
    console.error("Error fetching grammar practices:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết bài tập
exports.getPracticeDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await GrammarPractice.findById(id);
    if (results.length === 0) {
      return res.status(404).json({ message: "Bài thực hành không tồn tại" });
    }

    const practice = {
      ...results[0],
      content: results[0].content ? JSON.parse(results[0].content) : {},
    };

    res.json(practice);
  } catch (err) {
    console.error("Error fetching grammar practice details:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Cập nhật bài tập
exports.updatePractice = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    instructions,
    content,
    practice_type,
    difficulty_level,
    time_limit,
    points,
    display_order,
  } = req.body;

  try {
    const results = await GrammarPractice.update(id, {
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
    console.error("Error updating grammar practice:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Nộp bài thực hành
exports.submitPractice = async (req, res) => {
  const { practice_id, answers, time_spent } = req.body;
  const user_id = req.user.userId;

  try {
    const practice = await GrammarPractice.findById(practice_id);
    if (practice.length === 0) {
      return res.status(404).json({ message: "Bài thực hành không tồn tại" });
    }

    const score = calculatePracticeScore(
      answers,
      JSON.parse(practice[0].content)
    );

    const result = await UserGrammarPractice.saveResult({
      user_id,
      practice_id,
      answers,
      score,
      time_spent,
    });

    res.json({
      message: "Bài thực hành đã được nộp",
      score,
      resultId: result.insertId,
    });
  } catch (err) {
    console.error("Error submitting grammar practice:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy lịch sử thực hành
exports.getPracticeHistory = async (req, res) => {
  const user_id = req.user.userId;
  const { lesson_id } = req.query;

  try {
    const results = await UserGrammarPractice.findByUser(user_id, lesson_id);

    const history = results.map((item) => ({
      ...item,
      answers: item.answers ? JSON.parse(item.answers) : {},
    }));

    res.json(history);
  } catch (err) {
    console.error("Error fetching practice history:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Hàm tính điểm
function calculatePracticeScore(answers, practiceContent) {
  let score = 0;
  let total = 0;

  if (practiceContent.questions && Array.isArray(practiceContent.questions)) {
    total = practiceContent.questions.length;
    practiceContent.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });
  }

  return total > 0 ? (score / total) * 100 : 0;
}

// Lưu tiến độ học ngữ pháp
exports.saveGrammarProgress = async (req, res) => {
  const { lesson_id, score, time_spent, completed } = req.body;
  const user_id = req.user.userId;

  try {
    await UserGrammarProgress.save({
      user_id,
      lesson_id,
      score,
      time_spent,
      completed,
    });
    res.json({ message: "Đã lưu tiến độ" });
  } catch (err) {
    console.error("Error saving grammar progress:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tiến độ học ngữ pháp cho một bài học
exports.getGrammarProgress = async (req, res) => {
  const { lessonId } = req.params;
  const user_id = req.user.userId;

  try {
    const progress = await UserGrammarProgress.findByUserAndLesson(user_id, lessonId);
    if (progress.length > 0) {
      const progressData = progress[0];
      res.json({
        ...progressData,
        completed: !!progressData.completed
      });
    } else {
      res.json({ completed: false, score: 0, time_spent: 0 });
    }
  } catch (err) {
    console.error("Error fetching grammar progress:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tất cả tiến độ học ngữ pháp của người dùng
exports.getAllGrammarProgress = async (req, res) => {
  const user_id = req.user.userId;

  try {
    const progress = await UserGrammarProgress.findByUser(user_id);
    res.json(progress);
  } catch (err) {
    console.error("Error fetching all grammar progress:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Phân tích kết quả ngữ pháp với AI
exports.analyzeGrammarResult = async (req, res) => {
  const { quiz, results } = req.body;

  if (
    !quiz ||
    !results ||
    !Array.isArray(quiz.exercises) ||
    !Array.isArray(results)
  ) {
    return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const incorrectAnswers = results
      .map((result, index) => ({ ...result, ...quiz.exercises[index] }))
      .filter((q) => !q.isCorrect);

    if (incorrectAnswers.length === 0) {
      return res.json({
        analysis:
          "Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi. Không có gì cần phân tích thêm.",
      });
    }

    const prompt = `
      Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy phân tích kết quả bài làm ngữ pháp của một học sinh và đưa ra nhận xét chi tiết bằng tiếng Việt.
      Dưới đây là danh sách các câu hỏi học sinh đã trả lời sai:

      ${incorrectAnswers
        .map((q, index) => {
          const userAnswerText =
            q.question_type === "multiple_choice"
              ? q.options[q.userAnswer]
              : q.userAnswer;
          const correctAnswerText =
            q.question_type === "multiple_choice"
              ? q.options[q.correctAnswer]
              : q.correctAnswer;
          return `
        Câu ${index + 1}:
        - Đề bài: ${q.question_text}
        - Câu trả lời của học sinh: "${userAnswerText}"
        - Đáp án đúng: "${correctAnswerText}"
      `;
        })
        .join(`\n`)}

      Yêu cầu:
      1. Với mỗi câu trả lời sai, hãy giải thích rõ ràng tại sao đáp án của học sinh lại sai và tại sao đáp án đúng lại đúng. Tập trung vào các quy tắc ngữ pháp.
      2. Sau khi phân tích từng câu, hãy đưa ra một bản tóm tắt tổng quan về các điểm yếu ngữ pháp của học sinh.
      3. Cuối cùng, đề xuất các chủ đề ngữ pháp cụ thể mà học sinh nên tập trung ôn luyện để cải thiện.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = await response.text();

    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing grammar result with AI:", error);
    res
      .status(500)
      .json({
        message: "Lỗi máy chủ khi phân tích kết quả với AI",
        error: error.message,
      });
  }
};