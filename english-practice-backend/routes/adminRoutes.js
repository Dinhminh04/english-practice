const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  updateUserPremiumStatus
} = require("../controllers/adminController");
const aiKnowledge = require("../controllers/aiKnowledgeController");
const { DOCS_DIR, TEXT_TYPES } = require("../services/documentIngest");

const router = express.Router();

// Tài liệu AI: lưu vào storage/ai-docs (không công khai), tối đa 10MB, PDF/TXT/MD
const docUpload = multer({
  storage: multer.diskStorage({
    destination: DOCS_DIR,
    filename: (req, file, cb) =>
      cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || TEXT_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Chỉ chấp nhận file PDF, TXT hoặc MD"));
  },
});

const uploadDocumentFile = (req, res, next) =>
  docUpload.single("file")(req, res, (err) =>
    err ? res.status(400).json({ message: err.message }) : next()
  );

// Tất cả routes đều yêu cầu auth và admin privileges
router.use(auth, isAdmin);

// User management routes
router.get("/users", getUsers);
router.get("/users/stats", getUserStats);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/premium", updateUserPremiumStatus);

// AI knowledge base (RAG)
router.get("/ai/knowledge", aiKnowledge.getStats);
router.post("/ai/knowledge/rebuild", aiKnowledge.rebuild);
router.get("/ai/knowledge/search", aiKnowledge.search);
router.post("/ai/knowledge/ask", aiKnowledge.ask);

// AI reference documents uploaded by admins
router.get("/ai/documents", aiKnowledge.listDocuments);
router.post("/ai/documents", uploadDocumentFile, aiKnowledge.uploadDocument);
router.delete("/ai/documents/:id", aiKnowledge.deleteDocument);

module.exports = router;
