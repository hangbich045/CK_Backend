'use strict';

/**
 * @file services/auth.service.js
 * @description Service xử lý toàn bộ Business Logic cho Authentication.
 *
 * ========================================
 * TẠI SAO TÁCH SERVICES?
 * ========================================
 * - Controller chỉ nhận/trả request-response, KHÔNG chứa logic nghiệp vụ.
 * - Service chứa toàn bộ logic: kiểm tra điều kiện, truy vấn DB, xử lý dữ liệu.
 * - Giúp tái sử dụng: nhiều controller có thể dùng chung một service.
 * - Dễ viết unit test cho logic nghiệp vụ mà không cần HTTP.
 *
 * ========================================
 * BẢO MẬT MẬT KHẨU VỚI BCRYPT:
 * ========================================
 * - bcryptjs.hash(password, saltRounds): Tạo hash từ plaintext
 *   + saltRounds=10: Số vòng hashing (càng cao càng an toàn nhưng chậm hơn)
 *   + Mỗi lần hash tạo ra salt khác nhau -> cùng password khác hash
 * - bcryptjs.compare(plaintext, hash): So sánh mà KHÔNG cần biết salt
 *   + Trả về true nếu match, false nếu không
 *
 * ========================================
 * JWT TOKEN:
 * ========================================
 * - jwt.sign(payload, secret, options): Tạo token
 *   + payload: Dữ liệu nhúng vào token (KHÔNG nhúng thông tin nhạy cảm)
 *   + expiresIn: Thời gian hết hạn
 * - Token gồm 3 phần: header.payload.signature (base64 encoded)
 * - Client lưu token (localStorage/cookie) và gửi lại trong Authorization header
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Đăng ký tài khoản mới
 * @param {Object} data - { fullName, email, password, employeeCode, phone }
 * @returns {Object} User mới tạo (không có password)
 * @throws {Error} Nếu email đã tồn tại
 */
const register = async (data) => {
  const { fullName, email, password, employeeCode, phone } = data;

  // Bước 1: Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('Email này đã được đăng ký. Vui lòng dùng email khác.');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Bước 2: Kiểm tra mã nhân viên nếu có
  if (employeeCode) {
    const existingCode = await User.findOne({ where: { employeeCode } });
    if (existingCode) {
      const error = new Error('Mã nhân viên đã tồn tại.');
      error.statusCode = 409;
      throw error;
    }
  }

  // Bước 3: Hash mật khẩu bằng bcryptjs (saltRounds = 10)
  // Tuyệt đối KHÔNG lưu mật khẩu dạng plaintext
  const hashedPassword = await bcrypt.hash(password, 10);

  // Bước 4: Xác định role: Admin đầu tiên, còn lại là User
  const userCount = await User.count();
  const role = userCount === 0 ? 'ADMIN' : 'USER';

  // Bước 5: Tạo user mới trong database
  const newUser = await User.create({
    fullName,
    email,
    password: hashedPassword, // Lưu hash, không phải plaintext
    employeeCode: employeeCode || null,
    phone: phone || null,
    role,
    isActive: true,
  });

  // Bước 6: Trả về user info, LOẠI BỎ trường password
  const { password: _, ...userWithoutPassword } = newUser.toJSON();
  return userWithoutPassword;
};

/**
 * Đăng nhập và nhận JWT Token
 * @param {Object} data - { email, password }
 * @returns {{ accessToken: string, user: Object }} Token và thông tin user
 * @throws {Error} Nếu email/password sai
 */
const login = async (data) => {
  const { email, password } = data;

  // Bước 1: Tìm user theo email
  const user = await User.findOne({ where: { email } });

  // Bước 2: Kiểm tra user tồn tại và mật khẩu đúng
  // Dùng cùng một thông báo lỗi để tránh lộ thông tin (Email có tồn tại không)
  const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !isPasswordValid) {
    const error = new Error('Email hoặc mật khẩu không chính xác.');
    error.statusCode = 401;
    throw error;
  }

  // Bước 3: Kiểm tra tài khoản có bị khóa không
  if (!user.isActive) {
    const error = new Error('Tài khoản của bạn đã bị vô hiệu hóa. Liên hệ Admin.');
    error.statusCode = 403;
    throw error;
  }

  // Bước 4: Tạo JWT Token
  // Payload chứa các thông tin cần thiết để middleware xác thực
  const payload = {
    id: user.id,       // Dùng để tìm user trong DB
    email: user.email,
    role: user.role,   // Dùng để phân quyền (RBAC)
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,      // Secret key từ biến môi trường
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Hết hạn sau 7 ngày
  );

  // Bước 5: Trả về token và thông tin user (không có password)
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      employeeCode: user.employeeCode,
      avatarUrl: user.avatarUrl,
    },
  };
};

/**
 * Lấy thông tin profile của user hiện tại
 * @param {string} userId - UUID của user
 * @returns {Object} Thông tin user (không có password)
 */
const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] }, // Loại trừ trường password
  });

  if (!user) {
    const error = new Error('Người dùng không tồn tại.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Cập nhật thông tin profile
 * @param {string} userId
 * @param {Object} data - { fullName, phone, employeeCode }
 */
const updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('Người dùng không tồn tại.');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra mã nhân viên nếu có thay đổi
  if (data.employeeCode && data.employeeCode !== user.employeeCode) {
    const existing = await User.findOne({ where: { employeeCode: data.employeeCode } });
    if (existing) {
      const error = new Error('Mã nhân viên này đã được sử dụng bởi người khác.');
      error.statusCode = 409;
      throw error;
    }
  }

  await user.update(data);

  const { password: _, ...result } = user.toJSON();
  return result;
};

/**
 * [ADMIN ONLY] Lấy danh sách tất cả người dùng (có phân trang)
 * @param {{ page, limit, search, role }} query
 */
const getAllUsers = async (query) => {
  const { Op } = require('sequelize');
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  const where = {};

  // Tìm kiếm theo tên hoặc email
  if (query.search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${query.search}%` } },
      { email: { [Op.like]: `%${query.search}%` } },
      { employeeCode: { [Op.like]: `%${query.search}%` } },
    ];
  }

  // Lọc theo role
  if (query.role) {
    where.role = query.role;
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return {
    items: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers };
