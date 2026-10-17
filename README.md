# English Practice

An English learning web app with grammar lessons, vocabulary flashcards, exams and an AI tutor that chats with learners, grades their speaking and points out their weak areas.

> Graduation thesis project — Bachelor of Information Technology, University of Technology and Management (UTM), 2026.

## Description

### What the application does

Learners create an account (or log in with Google / Facebook) and study in four areas:

- **Grammar:** lessons grouped by topic, examples, exercises and quizzes, with progress saved for each lesson.
- **Vocabulary:** collections of flashcards, self-test quizzes and dictionary lookup.
- **Exams:** listening, reading and writing tests with multiple question types, automatic scoring and exam history.
- **Speaking and AI tutor:** learners speak into the microphone, the browser turns their voice into text, and the Gemini API grades the answer and gives feedback. Learners can also chat with an AI tutor to ask questions in Vietnamese.

After each quiz or exam, the AI analyzes the result and tells the learner which topics they are weak at. A progress dashboard shows their learning history.

Admins and teachers manage users, exams, grammar lessons and vocabulary from an admin dashboard, upload audio and images for questions, and import or export lessons and flashcards as CSV files.

### Why these technologies

- **React:** the app has many interactive screens (flashcards, quizzes, timed exams, chat), which are easier to build as reusable components.
- **Node.js + Express:** one language (JavaScript) on both sides, and a simple way to split 88 API endpoints into routes, controllers and models.
- **MySQL:** users, lessons, questions, attempts and progress are closely related, so a relational database with 19 tables fits well.
- **JWT + Passport.js:** JWT keeps the API stateless; Passport handles Google and Facebook login so every login method ends with the same JWT.
- **Gemini API:** powers speaking evaluation, the chat tutor and result analysis without training my own model.
- **Web Speech API:** converts speech to text directly in the browser, free and with no extra server.
- **Multer + Nodemailer:** file uploads (audio, images, CSV) and emails for account verification and password reset.

### Challenges

- **Getting reliable output from the AI:** the speaking prompt asks Gemini to return only JSON with scores for fluency, grammar, vocabulary and pronunciation (1–10), an overall score and feedback. Gemini sometimes adds extra text, so the server cuts out the part between the first `{` and the last `}` before parsing it.
- **Five user roles:** `superadmin`, `admin`, `teacher`, `student` and `user` need different permissions, handled by an auth middleware (checks the JWT) followed by a role middleware on each protected route.
- **Tracking progress across modules:** grammar, vocabulary and exams each store their own attempts and progress, and the database had to support both the learner's dashboard and the AI analysis.
- **Listening exams:** one audio file is often shared by several questions, so the upload logic saves a shared audio file for the exam instead of one per question.

### Future features

- Pronunciation scoring from the recorded audio, not only from the transcript
- Online payment for premium accounts
- Unit and integration tests for the API
- Docker setup for easier deployment

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
| Frontend | React 19, React Router 6, Bootstrap 5, Chart.js, Axios |
| Backend | Node.js, Express 5, Passport.js, JWT, bcrypt, Multer, Nodemailer |
| Database | MySQL (19 tables) |
| AI | Google Gemini API (gemini-2.5-flash), Web Speech API |
| Tools | XAMPP, Git/GitHub, VS Code |

## Installation and Running

### Requirements

- Node.js 18 or later
- MySQL (for example via XAMPP)
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))
- Chrome or Edge (for the speech recognition feature)

### Step 1: Clone the repository

```bash
git clone https://github.com/Dinhminh04/english-practice.git
cd english-practice
```

### Step 2: Set up the database

Create a database named `english_practice`, then import `db.sql` (in phpMyAdmin: select the database, open **Import**, choose `db.sql`), or run:

```bash
mysql -u root -p english_practice < db.sql
```

### Step 3: Set up the backend

```bash
cd english-practice-backend
npm install
```

Create a `.env` file in `english-practice-backend`:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=english_practice

JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

GEMINI_API_KEY=your_gemini_api_key

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=

OXFORD_APP_ID=
OXFORD_APP_KEY=
```

Google, Facebook and Oxford keys are optional; leave them empty to skip those features.

### Step 4: Run the backend

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### Step 5: Set up and run the frontend

Open a new terminal:

```bash
cd english-practice-frontend
npm install
npm start
```

The app runs at `http://localhost:3000`.

## API Overview

88 endpoints, grouped by module:

| Base path | Description |
|---|---|
| `/api/auth` | Register, login, verify email, forgot / reset password |
| `/api/user` | Profile, change password, learning history, weak areas |
| `/api/grammar` | Topics, lessons, exercises, practices, progress, CSV import / export |
| `/api/vocabulary` | Collections, flashcards, questions, progress, CSV import / export |
| `/api/exams` | Exam CRUD, questions with audio / images, submit, results, history, AI analysis |
| `/api/speaking` | Get a random speaking topic, evaluate an answer |
| `/api/chat` | AI tutor chat and voice feedback |
| `/api/admin` | User management, statistics, premium status |
| `/auth/google` | Google login (OAuth 2.0) |

## Project Structure

```
english-practice/
├── english-practice-backend/    # Express REST API
│   ├── controllers/  # Request handlers (auth, grammar, vocabulary, exam, speaking, chat, admin)
│   ├── models/       # Database queries
│   ├── routes/       # API routes
│   ├── middleware/   # JWT auth and role checks
│   ├── config/       # Database and Passport config
│   └── utils/        # Email sender
├── english-practice-frontend/   # React app
│   └── src/
│       ├── components/   # grammar, vocabulary, exam, speaking, admin, layout, ChatAI
│       ├── pages/        # AuthSuccess, VerifyEmail
│       ├── routers/      # App routes
│       └── api.js        # Axios instance
└── db.sql                       # Database schema and sample data
```

## Author

Nguyen Dinh Minh — [github.com/Dinhminh04](https://github.com/Dinhminh04)
