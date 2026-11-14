const {
  GrammarLesson,
  GrammarExercise,
  GrammarCSV,
  GrammarExample,
  GrammarPractice,
  UserGrammarPractice,
} = require("../models/grammarModel");
const { parseList, splitCsvList, parseJsonColumn, uploadedFilePath } = require("../utils/parseFields");
const { readCsv, toCsv } = require("./csvService");

// Business logic of the grammar module. Controllers only read the request,
// call these functions and send the response.

// ---- Lessons -----------------------------------------------------------------

// Text fields of a lesson form
const lessonFields = (body) => ({
  topic_id: body.topic_id,
  title: body.title,
  explanation: body.explanation,
  structure: body.structure,
  usage: body.usage,
  example_sentence: body.example_sentence,
  meaning: body.meaning,
  tags: parseList(body.tags),
  difficulty_level: body.difficulty_level,
  display_order: body.display_order,
});

// Uploaded audio/image, or the current ones when nothing new is uploaded
const lessonMedia = (files, current = {}) => ({
  pronunciation_audio: uploadedFilePath(files, "audio", "grammar/audio") || current.pronunciation_audio || null,
  example_image: uploadedFilePath(files, "image", "grammar/images") || current.example_image || null,
});

const exampleMedia = (files, current = {}) => ({
  pronunciation_audio:
    uploadedFilePath(files, "audio", "grammar/examples/audio") || current.pronunciation_audio || null,
  example_image: uploadedFilePath(files, "image", "grammar/examples/images") || current.example_image || null,
});

const formatPractice = (practice) => ({ ...practice, content: parseJsonColumn(practice.content, {}) });

// Lesson with its exercises, examples and practices, or null when it does not exist
const getLessonDetail = async (id) => {
  const lessons = await GrammarLesson.findById(id);
  if (lessons.length === 0) return null;

  const [exercises, examples, practices] = await Promise.all([
    GrammarExercise.findByLessonId(id),
    GrammarExample.findByLessonId(id),
    GrammarPractice.findByLessonId(id),
  ]);

  return {
    ...lessons[0],
    tags: parseJsonColumn(lessons[0].tags, []),
    exercises: exercises.map((ex) => ({
      ...ex,
      options: parseJsonColumn(ex.options, []),
      correct_answer: parseJsonColumn(ex.correct_answer, {}),
    })),
    examples,
    practices: practices.map(formatPractice),
  };
};

// ---- Practices ---------------------------------------------------------------

// Practice content arrives as a JSON string from the admin form; invalid JSON -> {}
const parsePracticeContent = (content) => {
  if (typeof content !== "string") return content;
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

// Percentage of questions answered correctly (answers[i] is compared with questions[i].correctAnswer)
const calculatePracticeScore = (answers, practiceContent) => {
  const questions = Array.isArray(practiceContent.questions) ? practiceContent.questions : [];
  if (questions.length === 0) return 0;
  const correct = questions.filter((question, index) => answers[index] === question.correctAnswer).length;
  return (correct / questions.length) * 100;
};

// Grade and save a submission; returns { score, resultId }, or null when the practice does not exist
const submitPractice = async ({ userId, practiceId, answers, timeSpent }) => {
  const practices = await GrammarPractice.findById(practiceId);
  if (practices.length === 0) return null;

  const score = calculatePracticeScore(answers, JSON.parse(practices[0].content));
  const result = await UserGrammarPractice.saveResult({
    user_id: userId,
    practice_id: practiceId,
    answers,
    score,
    time_spent: timeSpent,
  });
  return { score, resultId: result.insertId };
};

const getPracticeHistory = async (userId, lessonId) => {
  const rows = await UserGrammarPractice.findByUser(userId, lessonId);
  return rows.map((item) => ({ ...item, answers: parseJsonColumn(item.answers, {}) }));
};

// ---- CSV import / export -------------------------------------------------------

const EXPORT_FIELDS = [
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

const exportLessonsCsv = async () => toCsv(await GrammarCSV.exportLessons(), EXPORT_FIELDS);

// Returns the number of imported lessons
const importLessonsCsv = async (filePath, createdBy) => {
  const rows = await readCsv(filePath);
  const lessons = rows.map((row) => ({
    topic_id: row.topic_id,
    title: row.title,
    explanation: row.explanation,
    structure: row.structure || null,
    usage: row.usage || null,
    example_sentence: row.example_sentence || null,
    meaning: row.meaning || null,
    tags: splitCsvList(row.tags),
    difficulty_level: row.difficulty_level || "easy",
    display_order: parseInt(row.display_order) || 0,
    created_by: createdBy,
  }));
  await GrammarLesson.bulkCreate(lessons);
  return lessons.length;
};

// ---- AI analysis -------------------------------------------------------------

// Wrong answers in the shape expected by analyzeWrongAnswers.
// For multiple choice, answers are option indexes, so they are turned into option text.
const toWrongAnswerItems = (quiz, results) =>
  results
    .map((result, index) => ({ ...result, ...quiz.exercises[index] }))
    .filter((q) => !q.isCorrect)
    .map((q) => {
      const isChoice = q.question_type === "multiple_choice";
      return {
        question: q.question_text,
        userAnswer: isChoice ? q.options[q.userAnswer] : q.userAnswer,
        correctAnswer: isChoice ? q.options[q.correctAnswer] : q.correctAnswer,
      };
    });

module.exports = {
  lessonFields,
  lessonMedia,
  exampleMedia,
  formatPractice,
  getLessonDetail,
  parsePracticeContent,
  calculatePracticeScore,
  submitPractice,
  getPracticeHistory,
  exportLessonsCsv,
  importLessonsCsv,
  toWrongAnswerItems,
};
