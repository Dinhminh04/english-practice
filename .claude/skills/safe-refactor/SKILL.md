---
name: safe-refactor
description: Refactor or restructure backend code (split controllers into services, move logic, rename, change SQL) without changing API behaviour, proven by snapshotting API responses before and after. Use when asked to refactor, clean up, split a long file, or change a model/query in english-practice-backend.
when_to_use: Also use when fixing a bug in shared code, to show the fix did not change unrelated endpoints.
---

# Safe refactor (behaviour must not change)

Goal: the code gets cleaner, the API stays identical. "It still looks right" is not proof; matching responses are.

## Layering used in this project

```
Router (routes/)        URL + method → middleware → controller
Middleware              auth (JWT, 401), isAdmin (403), multer uploads
Controller              read req, call service/model, choose status code, res.json()
Service (services/)     business logic, no req/res, reusable and testable
Model (models/)         SQL with mysql2 and ? placeholders (repository role)
```

Controllers stay thin. Plain CRUD may call the model directly; anything with rules (scoring, merging progress, CSV parsing, dictionary lookups) belongs in a service. Shared helpers go to `utils/`.

## Steps

1. **Read the whole file** before changing it, and grep for every importer of the functions you will move (`grep -rn "require(\"../controllers/..."`).
2. **Snapshot before.** With the stack running (see the `run-and-verify` skill), save every GET response the change can touch:
   ```bash
   API_EMAIL=<test admin> API_PASSWORD=<password> node ${CLAUDE_SKILL_DIR}/scripts/api-snapshot.js snapshot before
   ```
   The container runs the image built *before* your edits, so you can write code while it runs; just snapshot before rebuilding.
3. **Refactor.** Keep exported names, status codes and messages unchanged so routes and the frontend need no edits. Move logic, don't rewrite it.
4. **Rebuild** the backend and **snapshot after**, then compare:
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/api-snapshot.js snapshot after
   node ${CLAUDE_SKILL_DIR}/scripts/api-snapshot.js compare before after
   ```
   Every file must match. A difference is a regression until explained.
5. **Test write endpoints on throwaway data**: create a "TEST ..." collection/topic, exercise create/update/import/submit, then delete it and confirm no rows are left. Never test on real user data.
6. **Report** line counts before/after, the snapshot result, write tests run, and any intended behaviour change (list each one explicitly).

## Traps found on this project

- **MySQL 8 + mysql2:** `pool.execute()` (prepared statements) fails with `LIMIT ?` and with bulk `INSERT ... VALUES ?`. Use `pool.query()` for those.
- **JSON columns:** the pool `typeCast` returns JSON as text, so models/services parse with `parseJsonColumn` (`utils/parseFields.js`).
- **`Bind parameters must not contain undefined`:** models pass optional fields straight to `execute`. When testing by hand, send every form field the frontend sends.
- **CSV import:** use `readCsv()` from `services/csvService.js`; it rejects on a broken file and always deletes the temp upload.
- If the user rejects or interrupts a change, restore exactly what was there (`git checkout -- <files>` for files you alone changed) and re-check `git status` before doing anything else.
