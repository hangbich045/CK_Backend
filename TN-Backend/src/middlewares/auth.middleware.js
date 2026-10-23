'use strict';

/**
 * @file middlewares/auth.middleware.js
 * @description Middleware xác thực JWT và phân quyền RBAC (Role-Based Access Control).
 *
 * ========================================
 * LUỒNG XÁC THỰC (Authentication Flow):
 * ========================================
 *
 * 1. Client gửi request kèm Header: Authorization: Bearer <token>
 * 2. Middleware `authenticate` trích xuất token từ header
 * 3. Dùng jwt.verify() để giải mã và xác minh chữ ký
 * 4. Nếu hợp lệ: đính thêm user info vào req.user, gọi next()
 * 5. Nếu không hợp lệ: trả về 401 Unauthorized
 *
 * ========================================
 * LUỒNG PHÂN QUYỀN (Authorization Flow):
 * ========================================
 *
 * 1. Sau khi authenticate, req.user chứa { id, email, role }
 * 2. Middleware `authorize(...roles)` kiểm tra req.user.role
 * 3. Nếu role khớp: gọi next()
 * 4. Nếu không đủ quyền: trả về 403 Forbidden
 *
 * ========================================
 * CÁCH SỬ DỤNG TRONG ROUTES:
 * ========================================
 *
 *   const { authenticate, authorize } = require('../middlewares/auth.middleware');
 *
 *   // Route chỉ cần đăng nhập:
 *   router.get('/profile', authenticate, controller.getProfile);
 *
 *   // Route chỉ ADMIN mới được:
 *   router.delete('/:id', authenticate, authorize('ADMIN'), controller.delete);
 *
 *   // Route cho cả ADMIN và USER:
 *   router.get('/', authenticate, authorize('ADMIN', 'USER'), controller.getAll);
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * MIDDLEWARE 1: Xác thực JWT Token
 * Kiểm tra token có hợp lệ không, nếu có thì gắn thông tin user vào request.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticate = async (req, res, next) => {
  try {
    // Bước 1: Lấy Authorization header
    const authHeader = req.headers['authorization'];

    // Bước 2: Kiểm tra header có tồn tại và đúng format "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực. Vui lòng đăng nhập.',
      });
    }

    // Bước 3: Tách token ra khỏi prefix "Bearer "
    const token = authHeader.split(' ')[1];

    // Bước 4: Giải mã và xác minh token bằng secret key
    // jwt.verify() sẽ throw error nếu token hết hạn hoặc chữ ký sai
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Bước 5: Tìm user trong DB để xác nhận vẫn còn tồn tại và đang active
    // (Token vẫn valid nhưng user có thể bị xóa hoặc bị khóa sau đó)
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'fullName', 'role', 'isActive'], // Chỉ lấy các field cần thiết
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc đã bị xóa.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Liên hệ Admin.',
      });
    }

    // Bước 6: Gắn thông tin user vào request để các middleware/controller sau dùng
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    // Bước 7: Chuyển sang middleware/controller tiếp theo
    next();
  } catch (error) {
    // Phân biệt lỗi token hết hạn vs. lỗi chữ ký sai
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ.',
      });
    }

    // Lỗi không xác định
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xác thực.',
    });
  }
};

/**
 * MIDDLEWARE 2: Phân quyền (Authorization / RBAC)
 * Là Higher-Order Function: nhận danh sách roles, trả về middleware function.
 *
 * Cách hoạt động của Higher-Order Function:
 *   authorize('ADMIN')           -> Trả về middleware chỉ cho ADMIN qua
 *   authorize('ADMIN', 'USER')   -> Trả về middleware cho cả ADMIN lẫn USER qua
 *
 * Phải gọi authenticate TRƯỚC để req.user có giá trị.
 *
 * @param {...string} roles - Danh sách roles được phép truy cập
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra middleware authenticate đã chạy chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập trước.',
      });
    }

    // Kiểm tra role của user có nằm trong danh sách được phép không
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập. Chức năng này yêu cầu quyền: ${roles.join(', ')}.`,
      });
    }

    // Đủ quyền -> tiếp tục
    next();
  };
};

module.exports = { authenticate, authorize };
