# English Practice

An English learning web app with grammar lessons, vocabulary flashcards, exams and an AI tutor that chats with learners, grades their speaking and points out their weak areas.

## Description

### What the application does

Learners create an account (or log in with Google / Facebook) and study in four areas:

- **Grammar:** lessons grouped by topic, examples, exercises and quizzes, with progress saved for each lesson.
- **Vocabulary:** collections of flashcards, self-test quizzes and dictionary lookup.
- **Exams:** listening, reading and writing tests with multiple question types, automatic scoring and exam history.
- **Speaking and AI tutor:** learners speak into the microphone, the browser turns their voice into text, and the Gemini API grades the answer and gives feedback. Learners can also chat with an AI tutor to ask questions in Vietnamese.

After each quiz or exam, the AI analyzes the result and tells the learner which topics they are weak at. A progress dashboard shows their learning history.

Admins manage users, exams, grammar lessons and vocabulary from an admin dashboard, upload audio and images for questions, and import or export lessons and flashcards as CSV files.

### Why these technologies

- **React:** the app has many interactive screens (flashcards, quizzes, timed exams, chat), which are easier to build as reusable components.
- **Node.js + Express:** one language (JavaScript) on both sides, and a simple way to split 88 API endpoints into routes, controllers and models.
- **MySQL:** users, lessons, questions, attempts and progress are closely related, so a relational database with 19 tables fits well.
- **JWT + Passport.js:** JWT keeps the API stateless; Passport handles Google and Facebook login so every login method ends with the same JWT.
- **Gemini API:** powers speaking evaluation, the chat tutor and result analysis without training my own model.
- **Web Speech API:** converts speech to text directly in the browser, free and with no extra server.
- **Docker + Nginx:** the whole stack starts with one command; Nginx serves the React build and proxies `/api` to the backend, so only port 80 is exposed.

### Challenges

- **Getting reliable output from the AI:** the speaking prompt asks Gemini to return only JSON with scores for fluency, grammar, vocabulary and pronunciation (1–10), an overall score and feedback. Gemini sometimes adds extra text, so the server cuts out the part between the first `{` and the last `}` before parsing it.
- **User roles:** an auth middleware checks the JWT, then a role middleware protects each route. The app uses `user`, `admin` and `superadmin`; `teacher` and `student` are reserved for course enrollment.
- **Tracking progress across modules:** grammar, vocabulary and exams each store their own attempts and progress, and the database had to support both the learner's dashboard and the AI analysis.
- **Moving from XAMPP to Docker (MySQL 8):** paginated queries with `LIMIT ?` failed under `pool.execute()`, so they now use `pool.query()`; Vietnamese text in `db.sql` was imported as `latin1` until the MySQL container got `LANG=C.UTF-8`.

### Future features

- Course enrollment with `teacher` and `student` roles
- Pronunciation scoring from the recorded audio, not only from the transcript
- Saving AI chat history, HTTPS, online payment
- Unit and integration tests for the API

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Installation and Running](#installation-and-running)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Author](#author)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 6, Bootstrap 5, Font Awesome, Chart.js, Axios |
| Backend | Node.js, Express 5, Passport.js, JWT, bcrypt, Multer, Nodemailer |
| Database | MySQL 8 (19 tables) |
| AI | Google Gemini API (gemini-3.1-flash-lite), Web Speech API |
| Deployment | Docker, Docker Compose, Nginx |

## Installation and Running

### Requirements

- Docker Desktop (or Node.js 18+ and MySQL to run without Docker)
- A Google Gemini API key and a Gmail App Password
- Chrome or Edge (for the speech recognition feature)

### Step 1: Clone the repository

```bash
git clone https://github.com/Dinhminh04/english-practice.git
cd english-practice
```

### Step 2: Create the environment files

```bash
cp .env.example .env                                          # MYSQL_ROOT_PASSWORD
cp english-practice-backend/.env.example english-practice-backend/.env
```

Fill in `JWT_SECRET`, `SESSION_SECRET`, `GEMINI_API_KEY`, `EMAIL_USER` and `EMAIL_PASS`. Google and Facebook keys are optional; leave them empty to skip those login methods.

### Step 3: Run with Docker

```bash
docker compose up -d
```

MySQL imports `db.sql` on the first start. Open **http://localhost**. Google / Facebook redirect URIs: `http://localhost/api/auth/{google|facebook}/callback`.

### Run without Docker

Import `db.sql` into a MySQL database named `english_practice`, then:

```bash
cd english-practice-backend && npm install && npm run dev      # http://localhost:5000
cd english-practice-frontend && cp .env.example .env && npm install && npm start   # http://localhost:3000
```

Set `DB_PORT` in the backend `.env` if MySQL does not use port 3306.

## API Overview

88 endpoints, grouped by module:

| Base path | Description |
|---|---|
| `/api/auth` | Register, login, verify email, forgot / reset password, Google / Facebook login |
| `/api/user` | Profile, change password, learning history, weak areas |
| `/api/grammar` | Topics, lessons, exercises, practices, progress, CSV import / export |
| `/api/vocabulary` | Collections, flashcards, questions, progress, CSV import / export |
| `/api/exams` | Exam CRUD, questions with audio / images, submit, results, history, AI analysis |
| `/api/speaking` | Get a random speaking topic, evaluate an answer |
| `/api/chat` | AI tutor chat and voice feedback |
| `/api/admin` | User management, statistics, premium status |

## Project Structure

```
english-practice/
├── english-practice-backend/    # Express REST API (Dockerfile)
│   ├── controllers/  # Request handlers (auth, grammar, vocabulary, exam, speaking, chat, admin)
│   ├── models/       # Database queries
│   ├── routes/       # API routes
│   ├── middleware/   # JWT auth and role checks
│   ├── config/       # Database and Passport config
│   └── utils/        # Email sender
├── english-practice-frontend/   # React app (multi-stage Dockerfile + nginx.conf)
│   └── src/
│       ├── components/   # grammar, vocabulary, exam, speaking, admin, layout, ChatAI
│       ├── pages/        # AuthSuccess, VerifyEmail
│       ├── routers/      # App routes
│       └── api.js        # Axios instance
├── docker-compose.yml           # MySQL + backend + Nginx
└── db.sql                       # Database schema and sample data
```

## Author

Nguyen Dinh Minh — [github.com/Dinhminh04](https://github.com/Dinhminh04)
