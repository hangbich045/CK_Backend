'use strict';

/**
 * @file controllers/equipment.controller.js
 * @description Controller nhận request, gọi service và trả về response cho API Thiết bị.
 */

const equipmentService = require('../services/equipment.service');

/**
 * GET /api/equipments
 * @swagger
 * /api/equipments:
 *   get:
 *     summary: Lấy danh sách thiết bị (có tìm kiếm, lọc, phân trang)
 *     tags: [Equipment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số item mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (tên hoặc mã thiết bị)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID danh mục
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BORROWED, MAINTENANCE]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách thiết bị với metadata phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
const getAll = async (req, res) => {
  try {
    // req.query chứa các tham số từ URL: ?page=1&limit=10&search=camera&status=AVAILABLE
    const result = await equipmentService.findAll(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/equipments/:id
 * @swagger
 * /api/equipments/{id}:
 *   get:
 *     summary: Lấy chi tiết một thiết bị theo ID
 *     tags: [Equipment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thông tin thiết bị
 *       404:
 *         description: Không tìm thấy thiết bị
 */
const getById = async (req, res) => {
  try {
    const equipment = await equipmentService.findById(req.params.id);
    return res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/equipments  [ADMIN ONLY]
 * @swagger
 * /api/equipments:
 *   post:
 *     summary: "[ADMIN] Thêm thiết bị mới"
 *     tags: [Equipment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, categoryId, quantity]
 *             properties:
 *               code:
 *                 type: string
 *                 example: CAM-001
 *               name:
 *                 type: string
 *                 example: Máy ảnh Canon EOS R5
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 3
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, MAINTENANCE]
 *               location:
 *                 type: string
 *                 example: Kho A - Tầng 2
 *     responses:
 *       201:
 *         description: Thêm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Mã thiết bị đã tồn tại
 */
const create = async (req, res) => {
  try {
    const equipment = await equipmentService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Thêm thiết bị thành công!',
      data: equipment,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/equipments/:id  [ADMIN ONLY]
 * @swagger
 * /api/equipments/{id}:
 *   patch:
 *     summary: "[ADMIN] Cập nhật thông tin thiết bị"
 *     tags: [Equipment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, MAINTENANCE]
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy thiết bị
 */
const update = async (req, res) => {
  try {
    const equipment = await equipmentService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thiết bị thành công!',
      data: equipment,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/equipments/:id  [ADMIN ONLY]
 * @swagger
 * /api/equipments/{id}:
 *   delete:
 *     summary: "[ADMIN] Xóa thiết bị"
 *     tags: [Equipment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Không thể xóa vì đang cho mượn
 *       404:
 *         description: Không tìm thấy
 */
const remove = async (req, res) => {
  try {
    const result = await equipmentService.remove(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
