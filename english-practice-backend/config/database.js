const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "english_practice",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // MySQL 8 returns JSON columns already parsed, MariaDB returns them as text.
  // Always return text so the existing JSON.parse calls work on both.
  typeCast: (field, next) =>
    field.type === "JSON" ? field.string("utf8") : next(),
});

// Test the connection
pool
  .getConnection()
  .then((conn) => {
    console.log("Kết nối đến MySQL thành công.");
    conn.release();
  })
  .catch((err) => {
    console.error("Lỗi kết nối đến MySQL: ", err);
  });

module.exports = pool;
