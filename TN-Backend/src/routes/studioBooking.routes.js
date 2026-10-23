'use strict';

/**
 * @file routes/studioBooking.routes.js
 * @description Routes cho API Đặt phòng Studio.
 */

/**
 * @swagger
 * tags:
 *   name: StudioBooking
 *   description: Quản lý đặt phòng studio
 */

/**
 * @swagger
 * /api/studio-bookings:
 *   get:
 *     summary: Lấy danh sách đặt phòng
 *     tags: [StudioBooking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Danh sách booking (mảng trực tiếp)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   fullName: { type: string }
 *                   studioName: { type: string }
 *                   purpose: { type: string }
 *                   startTime: { type: string, format: date-time }
 *                   endTime: { type: string, format: date-time }
 *                   attendees: { type: integer }
 *                   status: { type: string }
 */

/**
 * @swagger
 * /api/studio-bookings:
 *   post:
 *     summary: Tạo yêu cầu đặt phòng mới
 *     tags: [StudioBooking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purpose, startTime, endTime]
 *             properties:
 *               fullName: { type: string, example: "Nguyễn Văn A" }
 *               purpose: { type: string, example: "Quay video học thuật" }
 *               startTime: { type: string, format: date-time, example: "2026-10-25T07:30:00.000Z" }
 *               endTime: { type: string, format: date-time, example: "2026-10-25T11:30:00.000Z" }
 *               participants: { type: integer, example: 10 }
 *               technicalSupport: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: Đặt phòng thành công!
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Khung giờ đã được đặt bởi người khác
 */

/**
 * @swagger
 * /api/studio-bookings/{id}/approve:
 *   put:
 *     summary: "[ADMIN] Duyệt yêu cầu đặt phòng"
 *     tags: [StudioBooking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã phê duyệt đặt phòng
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Booking không tồn tại
 */

/**
 * @swagger
 * /api/studio-bookings/{id}/reject:
 *   put:
 *     summary: "[ADMIN] Từ chối yêu cầu đặt phòng"
 *     tags: [StudioBooking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectReason: { type: string, example: "Phòng đang bảo trì" }
 *     responses:
 *       200:
 *         description: Đã từ chối đặt phòng
 */

/**
 * @swagger
 * /api/studio-bookings/{id}/cancel:
 *   patch:
 *     summary: Người dùng tự huỷ booking của mình
 *     tags: [StudioBooking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã huỷ đặt phòng
 */

const { Router } = require('express');
const studioBookingController = require('../controllers/studioBooking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateCreateStudioBooking } = require('../middlewares/validate.middleware');

const router = Router();

// Lấy danh sách booking (RBAC ở service)
router.get('/', authenticate, studioBookingController.getAll);

// Tạo booking mới
router.post('/', authenticate, validateCreateStudioBooking, studioBookingController.create);

// [ADMIN] Xác nhận hoặc huỷ booking
router.patch('/:id/process', authenticate, authorize('ADMIN'), studioBookingController.processBooking);

// FE gọi PUT /:id/approve và /:id/reject (NestJS-style)
router.put('/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const booking = await require('../services/studioBooking.service').processBooking(req.params.id, 'confirm');
    return res.status(200).json({ message: 'Đã phê duyệt đặt phòng!', data: booking });
  } catch (e) { return res.status(e.statusCode || 500).json({ message: e.message }); }
});

router.put('/:id/reject', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { rejectReason } = req.body;
    const booking = await require('../services/studioBooking.service').processBooking(req.params.id, 'cancel', rejectReason);
    return res.status(200).json({ message: 'Đã từ chối đặt phòng.', data: booking });
  } catch (e) { return res.status(e.statusCode || 500).json({ message: e.message }); }
});

// User tự huỷ booking của mình
router.patch('/:id/cancel', authenticate, studioBookingController.cancelByUser);

module.exports = router;
