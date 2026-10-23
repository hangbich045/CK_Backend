'use strict';

/**
 * @file controllers/auth.controller.js
 * @description Controller xử lý HTTP request/response cho Authentication.
 *
 * ========================================
 * VAI TRÒ CỦA CONTROLLER:
 * ========================================
 * - Nhận request từ client (req.body, req.params, req.query, req.user)
 * - Gọi service tương ứng để xử lý logic
 * - Format và trả về response cho client
 * - KHÔNG chứa business logic (logic đó ở service)
 * - KHÔNG trực tiếp truy vấn database (database ở model/service)
 *
 * ========================================
 * PATTERN XỬ LÝ LỖI (try/catch):
 * ========================================
 * - try: Gọi service, nếu thành công trả về response
 * - catch: Bắt lỗi từ service (có statusCode) hoặc lỗi hệ thống
 * - error.statusCode: Mã lỗi tự định nghĩa trong service (400, 404, 409...)
 * - Fallback: 500 Internal Server Error
 *
 * ========================================
 * CHUẨN RESPONSE FORMAT:
 * ========================================
 * Thành công: { success: true,  message: '...', data: {...} }
 * Thất bại:   { success: false, message: '...' }
 */

const authService = require('../services/auth.service');

/**
 * POST /api/auth/register
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Password123
 *               employeeCode:
 *                 type: string
 *                 example: EMP001
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       409:
 *         description: Email hoặc mã nhân viên đã tồn tại
 *       422:
 *         description: Dữ liệu không hợp lệ
 */
const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập và nhận JWT Token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Email hoặc mật khẩu không chính xác
 */
const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/auth/profile
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Lấy thông tin profile của người dùng hiện tại
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile
 *       401:
 *         description: Chưa xác thực
 */
const getProfile = async (req, res) => {
  try {
    // req.user được gắn bởi authenticate middleware
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/auth/profile
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Cập nhật thông tin profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               employeeCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateProfile = async (req, res) => {
  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/auth/users  [ADMIN ONLY]
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: "[ADMIN] Lấy danh sách tất cả người dùng"
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên, email, mã nhân viên
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER]
 *     responses:
 *       200:
 *         description: Danh sách người dùng có phân trang
 *       403:
 *         description: Không có quyền Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await authService.getAllUsers(req.query);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers };
