const fs = require("fs");
const { extractExamFromPdf, examDraftSchema } = require("../services/examImporter");
const { Exam } = require("../models/examModel");

// Admin upload PDF đề thi -> AI trả về bản nháp (chưa ghi vào DB)
exports.previewExamImport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file PDF đề thi" });
  }

  try {
    const draft = await extractExamFromPdf(req.file.buffer);
    res.json({ draft });
  } catch (error) {
    console.error("Error importing exam PDF:", error);
    res
      .status(503)
      .json({ message: "AI chưa đọc được file PDF này, vui lòng thử lại." });
  }
};

const removeUploadedFile = (file) => {
  if (file) fs.unlink(file.path, () => {});
};

const samePart = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Admin đã duyệt bản nháp -> lưu đề và câu hỏi vào DB
// Body (multipart): draft = JSON bản nháp đã sửa, audio = file nghe (nếu đề có phần nghe)
exports.saveExamImport = async (req, res) => {
  const audioFile = req.files?.audio?.[0];

  let parsed;
  try {
    parsed = examDraftSchema.safeParse(JSON.parse(req.body.draft || ""));
  } catch {
    parsed = { success: false };
  }
  if (!parsed.success) {
    removeUploadedFile(audioFile);
    return res.status(400).json({ message: "Bản nháp đề thi không hợp lệ" });
  }
  const draft = parsed.data;

  // Hệ thống hiện chỉ chấm được câu trắc nghiệm có đáp án nằm trong các lựa chọn
  const questions = [];
  const skipped = [];
  const sorted = [...draft.questions].sort((a, b) => a.number - b.number);
  for (const q of sorted) {
    if (q.question_type !== "multiple_choice") {
      skipped.push({ number: q.number, reason: "Loại câu hỏi chưa được hỗ trợ" });
      continue;
    }
    if (q.options.length < 2 || !q.options.includes(q.correct_answer)) {
      skipped.push({ number: q.number, reason: "Đáp án không khớp với các lựa chọn" });
      continue;
    }

    // Câu đọc hiểu: ghép đoạn văn vào trước câu hỏi để người học đọc được khi làm bài
    const passage = draft.passages.find((p) => samePart(p.part, q.part));
    questions.push({
      question_type: "multiple_choice",
      question_text: passage ? `${passage.text}\n\n${q.question_text}` : q.question_text,
      question_order: questions.length + 1,
      options: q.options,
      correct_answer: q.correct_answer,
      is_listening: q.is_listening,
    });
  }

  if (questions.length === 0) {
    removeUploadedFile(audioFile);
    return res.status(400).json({ message: "Không có câu hỏi trắc nghiệm hợp lệ để lưu", skipped });
  }

  const hasListening = questions.some((q) => q.is_listening);
  if (hasListening && !audioFile) {
    return res.status(400).json({ message: "Đề có phần nghe, vui lòng chọn file audio" });
  }
  if (!hasListening) removeUploadedFile(audioFile);
  const audioUrl = hasListening ? `/uploads/audio/${audioFile.filename}` : null;

  try {
    const examId = await Exam.createWithQuestions(
      {
        title: draft.title,
        description: draft.description,
        exam_type: draft.exam_type,
        duration: draft.duration,
        difficulty: draft.difficulty,
        created_by: req.user.userId,
        shared_audio_url: audioUrl,
      },
      questions.map((q) => ({ ...q, audio_url: q.is_listening ? audioUrl : null }))
    );

    res.status(201).json({
      message: `Đã lưu đề thi với ${questions.length} câu hỏi`,
      examId,
      saved: questions.length,
      skipped,
    });
  } catch (error) {
    removeUploadedFile(audioFile);
    console.error("Error saving imported exam:", error);
    res.status(500).json({ message: "Lỗi server khi lưu đề thi" });
  }
};
