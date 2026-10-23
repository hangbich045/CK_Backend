'use strict';

/**
 * @file routes/compat.routes.js
 * @description Compatibility routes - ánh xạ các endpoint cũ (NestJS) sang backend mới (Express).
 *
 * Frontend gọi các path cũ, file này tạo aliases để không cần sửa toàn bộ frontend.
 *
 * Map:
 *   GET  /equipment             -> /equipments
 *   POST /equipment             -> /equipments
 *   PUT  /equipment/:id         -> /equipments/:id (PATCH)
 *   DEL  /equipment/:id         -> /equipments/:id
 *   GET  /equipment-categories  -> /categories
 *   POST /equipment-categories  -> /categories
 *   PUT  /borrow-requests/:id/approve  -> process {action: approve}
 *   PUT  /borrow-requests/:id/reject   -> process {action: reject}
 *   PUT  /borrow-requests/:id/return   -> return endpoint
 *   PUT  /studio-bookings/:id/approve  -> process {action: confirm}
 *   PUT  /studio-bookings/:id/reject   -> process {action: cancel}
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const equipmentService = require('../services/equipment.service');
const borrowRequestService = require('../services/borrowRequest.service');
const studioBookingService = require('../services/studioBooking.service');
const { EquipmentCategory, Equipment } = require('../models');

const router = Router();

// ============================================================
// HELPER: Transform equipment object sang format FE expect
// FE expect: { id, code, name, category (string), image, description, quantity, availableQuantity, status }
// BE trả về: { ..., imageUrl, category: { id, name } }
// ============================================================
const transformEquipment = (item) => {
  const raw = item.toJSON ? item.toJSON() : item;
  return {
    ...raw,
    // FE dùng `image` thay vì `imageUrl`
    image: raw.imageUrl || raw.image || '',
    // FE dùng `category` string thay vì object
    category: raw.category?.name || raw.category || '',
  };
};

// ============================================================
// EQUIPMENT ALIASES (/equipment -> /equipments)
// ============================================================

/**
 * GET /api/equipment  (alias /api/equipments)
 * Frontend lọc theo `category` (tên string), backend lọc theo `categoryId` (số)
 * Cần convert: category name -> categoryId
 */
