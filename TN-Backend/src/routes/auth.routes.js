'use strict';

/**
 * @file routes/auth.routes.js
 * @description Authentication routes:
 *   POST /register       → Đăng ký, gửi OTP verify email
 *   POST /login          → Đăng nhập (kiểm tra isVerified)
 *   POST /verify         → Xác thực OTP (sau register hoặc resend)
 *   POST /resend-otp     → Gửi lại OTP verify
 *   POST /forgot-password→ Gửi OTP reset password
 *   POST /reset-password → Đặt lại password bằng OTP
 *   GET  /profile        → Lấy profile
 *   PATCH /profile       → Cập nhật profile (fullName, employeeCode, phone)
 *   PUT  /profile        → Alias cho PATCH /profile
 */

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin } = require('../middlewares/validate.middleware');
const authController = require('../controllers/auth.controller');
const { User } = require('../models');
const { sendOTPEmail } = require('../config/mailer');
const jwt = require('jsonwebtoken');

const router = Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Đăng ký, đăng nhập và quản lý tài khoản
 */

/**
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
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@lhu.edu.vn
 *               password:
 *                 type: string
 *                 example: "123456"
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               employeeCode:
 *                 type: string
 *                 example: EMP001
 *     responses:
 *       201:
 *         description: Đăng ký thành công, OTP đã gửi tới email
 *       409:
 *         description: Email đã được sử dụng
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, fullName, employeeCode } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = await User.create({
      email, password: hashed,
      fullName: fullName || email.split('@')[0],
      employeeCode: employeeCode || null,
      isVerified: false, otpCode: otp, otpExpiry,
    });
    await sendOTPEmail(email, otp, 'verify').catch(err => {
      console.warn('Gửi email OTP thất bại:', err.message);
    });
    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.',
      data: { email: user.email, requireVerification: true },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
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
 *                 example: admin@lhu.edu.vn
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về accessToken
 *       401:
 *         description: Sai email hoặc mật khẩu
 *       403:
 *         description: Tài khoản chưa xác thực hoặc bị khóa
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
    }
    if (!user.isVerified) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.update({ otpCode: otp, otpExpiry });
      await sendOTPEmail(email, otp, 'verify').catch(err => {
        console.warn('Gửi email OTP thất bại:', err.message);
      });
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Mã OTP mới đã được gửi tới email của bạn.',
        requireVerification: true, email,
      });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa.' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    const { password: _, otpCode: __, otpExpiry: ___, ...userJson } = user.toJSON();
    return res.status(200).json({
      success: true, message: 'Đăng nhập thành công!',
      data: { accessToken: token, user: userJson },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Xác thực OTP sau khi đăng ký
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@lhu.edu.vn
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Xác thực thành công, trả về accessToken
 *       400:
 *         description: OTP không đúng hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email và OTP là bắt buộc.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' });
    }
    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }
    await user.update({ isVerified: true, isActive: true, otpCode: null, otpExpiry: null });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    const { password: _, otpCode: __, otpExpiry: ___, ...userJson } = user.toJSON();
    userJson.isVerified = true;
    return res.status(200).json({
      success: true, message: 'Xác thực tài khoản thành công!',
      accessToken: token, user: userJson,
      data: { accessToken: token, user: userJson },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Gửi lại mã OTP xác thực email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@lhu.edu.vn
 *     responses:
 *       200:
 *         description: Đã gửi lại OTP
 *       400:
 *         description: Tài khoản đã được xác thực
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email là bắt buộc.' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    if (user.isVerified) {
      return res.status(400).json({ message: 'Tài khoản đã được xác thực.' });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.update({ otpCode: otp, otpExpiry });
    await sendOTPEmail(email, otp, 'verify');
    return res.status(200).json({ message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Quên mật khẩu — gửi OTP reset về email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@lhu.edu.vn
 *     responses:
 *       200:
 *         description: OTP đã được gửi (luôn trả 200 để tránh user enumeration)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email là bắt buộc.' });
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: 'Nếu email tồn tại, mã OTP đã được gửi.' });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.update({ otpCode: otp, otpExpiry });
    await sendOTPEmail(email, otp, 'reset');
    return res.status(200).json({
      success: true,
      message: 'Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@lhu.edu.vn
 *               otp:
 *                 type: string
 *                 example: "654321"
 *               password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không đúng hoặc hết hạn
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP và mật khẩu mới là bắt buộc.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' });
    }
    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await user.update({ password: hashed, otpCode: null, otpExpiry: null, isVerified: true });
    return res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
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
 *         description: Chưa đăng nhập
 *   patch:
 *     summary: Cập nhật thông tin profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               employeeCode: { type: string }
 *               phone: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, authController.updateProfile);
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: "[ADMIN] Lấy danh sách tất cả người dùng"
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách users
 *       403:
 *         description: Không có quyền Admin
 */
router.get('/users', authenticate, authorize('ADMIN'), authController.getAllUsers);

module.exports = router;
