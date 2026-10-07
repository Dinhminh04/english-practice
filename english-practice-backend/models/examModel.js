const db = require("../config/database");

const Exam = {};

Exam.create = async (examData) => {
  const sql = `
    INSERT INTO exams (title, description, exam_type, duration, difficulty, created_by, shared_audio_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  return await db.execute(sql, [
    examData.title,
    examData.description,
    examData.exam_type,
    examData.duration,
    examData.difficulty,
    examData.created_by,
    examData.shared_audio_url || null,
  ]);
};

Exam.findAll = async ({ limit, offset, search = "", exam_type = "" }) => {
  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push("e.title LIKE ?");
    params.push(`%${search}%`);
  }

  if (exam_type) {
    whereClauses.push("e.exam_type = ?");
    params.push(exam_type);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const sql = `
    SELECT e.*, u.display_name as creator_name, (SELECT COUNT(*) FROM exam_results WHERE exam_id = e.id) AS attempt_count 
    FROM exams e 
    LEFT JOIN users u ON e.created_by = u.id 
    ${whereSql}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `SELECT COUNT(*) as count FROM exams e ${whereSql}`;

  const queryParams = [...params, limit, offset];

  const [exams] = await db.execute(sql, queryParams);
  const [countResult] = await db.execute(countSql, params);

  return { exams, totalExams: countResult[0].count };
};

Exam.findById = async (id) => {
  const sql = `
    SELECT e.*, u.display_name as creator_name, (SELECT COUNT(*) FROM exam_results WHERE exam_id = e.id) AS attempt_count 
    FROM exams e 
    LEFT JOIN users u ON e.created_by = u.id 
    WHERE e.id = ?
  `;
  return await db.execute(sql, [id]);
};

Exam.update = async (id, examData) => {
  // Create base query without shared_audio_url
  let sql = `
    UPDATE exams 
    SET title = ?, 
        description = ?, 
        exam_type = ?, 
        duration = ?, 
        difficulty = ?,
        updated_at = CURRENT_TIMESTAMP 
  `;

  // Add shared_audio_url to query only if it exists in examData
  const params = [
    examData.title,
    examData.description,
    examData.exam_type,
    examData.duration,
    examData.difficulty,
  ];

  if ("shared_audio_url" in examData) {
    sql = sql.replace("difficulty = ?", "difficulty = ?, shared_audio_url = ?");
    params.push(examData.shared_audio_url);
  }

  sql += ` WHERE id = ?`;
  params.push(id);

  return await db.execute(sql, params);
};

Exam.delete = async (id) => {
  const sql = "DELETE FROM exams WHERE id = ?";
  return await db.execute(sql, [id]);
};

Exam.updateTotalQuestions = async (examId) => {
  const sql = `
    UPDATE exams e
    SET e.total_questions = (
      SELECT COUNT(*) FROM questions WHERE exam_id = ?
    )
    WHERE e.id = ?
  `;
  return await db.execute(sql, [examId, examId]);
};

Exam.getHistoryByUserId = async (userId) => {
  const sql = `
    SELECT er.*, e.title as exam_title
    FROM exam_results er
    JOIN exams e ON er.exam_id = e.id
    WHERE er.user_id = ?
    ORDER BY er.submitted_at DESC
  `;
  const [rows] = await db.execute(sql, [userId]);
  return rows;
};

const Question = {};

Question.create = async (questionData) => {
  const sql = `
    INSERT INTO questions (exam_id, question_type, question_text, question_order, audio_url, image_url, options, correct_answer, points) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return await db.execute(sql, [
    questionData.exam_id,
    questionData.question_type,
    questionData.question_text,
    questionData.question_order,
    questionData.audio_url || null,
    questionData.image_url || null,
    JSON.stringify(questionData.options || []),
    JSON.stringify(questionData.correct_answer || {}),
    questionData.points || 1,
  ]);
};

Question.findByExamId = async (examId) => {
  const sql =
    "SELECT * FROM questions WHERE exam_id = ? ORDER BY question_order ASC";
  return await db.execute(sql, [examId]);
};

Question.findById = async (id) => {
  const sql = "SELECT * FROM questions WHERE id = ?";
  return await db.execute(sql, [id]);
};

Question.update = async (id, questionData) => {
  const sql = `
    UPDATE questions 
    SET question_type = ?, question_text = ?, question_order = ?, audio_url = ?, image_url = ?, options = ?, correct_answer = ?, points = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  return await db.execute(sql, [
    questionData.question_type,
    questionData.question_text,
    questionData.question_order,
    questionData.audio_url || null,
    questionData.image_url || null,
    JSON.stringify(questionData.options || []),
    JSON.stringify(questionData.correct_answer || {}),
    questionData.points || 1,
    id,
  ]);
};

Question.delete = async (id) => {
  const sql = "DELETE FROM questions WHERE id = ?";
  return await db.execute(sql, [id]);
};

Question.updateOrder = async (examId) => {
  const sql = `
    UPDATE questions q1
    JOIN (
      SELECT id, ROW_NUMBER() OVER (ORDER BY question_order, id) as new_order
      FROM questions 
      WHERE exam_id = ?
    ) q2 ON q1.id = q2.id
    SET q1.question_order = q2.new_order
    WHERE q1.exam_id = ?
  `;
  return await db.execute(sql, [examId, examId]);
};

const ExamResult = {};

ExamResult.create = async (resultData) => {
  const sql = `
    INSERT INTO exam_results (user_id, exam_id, score, total_points, correct_answers, total_questions, time_spent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(sql, [
    resultData.user_id,
    resultData.exam_id,
    resultData.score,
    resultData.total_points,
    resultData.correct_answers,
    resultData.total_questions,
    resultData.time_spent,
  ]);
  return result.insertId;
};

ExamResult.findById = async (id) => {
  const sql = "SELECT * FROM exam_results WHERE id = ?";
  return await db.execute(sql, [id]);
};

ExamResult.findLatestByExamAndUser = async (examId, userId) => {
  const sql = `
    SELECT * FROM exam_results 
    WHERE exam_id = ? AND user_id = ? 
    ORDER BY submitted_at DESC 
    LIMIT 1
  `;
  return await db.execute(sql, [examId, userId]);
};

ExamResult.findExamResultsByUserId = async (userId) => {
  const sql = `
    SELECT er.*, e.title as exam_title
    FROM exam_results er
    JOIN exams e ON er.exam_id = e.id
    WHERE er.user_id = ?
    ORDER BY er.submitted_at DESC
  `;
  return await db.execute(sql, [userId]);
};

const ExamSubmission = {};

ExamSubmission.bulkCreate = async (submissions) => {
  if (submissions.length === 0) return;

  const sql = `
    INSERT INTO exam_submissions (result_id, question_id, user_answer, is_correct)
    VALUES ?
  `;
  const values = submissions.map((s) => [
    s.result_id,
    s.question_id,
    s.user_answer,
    s.is_correct,
  ]);

  return await db.query(sql, [values]);
};

ExamSubmission.findByResultId = async (resultId) => {
  const sql = "SELECT * FROM exam_submissions WHERE result_id = ?";
  return await db.execute(sql, [resultId]);
};

module.exports = {
  Exam,
  Question,
  ExamResult,
  ExamSubmission,
};
