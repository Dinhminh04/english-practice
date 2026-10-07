const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");
const {
  createCollection,
  getAllCollections,
  getCollectionDetail,
  updateCollection,
  deleteCollection,
  addFlashcard,
  getFlashcards,
  updateFlashcard,
  deleteFlashcard,
  searchVocabulary,
  saveLearningProgress,
  getLearningProgress,
  exportFlashcardsCSV,
  importFlashcardsCSV,
  getWordDefinition,
  createVocabularyQuestion,
  getVocabularyQuestions,
  updateVocabularyQuestion,
  deleteVocabularyQuestion,
  saveQuizProgress,
  completeSession,
  analyzeQuizResult,
} = require("../controllers/vocabularyController");

const router = express.Router();

// Cấu hình multer cho file upload
const vocabularyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "audio") {
      cb(null, "uploads/audio/");
    } else if (file.fieldname === "image") {
      cb(null, "uploads/images/");
    } else if (file.fieldname === "csv") {
      cb(null, "uploads/temp/");
    } else {
      cb(new Error("Invalid fieldname"), false);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: vocabularyStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === "audio") {
      if (file.mimetype.startsWith("audio/")) {
        cb(null, true);
      } else {
        cb(new Error("Chỉ chấp nhận file audio"), false);
      }
    } else if (file.fieldname === "image") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Chỉ chấp nhận file ảnh"), false);
      }
    } else if (file.fieldname === "csv") {
      if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
        cb(null, true);
      } else {
        cb(new Error("Chỉ chấp nhận file CSV"), false);
      }
    } else {
      cb(new Error("Invalid fieldname"), false);
    }
  },
});

// Routes cho bộ từ vựng
router.post("/collections", auth, createCollection);
router.get("/collections", getAllCollections);
router.get("/collections/:id", getCollectionDetail);
router.put("/collections/:id", auth, updateCollection);
router.delete("/collections/:id", auth, deleteCollection);

// Routes cho flashcards
router.post(
  "/flashcards",
  auth,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  addFlashcard
);

router.get("/flashcards", auth, getFlashcards);
router.put(
  "/flashcards/:id",
  auth,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateFlashcard
);
router.delete("/flashcards/:id", auth, deleteFlashcard);

// Routes cho câu hỏi tự kiểm tra
router.post("/questions", auth, createVocabularyQuestion);
router.get("/questions", auth, getVocabularyQuestions);
router.put("/questions/:id", auth, updateVocabularyQuestion);
router.delete("/questions/:id", auth, deleteVocabularyQuestion);

// Tìm kiếm từ vựng
router.get("/search", auth, searchVocabulary);

// Học từ vựng
router.post("/learning/progress", auth, saveLearningProgress);
router.post("/quiz/progress", auth, saveQuizProgress);
router.post("/session/complete", auth, completeSession);
router.post("/analyze", auth, analyzeQuizResult);

router.get("/learning/progress", auth, getLearningProgress);

// Import/Export CSV
router.get("/export/csv", auth, exportFlashcardsCSV);
router.post("/import/csv", auth, upload.single("csv"), importFlashcardsCSV);

// Oxford Dictionary API
router.get("/dictionary/:word", auth, getWordDefinition);

module.exports = router;
