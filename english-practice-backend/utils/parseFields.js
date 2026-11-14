// Helpers for request fields and JSON columns shared by the grammar and vocabulary modules.

// List fields (tags, synonyms, options...) arrive as a JSON array string from FormData
// or as "a, b, c" from a text input. Non-string values are returned unchanged.
const parseList = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value.split(",").map((item) => item.trim());
  }
};

// "a, b, c" from a CSV cell -> ["a", "b", "c"] (empty cell -> [])
const splitCsvList = (value) => (value ? value.split(",").map((item) => item.trim()) : []);

// JSON column read from MySQL (the pool returns JSON as text) -> value, or fallback when empty
const parseJsonColumn = (value, fallback) => (value ? JSON.parse(value) : fallback);

// Public path of a file uploaded with multer .fields(), e.g. "/uploads/audio/abc.mp3", or null
const uploadedFilePath = (files, field, folder) =>
  files && files[field] ? `/uploads/${folder}/${files[field][0].filename}` : null;

module.exports = { parseList, splitCsvList, parseJsonColumn, uploadedFilePath };
