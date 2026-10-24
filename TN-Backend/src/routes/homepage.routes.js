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
const cmsStore = require('../services/cms.store');
const router = Router();

/**
 * GET /api/homepage
 * Trả về dữ liệu trang chủ đồng bộ với CMS Admin.
 */
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const data = cmsStore.getHomepageData();
  return res.status(200).json(data);
});

module.exports = router;

