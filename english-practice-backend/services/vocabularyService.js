const {
  VocabularyFlashcard,
  UserVocabularyLearning,
  VocabularyCSV,
} = require("../models/vocabularyModel");
const { parseList, splitCsvList, parseJsonColumn, uploadedFilePath } = require("../utils/parseFields");
const { findPronunciationAudio } = require("./dictionaryService");
const { readCsv, toCsv } = require("./csvService");

// Business logic of the vocabulary module. Controllers only read the request,
// call these functions and send the response.

// ---- Formatting rows from MySQL ----------------------------------------------

const formatFlashcard = (card) => ({
  ...card,
  synonyms: parseJsonColumn(card.synonyms, []),
  antonyms: parseJsonColumn(card.antonyms, []),
  tags: parseJsonColumn(card.tags, []),
});

const formatCollection = (collection, flashcards) => ({
  ...collection,
  tags: parseJsonColumn(collection.tags, []),
  flashcards: flashcards.map(formatFlashcard),
});

// Question options may be stored as a JSON array, a JSON string or plain "a, b, c"
const parseQuestionOptions = (options) => {
  if (!options || typeof options !== "string") return [];
  try {
    const parsed = JSON.parse(options);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return parsed.split(",").map((opt) => opt.trim());
    return [];
  } catch {
    return options.split(",").map((opt) => opt.trim());
  }
};

const formatQuestion = (question) => ({ ...question, options: parseQuestionOptions(question.options) });

// ---- Flashcard create / update ---------------------------------------------------

// Text fields of a flashcard form (FormData sends lists as strings)
const flashcardFields = (body) => ({
  word: body.word,
  meaning: body.meaning,
  pronunciation: body.pronunciation,
  example_sentence: body.example_sentence,
  example_meaning: body.example_meaning,
  part_of_speech: body.part_of_speech,
  synonyms: parseList(body.synonyms),
  antonyms: parseList(body.antonyms),
  tags: parseList(body.tags),
  difficulty_level: body.difficulty_level,
  display_order: body.display_order,
});

// New flashcard: uploaded audio > audio URL > audio looked up in the dictionary
const buildNewFlashcard = async (body, files) => {
  let pronunciation_audio = uploadedFilePath(files, "audio", "audio") || body.pronunciation_audio_url || null;
  if (!pronunciation_audio && body.word) {
    pronunciation_audio = await findPronunciationAudio(body.word);
  }
  return {
    collection_id: body.collection_id,
    ...flashcardFields(body),
    pronunciation_audio,
    example_image: uploadedFilePath(files, "image", "images"),
  };
};

// Updated flashcard: keeps the current audio/image unless a new one is uploaded,
// a URL is given, or a dictionary lookup is requested and finds one.
const buildUpdatedFlashcard = async (body, files, current) => {
  let pronunciation_audio = uploadedFilePath(files, "audio", "audio");
  if (!pronunciation_audio && body.fetch_pronunciation_audio) {
    pronunciation_audio = await findPronunciationAudio(body.word || current.word);
  }
  if (!pronunciation_audio) {
    pronunciation_audio = body.pronunciation_audio_url || current.pronunciation_audio;
  }
  return {
    ...flashcardFields(body),
    pronunciation_audio,
    example_image: uploadedFilePath(files, "image", "images") || current.example_image,
  };
};

// ---- Learning progress (spaced repetition) ---------------------------------------