router.get('/equipment', authenticate, async (req, res) => {
  try {
    // Convert category name filter -> categoryId
    let query = { ...req.query };
    if (query.category && !query.categoryId) {
      const cat = await EquipmentCategory.findOne({ where: { name: query.category } });
      if (cat) query.categoryId = cat.id;
      delete query.category;
    }

    const result = await equipmentService.findAll(query);

    // Lấy danh sách tên categories (FE equipment page cần `data.categories`)
    const allCategories = await EquipmentCategory.findAll({ attributes: ['name'], order: [['name', 'ASC']] });
    const categoryNames = allCategories.map(c => c.name);

    // Transform items
    const transformedItems = result.items.map(transformEquipment);

    // FE expect response TRỰC TIẾP (không wrap {success,data})
    return res.status(200).json({
      items: transformedItems,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      categories: categoryNames, // Field thêm cho FE user equipment page
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/equipment/:id', authenticate, async (req, res) => {
  try {
    const equipment = await equipmentService.findById(req.params.id);
    return res.status(200).json(transformEquipment(equipment));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/equipment', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // FE gửi `category` (tên string) và `image` (url string)
    // BE expect `categoryId` (int) và `imageUrl`
    const body = { ...req.body };

    if (body.category && !body.categoryId) {
      const cat = await EquipmentCategory.findOne({ where: { name: body.category } });
      if (!cat) return res.status(400).json({ message: `Danh mục '${body.category}' không tồn tại.` });
      body.categoryId = cat.id;
      delete body.category;
    }

    if (body.image !== undefined) {
      body.imageUrl = body.image;
      delete body.image;
    }

    const equipment = await equipmentService.create(body);
    return res.status(201).json(transformEquipment(equipment));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/equipment/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.category && !body.categoryId) {
      const cat = await EquipmentCategory.findOne({ where: { name: body.category } });
      if (cat) { body.categoryId = cat.id; }
      delete body.category;
    }
    if (body.image !== undefined) {
      body.imageUrl = body.image;
      delete body.image;
    }

    const equipment = await equipmentService.update(req.params.id, body);
    return res.status(200).json(transformEquipment(equipment));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/equipment/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await equipmentService.remove(req.params.id);
    return res.status(200).json({ message: 'Xóa thiết bị thành công.' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// ============================================================
// EQUIPMENT-CATEGORIES ALIASES (/equipment-categories -> /categories)
// ============================================================

router.get('/equipment-categories', authenticate, async (req, res) => {
  try {
    const categories = await EquipmentCategory.findAll({ order: [['name', 'ASC']] });
    // FE expect mảng trực tiếp: [{id, name, description}]
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/equipment-categories', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existing = await EquipmentCategory.findOne({ where: { name: req.body.name } });
    if (existing) return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
    const category = await EquipmentCategory.create(req.body);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/equipment-categories/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const category = await EquipmentCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Danh mục không tồn tại.' });

    const count = await Equipment.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      return res.status(400).json({ message: `Danh mục đang có ${count} thiết bị. Không thể xóa.` });
    }

    await category.destroy();
    return res.status(200).json({ message: 'Xóa danh mục thành công!' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /equipment-categories/:id
router.put('/equipment-categories/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const category = await EquipmentCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Danh mục không tồn tại.' });
    if (req.body.name) {
      const existing = await EquipmentCategory.findOne({ where: { name: req.body.name } });
      if (existing && existing.id !== category.id) {
        return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
      }
    }
    await category.update(req.body);
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ============================================================
// BORROW-REQUESTS - Format cũ (NestJS style)
// FE expect: mảng trực tiếp, user field là `user` (không phải `requester`)
// FE gửi: PUT /borrow-requests/:id/approve | /reject | /return
// FE gửi multi-item: { equipments: [{equipmentId, quantity}], purpose, borrowDate, returnDate }
// ============================================================

router.get('/borrow-requests', authenticate, async (req, res) => {
  try {
    const result = await borrowRequestService.findAll(req.query, req.user);

    // Transform để FE có thể dùng `borrow.user.fullName` và `borrow.equipments[]`
    const transformed = result.items.map(item => {
      const raw = item.toJSON ? item.toJSON() : item;
      return {
        ...raw,
        // Rename requester -> user (FE dùng borrow.user.fullName)
        user: raw.requester || raw.user,
        requester: undefined,
        // FE expect equipments: [{equipmentId, quantity, details: {name, code, image}}]
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

    // FE requests page expect mảng trực tiếp (không wrap)
    return res.status(200).json(transformed);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/borrow-requests', authenticate, async (req, res) => {
  try {
    const body = req.body;

    // FE gửi multi-item: { equipments: [{equipmentId, quantity}], purpose, borrowDate, returnDate }
    // BE mới chỉ nhận 1 item/request → tạo nhiều request song song
    if (body.equipments && Array.isArray(body.equipments) && body.equipments.length > 0) {
      const results = [];
      for (const eq of body.equipments) {
        const singleRequest = await borrowRequestService.create({
          equipmentId: eq.equipmentId,
          quantity: eq.quantity,
          purpose: body.purpose,
          borrowDate: body.borrowDate,
          returnDate: body.returnDate,
          notes: body.notes,
        }, req.user.id);
        results.push(singleRequest);
      }
      return res.status(201).json({ message: 'Tạo đơn mượn thành công!', data: results });
    }

    // Single item fallback
    const request = await borrowRequestService.create(body, req.user.id);
    return res.status(201).json(request);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// PUT /borrow-requests/:id/approve  [ADMIN]
router.put('/borrow-requests/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await borrowRequestService.processRequest(req.params.id, 'approve');
    return res.status(200).json({ message: 'Đã phê duyệt đơn mượn!', data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// PUT /borrow-requests/:id/reject  [ADMIN]
router.put('/borrow-requests/:id/reject', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { rejectReason } = req.body;
    if (!rejectReason) return res.status(400).json({ message: 'Vui lòng điền lý do từ chối.' });
    const result = await borrowRequestService.processRequest(req.params.id, 'reject', rejectReason);
    return res.status(200).json({ message: 'Đã từ chối đơn mượn.', data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// PUT /borrow-requests/:id/return
router.put('/borrow-requests/:id/return', authenticate, async (req, res) => {
  try {
    const result = await borrowRequestService.returnEquipment(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({ message: 'Trả thiết bị thành công!', data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// ============================================================
// STUDIO-BOOKINGS - Format cũ (NestJS style)
// FE expect: mảng trực tiếp với fields: fullName, participants, technicalSupport
// ============================================================

router.get('/studio-bookings', authenticate, async (req, res) => {
  try {
    const result = await studioBookingService.findAll(req.query, req.user);

    const transformed = result.items.map(item => {
      const raw = item.toJSON ? item.toJSON() : item;
      return {
        ...raw,
        // Rename booker -> user
        user: raw.booker || raw.user,
        booker: undefined,
        // FE hiển thị booking.fullName (của user trong booking)
        fullName: raw.booker?.fullName || '',
        // Map attendees -> participants (FE dùng tên cũ)
        participants: raw.attendees || 0,
        // FE có thêm trường technicalSupport (không có trong model mới, mặc định false)
        technicalSupport: raw.technicalSupport || false,
        // Map status: FE expect APPROVED (không phải CONFIRMED)
        status: raw.status === 'CONFIRMED' ? 'APPROVED' : raw.status,
      };
    });

    return res.status(200).json(transformed);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/studio-bookings', authenticate, async (req, res) => {
  try {
    const body = { ...req.body };
    // FE gửi `participants` -> map sang `attendees`
    if (body.participants !== undefined) {
      body.attendees = body.participants;
      delete body.participants;
    }
    const booking = await studioBookingService.create(body, req.user.id);
    return res.status(201).json(booking);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// PUT /studio-bookings/:id/approve  [ADMIN]
router.put('/studio-bookings/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await studioBookingService.processBooking(req.params.id, 'confirm');
    return res.status(200).json({ message: 'Đã phê duyệt đặt phòng!', data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// PUT /studio-bookings/:id/reject  [ADMIN]
router.put('/studio-bookings/:id/reject', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { rejectReason } = req.body;
    const result = await studioBookingService.processBooking(req.params.id, 'cancel', rejectReason);
    return res.status(200).json({ message: 'Đã từ chối đặt phòng.', data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
