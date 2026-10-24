'use strict';

/**
 * @file routes/cms.routes.js
 * @description CMS routes cho Admin - quản lý nội dung trang chủ.
 */

/**
 * @swagger
 * tags:
 *   name: CMS
 *   description: "[ADMIN] Quản lý nội dung trang chủ (Homepage CMS)"
 */

/**
 * @swagger
 * /api/homepage-content:
 *   get:
 *     summary: "[ADMIN] Lấy nội dung hero/about/contact"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Nội dung trang chủ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 heroTitle: { type: string }
 *                 heroDescription: { type: string }
 *                 heroVideoUrl: { type: string }
 *                 heroPosterUrl: { type: string }
 *                 aboutContent: { type: string }
 *                 contactInfo: { type: string }
 *   put:
 *     summary: "[ADMIN] Cập nhật nội dung hero/about/contact"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               heroTitle: { type: string }
 *               heroDescription: { type: string }
 *               heroVideoUrl: { type: string }
 *               heroPosterUrl: { type: string }
 *               aboutContent: { type: string }
 *               contactInfo: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */

/**
 * @swagger
 * /api/homepage-sections:
 *   get:
 *     summary: "[ADMIN] Lấy cấu hình ẩn/hiện các section"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Trạng thái hiện thị các section
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 showHero: { type: boolean }
 *                 showServices: { type: boolean }
 *                 showGallery: { type: boolean }
 *                 showAbout: { type: boolean }
 *                 showContact: { type: boolean }
 *   put:
 *     summary: "[ADMIN] Cập nhật cấu hình ẩn/hiện sections"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showHero: { type: boolean }
 *               showServices: { type: boolean }
 *               showGallery: { type: boolean }
 *               showAbout: { type: boolean }
 *               showContact: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */

/**
 * @swagger
 * /api/homepage-services:
 *   get:
 *     summary: "[ADMIN] Lấy danh sách dịch vụ"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Mảng dịch vụ sắp xếp theo order
 *   post:
 *     summary: "[ADMIN] Thêm dịch vụ mới"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string, example: "Đặt phòng Studio" }
 *               description: { type: string }
 *               icon: { type: string, example: "video" }
 *               color: { type: string }
 *               isActive: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Tạo dịch vụ thành công
 */

/**
 * @swagger
 * /api/homepage-services/{id}:
 *   put:
 *     summary: "[ADMIN] Cập nhật dịch vụ"
 *     tags: [CMS]
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
 *               title: { type: string }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy service
 *   delete:
 *     summary: "[ADMIN] Xóa dịch vụ"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /api/homepage-services/reorder:
 *   put:
 *     summary: "[ADMIN] Sắp xếp lại thứ tự dịch vụ"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *     responses:
 *       200:
 *         description: Sắp xếp thành công
 */

/**
 * @swagger
 * /api/homepage-gallery:
 *   get:
 *     summary: "[ADMIN] Lấy danh sách ảnh gallery"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Mảng ảnh gallery sắp xếp theo order
 *   post:
 *     summary: "[ADMIN] Thêm ảnh gallery mới"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl: { type: string }
 *               title: { type: string }
 *               isActive: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Thêm ảnh thành công
 */

/**
 * @swagger
 * /api/homepage-gallery/{id}:
 *   put:
 *     summary: "[ADMIN] Cập nhật ảnh gallery"
 *     tags: [CMS]
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
 *               imageUrl: { type: string }
 *               title: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: "[ADMIN] Xóa ảnh gallery"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

/**
 * @swagger
 * /api/homepage-gallery/reorder:
 *   put:
 *     summary: "[ADMIN] Sắp xếp lại thứ tự ảnh gallery"
 *     tags: [CMS]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *     responses:
 *       200:
 *         description: Sắp xếp thành công
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const cmsStore = require('../services/cms.store');

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// ============================================================
// HOMEPAGE CONTENT
// ============================================================
router.get('/homepage-content', (req, res) => res.json(cmsStore.getContent()));

router.put('/homepage-content', (req, res) => {
  const updated = cmsStore.updateContent(req.body);
  res.json(updated);
});

// ============================================================
// HOMEPAGE SECTIONS
// ============================================================
router.get('/homepage-sections', (req, res) => res.json(cmsStore.getSections()));

router.put('/homepage-sections', (req, res) => {
  const updated = cmsStore.updateSections(req.body);
  res.json(updated);
});

// ============================================================
// HOMEPAGE SERVICES
// ============================================================
router.get('/homepage-services', (req, res) => {
  res.json(cmsStore.getServices());
});

router.post('/homepage-services', (req, res) => {
  const newService = cmsStore.addService(req.body);
  res.status(201).json(newService);
});

router.put('/homepage-services/reorder', (req, res) => {
  const reordered = cmsStore.reorderServices(req.body.items);
  res.json(reordered);
});

router.put('/homepage-services/:id', (req, res) => {
  const updated = cmsStore.updateService(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Service không tồn tại.' });
  res.json(updated);
});

router.delete('/homepage-services/:id', (req, res) => {
  const deleted = cmsStore.deleteService(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Service không tồn tại.' });
  res.json({ message: 'Đã xóa service.' });
});

// ============================================================
// HOMEPAGE GALLERY
// ============================================================
router.get('/homepage-gallery', (req, res) => {
  res.json(cmsStore.getGallery());
});

router.post('/homepage-gallery', (req, res) => {
  const newItem = cmsStore.addGalleryItem(req.body);
  res.status(201).json(newItem);
});

router.put('/homepage-gallery/reorder', (req, res) => {
  const reordered = cmsStore.reorderGallery(req.body.items);
  res.json(reordered);
});

router.put('/homepage-gallery/:id', (req, res) => {
  const updated = cmsStore.updateGalleryItem(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Gallery item không tồn tại.' });
  res.json(updated);
});

router.delete('/homepage-gallery/:id', (req, res) => {
  const deleted = cmsStore.deleteGalleryItem(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Gallery item không tồn tại.' });
  res.json({ message: 'Đã xóa gallery item.' });
});

module.exports = router;