// Higher confidence -> review later: <40 tomorrow, 40+ in 2 days, 60+ in 3 days, 80+ in a week
const calculateNextReviewDate = (confidenceLevel) => {
  let daysToAdd = 1;
  if (confidenceLevel >= 80) daysToAdd = 7;
  else if (confidenceLevel >= 60) daysToAdd = 3;
  else if (confidenceLevel >= 40) daysToAdd = 2;

  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

const saveCardProgress = async ({ userId, collectionId, flashcardId, status, confidenceLevel }) => {
  const next_review_date = calculateNextReviewDate(confidenceLevel);
  await UserVocabularyLearning.saveProgress({
    user_id: userId,
    flashcard_id: flashcardId,
    collection_id: collectionId,
    status,
    confidence_level: confidenceLevel,
    next_review_date,
  });
  await UserVocabularyLearning.updateOverallProgress(userId, collectionId);
  return next_review_date;
};

const saveQuizProgress = async ({ userId, collectionId, answers }) => {
  const progress = answers.map((answer) => {
    const confidence_level = answer.is_correct ? 80 : 20;
    return {
      user_id: userId,
      flashcard_id: answer.flashcard_id,
      collection_id: collectionId,
      status: answer.is_correct ? "learned" : "learning",
      confidence_level,
      next_review_date: calculateNextReviewDate(confidence_level),
    };
  });
  await UserVocabularyLearning.saveBulkProgress(progress);
  await UserVocabularyLearning.updateOverallProgress(userId, collectionId);
};

// End of a study session: combine flashcard self-ratings with quiz answers.
// A correct quiz answer raises the card's confidence by 20, a wrong one lowers it by 20;
// a card seen only in the quiz starts at 85 (correct) or 25 (wrong).
const mergeSessionProgress = ({ userId, collectionId, studyProgress, quizAnswers }) => {
  const progressByCard = new Map();
  const entry = (flashcardId, status, confidenceLevel) => ({
    user_id: userId,
    collection_id: collectionId,
    flashcard_id: flashcardId,
    status,
    confidence_level: confidenceLevel,
    next_review_date: calculateNextReviewDate(confidenceLevel),
  });

  studyProgress
    .filter((p) => p.flashcard_id)
    .forEach((p) => progressByCard.set(p.flashcard_id, entry(p.flashcard_id, p.status, p.confidence_level)));

  quizAnswers
    .filter((a) => a.flashcard_id)
    .forEach((a) => {
      const existing = progressByCard.get(a.flashcard_id);
      let confidence;
      if (existing) {
        confidence = a.is_correct
          ? Math.min(100, existing.confidence_level + 20)
          : Math.max(0, existing.confidence_level - 20);
      } else {
        confidence = a.is_correct ? 85 : 25;
      }
      progressByCard.set(
        a.flashcard_id,
        entry(a.flashcard_id, confidence >= 80 ? "mastered" : "learning", confidence)
      );
    });

  return [...progressByCard.values()];
};

const completeSession = async ({ userId, collectionId, studyProgress = [], quizAnswers = [] }) => {
  const progress = mergeSessionProgress({ userId, collectionId, studyProgress, quizAnswers });
  if (progress.length > 0) {
    await UserVocabularyLearning.saveBulkProgress(progress);
  }
  await UserVocabularyLearning.updateOverallProgress(userId, collectionId);
};

// ---- CSV import / export -------------------------------------------------------

const EXPORT_FIELDS = [
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

const exportFlashcardsCsv = async (collectionId) =>
  toCsv(await VocabularyCSV.exportFlashcards(collectionId), EXPORT_FIELDS);

// Returns the number of imported flashcards
const importFlashcardsCsv = async (filePath, collectionId) => {
  const rows = await readCsv(filePath);
  const flashcards = rows.map((row) => ({
    collection_id: parseInt(collectionId),
    word: row.word,
    meaning: row.meaning,
    pronunciation: row.pronunciation || null,
    example_sentence: row.example_sentence || null,
    example_meaning: row.example_meaning || null,
    part_of_speech: row.part_of_speech || "noun",
    synonyms: splitCsvList(row.synonyms),
    antonyms: splitCsvList(row.antonyms),
    tags: splitCsvList(row.tags),
    difficulty_level: row.difficulty_level || "medium",
    display_order: parseInt(row.display_order) || 0,
  }));
  await VocabularyFlashcard.bulkCreate(flashcards);
  return flashcards.length;
};

// ---- AI analysis -------------------------------------------------------------

// Wrong quiz answers in the shape expected by analyzeWrongAnswers
const toWrongAnswerItems = (detailedResults) =>
  detailedResults
    .filter((q) => !q.is_correct)
    .map((q) => ({
      question: q.question_text,
      options: Array.isArray(q.options) ? q.options : [],
      userAnswer: q.user_answer,
      correctAnswer: q.correct_answer,
    }));

module.exports = {
  formatFlashcard,
  formatCollection,
  formatQuestion,
  buildNewFlashcard,
  buildUpdatedFlashcard,
  calculateNextReviewDate,
  saveCardProgress,
  saveQuizProgress,
  mergeSessionProgress,
  completeSession,
  exportFlashcardsCsv,
  importFlashcardsCsv,
  toWrongAnswerItems,
};
