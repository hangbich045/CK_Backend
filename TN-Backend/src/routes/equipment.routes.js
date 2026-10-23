'use strict';

/**
 * @file routes/equipment.routes.js
 * @description Routes cho API Thiết bị.
 *
 * Bảng tổng hợp các endpoints:
 * ┌────────────┬──────────────────────────────┬──────────────────────────────────────────┐
 * │  Method    │  Path                        │  Mô tả                                   │
 * ├────────────┼──────────────────────────────┼──────────────────────────────────────────┤
 * │  GET       │  /api/equipments             │  Lấy danh sách (search/filter/pagination) │
 * │  GET       │  /api/equipments/:id         │  Lấy chi tiết một thiết bị               │
 * │  POST      │  /api/equipments             │  [ADMIN] Thêm thiết bị mới               │
 * │  PATCH     │  /api/equipments/:id         │  [ADMIN] Cập nhật thiết bị               │
 * │  DELETE    │  /api/equipments/:id         │  [ADMIN] Xóa thiết bị                    │
 * └────────────┴──────────────────────────────┴──────────────────────────────────────────┘
 */

const { Router } = require('express');
const equipmentController = require('../controllers/equipment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateCreateEquipment } = require('../middlewares/validate.middleware');

const router = Router();

// Tất cả routes đều cần đăng nhập
// authenticate được áp dụng cho toàn bộ router này

// GET - Xem danh sách: Cả User và Admin đều xem được
router.get('/', authenticate, equipmentController.getAll);

// GET - Xem chi tiết: Cả User và Admin
router.get('/:id', authenticate, equipmentController.getById);

// POST - Thêm mới: Chỉ Admin
router.post('/', authenticate, authorize('ADMIN'), validateCreateEquipment, equipmentController.create);

// PATCH - Cập nhật: Chỉ Admin
router.patch('/:id', authenticate, authorize('ADMIN'), equipmentController.update);

// DELETE - Xóa: Chỉ Admin
router.delete('/:id', authenticate, authorize('ADMIN'), equipmentController.remove);

module.exports = router;
