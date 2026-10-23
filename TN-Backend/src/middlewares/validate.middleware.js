'use strict';

/**
 * @file middlewares/validate.middleware.js
 * @description Middleware xử lý và trả về lỗi validation từ express-validator.
 *
 * express-validator dùng pattern: validate -> handleValidation
 * 1. Khai báo các rules validation trong mảng (ví dụ: body('email').isEmail())
 * 2. Dùng `handleValidation` ở cuối mảng để kiểm tra kết quả
 * 3. Nếu có lỗi -> trả 422 với danh sách lỗi cụ thể
 * 4. Nếu không lỗi -> gọi next() để đi vào controller
 */

const { validationResult, body, param, query } = require('express-validator');

/**
 * Middleware kiểm tra kết quả validation
 * Đặt ở cuối mảng middleware của mỗi route
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Định dạng lỗi thân thiện: { field: 'email', message: 'Email không hợp lệ' }
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
      errors: formattedErrors,
    });
  }

  next();
};

// ============================================================
// CÁC BỘ QUY TẮC VALIDATION CHO TỪNG CHỨC NĂNG
// ============================================================

/**
 * Validation rules cho Đăng ký tài khoản
 */
const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 100 }).withMessage('Họ tên phải từ 2 đến 100 ký tự'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mật khẩu phải có chữ hoa, chữ thường và số'),

  body('employeeCode')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Mã nhân viên tối đa 50 ký tự'),

  handleValidation, // LUÔN đặt ở cuối!
];

/**
 * Validation rules cho Đăng nhập
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng'),

  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),

  handleValidation,
];

/**
 * Validation rules cho tạo Thiết bị
 */
const validateCreateEquipment = [
  body('code')
    .trim()
    .notEmpty().withMessage('Mã thiết bị không được để trống')
    .isLength({ max: 50 }).withMessage('Mã thiết bị tối đa 50 ký tự'),

  body('name')
    .trim()
    .notEmpty().withMessage('Tên thiết bị không được để trống')
    .isLength({ min: 2, max: 200 }).withMessage('Tên thiết bị phải từ 2 đến 200 ký tự'),

  body('categoryId')
    .notEmpty().withMessage('Danh mục không được để trống')
    .isInt({ min: 1 }).withMessage('Danh mục không hợp lệ'),

  body('quantity')
    .notEmpty().withMessage('Số lượng không được để trống')
    .isInt({ min: 1 }).withMessage('Số lượng phải là số nguyên dương'),

  body('status')
    .optional()
    .isIn(['AVAILABLE', 'MAINTENANCE']).withMessage('Trạng thái phải là AVAILABLE hoặc MAINTENANCE'),

  handleValidation,
];

/**
 * Validation rules cho tạo Đơn mượn
 */
const validateCreateBorrowRequest = [
  body('equipmentId')
    .notEmpty().withMessage('Thiết bị không được để trống')
    .isUUID().withMessage('ID thiết bị không hợp lệ'),

  body('quantity')
    .notEmpty().withMessage('Số lượng mượn không được để trống')
    .isInt({ min: 1 }).withMessage('Số lượng phải ít nhất là 1'),

  body('purpose')
    .trim()
    .notEmpty().withMessage('Mục đích mượn không được để trống'),

  body('borrowDate')
    .notEmpty().withMessage('Ngày mượn không được để trống')
    .isISO8601().withMessage('Ngày mượn không đúng định dạng (ISO 8601)'),

  body('returnDate')
    .notEmpty().withMessage('Ngày trả không được để trống')
    .isISO8601().withMessage('Ngày trả không đúng định dạng (ISO 8601)'),

  handleValidation,
];

/**
 * Validation rules cho Đặt phòng studio
 * FE gửi: { fullName, participants, purpose, technicalSupport, startTime, endTime }
 * BE model cần: { studioName, purpose, startTime, endTime, attendees }
 * -> Map: participants -> attendees, set default studioName nếu không có
 */
const validateCreateStudioBooking = [
  body('purpose')
    .trim()
    .notEmpty().withMessage('Mục đích không được để trống'),

  body('startTime')
    .notEmpty().withMessage('Thời gian bắt đầu không được để trống')
    .isISO8601().withMessage('Thời gian bắt đầu không đúng định dạng'),

  body('endTime')
    .notEmpty().withMessage('Thời gian kết thúc không được để trống')
    .isISO8601().withMessage('Thời gian kết thúc không đúng định dạng')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      return true;
    }),

  body('participants')
    .optional()
    .isInt({ min: 1, max: 40 }).withMessage('Số người phải từ 1 đến 40'),

  body('attendees')
    .optional()
    .isInt({ min: 1 }).withMessage('Số người phải ít nhất là 1'),

  handleValidation,
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validateCreateEquipment,
  validateCreateBorrowRequest,
  validateCreateStudioBooking,
};
