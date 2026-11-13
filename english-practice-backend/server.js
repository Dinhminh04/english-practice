const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();
require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const examRoutes = require("./routes/examRoutes");
const grammarRoutes = require("./routes/grammarRoutes");
const vocabulary = require("./routes/vocabularyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const speakingRoutes = require("./routes/speakingRoutes"); // Thêm import
const AiChat = require("./models/aiChatModel");
const { Exam } = require("./models/examModel");
const { initKnowledgeBase } = require("./services/knowledgeBase");
const AiDocument = require("./models/aiDocumentModel");

const app = express();
const PORT = process.env.PORT || 5000;

// Multer does not create its destination folders, so make sure they exist
[
  "uploads/audio",
  "uploads/images",
  "uploads/avatars",
  "uploads/temp",
  "uploads/grammar/audio",
  "uploads/grammar/images",
  "uploads/grammar/temp",
  "storage/ai-docs", // AI reference documents (not served publicly)
].forEach((dir) => fs.mkdirSync(path.join(__dirname, dir), { recursive: true }));

// Create the AI chat tables if they do not exist yet
AiChat.ensureTables().catch((err) =>
  console.error("Không tạo được bảng AI chat:", err.message)
);

// Add exams.shared_audio_url to databases created before the column existed
Exam.ensureSchema().catch((err) =>
  console.error("Không cập nhật được bảng exams:", err.message)
);

// Table for admin-uploaded AI documents
AiDocument.ensureTable().catch((err) =>
  console.error("Không tạo được bảng tài liệu AI:", err.message)
);

// Build the RAG knowledge base in Qdrant on first start (skipped when it already has data)
initKnowledgeBase().catch((err) =>
  console.error("Không khởi tạo được kho kiến thức AI:", err.message)
);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysupersecretkey123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/grammar", grammarRoutes);
app.use("/api/vocabulary", vocabulary);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/speaking", speakingRoutes); // Thêm route speaking

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server đang hoạt động" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Có gì đó không ổn!" });
});

app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy trên cổng ${PORT}`);
});