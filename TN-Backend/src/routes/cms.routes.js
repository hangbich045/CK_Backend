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
const { randomUUID } = require('crypto');

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// ============================================================
// IN-MEMORY STORE (dev only — thay bằng Sequelize Model nếu cần)
// ============================================================
let cmsContent = {
  heroTitle: 'LHU MEDIA STUDIO',
  heroDescription: 'Hệ thống quản lý đặt lịch và mượn thiết bị studio chuyên nghiệp.',
  heroVideoUrl: '',
  heroPosterUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&auto=format&fit=crop&q=80',
  aboutContent: 'LHU Media Studio cung cấp đầy đủ phòng ốc cách âm và trang thiết bị chuyên dụng phục vụ mọi sản phẩm truyền thông.',
  contactInfo: JSON.stringify({
    address: 'Trường Đại học Lạc Hồng, 10 Huỳnh Văn Nghệ, Bửu Long, Biên Hòa, Đồng Nai',
    email: 'media@lhu.edu.vn',
    phone: '(+84) 251 3952 778',
    fanpage: 'https://facebook.com/lhu.edu.vn',
  }),
};

let cmsSections = {
  showHero: true,
  showServices: true,
  showGallery: true,
  showAbout: true,
  showContact: true,
};

let cmsServices = [
  { id: '1', title: 'Đặt phòng Studio', description: 'Đặt lịch sử dụng phòng thu âm, phòng quay phim chuyên nghiệp theo giờ hoặc cả ngày.', icon: 'video', color: 'from-brand-primary/10 to-brand-primary/5 border-brand-primary/15', order: 1, isActive: true },
  { id: '2', title: 'Mượn Thiết bị', description: 'Đăng ký mượn máy ảnh, máy quay, gimbal, đèn chiếu sáng và phụ kiện chuyên dụng.', icon: 'camera', color: 'from-brand-secondary/10 to-brand-secondary/5 border-brand-secondary/15', order: 2, isActive: true },
  { id: '3', title: 'Hỗ trợ kỹ thuật', description: 'Đội ngũ kỹ thuật viên sẵn sàng hỗ trợ trong suốt quá trình sử dụng thiết bị và phòng.', icon: 'headphones', color: 'from-brand-accent/10 to-brand-accent/5 border-brand-accent/15', order: 3, isActive: true },
  { id: '4', title: 'Theo dõi lịch sử', description: 'Xem lại toàn bộ lịch sử đặt phòng và mượn thiết bị theo thời gian thực.', icon: 'clock', color: 'from-white/5 to-white/2 border-white/10', order: 4, isActive: true },
];

let cmsGallery = [
  { id: '1', imageUrl: 'https://images.unsplash.com/photo-1596443686812-2f45229eebc3?w=800&fit=crop', title: 'Phòng thu âm chuyên nghiệp', order: 1, isActive: true },
  { id: '2', imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&fit=crop', title: 'Studio quay phim', order: 2, isActive: true },
  { id: '3', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&fit=crop', title: 'Thiết bị máy ảnh', order: 3, isActive: true },
  { id: '4', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&fit=crop', title: 'Hệ thống ánh sáng', order: 4, isActive: true },
];

// ============================================================
// HOMEPAGE CONTENT
// ============================================================
router.get('/homepage-content', (req, res) => res.json(cmsContent));

router.put('/homepage-content', (req, res) => {
  cmsContent = { ...cmsContent, ...req.body };
  res.json(cmsContent);
});

// ============================================================
// HOMEPAGE SECTIONS
// ============================================================
router.get('/homepage-sections', (req, res) => res.json(cmsSections));

router.put('/homepage-sections', (req, res) => {
  cmsSections = { ...cmsSections, ...req.body };
  res.json(cmsSections);
});

// ============================================================
// HOMEPAGE SERVICES
// ============================================================
router.get('/homepage-services', (req, res) => {
  res.json(cmsServices.sort((a, b) => a.order - b.order));
});

router.post('/homepage-services', (req, res) => {
  const newService = {
    id: randomUUID(),
    order: cmsServices.length + 1,
    isActive: true,
    ...req.body,
  };
  cmsServices.push(newService);
  res.status(201).json(newService);
});

router.put('/homepage-services/reorder', (req, res) => {
  const { items } = req.body;
  if (Array.isArray(items)) {
    items.forEach((item, idx) => {
      const found = cmsServices.find(s => s.id === item.id);
      if (found) found.order = idx + 1;
    });
  }
  res.json(cmsServices.sort((a, b) => a.order - b.order));
});

router.put('/homepage-services/:id', (req, res) => {
  const idx = cmsServices.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Service không tồn tại.' });
  cmsServices[idx] = { ...cmsServices[idx], ...req.body };
  res.json(cmsServices[idx]);
});

router.delete('/homepage-services/:id', (req, res) => {
  const idx = cmsServices.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Service không tồn tại.' });
  cmsServices.splice(idx, 1);
  res.json({ message: 'Đã xóa service.' });
});

// ============================================================
// HOMEPAGE GALLERY
// ============================================================
router.get('/homepage-gallery', (req, res) => {
  res.json(cmsGallery.sort((a, b) => a.order - b.order));
});

router.post('/homepage-gallery', (req, res) => {
  const newItem = {
    id: randomUUID(),
    order: cmsGallery.length + 1,
    isActive: true,
    ...req.body,
  };
  cmsGallery.push(newItem);
  res.status(201).json(newItem);
});

router.put('/homepage-gallery/reorder', (req, res) => {
  const { items } = req.body;
  if (Array.isArray(items)) {
    items.forEach((item, idx) => {
      const found = cmsGallery.find(g => g.id === item.id);
      if (found) found.order = idx + 1;
    });
  }
  res.json(cmsGallery.sort((a, b) => a.order - b.order));
});

router.put('/homepage-gallery/:id', (req, res) => {
  const idx = cmsGallery.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Gallery item không tồn tại.' });
  cmsGallery[idx] = { ...cmsGallery[idx], ...req.body };
  res.json(cmsGallery[idx]);
});

router.delete('/homepage-gallery/:id', (req, res) => {
  const idx = cmsGallery.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Gallery item không tồn tại.' });
  cmsGallery.splice(idx, 1);
  res.json({ message: 'Đã xóa gallery item.' });
});

module.exports = router;
