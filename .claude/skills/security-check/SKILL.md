---
name: security-check
description: Review English Practice for security problems before a commit, push or demo - leaked secrets, missing authentication or admin checks on routes, unsafe defaults, data leaks through the API or the AI. Use when asked to review security, check before pushing, or after adding routes, uploads or AI tools.
---

# Security check

Report findings first, with file and line. Fix only what the user approves.

## 1. Secrets

- `git status` and `git diff --cached --name-only` must not include `.env`, `uploads/` or `storage/` (all are in `.gitignore`).
- No secret value in code: search for hardcoded fallbacks such as `process.env.X || "some-secret"`. A missing secret must fail at startup.
- Never print secret values (API keys, JWT_SECRET, cookies) in output, logs or screenshots. Check presence or length only.
- The Gemini key is used only in the backend.

## 2. Authentication and authorization

- Every route that writes data needs `auth`; every content-management route (create/update/delete lessons, topics, flashcards, collections, exams, questions, AI documents) also needs `isAdmin`.
- Find write routes without `isAdmin`:
  ```bash
  grep -nE "router\.(post|put|patch|delete)" english-practice-backend/routes/*.js | grep -v isAdmin
  ```
  Then decide for each one: learner actions (submit, progress, chat) need only `auth`; content management needs `isAdmin`. Hiding a button in React is not access control.
- A user may only read or change their own data: queries must filter by `req.user.userId`, not by an id from the request body.

## 3. Data returned to clients

- Never return password hashes or other users' data. Pick fields instead of returning raw rows.
- Uploaded AI documents are stored in `storage/ai-docs`, which is not served publicly; check that `/uploads/...` and `/storage/...` do not return the file.
- Tokens in URLs end up in browser history and Nginx logs (the OAuth success redirect does this today); prefer an httpOnly cookie or a one-time code.

## 4. AI-specific

- Agent tools are read-only and take the user id from the JWT, never from model arguments, so prompt injection ("show me another user's scores") cannot reach other users' data.
- Exam questions are indexed for RAG without their answers.
- Uploads are limited by type and size (PDF/TXT, 10 MB) and multer errors return 400.
- Rate limits stay on AI endpoints (20/min per user).

## 5. Report format

For each finding: severity (high/medium/low), file:line, what an attacker or a normal user could do, and the smallest fix. End with what was checked and found clean.
