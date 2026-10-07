const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "english_practice",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
