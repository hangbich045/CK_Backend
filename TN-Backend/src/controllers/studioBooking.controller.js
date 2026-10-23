'use strict';

/**
 * @file controllers/studioBooking.controller.js
 * @description Controller cho API Đặt phòng Studio.
 */

const studioBookingService = require('../services/studioBooking.service');

/**
 * GET /api/studio-bookings
 * @swagger
 * /api/studio-bookings:
 *   get:
 *     summary: Lấy danh sách đặt phòng studio
 *     tags: [StudioBooking]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: studioName
 *         schema:
 *           type: string
 *         description: Lọc theo tên phòng
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Danh sách booking với phân trang
 */
const getAll = async (req, res) => {
  try {
    const result = await studioBookingService.findAll(req.query, req.user);

    // Transform sang shape FE expect:
    // - booker -> user
    // - CONFIRMED -> APPROVED (FE dùng status text đó)
    // - attendees -> participants
    // - thêm fullName (FE dùng booking.fullName)
    const items = result.items.map(item => {
      const raw = item.toJSON ? item.toJSON() : item;
      return {
        ...raw,
        user: raw.booker || raw.user,
        booker: undefined,
        fullName: raw.booker?.fullName || raw.user?.fullName || '',
        participants: raw.attendees || 0,
        technicalSupport: raw.technicalSupport || false,
        status: raw.status === 'CONFIRMED' ? 'APPROVED' : raw.status,
      };
    });

    // FE gọi setBookings(data) và dùng bookings.map() nên phải là mảng
    return res.status(200).json(items);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/studio-bookings
 * @swagger
 * /api/studio-bookings:
 *   post:
 *     summary: Đặt phòng studio
 *     tags: [StudioBooking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studioName, purpose, startTime, endTime]
 *             properties:
 *               studioName:
 *                 type: string
 *                 example: Studio A
 *               purpose:
 *                 type: string
 *                 example: Chụp ảnh sản phẩm
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               attendees:
 *                 type: integer
 *                 example: 5
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đặt phòng thành công
 *       409:
 *         description: Phòng đã được đặt trong khung giờ này
 */
const create = async (req, res) => {
  try {
    const booking = await studioBookingService.create(req.body, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Đặt phòng thành công! Vui lòng chờ Admin xác nhận.',
      data: booking,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/studio-bookings/:id/process  [ADMIN ONLY]
 * @swagger
 * /api/studio-bookings/{id}/process:
 *   patch:
 *     summary: "[ADMIN] Xác nhận hoặc huỷ booking"
 *     tags: [StudioBooking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [confirm, cancel]
 *               cancelReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xử lý thành công
 */
const processBooking = async (req, res) => {
  try {
    const { action, cancelReason } = req.body;
    const result = await studioBookingService.processBooking(req.params.id, action, cancelReason);
    const messages = {
      confirm: 'Đã xác nhận đặt phòng!',
      cancel: 'Đã huỷ đặt phòng.',
    };
    return res.status(200).json({
      success: true,
      message: messages[action] || 'Xử lý thành công.',
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/studio-bookings/:id/cancel
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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Huỷ thành công
 *       403:
 *         description: Không có quyền huỷ booking này
 */
const cancelByUser = async (req, res) => {
  try {
    const result = await studioBookingService.cancelByUser(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Huỷ đặt phòng thành công!',
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, processBooking, cancelByUser };
