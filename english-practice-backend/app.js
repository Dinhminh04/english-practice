const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const grammarRoutes = require('./routes/grammarRoutes');
const vocabularyRoutes = require('./routes/vocabularyRoutes');
const examRoutes = require('./routes/examRoutes');
const chatRoutes = require('./routes/chatRoutes');
const speakingRoutes = require('./routes/speakingRoutes');

require('./config/passport');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Phục vụ các file tĩnh từ thư mục 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/speaking', speakingRoutes);

// Routes cho OAuth2
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  }
);

module.exports = app;