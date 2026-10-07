const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const {
  createExam,
  getAllExams,
  getExamDetail,
  updateExam,
  deleteExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitExam,
  getExamResult,
  getExamHistory,
  analyzeExamResult,
} = require("../controllers/examController");

const router = express.Router();

// Cấu hình multer cho file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "shared_audio" || file.fieldname === "audio") {
      cb(null, "uploads/audio/");
    } else if (file.fieldname === "image") {
      cb(null, "uploads/images/");
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

// Cập nhật fileFilter trong multer config
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === "shared_audio" || file.fieldname === "audio") {
      // Kiểm tra xem có shared_audio không
      const hasSharedAudio = req.files && req.files.shared_audio;

      if (file.mimetype.startsWith("audio/")) {
        // Cho phép upload nếu là shared_audio hoặc không có shared_audio
        if (file.fieldname === "shared_audio" || !hasSharedAudio) {
          cb(null, true);
        } else {
          cb(null, false); // Bỏ qua file audio riêng nếu đã có shared_audio
        }
      } else {
        cb(new Error("Only audio files are allowed"), false);
      }
    } else if (file.fieldname === "image") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"), false);
      }
    } else {
      cb(new Error("Invalid fieldname: " + file.fieldname), false);
    }
  },
});

// Routes cho đề thi
router.post("/", auth, createExam);
router.get("/", getAllExams);
router.get("/history", auth, getExamHistory);
router.get("/:id", getExamDetail);
router.put("/:id", auth, updateExam);
router.delete("/:id", auth, deleteExam);
router.post("/:id/submit", auth, submitExam);
router.get("/result/:resultId", auth, getExamResult);
router.post("/analyze", auth, analyzeExamResult);

// Routes cho câu hỏi
router.post(
  "/:examId/questions",
  auth,
  upload.fields([
    { name: "shared_audio", maxCount: 1 },
    { name: "audio", maxCount: 1 }, // Add this line
    { name: "image", maxCount: 1 },
  ]),
  addQuestion
);

router.put(
  "/questions/:id",
  auth,
  upload.fields([
    { name: "shared_audio", maxCount: 1 }, // Add this line
    { name: "audio", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateQuestion
);

router.delete("/questions/:id", auth, deleteQuestion);

module.exports = router;
