'use strict';

/**
 * @file routes/category.routes.js
 * @description Routes cho API Danh mục thiết bị.
 *
 * @swagger
 * tags:
 *   name: Category
 *   description: Quản lý danh mục thiết bị
 */

const { Router } = require('express');
const { EquipmentCategory, Equipment } = require('../models');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { handleValidation } = require('../middlewares/validate.middleware');

const router = Router();

/**
 * GET /api/categories
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách danh mục thiết bị
 *     tags: [Category]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await EquipmentCategory.findAll({
      order: [['name', 'ASC']],
    });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/categories  [ADMIN]
 * @swagger
 * /api/categories:
 *   post:
 *     summary: "[ADMIN] Tạo danh mục mới"
 *     tags: [Category]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Máy ảnh
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       409:
 *         description: Tên danh mục đã tồn tại
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Tên danh mục không được để trống'),
    handleValidation,
  ],
  async (req, res) => {
    try {
      const existing = await EquipmentCategory.findOne({ where: { name: req.body.name } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Tên danh mục đã tồn tại.' });
      }
      const category = await EquipmentCategory.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo danh mục thành công!', data: category });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * DELETE /api/categories/:id  [ADMIN]
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: "[ADMIN] Xóa danh mục"
 *     tags: [Category]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Danh mục đang có thiết bị, không thể xóa
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const category = await EquipmentCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
    }

    const count = await Equipment.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Danh mục đang có ${count} thiết bị. Xóa hoặc chuyển thiết bị sang danh mục khác trước.`,
      });
    }

    await category.destroy();
    return res.status(200).json({ success: true, message: 'Xóa danh mục thành công!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
