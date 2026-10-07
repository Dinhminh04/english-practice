const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const router = express.Router();

// Cấu hình multer để lưu file ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/");
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
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh"), false);
    }
  },
});

// Lấy thông tin profile
router.get("/profile", auth, userController.getProfile);

// Cập nhật thông tin profile
router.put("/profile", auth, upload.single("avatar"), userController.updateProfile);

// Đổi mật khẩu
router.put("/change-password", auth, userController.changePassword);

// Lấy lịch sử học tập
router.get("/learning-history", auth, userController.getLearningHistory);

// Phân tích điểm yếu
router.get("/weaknesses", auth, userController.getWeaknesses);

module.exports = router;
