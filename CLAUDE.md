# English Practice

Full-stack English learning app: Express API (`english-practice-backend/`) + React (`english-practice-frontend/`), MySQL 8, LangChain.js with Gemini, Qdrant for RAG. Runs as 4 Docker containers behind Nginx.

## Commands

- Run everything: `docker compose up -d --build`, then open http://localhost (only port 80 is published)
- Rebuild one part: `docker compose up -d --build backend` (or `frontend`)
- Health check: `curl http://localhost/api/health` (expect 200)
- Logs: `docker logs english_backend --tail 30`, `docker logs english_frontend` (Nginx access log)

## Architecture

```
routes/ → middleware (auth → 401, isAdmin → 403, multer) → controllers/ → services/ → models/ → MySQL
```

- Controllers stay thin: read `req`, call a service or model, pick the status code, `res.json()`.
- Business logic and all LangChain code live in `services/`; SQL lives only in `models/`.
- AI entry points: `services/llm.js` (shared models), `ragChain.js` (RAG), `chatMemory.js` (memory), `aiTutor.js` + `aiTutorTools.js` (agent).

## Rules

- Never print, log or commit secrets. `.env`, `uploads/` and `storage/` are git-ignored.
- After editing `.env`, run `docker compose up -d <service>`; `restart` does not reload it.
- Routes that change content (lessons, topics, flashcards, collections, exams, AI documents) need `auth` + `isAdmin`. Learner routes (progress, submit, chat) need `auth` only.
- SQL uses mysql2 with `?` placeholders. Use `pool.query` (not `execute`) for `LIMIT ?` and bulk `VALUES ?` inserts on MySQL 8.
- AI code reuses `services/llm.js` (fallback model, Zod structured output). Agent tools are read-only and take the user id from the JWT, never from tool arguments.
- Keep API responses and messages unchanged when refactoring; prove it with before/after snapshots.
- A change is done only when it runs in the containers and the touched endpoint or page was exercised.

## Skills

Project workflows are in `.claude/skills/`:

- `run-and-verify`: start the stack, verify, read logs
- `safe-refactor`: refactor with before/after API snapshots
- `add-ai-feature`: LangChain/Gemini conventions for chains, RAG, memory, agent tools
- `security-check`: secrets, auth/isAdmin, data leaks, AI-specific risks
