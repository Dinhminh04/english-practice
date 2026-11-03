# English Practice

A full-stack English learning web app with grammar lessons, vocabulary flashcards, exams and a Gemini-powered AI tutor. The tutor is a LangChain agent that reads the app's own data: it knows each learner's progress, explains their exam mistakes and recommends what to study next.

The whole stack (MySQL, Express API, React + Nginx) runs with one `docker compose up` command.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Why These Technologies](#why-these-technologies)
- [Challenges](#challenges)
- [Installation and Running](#installation-and-running)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Future Features](#future-features)
- [Author](#author)

## Features

Learners sign up with email (with email verification), or log in with Google / Facebook.

**Grammar**
- Lessons grouped by topic, with examples
- Exercises and quizzes
- Progress saved for each lesson

**Vocabulary**
- Flashcard collections
- Self-test quizzes
- Dictionary lookup

**Exams**
- Listening, reading and writing tests with multiple question types
- Automatic scoring
- Exam history

**Speaking**
- The learner speaks into the microphone and the browser converts speech to text.
- The Gemini API grades the answer and gives feedback.

**AI tutor (chat)**
- Answers in Vietnamese using the app's real data: grammar lessons, flashcards, exams and the learner's own results.
- Finds weak areas, explains wrong exam answers and suggests the next lessons, with clickable links.
- Lists the words due for review today (spaced repetition).
- Chat history is saved, so the tutor remembers the conversation; learners can start, reopen and delete conversations.

**Learning analysis**
- After each quiz or exam, the AI analyzes the result and lists the topics the learner is weak at.
- A progress dashboard shows the learner's history.

**Admin dashboard**
- Manage users, exams, grammar lessons and vocabulary
- Upload audio and images for exam questions
- Import and export lessons and flashcards as CSV files

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 6, Bootstrap 5, Font Awesome, Chart.js, Axios |
| Backend | Node.js, Express 5, Passport.js, JWT, bcrypt, Multer, Nodemailer |
| Database | MySQL 8 (21 tables) |
| AI | Google Gemini API (gemini-3.5-flash-lite), LangChain.js (agent, tool calling), Web Speech API |
| Deployment | Docker, Docker Compose, Nginx |

## Why These Technologies

- **React:** the app has many interactive screens (flashcards, quizzes, timed exams, chat). Reusable components make them easier to build.
- **Node.js + Express:** JavaScript on both frontend and backend. Express makes it simple to split 91 endpoints into routes, controllers and models.
- **MySQL:** users, lessons, questions, attempts and progress are closely related, so a relational database fits well.
- **JWT + Passport.js:** JWT keeps the API stateless. Passport handles Google and Facebook login, and every login method ends with the same JWT.
- **Gemini API:** powers speaking evaluation, the chat tutor and result analysis without training a custom model.
- **LangChain (tool calling):** the tutor calls a set of read-only functions (search lessons, get my weaknesses, review my last exam...) instead of writing SQL. This keeps answers grounded in real data and limits what the AI can access.
- **Web Speech API:** converts speech to text in the browser for free, with no extra server.
- **Multer + Nodemailer:** Multer handles file uploads (audio, images, CSV). Nodemailer sends account verification and password reset emails.
- **Docker + Nginx:** the whole stack starts with one command. Nginx serves the React build and proxies `/api` and `/uploads` to the backend, so only port 80 is exposed.

## Challenges

- **Reliable AI output.** The speaking prompt asks Gemini to return only JSON: scores (1–10) for fluency, grammar, vocabulary and pronunciation, an overall score and feedback. Gemini sometimes adds extra text, so the server extracts the part between the first `{` and the last `}` before parsing.
- **User roles.** Each protected route uses an auth middleware (checks the JWT) followed by a role middleware. The app uses `user`, `admin` and `superadmin`; `teacher` and `student` exist in the database but are reserved for course enrollment.
- **Progress across modules.** Grammar, vocabulary and exams each store their own attempts and progress. The schema had to support both the learner dashboard and the AI analysis.
- **Listening exams.** Several questions often share one audio file, so the upload logic stores one shared audio file per exam instead of one per question.
- **Moving from XAMPP to Docker (MySQL 8).**
  - Paginated queries with `LIMIT ? OFFSET ?` failed under `pool.execute()`, so they now use `pool.query()`.
  - Vietnamese text in `db.sql` was imported as `latin1` until the MySQL container got `LANG=C.UTF-8`.
  - MySQL 8 returns `JSON` columns already parsed, while MariaDB returns text, so `JSON.parse` failed. A `typeCast` in the connection pool now returns JSON as text on both.
- **Keeping the AI tutor safe.** Each tool gets the user id from the JWT, never from the model, so a learner can only see their own data. Messages are limited to 20 per minute per user.
- **Gemini overload (503).** The first model was often overloaded, which made answers take about 50 seconds. The agent now uses a faster primary model and switches to a fallback model on errors, bringing replies down to about 2 seconds.

## Installation and Running

### Requirements

- Docker Desktop (or Node.js 18+ and MySQL to run without Docker)
- A Google Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- A Gmail App Password (for verification and password reset emails)
- Chrome or Edge (for speech recognition)

### 1. Clone the repository

```bash
git clone https://github.com/Dinhminh04/english-practice.git
cd english-practice
```

### 2. Create the environment files

```bash
cp .env.example .env
cp english-practice-backend/.env.example english-practice-backend/.env
```

- In the root `.env`, set `MYSQL_ROOT_PASSWORD`.
- In `english-practice-backend/.env`, fill in `JWT_SECRET`, `SESSION_SECRET`, `GEMINI_API_KEY`, `EMAIL_USER` and `EMAIL_PASS`.
- Google, Facebook and Oxford keys are optional. Leave them empty to turn those features off.

With Docker, `docker-compose.yml` overrides the database host, password, `FRONTEND_URL` and OAuth callback URLs, so you don't need to change them in the backend `.env`.

### 3. Run with Docker

```bash
docker compose up -d
```

- MySQL imports `db.sql` on the first start.
- Open **http://localhost**.
- Google / Facebook redirect URIs: `http://localhost/api/auth/google/callback` and `http://localhost/api/auth/facebook/callback`.

To stop the app:

```bash
docker compose down        # keep data
docker compose down -v     # also delete the database and uploaded files
```

### Run without Docker

1. Import `db.sql` into a MySQL database named `english_practice`.
2. Start the backend:

   ```bash
   cd english-practice-backend
   npm install
   npm run dev        # http://localhost:5000
   ```

3. Start the frontend in a new terminal:

   ```bash
   cd english-practice-frontend
   cp .env.example .env
   npm install
   npm start          # http://localhost:3000
   ```

Set `DB_PORT` in the backend `.env` if MySQL does not use port 3306.

## API Overview

91 endpoints, grouped by module:

| Base path | Description |
|---|---|
| `/api/auth` | Register, login, email verification, forgot / reset password, Google / Facebook login |
| `/api/user` | Profile, change password, learning history, weak areas |
| `/api/grammar` | Topics, lessons, exercises, practices, progress, CSV import / export |
| `/api/vocabulary` | Collections, flashcards, questions, progress, CSV import / export |
| `/api/exams` | Exam CRUD, questions with audio / images, submit, results, history, AI analysis |
| `/api/speaking` | Random speaking topic, answer evaluation |
| `/api/chat` | AI tutor chat, conversation history (list, messages, delete), voice feedback |
| `/api/admin` | User management, statistics, premium status |
| `/api/health` | Health check |

## Project Structure

```
english-practice/
├── english-practice-backend/    # Express REST API (Dockerfile)
│   ├── config/       # Database and Passport config
│   ├── controllers/  # Request handlers (auth, grammar, vocabulary, exam, speaking, chat, admin)
│   ├── middleware/   # JWT auth and role checks
│   ├── models/       # Database queries
│   ├── routes/       # API routes
│   ├── services/     # AI tutor: LangChain agent and its tools
│   ├── utils/        # Email sender
│   └── server.js     # Entry point
├── english-practice-frontend/   # React app (multi-stage Dockerfile + nginx.conf)
│   └── src/
│       ├── components/   # grammar, vocabulary, exam, speaking, admin, layout, ChatAI
│       ├── pages/        # AuthSuccess, VerifyEmail
│       ├── routers/      # App routes
│       └── api.js        # Axios instance
├── docker-compose.yml           # MySQL + backend + Nginx
├── .env.example                 # MYSQL_ROOT_PASSWORD for Docker Compose
└── db.sql                       # Database schema and sample data
```

## Future Features

- Course enrollment with `teacher` and `student` roles
- Pronunciation scoring from recorded audio, not only from the transcript
- Streaming AI replies word by word
- HTTPS and online payment for premium accounts
- Unit and integration tests for the API

## Author

**Nguyen Dinh Minh** — [github.com/Dinhminh04](https://github.com/Dinhminh04)