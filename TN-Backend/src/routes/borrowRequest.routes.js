'use strict';

/**
 * @file routes/borrowRequest.routes.js
 * @description Routes cho API Đơn mượn thiết bị.
 */

/**
 * @swagger
 * tags:
 *   name: BorrowRequest
 *   description: Quản lý đơn mượn thiết bị
 */

/**
 * @swagger
 * /api/borrow-requests:
 *   get:
 *     summary: Lấy danh sách đơn mượn
 *     description: User chỉ thấy đơn của mình. Admin thấy tất cả.
 *     tags: [BorrowRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, RETURNED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Danh sách đơn mượn (mảng trực tiếp)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   fullName: { type: string }
 *                   equipmentName: { type: string }
 *                   quantity: { type: integer }
 *                   purpose: { type: string }
 *                   borrowDate: { type: string, format: date-time }
 *                   returnDate: { type: string, format: date-time }
 *                   status: { type: string }
 */

/**
 * @swagger
 * /api/borrow-requests:
 *   post:
 *     summary: Tạo đơn mượn thiết bị
 *     description: Hỗ trợ tạo 1 hoặc nhiều đơn cùng lúc (gửi mảng `equipments`)
 *     tags: [BorrowRequest]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purpose, borrowDate, returnDate]
 *             properties:
 *               equipments:
 *                 type: array
 *                 description: Mảng nhiều thiết bị (nếu muốn tạo nhiều đơn)
 *                 items:
 *                   type: object
 *                   properties:
 *                     equipmentId: { type: string }
 *                     quantity: { type: integer, default: 1 }
 *               equipmentId:
 *                 type: string
 *                 description: ID thiết bị (nếu tạo 1 đơn)
 *               quantity: { type: integer, default: 1 }
 *               purpose: { type: string, example: "Quảy video học thuật" }
 *               borrowDate: { type: string, format: date-time }
 *               returnDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Tạo đơn mượn thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /api/borrow-requests/{id}/approve:
 *   put:
 *     summary: "[ADMIN] Duyệt đơn mượn"
 *     tags: [BorrowRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã duyệt đơn mượn, cập nhật trạng thái thiết bị thành BORROWED
 *       404:
 *         description: Đơn không tồn tại
 */

/**
 * @swagger
 * /api/borrow-requests/{id}/reject:
 *   put:
 *     summary: "[ADMIN] Từ chối đơn mượn"
 *     tags: [BorrowRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectReason]
 *             properties:
 *               rejectReason: { type: string, example: "Thiết bị đang bảo trì" }
 *     responses:
 *       200:
 *         description: Đã từ chối đơn mượn
 */

/**
 * @swagger
 * /api/borrow-requests/{id}/return:
 *   put:
 *     summary: Xác nhận trả thiết bị
 *     description: User trả thiết bị, Admin duyệt trả. Trạng thái thiết bị về AVAILABLE.
 *     tags: [BorrowRequest]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trả thiết bị thành công
 */

const { Router } = require('express');
const borrowRequestController = require('../controllers/borrowRequest.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateCreateBorrowRequest } = require('../middlewares/validate.middleware');

const router = Router();

// Lấy danh sách (User thấy của mình, Admin thấy tất cả - logic ở service)
router.get('/', authenticate, borrowRequestController.getAll);

// Tạo đơn mượn mới (User và Admin đều có thể tạo)
router.post('/', authenticate, async (req, res) => {
  try {
    const body = req.body;
    const svc = require('../services/borrowRequest.service');
    // FE gửi multi-item: { equipments: [{equipmentId, quantity}], purpose, borrowDate, returnDate }
    if (body.equipments && Array.isArray(body.equipments) && body.equipments.length > 0) {
      const results = [];
      for (const eq of body.equipments) {
        const r = await svc.create({
          equipmentId: eq.equipmentId,
          quantity: eq.quantity || 1,
          purpose: body.purpose,
          borrowDate: body.borrowDate,
          returnDate: body.returnDate,
          notes: body.notes,
        }, req.user.id);
        results.push(r);
      }
      return res.status(201).json({ message: 'Tạo đơn mượn thành công!', data: results });
    }
    // Single item
    const request = await svc.create(body, req.user.id);
    return res.status(201).json({ message: 'Tạo đơn mượn thành công!', data: request });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// [ADMIN] Duyệt hoặc từ chối đơn
router.patch('/:id/process', authenticate, authorize('ADMIN'), borrowRequestController.processRequest);

// FE gọi PUT /:id/approve và /:id/reject (NestJS-style)
router.put('/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await require('../services/borrowRequest.service').processRequest(req.params.id, 'approve');
    return res.status(200).json({ message: 'Đã duyệt đơn mượn!', data: result });
  } catch (e) { return res.status(e.statusCode || 500).json({ message: e.message }); }
});

router.put('/:id/reject', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { rejectReason } = req.body;
    if (!rejectReason) return res.status(400).json({ message: 'Vui lòng điền lý do từ chối.' });
    const result = await require('../services/borrowRequest.service').processRequest(req.params.id, 'reject', rejectReason);
    return res.status(200).json({ message: 'Đã từ chối đơn mượn.', data: result });
  } catch (e) { return res.status(e.statusCode || 500).json({ message: e.message }); }
});

// Xác nhận trả thiết bị
router.patch('/:id/return', authenticate, borrowRequestController.returnEquipment);

// FE gọi PUT /:id/return
router.put('/:id/return', authenticate, async (req, res) => {
  try {
    const result = await require('../services/borrowRequest.service').returnEquipment(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({ message: 'Trả thiết bị thành công!', data: result });
  } catch (e) { return res.status(e.statusCode || 500).json({ message: e.message }); }
});

module.exports = router;
