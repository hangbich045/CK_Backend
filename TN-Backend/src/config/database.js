'use strict';

/**
 * @file config/database.js
 * @description Cấu hình kết nối SQL Server bằng Sequelize ORM.
 *
 * Sequelize hỗ trợ nhiều dialect (mysql, postgres, mssql, sqlite...).
 * Ở đây ta dùng 'mssql' với driver 'tedious' (đã cài qua npm).
 *
 * Các tuỳ chọn quan trọng:
 *  - dialect: Loại database ('mssql')
 *  - host/port: Địa chỉ và cổng SQL Server
 *  - dialectOptions: Tuỳ chọn đặc thù của MSSQL (encrypt, trustServerCertificate...)
 *  - pool: Quản lý connection pool (tránh tạo quá nhiều kết nối đồng thời)
 *  - logging: false => Tắt log SQL ra console (bật khi cần debug)
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Khởi tạo instance Sequelize với thông tin từ biến môi trường
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Tên database
  process.env.DB_USER,     // Username
  process.env.DB_PASSWORD, // Password
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    dialect: 'mssql', // Loại database: SQL Server

    // Cấu hình đặc thù cho MSSQL (Tedious driver)
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',       // true nếu dùng Azure SQL
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true', // true cho local
        enableArithAbort: true, // Bắt buộc cho SQL Server mới
        requestTimeout: 30000,  // Timeout cho mỗi query (30 giây)
        connectTimeout: 15000,  // Timeout kết nối ban đầu (15 giây)
      },
    },

    // Quản lý Pool kết nối (Connection Pooling)
    pool: {
      max: 10,     // Tối đa 10 kết nối đồng thời
      min: 0,      // Tối thiểu 0 kết nối khi rảnh
      acquire: 60000, // Thời gian tối đa chờ lấy kết nối (60 giây)
      idle: 10000,    // Thời gian kết nối rảnh trước khi đóng (10 giây)
    },

    logging: false, // Tắt log SQL ra console (đặt thành console.log để bật khi debug)
    timezone: '+07:00', // Múi giờ Việt Nam
  }
);

/**
 * Hàm kiểm tra kết nối database
 * Được gọi khi server khởi động
 */
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối SQL Server thành công!');
  } catch (error) {
    console.error('❌ Không thể kết nối SQL Server:', error.message);
    process.exit(1); // Dừng server nếu không kết nối được DB
  }
};

module.exports = { sequelize, connectDatabase };
