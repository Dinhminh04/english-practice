const {
  VocabularyCollection,
  VocabularyFlashcard,
  UserVocabularyLearning,
  VocabularyCSV,
  VocabularyQuestion,
} = require("../models/vocabularyModel");
const csv = require("csv-parser");
const fs = require("fs");
const { Parser } = require("json2csv");
const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Bộ từ vựng
exports.createCollection = async (req, res) => {
  const {
    title,
    description,
    level,
    category,
    tags,
    is_public,
    display_order,
  } = req.body;
  const created_by = req.user.userId;

  try {
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((tag) => tag.trim());
      }
    }

    const results = await VocabularyCollection.create({
      title,
      description,
      level,
      category,
      tags: parsedTags,
      is_public: is_public !== undefined ? is_public : true,
      display_order: display_order || 0,
      created_by,
    });

    res.status(201).json({
      message: "Bộ từ vựng đã được tạo",
      collectionId: results.insertId,
    });
  } catch (err) {
    console.error("Error creating vocabulary collection:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tất cả bộ từ vựng với phân trang và lọc
exports.getAllCollections = async (req, res) => {
  const { level, category, created_by, is_public } = req.query;

  try {
    const filters = {};
    if (level) filters.level = level;
    if (category) filters.category = category;
    if (created_by) filters.created_by = created_by;
    if (is_public !== undefined) filters.is_public = is_public === "true";

    const results = await VocabularyCollection.findAll(filters);
    res.json(results);
  } catch (err) {
    console.error("Error fetching vocabulary collections:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết bộ từ vựng
exports.getCollectionDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const collectionResults = await VocabularyCollection.findById(id);
    if (collectionResults.length === 0) {
      return res.status(404).json({ message: "Bộ từ vựng không tồn tại" });
    }

    const flashcardsResults = await VocabularyFlashcard.findByCollectionId(id);

    const collection = {
      ...collectionResults[0],
      tags: collectionResults[0].tags
        ? JSON.parse(collectionResults[0].tags)
        : [],
      flashcards: flashcardsResults.map((card) => ({
        ...card,
        synonyms: card.synonyms ? JSON.parse(card.synonyms) : [],
        antonyms: card.antonyms ? JSON.parse(card.antonyms) : [],
        tags: card.tags ? JSON.parse(card.tags) : [],
      })),
    };

    res.json(collection);
  } catch (err) {
    console.error("Error fetching vocabulary collection details:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Cập nhật bộ từ vựng
exports.updateCollection = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    level,
    category,
    tags,
    is_public,
    display_order,
  } = req.body;

  try {
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((tag) => tag.trim());
      }
    }

    const results = await VocabularyCollection.update(id, {
      title,
      description,
      level,
      category,
      tags: parsedTags,
      is_public,
      display_order,
    });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bộ từ vựng không tồn tại" });
    }

    res.json({ message: "Bộ từ vựng đã được cập nhật" });
  } catch (err) {
    console.error("Error updating vocabulary collection:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xóa bộ từ vựng
exports.deleteCollection = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await VocabularyCollection.delete(id);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Bộ từ vựng không tồn tại" });
    }

    res.json({ message: "Bộ từ vựng đã được xóa" });
  } catch (err) {
    console.error("Error deleting vocabulary collection:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Flashcards
exports.addFlashcard = async (req, res) => {
  const {
    collection_id,
    word,
    meaning,
    pronunciation,
    example_sentence,
    example_meaning,
    part_of_speech,
    synonyms,
    antonyms,
    tags,
    difficulty_level,
    display_order,
    pronunciation_audio_url,
  } = req.body;

  try {
    // Xử lý file upload hoặc gọi API
    let pronunciation_audio = pronunciation_audio_url || null;
    if (req.files && req.files.audio) {
      pronunciation_audio = `/uploads/audio/${req.files.audio[0].filename}`;
    } else if (!pronunciation_audio && word) {
      // Nếu không có file audio và không có URL, thử gọi API
      console.log(`Fetching pronunciation for "${word}" from API...`);
      pronunciation_audio = await getAudioFromApi(word);
      if (pronunciation_audio) {
        console.log(`Found pronunciation audio: ${pronunciation_audio}`);
      } else {
        console.log(`Could not find pronunciation for "${word}" from API.`);
      }
    }

    const example_image =
      req.files && req.files.image
        ? `/uploads/images/${req.files.image[0].filename}`
        : null;

    // Parse các trường JSON
    let parsedSynonyms = synonyms;
    let parsedAntonyms = antonyms;
    let parsedTags = tags;

    if (typeof synonyms === "string") {
      try {
        parsedSynonyms = JSON.parse(synonyms);
      } catch {
        parsedSynonyms = synonyms.split(",").map((item) => item.trim());
      }
    }

    if (typeof antonyms === "string") {
      try {
        parsedAntonyms = JSON.parse(antonyms);
      } catch {
        parsedAntonyms = antonyms.split(",").map((item) => item.trim());
      }
    }

    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((item) => item.trim());
      }
    }

    const results = await VocabularyFlashcard.create({
      collection_id,
      word,
      meaning,
      pronunciation,
      pronunciation_audio,
      example_sentence,
      example_meaning,
      example_image,
      part_of_speech,
      synonyms: parsedSynonyms,
      antonyms: parsedAntonyms,
      tags: parsedTags,
      difficulty_level,
      display_order,
    });

    res.status(201).json({
      message: "Flashcard đã được thêm",
      flashcardId: results.insertId,
    });
  } catch (err) {
    console.error("Error adding vocabulary flashcard:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tất cả flashcards trong bộ từ vựng
exports.getFlashcards = async (req, res) => {
  const { collection_id } = req.query;

  try {
    if (!collection_id) {
      return res.status(400).json({ message: "Thiếu collection_id" });
    }

    const results = await VocabularyFlashcard.findByCollectionId(collection_id);

    const flashcards = results.map((card) => ({
      ...card,
      synonyms: card.synonyms ? JSON.parse(card.synonyms) : [],
      antonyms: card.antonyms ? JSON.parse(card.antonyms) : [],
      tags: card.tags ? JSON.parse(card.tags) : [],
    }));

    res.json(flashcards);
  } catch (err) {
    console.error("Error fetching vocabulary flashcards:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Hàm gọi API để lấy audio phát âm
exports.updateFlashcard = async (req, res) => {
  const { id } = req.params;
  const {
    word,
    meaning,
    pronunciation,
    example_sentence,
    example_meaning,
    part_of_speech,
    synonyms,
    antonyms,
    tags,
    difficulty_level,
    display_order,
    pronunciation_audio_url,
    fetch_pronunciation_audio,
  } = req.body;

  try {
    const currentFlashcard = await VocabularyFlashcard.findById(id);
    if (currentFlashcard.length === 0) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }

    // Xử lý file upload hoặc gọi API
    let pronunciation_audio =
      pronunciation_audio_url || currentFlashcard[0].pronunciation_audio;
    if (req.files && req.files.audio) {
      pronunciation_audio = `/uploads/audio/${req.files.audio[0].filename}`;
    } else if (fetch_pronunciation_audio) {
      const wordToFetch = word || currentFlashcard[0].word;
      console.log(`Fetching pronunciation for \"${wordToFetch}\" from API...`);
      pronunciation_audio = await getAudioFromApi(wordToFetch);
      if (pronunciation_audio) {
        console.log(`Found pronunciation audio: ${pronunciation_audio}`);
      } else {
        console.log(
          `Could not find pronunciation for \"${wordToFetch}\" from API.`
        );
        pronunciation_audio = currentFlashcard[0].pronunciation_audio; // Giữ lại audio cũ nếu không tìm thấy
      }
    }

    const example_image =
      req.files && req.files.image
        ? `/uploads/images/${req.files.image[0].filename}`
        : currentFlashcard[0].example_image;

    // Parse các trường JSON
    let parsedSynonyms = synonyms;
    let parsedAntonyms = antonyms;
    let parsedTags = tags;

    if (typeof synonyms === "string") {
      try {
        parsedSynonyms = JSON.parse(synonyms);
      } catch {
        parsedSynonyms = synonyms.split(",").map((item) => item.trim());
      }
    }

    if (typeof antonyms === "string") {
      try {
        parsedAntonyms = JSON.parse(antonyms);
      } catch {
        parsedAntonyms = antonyms.split(",").map((item) => item.trim());
      }
    }

    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((item) => item.trim());
      }
    }

    const results = await VocabularyFlashcard.update(id, {
      word,
      meaning,
      pronunciation,
      pronunciation_audio,
      example_sentence,
      example_meaning,
      example_image,
      part_of_speech,
      synonyms: parsedSynonyms,
      antonyms: parsedAntonyms,
      tags: parsedTags,
      difficulty_level,
      display_order,
    });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }

    res.json({ message: "Flashcard đã được cập nhật" });
  } catch (err) {
    console.error("Error updating vocabulary flashcard:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xóa flashcard
exports.deleteFlashcard = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await VocabularyFlashcard.delete(id);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }

    res.json({ message: "Flashcard đã được xóa" });
  } catch (err) {
    console.error("Error deleting vocabulary flashcard:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Tìm kiếm từ vựng
exports.searchVocabulary = async (req, res) => {
  const { q, collection_id } = req.query;

  try {
    if (!q) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    const results = await VocabularyFlashcard.search(q, collection_id);

    const flashcards = results.map((card) => ({
      ...card,
      synonyms: card.synonyms ? JSON.parse(card.synonyms) : [],
      antonyms: card.antonyms ? JSON.parse(card.antonyms) : [],
      tags: card.tags ? JSON.parse(card.tags) : [],
    }));

    res.json(flashcards);
  } catch (err) {
    console.error("Error searching vocabulary:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Học từ vựng
exports.saveLearningProgress = async (req, res) => {
  const { flashcard_id, collection_id, status, confidence_level } = req.body;
  const user_id = req.user.userId;

  try {
    // Tính ngày ôn tập tiếp theo dựa trên confidence level
    const nextReviewDate = calculateNextReviewDate(confidence_level);

    await UserVocabularyLearning.saveProgress({
      user_id,
      flashcard_id,
      collection_id,
      status,
      confidence_level,
      next_review_date: nextReviewDate,
    });

    // Cập nhật tổng tiến độ
    await UserVocabularyLearning.updateOverallProgress(user_id, collection_id);

    res.json({
      message: "Tiến độ học tập đã được lưu",
      next_review_date: nextReviewDate,
    });
  } catch (err) {
    console.error("Error saving learning progress:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lưu tiến độ làm quiz
exports.saveQuizProgress = async (req, res) => {
  const { collection_id, answers } = req.body;
  const user_id = req.user.userId;

  try {
    const progressDataArray = answers.map((answer) => {
      const confidence_level = answer.is_correct ? 80 : 20; // Example logic
      const status = answer.is_correct ? "learned" : "learning";
      const next_review_date = calculateNextReviewDate(confidence_level);

      return {
        user_id,
        flashcard_id: answer.flashcard_id,
        collection_id,
        status,
        confidence_level,
        next_review_date,
      };
    });

    await UserVocabularyLearning.saveBulkProgress(progressDataArray);
    await UserVocabularyLearning.updateOverallProgress(user_id, collection_id);

    res.status(200).json({ message: "Quiz progress saved successfully" });
  } catch (err) {
    console.error("Error saving quiz progress:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Hoàn thành phiên học
exports.completeSession = async (req, res) => {
  const { collection_id, study_progress = [], quiz_answers = [] } = req.body;
  const user_id = req.user.userId;

  console.log("--- completeSession ---");
  console.log("collection_id:", collection_id);
  console.log("study_progress:", JSON.stringify(study_progress, null, 2));
  console.log("quiz_answers:", JSON.stringify(quiz_answers, null, 2));

  try {
    const progressMap = new Map();

    // 1. Process study_progress first
    study_progress.forEach((progress) => {
      if (progress.flashcard_id) {
        progressMap.set(progress.flashcard_id, {
          user_id,
          collection_id,
          flashcard_id: progress.flashcard_id,
          status: progress.status,
          confidence_level: progress.confidence_level,
          next_review_date: calculateNextReviewDate(progress.confidence_level),
        });
      }
    });

    // 2. Process quiz_answers, updating or adding to the map
    quiz_answers.forEach((answer) => {
      if (answer.flashcard_id) {
        const isCorrect = answer.is_correct;
        const existingProgress = progressMap.get(answer.flashcard_id);

        // Adjust confidence based on quiz result
        let newConfidence;
        if (existingProgress) {
          // If it exists, adjust confidence based on quiz answer
          newConfidence = isCorrect
            ? Math.min(100, existingProgress.confidence_level + 20) // Increase confidence
            : Math.max(0, existingProgress.confidence_level - 20); // Decrease confidence
        } else {
          // If it's a new card encountered in the quiz
          newConfidence = isCorrect ? 85 : 25;
        }

        progressMap.set(answer.flashcard_id, {
          user_id,
          collection_id,
          flashcard_id: answer.flashcard_id,
          status: newConfidence >= 80 ? "mastered" : "learning",
          confidence_level: newConfidence,
          next_review_date: calculateNextReviewDate(newConfidence),
        });
      }
    });

    const allProgress = Array.from(progressMap.values());

    console.log(
      "Final combined progress:",
      JSON.stringify(allProgress, null, 2)
    );

    if (allProgress.length > 0) {
      await UserVocabularyLearning.saveBulkProgress(allProgress);
    }

    await UserVocabularyLearning.updateOverallProgress(user_id, collection_id);

    res.status(200).json({ message: "Session completed and progress saved" });
  } catch (err) {
    console.error("Error completing session:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tiến độ học tập
exports.getLearningProgress = async (req, res) => {
  const user_id = req.user.userId;
  const { collection_id } = req.query;

  try {
    const results = await UserVocabularyLearning.findByUser(
      user_id,
      collection_id
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching learning progress:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Vocabulary Questions
exports.createVocabularyQuestion = async (req, res) => {
  const {
    collection_id,
    flashcard_id,
    question_type,
    question_text,
    options,
    correct_answer,
  } = req.body;

  try {
    let parsedOptions = options;
    if (typeof options === "string") {
      try {
        parsedOptions = JSON.parse(options);
      } catch {
        parsedOptions = options.split(",").map((option) => option.trim());
      }
    }

    const results = await VocabularyQuestion.create({
      collection_id,
      flashcard_id: flashcard_id || null,
      question_type,
      question_text,
      options: parsedOptions,
      correct_answer,
    });

    res.status(201).json({
      message: "Câu hỏi đã được tạo",
      questionId: results.insertId,
    });
  } catch (err) {
    console.error("Error creating vocabulary question:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

//  Lấy câu hỏi trong bộ từ vựng
exports.getVocabularyQuestions = async (req, res) => {
  const { collection_id } = req.query;

  try {
    if (!collection_id) {
      return res.status(400).json({ message: "Thiếu collection_id" });
    }

    const results = await VocabularyQuestion.findByCollectionId(collection_id);

    const questions = results.map((question) => {
      let optionsArray = [];
      if (question.options && typeof question.options === "string") {
        try {
          const parsed = JSON.parse(question.options);
          if (Array.isArray(parsed)) {
            optionsArray = parsed;
          } else if (typeof parsed === "string") {
            optionsArray = parsed.split(",").map((opt) => opt.trim());
          }
        } catch (e) {
          optionsArray = question.options.split(",").map((opt) => opt.trim());
        }
      }

      return {
        ...question,
        options: optionsArray,
      };
    });

    res.json(questions);
  } catch (err) {
    console.error("Error fetching vocabulary questions:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Cập nhật câu hỏi
exports.updateVocabularyQuestion = async (req, res) => {
  const { id } = req.params;
  const {
    flashcard_id,
    question_type,
    question_text,
    options,
    correct_answer,
  } = req.body;

  try {
    let parsedOptions = options;
    if (typeof options === "string") {
      try {
        parsedOptions = JSON.parse(options);
      } catch {
        parsedOptions = options.split(",").map((option) => option.trim());
      }
    }

    const results = await VocabularyQuestion.update(id, {
      flashcard_id: flashcard_id || null,
      question_type,
      question_text,
      options: parsedOptions,
      correct_answer,
    });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại" });
    }

    res.json({ message: "Câu hỏi đã được cập nhật" });
  } catch (err) {
    console.error("Error updating vocabulary question:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xóa câu hỏi
exports.deleteVocabularyQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await VocabularyQuestion.delete(id);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại" });
    }

    res.json({ message: "Câu hỏi đã được xóa" });
  } catch (err) {
    console.error("Error deleting vocabulary question:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Phân tích kết quả bài quiz với AI
exports.analyzeQuizResult = async (req, res) => {
  const { detailedResults } = req.body;

  if (!detailedResults || !Array.isArray(detailedResults)) {
    return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const incorrectAnswers = detailedResults.filter((q) => !q.is_correct);

    if (incorrectAnswers.length === 0) {
      return res.json({
        analysis:
          "Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi. Không có gì cần phân tích thêm.",
      });
    }

    const prompt = `
      Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy phân tích kết quả bài kiểm tra từ vựng của một học sinh và đưa ra nhận xét chi tiết bằng tiếng Việt.
      Dưới đây là danh sách các câu hỏi học sinh đã trả lời sai:

      ${incorrectAnswers
        .map((q, index) => {
          const userAnswerText = q.user_answer;
          const correctAnswerText = q.correct_answer;
          return `
        Câu ${index + 1}:
        - Câu hỏi: ${q.question_text}
        - Các lựa chọn: ${JSON.stringify(q.options)}
        - Câu trả lời của học sinh: "${userAnswerText}"
        - Đáp án đúng: "${correctAnswerText}"
      `;
        })
        .join(`\n`)}

      Yêu cầu:
      1. Với mỗi câu trả lời sai, hãy giải thích rõ ràng tại sao đáp án của học sinh lại sai và tại sao đáp án đúng lại đúng. Tập trung vào ý nghĩa và cách dùng của từ vựng.
      2. Sau khi phân tích từng câu, hãy đưa ra một bản tóm tắt tổng quan về những điểm yếu trong vốn từ vựng của học sinh.
      3. Cuối cùng, đề xuất các phương pháp học từ vựng hiệu quả và các chủ đề từ vựng mà học sinh nên tập trung ôn luyện để cải thiện.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = await response.text();

    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing quiz result with AI:", error);
    res
      .status(500)
      .json({
        message: "Lỗi máy chủ khi phân tích kết quả với AI",
        error: error.message,
      });
  }
};

// Import/Export CSV
exports.exportFlashcardsCSV = async (req, res) => {
  const { collection_id } = req.query;

  try {
    if (!collection_id) {
      return res.status(400).json({ message: "Thiếu collection_id" });
    }

    const flashcards = await VocabularyCSV.exportFlashcards(collection_id);

    const fields = [
      "word",
      "meaning",
      "pronunciation",
      "example_sentence",
      "example_meaning",
      "part_of_speech",
      "difficulty_level",
      "display_order",
      "collection_title",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flashcards);

    res.header("Content-Type", "text/csv");
    res.attachment(`vocabulary-${collection_id}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Import flashcards từ CSV
exports.importFlashcardsCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file CSV" });
  }

  const { collection_id } = req.body;
  if (!collection_id) {
    return res.status(400).json({ message: "Thiếu collection_id" });
  }

  const flashcards = [];

  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => {
        const flashcard = {
          collection_id: parseInt(collection_id),
          word: data.word,
          meaning: data.meaning,
          pronunciation: data.pronunciation || null,
          example_sentence: data.example_sentence || null,
          example_meaning: data.example_meaning || null,
          part_of_speech: data.part_of_speech || "noun",
          synonyms: data.synonyms
            ? data.synonyms.split(",").map((item) => item.trim())
            : [],
          antonyms: data.antonyms
            ? data.antonyms.split(",").map((item) => item.trim())
            : [],
          tags: data.tags
            ? data.tags.split(",").map((item) => item.trim())
            : [],
          difficulty_level: data.difficulty_level || "medium",
          display_order: parseInt(data.display_order) || 0,
        };
        flashcards.push(flashcard);
      })
      .on("end", async () => {
        try {
          await VocabularyFlashcard.bulkCreate(flashcards);
          fs.unlinkSync(req.file.path); // Xóa file tạm
          res.json({
            message: `Đã import thành công ${flashcards.length} flashcards`,
            count: flashcards.length,
          });
        } catch (err) {
          console.error("Error bulk creating flashcards:", err);
          res.status(500).json({ message: "Lỗi server", error: err.message });
        }
      });
  } catch (err) {
    console.error("Error importing CSV:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Dictionary API integration
exports.getWordDefinition = async (req, res) => {
  const { word } = req.params;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(
        `Dictionary API Error: ${response.status} ${response.statusText}`,
        errorBody
      );
      throw new Error(errorBody.title || "Không tìm thấy từ trong từ điển");
    }

    const data = await response.json();

    // Extract relevant information from the first result
    const firstResult = data[0];
    const definition = {
      word: firstResult.word,
      phonetic:
        firstResult.phonetics?.find((p) => p.text)?.text ||
        firstResult.phonetic,
      audio: firstResult.phonetics?.find((p) => p.audio)?.audio,
      meanings:
        firstResult.meanings?.map((meaning) => ({
          partOfSpeech: meaning.partOfSpeech,
          definitions:
            meaning.definitions?.map((def) => ({
              definition: def.definition,
              example: def.example,
              synonyms: def.synonyms,
              antonyms: def.antonyms,
            })) || [],
        })) || [],
    };

    res.json(definition);
  } catch (err) {
    console.error("Error fetching word definition:", err);
    res.status(500).json({
      message: err.message || "Lỗi khi lấy định nghĩa từ",
      error: err.message,
    });
  }
};

async function getAudioFromApi(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );
    if (!response.ok) {
      console.error(
        `Dictionary API Error for ${word}: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const data = await response.json();
    const firstResult = data[0];
    // Find the first phonetic with an audio link
    const audioPhonetic = firstResult.phonetics?.find((p) => p.audio);
    return audioPhonetic?.audio || null;
  } catch (error) {
    console.error(
      `Error fetching audio from dictionary API for ${word}:`,
      error
    );
    return null;
  }
}

// Hàm tính ngày ôn tập tiếp theo
function calculateNextReviewDate(confidenceLevel) {
  const today = new Date();
  let daysToAdd = 1;

  if (confidenceLevel >= 80) {
    daysToAdd = 7; // 1 tuần
  } else if (confidenceLevel >= 60) {
    daysToAdd = 3; // 3 ngày
  } else if (confidenceLevel >= 40) {
    daysToAdd = 2; // 2 ngày
  }
  // confidenceLevel < 40: ôn lại ngày mai (mặc định)

  today.setDate(today.getDate() + daysToAdd);
  return today.toISOString().split("T")[0]; // Trả về YYYY-MM-DD
}

// Phân tích kết quả bài quiz với AI
exports.analyzeQuizResult = async (req, res) => {
  const { detailedResults } = req.body;

  if (!detailedResults || !Array.isArray(detailedResults)) {
    return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const incorrectAnswers = detailedResults.filter((q) => !q.is_correct);

    if (incorrectAnswers.length === 0) {
      return res.json({
        analysis:
          "Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi. Không có gì cần phân tích thêm.",
      });
    }

    const prompt = `
      Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy phân tích kết quả bài kiểm tra từ vựng của một học sinh và đưa ra nhận xét chi tiết bằng tiếng Việt.
      Dưới đây là danh sách các câu hỏi học sinh đã trả lời sai:

      ${incorrectAnswers
        .map((q, index) => {
          const userAnswerText = q.user_answer;
          const correctAnswerText = q.correct_answer;
          return `
        Câu ${index + 1}:
        - Câu hỏi: ${q.question_text}
        - Các lựa chọn: ${JSON.stringify(q.options)}
        - Câu trả lời của học sinh: "${userAnswerText}"
        - Đáp án đúng: "${correctAnswerText}"
      `;
        })
        .join(`\n`)}

      Yêu cầu:
      1. Với mỗi câu trả lời sai, hãy giải thích rõ ràng tại sao đáp án của học sinh lại sai và tại sao đáp án đúng lại đúng. Tập trung vào ý nghĩa và cách dùng của từ vựng.
      2. Sau khi phân tích từng câu, hãy đưa ra một bản tóm tắt tổng quan về những điểm yếu trong vốn từ vựng của học sinh.
      3. Cuối cùng, đề xuất các phương pháp học từ vựng hiệu quả và các chủ đề từ vựng mà học sinh nên tập trung ôn luyện để cải thiện.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = await response.text();

    res.json({ analysis });
  } catch (error) {
    console.error("Error analyzing quiz result with AI:", error);
    res
      .status(500)
      .json({
        message: "Lỗi máy chủ khi phân tích kết quả với AI",
        error: error.message,
      });
  }
};
