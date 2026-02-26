const mysql = require("mysql2");
require("dotenv").config();

// ĐỔI TỪ createConnection SANG createPool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
  // Các cấu hình thêm cho Pool
  waitForConnections: true,
  connectionLimit: 10, // Giới hạn tối đa 10 kết nối cùng lúc
  queueLimit: 0,
});

// Cách test kết nối đối với Pool
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Lỗi kết nối MySQL Pool:", err);
    return;
  }
  console.log("✅ Kết nối MySQL (TiDB Pool) thành công!");
  connection.release(); // Trả lại kết nối cho Pool sau khi test xong
});

module.exports = db;
