# English Practice

A full-stack web application for learning English through grammar lessons, vocabulary flashcards, exams, speaking practice and an AI tutor.

## Description

### What the application does

Learners register an account (or log in with Google / Facebook), then study grammar lessons, learn vocabulary with flashcards and quizzes, take exams, practice speaking and chat with an AI tutor. After each quiz or exam, the AI analyzes the result and points out the learner's weaknesses. A progress dashboard shows the learning history.

Admins manage users, exams, grammar lessons and vocabulary from a dashboard, and can import or export content as CSV files.

### Why these technologies

- **React:** the app has many interactive screens (flashcards, quizzes, exam taking, chat), which are easier to build as reusable components.
- **Node.js + Express:** using JavaScript on both sides keeps the codebase consistent, and Express makes it simple to split the REST API into routes, controllers and models.
- **MySQL:** users, lessons, questions, attempts and progress are strongly related data, so a relational database fits.
- **JWT + Passport.js:** JWT keeps the API stateless, and Passport handles Google and Facebook login without writing the OAuth flow by hand.
- **Google Gemini API:** powers the chat tutor, speaking evaluation and result analysis without training a model.
- **Chart.js:** displays learning progress as charts on the dashboard.

### Challenges

- Combining normal email / password login with Google and Facebook OAuth, so every method ends with the same JWT.
- Designing role-based access control for five roles (`superadmin`, `admin`, `teacher`, `student`, `user`).
- Designing the database to track progress across grammar, vocabulary and exams (19 tables).
- Getting consistent, structured feedback from the AI for speaking evaluation and result analysis.

### Future features

- Pronunciation scoring from recorded audio
- Online payment for premium accounts
- Unit and integration tests for the API
- Deployment with Docker

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation and Running](#installation-and-running)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Author](#author)

## Features

**Learner side**
- Register, login, email verification, forgot / reset password
- Login with Google or Facebook (OAuth 2.0)
- Grammar: topics, lessons, exercises and quizzes with progress tracking
- Vocabulary: collections, flashcards, self-test quizzes and dictionary lookup
- Exams: take an exam, view the result and exam history
- Speaking practice with AI evaluation
- AI chat tutor with voice feedback
- Profile, learning history and progress dashboard

**Admin side**
- User management and statistics, premium status
- Manage exams, grammar lessons and vocabulary
- Import / export lessons and flashcards as CSV
- Upload audio files for lessons

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 6, Bootstrap 5, Chart.js, Axios |
| Backend | Node.js, Express 5, Passport.js, JWT, bcrypt, Multer, Nodemailer |
| Database | MySQL (mysql2) |
| AI | Google Gemini API |


## Author

Dinh Minh — [github.com/Dinhminh04](https://github.com/Dinhminh04)
