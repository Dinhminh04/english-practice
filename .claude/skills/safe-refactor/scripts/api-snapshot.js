// Snapshot the English Practice GET endpoints to a folder, or compare two snapshots.
//
//   API_EMAIL=... API_PASSWORD=... node api-snapshot.js snapshot <dir>
//   node api-snapshot.js compare <beforeDir> <afterDir>
//
// Credentials come from the environment so they are never committed.
// BASE_URL defaults to http://localhost/api (the Nginx entry point).

const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost/api";

const snapshot = async (outDir) => {
  const { API_EMAIL, API_PASSWORD } = process.env;
  if (!API_EMAIL || !API_PASSWORD) throw new Error("Set API_EMAIL and API_PASSWORD (an admin test account)");
  fs.mkdirSync(outDir, { recursive: true });

  const login = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: API_EMAIL, password: API_PASSWORD }),
  }).then((r) => r.json());
  if (!login.token) throw new Error("Login failed");
  const headers = { Authorization: `Bearer ${login.token}` };

  const save = async (name, url) => {
    const res = await fetch(BASE + url, { headers });
    const body = await res.text();
    fs.writeFileSync(path.join(outDir, `${name}.txt`), `${res.status}\n${body}`);
    return body;
  };

  // Vocabulary
  const collections = JSON.parse(await save("collections", "/vocabulary/collections"));
  for (const c of collections) {
    await save(`collection-${c.id}`, `/vocabulary/collections/${c.id}`);
    await save(`flashcards-${c.id}`, `/vocabulary/flashcards?collection_id=${c.id}`);
    await save(`questions-${c.id}`, `/vocabulary/questions?collection_id=${c.id}`);
    await save(`export-vocab-${c.id}`, `/vocabulary/export/csv?collection_id=${c.id}`);
  }
  await save("search-the", "/vocabulary/search?q=the");
  await save("vocab-progress", "/vocabulary/learning/progress");
  await save("flashcards-missing-param", "/vocabulary/flashcards");
  await save("collection-404", "/vocabulary/collections/99999");

  // Grammar
  await save("topics", "/grammar/topics?limit=50");
  const { lessons } = JSON.parse(await save("lessons", "/grammar/lessons?limit=100"));
  for (const l of lessons) {
    await save(`lesson-${l.id}`, `/grammar/lessons/${l.id}`);
    await save(`examples-${l.id}`, `/grammar/examples?lesson_id=${l.id}`);
    const practices = JSON.parse(await save(`practices-${l.id}`, `/grammar/practices?lesson_id=${l.id}`));
    for (const p of practices) await save(`practice-${p.id}`, `/grammar/practices/${p.id}`);
    await save(`progress-${l.id}`, `/grammar/progress/${l.id}`);
  }
  await save("lesson-404", "/grammar/lessons/99999");
  await save("export-grammar", "/grammar/export/csv");
  await save("practice-history", "/grammar/practices/history");
  await save("grammar-progress-all", "/grammar/progress");

  // Exams
  const exams = JSON.parse(await save("exams", "/exams"));
  for (const e of Array.isArray(exams) ? exams : exams.exams || []) await save(`exam-${e.id}`, `/exams/${e.id}`);

  console.log(`Saved ${fs.readdirSync(outDir).length} responses to ${outDir}`);
};

const compare = (beforeDir, afterDir) => {
  const before = new Set(fs.readdirSync(beforeDir));
  const after = new Set(fs.readdirSync(afterDir));
  const problems = [];
  for (const name of before) {
    if (!after.has(name)) problems.push(`missing after: ${name}`);
    else if (fs.readFileSync(path.join(beforeDir, name), "utf8") !== fs.readFileSync(path.join(afterDir, name), "utf8")) {
      problems.push(`changed: ${name}`);
    }
  }
  for (const name of after) if (!before.has(name)) problems.push(`new after: ${name}`);

  if (problems.length === 0) {
    console.log(`ALL ${before.size} RESPONSES IDENTICAL`);
  } else {
    problems.forEach((p) => console.log(p));
    process.exitCode = 1;
  }
};

const [mode, a, b] = process.argv.slice(2);
(async () => {
  if (mode === "snapshot" && a) await snapshot(a);
  else if (mode === "compare" && a && b) compare(a, b);
  else throw new Error("Usage: api-snapshot.js snapshot <dir> | compare <beforeDir> <afterDir>");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
