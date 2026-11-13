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
const {
  previewExamImport,
  saveExamImport,
} = require("../controllers/examImportController");

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

// Upload PDF đề thi: giữ trong bộ nhớ (chỉ để AI đọc, không lưu file xuống đĩa)
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Chỉ chấp nhận file PDF"));
  },
});

// Trả lỗi upload (sai loại file, file quá lớn) thành 400 thay vì 500
const uploadPdf = (req, res, next) =>
  pdfUpload.single("pdf")(req, res, (err) =>
    err ? res.status(400).json({ message: err.message }) : next()
  );

// File audio cho phần nghe khi lưu đề nhập từ PDF (lưu vào uploads/audio)
const uploadImportAudio = (req, res, next) =>
  upload.fields([{ name: "audio", maxCount: 1 }])(req, res, (err) =>
    err ? res.status(400).json({ message: err.message }) : next()
  );

// AI nhập đề thi từ PDF: chỉ admin
router.post("/import/preview", auth, isAdmin, uploadPdf, previewExamImport);
router.post("/import/save", auth, isAdmin, uploadImportAudio, saveExamImport);

// Routes cho đề thi (tạo, sửa, xóa chỉ dành cho admin)
router.post("/", auth, isAdmin, createExam);
router.get("/", getAllExams);
router.get("/history", auth, getExamHistory);
router.get("/:id", getExamDetail);
router.put("/:id", auth, isAdmin, updateExam);
router.delete("/:id", auth, isAdmin, deleteExam);
router.post("/:id/submit", auth, submitExam);
router.get("/result/:resultId", auth, getExamResult);
router.post("/analyze", auth, analyzeExamResult);

// Routes cho câu hỏi
router.post(
  "/:examId/questions",
  auth,
  isAdmin,
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
  isAdmin,
  upload.fields([
    { name: "shared_audio", maxCount: 1 }, // Add this line
    { name: "audio", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateQuestion
);

router.delete("/questions/:id", auth, isAdmin, deleteQuestion);

module.exports = router;
