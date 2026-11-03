const { tool } = require("langchain");
const { z } = require("zod");
const pool = require("../config/database");

// All tools are read-only. userId is bound from the JWT, never taken from the model,
// so the AI can only read the data of the user who is chatting.

const like = (keyword) => `%${keyword}%`;
const toJson = (data) => JSON.stringify(data);

const lessonLink = (id) => `/grammar/learn/${id}`;
const examLink = (id) => `/exams/${id}/take`;
const collectionLink = (id) => `/vocabulary-collections/${id}/study`;

const buildTools = (userId) => [
  tool(
    async ({ keyword }) => {
      const params = [];
      let where = "gl.is_active = 1";
      if (keyword) {
        where += ` AND (gl.title LIKE ? OR gt.title LIKE ? OR gl.explanation LIKE ? OR CAST(gl.tags AS CHAR) LIKE ?)`;
        params.push(like(keyword), like(keyword), like(keyword), like(keyword));
      }
      const [rows] = await pool.query(
        `SELECT gl.id, gl.title, gt.title AS topic, gl.difficulty_level
         FROM grammar_lessons gl
         JOIN grammar_topics gt ON gt.id = gl.topic_id
         WHERE ${where}
         ORDER BY gt.display_order, gl.display_order
         LIMIT 10`,
        params
      );
      return toJson(rows.map((r) => ({ ...r, link: lessonLink(r.id) })));
    },
    {
      name: "search_grammar_lessons",
      description:
        "Find grammar lessons available in EnglishMaster. Use an English or Vietnamese keyword (e.g. 'present simple', 'thì hiện tại'), or no keyword to list all lessons.",
      schema: z.object({
        keyword: z.string().optional().describe("Keyword to search in lesson title, topic or content"),
      }),
    }
  ),

  tool(
    async ({ lesson_id }) => {
      const [rows] = await pool.query(
        `SELECT gl.id, gl.title, gt.title AS topic, gl.difficulty_level,
                LEFT(gl.explanation, 1500) AS explanation, gl.structure, gl.\`usage\`,
                gl.example_sentence, gl.meaning
         FROM grammar_lessons gl
         JOIN grammar_topics gt ON gt.id = gl.topic_id
         WHERE gl.id = ? AND gl.is_active = 1`,
        [lesson_id]
      );
      if (rows.length === 0) return toJson({ error: "Lesson not found" });
      return toJson({ ...rows[0], link: lessonLink(rows[0].id) });
    },
    {
      name: "get_grammar_lesson",
      description: "Get the content of one grammar lesson (explanation, structure, usage, example) to answer questions based on the system's material.",
      schema: z.object({ lesson_id: z.number().int().describe("Grammar lesson id") }),
    }
  ),

  tool(
    async ({ word }) => {
      const [rows] = await pool.query(
        `SELECT vf.word, vf.meaning, vf.pronunciation, vf.part_of_speech,
                vf.example_sentence, vf.example_meaning,
                vc.id AS collection_id, vc.title AS collection
         FROM vocabulary_flashcards vf
         JOIN vocabulary_collections vc ON vc.id = vf.collection_id
         WHERE vf.is_active = 1 AND (vf.word LIKE ? OR vf.meaning LIKE ?)
         ORDER BY (vf.word = ?) DESC, vf.word
         LIMIT 10`,
        [like(word), like(word), word]
      );
      return toJson(rows.map((r) => ({ ...r, link: collectionLink(r.collection_id) })));
    },
    {
      name: "search_vocabulary",
      description: "Look up a word (English) or a meaning (Vietnamese) in EnglishMaster's flashcards.",
      schema: z.object({ word: z.string().min(1).describe("English word or Vietnamese meaning") }),
    }
  ),

  tool(
    async ({ level, keyword }) => {
      const params = [];
      let where = "vc.is_public = 1";
      if (level) {
        where += " AND vc.level = ?";
        params.push(level);
      }
      if (keyword) {
        where += " AND (vc.title LIKE ? OR vc.description LIKE ? OR vc.category LIKE ?)";
        params.push(like(keyword), like(keyword), like(keyword));
      }
      const [rows] = await pool.query(
        `SELECT vc.id, vc.title, vc.level, vc.category,
                (SELECT COUNT(*) FROM vocabulary_flashcards vf WHERE vf.collection_id = vc.id AND vf.is_active = 1) AS word_count
         FROM vocabulary_collections vc
         WHERE ${where}
         ORDER BY vc.display_order, vc.id
         LIMIT 10`,
        params
      );
      return toJson(rows.map((r) => ({ ...r, link: collectionLink(r.id) })));
    },
    {
      name: "list_vocabulary_collections",
      description: "List vocabulary collections (flashcard sets) in EnglishMaster, optionally by level or topic.",
      schema: z.object({
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        keyword: z.string().optional().describe("Topic keyword, e.g. 'business', 'travel'"),
      }),
    }
  ),

  tool(
    async ({ exam_type, difficulty }) => {
      const params = [];
      const where = [];
      if (exam_type) {
        where.push("exam_type = ?");
        params.push(exam_type);
      }
      if (difficulty) {
        where.push("difficulty = ?");
        params.push(difficulty);
      }
      const [rows] = await pool.query(
        `SELECT id, title, exam_type, difficulty, duration, total_questions
         FROM exams
         ${where.length ? "WHERE " + where.join(" AND ") : ""}
         ORDER BY created_at DESC
         LIMIT 10`,
        params
      );
      return toJson(rows.map((r) => ({ ...r, link: examLink(r.id) })));
    },
    {
      name: "list_exams",
      description: "List practice exams in EnglishMaster, optionally filtered by type or difficulty.",
      schema: z.object({
        exam_type: z.enum(["listening", "reading", "writing", "speaking", "full_test"]).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      }),
    }
  ),

  tool(
    async () => {
      const [exams] = await pool.query(
        `SELECT e.id AS exam_id, e.title, e.exam_type, er.score, er.total_points,
                er.correct_answers, er.total_questions, er.submitted_at
         FROM exam_results er
         JOIN exams e ON e.id = er.exam_id
         WHERE er.user_id = ?
         ORDER BY er.submitted_at DESC
         LIMIT 10`,
        [userId]
      );
      const [grammar] = await pool.query(
        `SELECT gl.id AS lesson_id, gl.title, ugp.score AS score_percent, ugp.completed, ugp.completed_at
         FROM user_grammar_progress ugp
         JOIN grammar_lessons gl ON gl.id = ugp.lesson_id
         WHERE ugp.user_id = ?
         ORDER BY ugp.updated_at DESC
         LIMIT 10`,
        [userId]
      );
      const [vocabulary] = await pool.query(
        `SELECT vc.title AS collection, uvp.total_cards, uvp.learned_cards, uvp.mastered_cards, uvp.last_studied_at
         FROM user_vocabulary_progress uvp
         JOIN vocabulary_collections vc ON vc.id = uvp.collection_id
         WHERE uvp.user_id = ?
         ORDER BY uvp.last_studied_at DESC
         LIMIT 10`,
        [userId]
      );
      return toJson({ exams, grammar, vocabulary });
    },
    {
      name: "get_my_progress",
      description: "Get the current learner's recent exam scores, grammar lesson scores (percent) and vocabulary progress.",
      schema: z.object({}),
    }
  ),

  tool(
    async () => {
      const [wrongAnswers] = await pool.query(
        `SELECT e.title AS exam, e.exam_type, q.question_type, q.question_text,
                es.user_answer, q.correct_answer
         FROM exam_submissions es
         JOIN exam_results er ON er.id = es.result_id
         JOIN questions q ON q.id = es.question_id
         JOIN exams e ON e.id = er.exam_id
         WHERE er.user_id = ? AND es.is_correct = 0
         ORDER BY er.submitted_at DESC
         LIMIT 20`,
        [userId]
      );
      const [weakLessons] = await pool.query(
        `SELECT gl.id AS lesson_id, gl.title, gt.title AS topic, ugp.score AS score_percent
         FROM user_grammar_progress ugp
         JOIN grammar_lessons gl ON gl.id = ugp.lesson_id
         JOIN grammar_topics gt ON gt.id = gl.topic_id
         WHERE ugp.user_id = ? AND ugp.score < 80
         ORDER BY ugp.score ASC
         LIMIT 10`,
        [userId]
      );
      return toJson({
        wrong_exam_answers: wrongAnswers,
        weak_grammar_lessons: weakLessons.map((l) => ({ ...l, link: lessonLink(l.lesson_id) })),
      });
    },
    {
      name: "get_my_weaknesses",
      description: "Get the current learner's recent wrong exam answers and grammar lessons scored below 80%, to find weak areas.",
      schema: z.object({}),
    }
  ),

  tool(
    async ({ exam_id }) => {
      const params = [userId];
      let filter = "";
      if (exam_id) {
        filter = "AND er.exam_id = ?";
        params.push(exam_id);
      }
      const [results] = await pool.query(
        `SELECT er.id, er.exam_id, e.title, er.score, er.total_points, er.submitted_at
         FROM exam_results er
         JOIN exams e ON e.id = er.exam_id
         WHERE er.user_id = ? ${filter}
         ORDER BY er.submitted_at DESC
         LIMIT 1`,
        params
      );
      if (results.length === 0) return toJson({ error: "No exam result found" });
      const result = results[0];
      const [answers] = await pool.query(
        `SELECT q.question_order, q.question_text, q.options, es.user_answer, q.correct_answer, es.is_correct
         FROM exam_submissions es
         JOIN questions q ON q.id = es.question_id
         WHERE es.result_id = ?
         ORDER BY q.question_order
         LIMIT 50`,
        [result.id]
      );
      return toJson({ ...result, result_link: `/exams/result/${result.id}`, answers });
    },
    {
      name: "review_exam_result",
      description: "Get the learner's latest exam result (or the latest result of a given exam) with every answer, to explain mistakes.",
      schema: z.object({ exam_id: z.number().int().optional().describe("Exam id; omit for the latest exam") }),
    }
  ),

  tool(
    async () => {
      const [lessons] = await pool.query(
        `SELECT gl.id, gl.title, gt.title AS topic, gl.difficulty_level
         FROM grammar_lessons gl
         JOIN grammar_topics gt ON gt.id = gl.topic_id
         LEFT JOIN user_grammar_progress ugp ON ugp.lesson_id = gl.id AND ugp.user_id = ?
         WHERE gl.is_active = 1 AND (ugp.id IS NULL OR ugp.completed = 0)
         ORDER BY gt.display_order, gl.display_order
         LIMIT 5`,
        [userId]
      );
      const [collections] = await pool.query(
        `SELECT vc.id, vc.title, vc.level
         FROM vocabulary_collections vc
         LEFT JOIN user_vocabulary_progress uvp ON uvp.collection_id = vc.id AND uvp.user_id = ?
         WHERE vc.is_public = 1 AND uvp.id IS NULL
         ORDER BY vc.display_order, vc.id
         LIMIT 3`,
        [userId]
      );
      const [exams] = await pool.query(
        `SELECT e.id, e.title, e.exam_type, e.difficulty
         FROM exams e
         WHERE NOT EXISTS (SELECT 1 FROM exam_results er WHERE er.exam_id = e.id AND er.user_id = ?)
         ORDER BY FIELD(e.difficulty, 'easy', 'medium', 'hard'), e.id
         LIMIT 3`,
        [userId]
      );
      return toJson({
        unfinished_grammar_lessons: lessons.map((l) => ({ ...l, link: lessonLink(l.id) })),
        new_vocabulary_collections: collections.map((c) => ({ ...c, link: collectionLink(c.id) })),
        exams_not_taken: exams.map((e) => ({ ...e, link: examLink(e.id) })),
      });
    },
    {
      name: "get_learning_suggestions",
      description:
        "Get content the learner has not finished yet: unfinished grammar lessons, new vocabulary collections and exams not taken. Combine with get_my_weaknesses to recommend what to study next.",
      schema: z.object({}),
    }
  ),

  tool(
    async () => {
      const [rows] = await pool.query(
        `SELECT vf.word, vf.meaning, vc.id AS collection_id, vc.title AS collection, uvl.next_review_date
         FROM user_vocabulary_learning uvl
         JOIN vocabulary_flashcards vf ON vf.id = uvl.flashcard_id
         JOIN vocabulary_collections vc ON vc.id = uvl.collection_id
         WHERE uvl.user_id = ? AND uvl.next_review_date <= NOW()
         ORDER BY uvl.next_review_date
         LIMIT 20`,
        [userId]
      );
      return toJson(rows.map((r) => ({ ...r, link: collectionLink(r.collection_id) })));
    },
    {
      name: "get_vocabulary_due_for_review",
      description: "Get the words the learner should review today (spaced repetition: next_review_date is due).",
      schema: z.object({}),
    }
  ),
];

module.exports = { buildTools };
