'use strict';

/**
 * @file routes/upload.routes.js
 * @description Upload ảnh lên Cloudinary.
 */

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Upload ảnh/video lên Cloudinary
 */

/**
 * @swagger
 * /api/equipment/upload:
 *   post:
 *     summary: "[ADMIN] Upload ảnh thiết bị lên Cloudinary"
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (jpg, png, webp, gif - tối đa 5MB)
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string, description: "Cloudinary URL của ảnh" }
 *                 publicId: { type: string }
 *                 message: { type: string }
 *       400:
 *         description: File quá lọn hoặc không tìm thấy file
 */

/**
 * @swagger
 * /api/auth/avatar:
 *   post:
 *     summary: Upload avatar cá nhân
 *     description: Upload ảnh lên Cloudinary và tự động cập nhật avatarUrl trong DB
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh avatar (jpg, png, webp - tối đa 2MB)
 *     responses:
 *       200:
 *         description: Upload avatar thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string }
 *                 message: { type: string }
 */

/**
 * @swagger
 * /api/gallery/upload:
 *   post:
 *     summary: "[ADMIN] Upload ảnh gallery CMS"
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh tối đa 10MB
 *     responses:
 *       200:
 *         description: Upload thành công, trả về URL Cloudinary
 */

/**
 * @swagger
 * /api/cms/upload/video:
 *   post:
 *     summary: "[ADMIN] Upload video CMS"
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary, description: "Video tối đa 100MB" }
 *     responses:
 *       200:
 *         description: Upload video thành công
 */

/**
 * @swagger
 * /api/cms/upload/poster:
 *   post:
 *     summary: "[ADMIN] Upload ảnh thumbnail/poster CMS"
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Upload poster thành công
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadEquipment, uploadAvatar, uploadGallery, uploadVideo } = require('../config/cloudinary');
const { User } = require('../models');

const router = Router();

// ============================================================
// Helper xử lý lỗi multer
// ============================================================
function handleMulterError(err, res) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File quá lớn. Vui lòng chọn file nhỏ hơn.' });
  }
  return res.status(500).json({ message: err.message || 'Lỗi upload file.' });
}

// ============================================================
// POST /api/equipment/upload — Upload ảnh thiết bị
// ============================================================
router.post('/equipment/upload', authenticate, authorize('ADMIN'), (req, res) => {
  uploadEquipment.single('file')(req, res, async (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return res.status(400).json({ message: 'Không tìm thấy file.' });

    return res.status(200).json({
      url: req.file.path,       // Cloudinary URL
      publicId: req.file.filename, // Cloudinary public_id
      message: 'Upload ảnh thiết bị thành công!',
    });
  });
});

// ============================================================
// POST /api/auth/avatar — Upload + cập nhật avatar user
// ============================================================
router.post('/auth/avatar', authenticate, (req, res) => {
  uploadAvatar.single('file')(req, res, async (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return res.status(400).json({ message: 'Không tìm thấy file.' });

    const url = req.file.path;

    // Cập nhật avatarUrl trong DB
    try {
      await User.update({ avatarUrl: url }, { where: { id: req.user.id } });
    } catch (dbErr) {
      console.warn('Không thể cập nhật avatarUrl:', dbErr.message);
    }

    return res.status(200).json({
      url,
      publicId: req.file.filename,
      message: 'Upload avatar thành công!',
    });
  });
});

// ============================================================
// POST /api/gallery/upload — Upload ảnh gallery CMS
// ============================================================
router.post('/gallery/upload', authenticate, authorize('ADMIN'), (req, res) => {
  uploadGallery.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return res.status(400).json({ message: 'Không tìm thấy file.' });

    return res.status(200).json({
      url: req.file.path,
      publicId: req.file.filename,
      message: 'Upload ảnh gallery thành công!',
    });
  });
});

// ============================================================
// POST /api/cms/upload/video — Upload video CMS
// POST /api/cms/upload/poster — Upload poster/thumbnail CMS
// ============================================================
router.post('/cms/upload/video', authenticate, authorize('ADMIN'), (req, res) => {
  uploadVideo.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return res.status(400).json({ message: 'Không tìm thấy file.' });
    return res.status(200).json({ url: req.file.path, message: 'Upload video thành công!' });
  });
});

router.post('/cms/upload/poster', authenticate, authorize('ADMIN'), (req, res) => {
  uploadGallery.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return res.status(400).json({ message: 'Không tìm thấy file.' });
    return res.status(200).json({ url: req.file.path, message: 'Upload poster thành công!' });
  });
});

module.exports = router;
