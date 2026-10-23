'use strict';

/**
 * @file src/server.js
 * @description Entry point của ứng dụng Express.js.
 *
 * ========================================
 * LUỒNG KHỞI ĐỘNG SERVER:
 * ========================================
 * 1. Load biến môi trường từ .env (dotenv)
 * 2. Kết nối SQL Server (Sequelize authenticate)
 * 3. Đồng bộ schema database (sequelize.sync)
 * 4. Cấu hình Express middlewares toàn cục
 * 5. Đăng ký các routes
 * 6. Cấu hình Swagger UI
 * 7. Lắng nghe trên PORT
 *
 * ========================================
 * CÁC MIDDLEWARE TOÀN CỤC (GLOBAL):
 * ========================================
 * - cors(): Cho phép frontend (Next.js) gọi API từ domain khác
 * - express.json(): Parse JSON request body
 * - express.urlencoded(): Parse form data
 */

require('dotenv').config(); // Bước 1: Load .env trước tất cả

const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./config/database');
const { syncDatabase } = require('./models');
const { setupSwagger } = require('./config/swagger');

// Import các routes
const authRoutes = require('./routes/auth.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const borrowRequestRoutes = require('./routes/borrowRequest.routes');
const studioBookingRoutes = require('./routes/studioBooking.routes');
const categoryRoutes = require('./routes/category.routes');
// Routes tương thích với Frontend hiện tại (NestJS-style paths)
const compatRoutes = require('./routes/compat.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const homepageRoutes = require('./routes/homepage.routes');
const cmsRoutes = require('./routes/cms.routes');
const reportsRoutes = require('./routes/reports.routes');
const { verifyMailer } = require('./config/mailer');

// Khởi tạo Express application
const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

// ============================================================
// GLOBAL MIDDLEWARES (Chạy TRƯỚC tất cả routes)
// ============================================================

/**
 * CORS (Cross-Origin Resource Sharing):
 * Cho phép Next.js (chạy trên localhost:3000) gọi API sang localhost:5000
 * Trong production: thay '*' bằng URL thực của frontend
 */
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // Dev mode: cho phép tất cả
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // IE11 compat
}));

/**
 * Parse JSON request body:
 * Biến đổi raw body string -> JS object (req.body)
 * Ví dụ: POST body '{"email":"a@b.com"}' -> req.body.email = 'a@b.com'
 */
app.use(express.json({ limit: '10mb' })); // Giới hạn payload 10MB

/**
 * Parse URL-encoded form data (application/x-www-form-urlencoded)
 * extended: true -> hỗ trợ nested objects
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// ROUTES (Đăng ký các đường dẫn API)
// ============================================================
/**
 * Tiền tố /api cho tất cả routes:
 * Phân biệt rõ ràng API endpoints vs. trang HTML (nếu có)
 * Giúp nginx/proxy dễ dàng điều hướng
 */
app.use('/api/auth', authRoutes);               // /api/auth/login, /api/auth/register...
app.use('/api/equipments', equipmentRoutes);    // /api/equipments, /api/equipments/:id...
app.use('/api/borrow-requests', borrowRequestRoutes);
app.use('/api/studio-bookings', studioBookingRoutes);
app.use('/api/categories', categoryRoutes);

// ============================================================
// COMPATIBILITY ROUTES (khớp với Frontend hiện tại)
// ============================================================
// Thứ tự quan trọng: compat trước, sẽ ưu tiên hơn routes mới nếu cùng path
app.use('/api', compatRoutes);          // /api/equipment, /api/equipment-categories, ...
app.use('/api/dashboard', dashboardRoutes);  // /api/dashboard/stats, /api/dashboard/users
app.use('/api/admin', adminRoutes);     // /api/admin/users
app.use('/api', uploadRoutes);          // /api/equipment/upload, /api/auth/avatar
app.use('/api/homepage', homepageRoutes); // /api/homepage (static CMS)
app.use('/api', cmsRoutes);               // /api/homepage-content, /api/homepage-services, ...
app.use('/api/reports', reportsRoutes);   // /api/reports/export-excel

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================
/**
 * GET /health
 * Kiểm tra nhanh server có đang chạy không
 * Hữu ích cho load balancer, monitoring tool
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: '🚀 TN-Backend đang chạy tốt!',
  });
});

// ============================================================
// GLOBAL ERROR HANDLER (Xử lý lỗi không bắt được)
// ============================================================
/**
 * Middleware xử lý lỗi của Express (4 tham số: err, req, res, next)
 * Đây là middleware đặc biệt, Express nhận diện qua 4 tham số
 * Phải đặt SAU TẤT CẢ routes để bắt lỗi từ bất kỳ route nào
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err.stack);
  return res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================
// KHỞI ĐỘNG SERVER
// ============================================================
const startServer = async () => {
  try {
    // Bước 1: Kết nối database
    await connectDatabase();

    // Bước 2: Đồng bộ schema (tạo/cập nhật bảng)
    await syncDatabase();

    // Bước 3: Thiết lập Swagger UI
    setupSwagger(app);

    // Bước 4: Kiểm tra SMTP Mailer
    await verifyMailer();

    // Bước 5: Lắng nghe port
    app.listen(PORT, () => {
      console.log('\n======================================');
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📡 API Base URL:         http://localhost:${PORT}/api`);
      console.log(`📤 Cloudinary:           ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Đã cấu hình' : '⚠️  Chưa cấu hình'}`);
      console.log(`📧 SMTP Mailer:           ${process.env.SMTP_USER ? '✅ ' + process.env.SMTP_USER : '⚠️  Chưa cấu hình'}`);
      console.log(`📄 Swagger Docs:         http://localhost:${PORT}/api-docs`);
      console.log('======================================\n');
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error.message);
    process.exit(1);
  }
};

startServer();
