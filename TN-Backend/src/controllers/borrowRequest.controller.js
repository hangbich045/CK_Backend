'use strict';

/**
 * @file controllers/borrowRequest.controller.js
 * @description Controller cho API Đơn mượn thiết bị.
 */

const borrowRequestService = require('../services/borrowRequest.service');

/**
 * GET /api/borrow-requests
 * @swagger
 * /api/borrow-requests:
 *   get:
 *     summary: Lấy danh sách đơn mượn (User xem của mình, Admin xem tất cả)
 *     tags: [BorrowRequest]
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
 *           enum: [PENDING, APPROVED, REJECTED, RETURNED]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: "[ADMIN] Lọc theo ID người dùng"
 *     responses:
 *       200:
 *         description: Danh sách đơn mượn
 */
const getAll = async (req, res) => {
  try {
    const result = await borrowRequestService.findAll(req.query, req.user);

    // Transform sang shape FE expect:
    // - requester -> user (FE dùng borrow.user.fullName)
    // - equipment -> equipments[] array
    const items = result.items.map(item => {
      const raw = item.toJSON ? item.toJSON() : item;
      return {
        ...raw,
        user: raw.requester || raw.user,
        requester: undefined,
        // FE hiển thị equipments: [{equipmentId, quantity, details}]
        equipments: raw.equipment ? [{
          equipmentId: raw.equipment.id,
          quantity: raw.quantity,
          details: {
            name: raw.equipment.name,
            code: raw.equipment.code,
            category: raw.equipment.category?.name || '',
            image: raw.equipment.imageUrl || '',
          }
        }] : [],
      };
    });

    // FE gọi setBorrows(data) và dùng borrows.map()
    return res.status(200).json(items);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/borrow-requests
 * @swagger
 * /api/borrow-requests:
 *   post:
 *     summary: Tạo đơn mượn thiết bị mới
 *     tags: [BorrowRequest]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [equipmentId, quantity, purpose, borrowDate, returnDate]
 *             properties:
 *               equipmentId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               purpose:
 *                 type: string
 *                 example: Quay phim sự kiện
 *               borrowDate:
 *                 type: string
 *                 format: date-time
 *               returnDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đơn mượn thành công
 *       400:
 *         description: Thiết bị không đủ số lượng hoặc đang bảo trì
 */
const create = async (req, res) => {
  try {
    // req.user.id được lấy từ JWT token (authenticate middleware)
    const request = await borrowRequestService.create(req.body, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Tạo đơn mượn thành công! Vui lòng chờ Admin duyệt.',
      data: request,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/borrow-requests/:id/process  [ADMIN ONLY]
 * @swagger
 * /api/borrow-requests/{id}/process:
 *   patch:
 *     summary: "[ADMIN] Duyệt hoặc từ chối đơn mượn"
 *     tags: [BorrowRequest]
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
 *                 enum: [approve, reject]
 *                 description: approve = Duyệt, reject = Từ chối
 *               rejectionReason:
 *                 type: string
 *                 description: Lý do từ chối (bắt buộc khi action = reject)
 *     responses:
 *       200:
 *         description: Xử lý thành công
 *       400:
 *         description: Đơn đã được xử lý hoặc không đủ thiết bị
 */
const processRequest = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const result = await borrowRequestService.processRequest(req.params.id, action, rejectionReason);
    const messages = {
      approve: 'Đã duyệt đơn mượn thành công!',
      reject: 'Đã từ chối đơn mượn.',
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
 * PATCH /api/borrow-requests/:id/return
 * @swagger
 * /api/borrow-requests/{id}/return:
 *   patch:
 *     summary: Xác nhận trả thiết bị
 *     tags: [BorrowRequest]
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
 *         description: Trả thiết bị thành công
 *       400:
 *         description: Đơn chưa được duyệt
 *       403:
 *         description: Không có quyền trả đơn này
 */
const returnEquipment = async (req, res) => {
  try {
    const result = await borrowRequestService.returnEquipment(
      req.params.id,
      req.user.id,
      req.user.role
    );
    return res.status(200).json({
      success: true,
      message: 'Trả thiết bị thành công!',
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create, processRequest, returnEquipment };
