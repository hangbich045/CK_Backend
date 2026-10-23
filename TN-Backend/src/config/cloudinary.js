'use strict';

/**
 * @file config/cloudinary.js
 * @description Cấu hình Cloudinary SDK để upload ảnh lên cloud.
 * Biến môi trường: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary với credentials từ .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Tạo Multer storage cho một folder cụ thể trên Cloudinary
 * @param {string} folder - Tên folder trên Cloudinary (e.g. 'equipment', 'avatars')
 * @param {string[]} allowedFormats - Định dạng cho phép
 */
function createStorage(folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `lhu-media/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    },
  });
}

// Multer instances cho từng loại upload
const uploadEquipment = multer({
  storage: createStorage('equipment'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadAvatar = multer({
  storage: createStorage('avatars', ['jpg', 'jpeg', 'png', 'webp']),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const uploadGallery = multer({
  storage: createStorage('gallery'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadVideo = multer({
  storage: createStorage('videos', ['mp4', 'webm', 'mov', 'jpg', 'jpeg', 'png', 'webp']),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

module.exports = { cloudinary, uploadEquipment, uploadAvatar, uploadGallery, uploadVideo };
