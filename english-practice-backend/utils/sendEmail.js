const nodemailer = require('nodemailer');

// Tạo transporter với connection pool
const transporter = nodemailer.createTransport({
  pool: true, // Sử dụng connection pooling
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Tối ưu hiệu suất
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
});

// Kiểm tra kết nối khi khởi tạo
transporter.verify((error) => {
  if (error) {
    console.log('Email server connection error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

const sendEmail = (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;