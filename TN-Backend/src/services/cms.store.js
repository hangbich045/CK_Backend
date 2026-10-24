'use strict';

/**
 * @file services/cms.store.js
 * @description Kho lưu trữ bền vững (persistent store) cho dữ liệu CMS trang chủ.
 * Đồng bộ giữa trang quản trị CMS (/admin/cms) và trang chủ công khai (/).
 * Dữ liệu được lưu vào file JSON để không bị mất khi restart server.
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_FILE_PATH = path.join(__dirname, '../../uploads/homepage-cms.json');

const DEFAULT_DATA = {
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
  sections: {
    showHero: true,
    showServices: true,
    showGallery: true,
    showAbout: true,
    showContact: true,
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
};

let cache = null;

function ensureUploadDir() {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadData() {
  if (cache) return cache;
  try {
    ensureUploadDir();
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      cache = {
        content: { ...DEFAULT_DATA.content, ...(parsed.content || {}) },
        sections: { ...DEFAULT_DATA.sections, ...(parsed.sections || {}) },
        services: Array.isArray(parsed.services) ? parsed.services : DEFAULT_DATA.services,
        gallery: Array.isArray(parsed.gallery) ? parsed.gallery : DEFAULT_DATA.gallery,
      };
      return cache;
    }
  } catch (err) {
    console.warn('⚠️  Không thể đọc file homepage-cms.json, sử dụng dữ liệu mặc định:', err.message);
  }

  cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveData();
  return cache;
}

function saveData() {
  try {
    ensureUploadDir();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Lỗi lưu homepage-cms.json:', err.message);
  }
}

// ============================================================
// CONTENT
// ============================================================
const getContent = () => {
  const store = loadData();
  return store.content;
};

const updateContent = (newContent) => {
  const store = loadData();
  store.content = { ...store.content, ...newContent };
  saveData();
  return store.content;
};

// ============================================================
// SECTIONS VISIBILITY
// ============================================================
const getSections = () => {
  const store = loadData();
  return store.sections;
};

const updateSections = (newSections) => {
  const store = loadData();
  store.sections = { ...store.sections, ...newSections };
  saveData();
  return store.sections;
};

// ============================================================
// SERVICES
// ============================================================
const getServices = () => {
  const store = loadData();
  return [...store.services].sort((a, b) => (a.order || 0) - (b.order || 0));
};

const addService = (serviceData) => {
  const store = loadData();
  const newService = {
    id: randomUUID(),
    order: store.services.length + 1,
    isActive: true,
    ...serviceData,
  };
  store.services.push(newService);
  saveData();
  return newService;
};

const updateService = (id, serviceData) => {
  const store = loadData();
  const idx = store.services.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.services[idx] = { ...store.services[idx], ...serviceData };
  saveData();
  return store.services[idx];
};

const deleteService = (id) => {
  const store = loadData();
  const idx = store.services.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  store.services.splice(idx, 1);
  saveData();
  return true;
};

const reorderServices = (items) => {
  const store = loadData();
  if (Array.isArray(items)) {
    items.forEach((item, idx) => {
      const found = store.services.find((s) => s.id === item.id);
      if (found) found.order = idx + 1;
    });
    saveData();
  }
  return getServices();
};

// ============================================================
// GALLERY
// ============================================================
const getGallery = () => {
  const store = loadData();
  return [...store.gallery].sort((a, b) => (a.order || 0) - (b.order || 0));
};

const addGalleryItem = (galleryData) => {
  const store = loadData();
  const newItem = {
    id: randomUUID(),
    order: store.gallery.length + 1,
    isActive: true,
    ...galleryData,
  };
  store.gallery.push(newItem);
  saveData();
  return newItem;
};

const updateGalleryItem = (id, galleryData) => {
  const store = loadData();
  const idx = store.gallery.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  store.gallery[idx] = { ...store.gallery[idx], ...galleryData };
  saveData();
  return store.gallery[idx];
};

const deleteGalleryItem = (id) => {
  const store = loadData();
  const idx = store.gallery.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  store.gallery.splice(idx, 1);
  saveData();
  return true;
};

const reorderGallery = (items) => {
  const store = loadData();
  if (Array.isArray(items)) {
    items.forEach((item, idx) => {
      const found = store.gallery.find((g) => g.id === item.id);
      if (found) found.order = idx + 1;
    });
    saveData();
  }
  return getGallery();
};

// ============================================================
// FULL HOMEPAGE DATA (Dùng cho public GET /api/homepage)
// ============================================================
const getHomepageData = () => {
  const store = loadData();
  return {
    content: store.content,
    services: [...store.services].sort((a, b) => (a.order || 0) - (b.order || 0)),
    gallery: [...store.gallery].sort((a, b) => (a.order || 0) - (b.order || 0)),
    sections: store.sections,
  };
};

module.exports = {
  getContent,
  updateContent,
  getSections,
  updateSections,
  getServices,
  addService,
  updateService,
  deleteService,
  reorderServices,
  getGallery,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGallery,
  getHomepageData,
};
