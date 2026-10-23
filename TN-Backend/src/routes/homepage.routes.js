'use strict';

/**
 * @file routes/homepage.routes.js
 * @description Route cho trang chủ homepage — trả về static CMS data.
 */

/**
 * @swagger
 * tags:
 *   name: Homepage
 *   description: API public cho trang chủ (không cần đăng nhập)
 */

/**
 * @swagger
 * /api/homepage:
 *   get:
 *     summary: Lấy toàn bộ nội dung trang chủ
 *     description: Trả về đầy đủ content, services, gallery và sections cho trang chủ frontend. Không yêu cầu token.
 *     tags: [Homepage]
 *     security: []
 *     responses:
 *       200:
 *         description: Dữ liệu trang chủ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: object
 *                   properties:
 *                     heroTitle: { type: string, example: "LHU MEDIA STUDIO" }
 *                     heroDescription: { type: string }
 *                     heroVideoUrl: { type: string }
 *                     heroPosterUrl: { type: string }
 *                     aboutContent: { type: string }
 *                     contactInfo: { type: string, description: "JSON string" }
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       icon: { type: string }
 *                       order: { type: integer }
 *                       isActive: { type: boolean }
 *                 gallery:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       imageUrl: { type: string }
 *                       title: { type: string }
 *                       order: { type: integer }
 *                 sections:
 *                   type: object
 *                   properties:
 *                     showHero: { type: boolean }
 *                     showServices: { type: boolean }
 *                     showGallery: { type: boolean }
 *                     showAbout: { type: boolean }
 *                     showContact: { type: boolean }
 */

const { Router } = require('express');
const router = Router();

/**
 * GET /api/homepage
 * Trả về dữ liệu tĩnh cho trang chủ.
 * Trong production, dữ liệu này có thể lưu vào DB và cung cấp endpoint CMS để Admin chỉnh sửa.
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    content: {
      heroTitle: 'LHU MEDIA STUDIO',
      heroDescription:
        'Hệ thống quản lý đặt lịch và mượn thiết bị studio chuyên nghiệp. Nơi chắp cánh đam mê sáng tạo của bạn.',
      heroVideoUrl: '',
      heroPosterUrl:
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&auto=format&fit=crop&q=80',
      aboutContent:
        'LHU Media Studio cung cấp đầy đủ phòng ốc cách âm và trang thiết bị chuyên dụng phục vụ mọi sản phẩm truyền thông. Từ quay phim, chụp ảnh đến podcast và livestream — tất cả trong một không gian hiện đại.',
      contactInfo: JSON.stringify({
        address: 'Trường Đại học Lạc Hồng, 10 Huỳnh Văn Nghệ, Bửu Long, Biên Hòa, Đồng Nai',
        email: 'media@lhu.edu.vn',
        phone: '(+84) 251 3952 778',
        fanpage: 'https://facebook.com/lhu.edu.vn',
      }),
    },
    services: [
      {
        id: '1',
        title: 'Đặt phòng Studio',
        description: 'Đặt lịch sử dụng phòng thu âm, phòng quay phim chuyên nghiệp theo giờ hoặc cả ngày.',
        icon: 'video',
        color: 'from-brand-primary/10 to-brand-primary/5 border-brand-primary/15',
        order: 1,
        isActive: true,
      },
      {
        id: '2',
        title: 'Mượn Thiết bị',
        description: 'Đăng ký mượn máy ảnh, máy quay, gimbal, đèn chiếu sáng và phụ kiện chuyên dụng.',
        icon: 'camera',
        color: 'from-brand-secondary/10 to-brand-secondary/5 border-brand-secondary/15',
        order: 2,
        isActive: true,
      },
      {
        id: '3',
        title: 'Hỗ trợ kỹ thuật',
        description: 'Đội ngũ kỹ thuật viên sẵn sàng hỗ trợ trong suốt quá trình sử dụng thiết bị và phòng.',
        icon: 'headphones',
        color: 'from-brand-accent/10 to-brand-accent/5 border-brand-accent/15',
        order: 3,
        isActive: true,
      },
      {
        id: '4',
        title: 'Theo dõi lịch sử',
        description: 'Xem lại toàn bộ lịch sử đặt phòng và mượn thiết bị theo thời gian thực.',
        icon: 'clock',
        color: 'from-white/5 to-white/2 border-white/10',
        order: 4,
        isActive: true,
      },
    ],
    gallery: [
      {
        id: '1',
        imageUrl: 'https://images.unsplash.com/photo-1596443686812-2f45229eebc3?w=800&fit=crop',
        title: 'Phòng thu âm chuyên nghiệp',
        order: 1,
        isActive: true,
      },
      {
        id: '2',
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&fit=crop',
        title: 'Studio quay phim',
        order: 2,
        isActive: true,
      },
      {
        id: '3',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&fit=crop',
        title: 'Thiết bị máy ảnh',
        order: 3,
        isActive: true,
      },
      {
        id: '4',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&fit=crop',
        title: 'Hệ thống ánh sáng',
        order: 4,
        isActive: true,
      },
      {
        id: '5',
        imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&fit=crop',
        title: 'Không gian sáng tạo',
        order: 5,
        isActive: true,
      },
      {
        id: '6',
        imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&fit=crop',
        title: 'Góc chụp ảnh thương mại',
        order: 6,
        isActive: true,
      },
    ],
    sections: {
      showHero: true,
      showServices: true,
      showGallery: true,
      showAbout: true,
      showContact: true,
    },
  });
});

module.exports = router;
