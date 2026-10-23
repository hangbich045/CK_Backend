'use strict';

/**
 * @file seed.js
 * @description Script tạo dữ liệu mẫu (seed data) cho demo đồ án.
 * Chạy: node seed.js
 *
 * Tạo:
 *   - 1 Admin account
 *   - 1 User thường
 *   - 4 EquipmentCategory
 *   - 8 Equipment
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const { User, EquipmentCategory, Equipment } = require('./src/models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối DB thành công\n');

    // ==========================
    // 1. USERS
    // ==========================
    const adminExists = await User.findOne({ where: { email: 'admin@lhu.edu.vn' } });
    let admin;
    if (!adminExists) {
      admin = await User.create({
        fullName: 'LHU Admin',
        email: 'admin@lhu.edu.vn',
        password: await bcrypt.hash('Admin@123', 10),
        employeeCode: 'ADM001',
        role: 'ADMIN',
        isActive: true,
      });
      console.log(`✅ Tạo Admin: ${admin.email}`);
    } else {
      // Đảm bảo role là ADMIN
      await adminExists.update({ role: 'ADMIN', fullName: 'LHU Admin' });
      console.log(`ℹ️  Admin đã tồn tại: ${adminExists.email} (role đã set thành ADMIN)`);
    }

    const userExists = await User.findOne({ where: { email: 'user@lhu.edu.vn' } });
    if (!userExists) {
      await User.create({
        fullName: 'Nguyễn Văn A',
        email: 'user@lhu.edu.vn',
        password: await bcrypt.hash('User@123', 10),
        employeeCode: 'USR001',
        role: 'USER',
        isActive: true,
      });
      console.log('✅ Tạo User thường: user@lhu.edu.vn');
    } else {
      console.log('ℹ️  User thường đã tồn tại');
    }

    // ==========================
    // 2. CATEGORIES
    // ==========================
    const categoryData = [
      { name: 'Máy ảnh', description: 'Máy ảnh DSLR, Mirrorless các loại' },
      { name: 'Thiết bị âm thanh', description: 'Micro, Mixer, Tai nghe chuyên dụng' },
      { name: 'Phụ kiện quay phim', description: 'Gimbal, Tripod, Slider, Rig camera' },
      { name: 'Ánh sáng', description: 'Đèn LED, Softbox, Ring light, Đèn Flash' },
    ];

    const createdCategories = {};
    for (const cat of categoryData) {
      const [category, created] = await EquipmentCategory.findOrCreate({
        where: { name: cat.name },
        defaults: cat,
      });
      createdCategories[cat.name] = category;
      console.log(`${created ? '✅ Tạo' : 'ℹ️  Đã có'} Category: ${cat.name}`);
    }

    // ==========================
    // 3. EQUIPMENTS
    // ==========================
    const equipmentData = [
      {
        code: 'CAM-001',
        name: 'Sony Alpha A7S III',
        categoryName: 'Máy ảnh',
        description: 'Máy ảnh mirrorless full-frame, cảm biến 12.1MP, quay 4K 120fps. Lý tưởng cho quay phim điện ảnh và chụp trong điều kiện ánh sáng yếu.',
        imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop',
        quantity: 3,
        availableQuantity: 3,
        status: 'AVAILABLE',
      },
      {
        code: 'CAM-002',
        name: 'Canon EOS R5',
        categoryName: 'Máy ảnh',
        description: 'Máy ảnh mirrorless Canon 45MP, quay video 8K RAW. Chống rung IBIS 8 stop. Phù hợp chụp ảnh thương mại và quay phim chuyên nghiệp.',
        imageUrl: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=400&h=300&fit=crop',
        quantity: 2,
        availableQuantity: 2,
        status: 'AVAILABLE',
      },
      {
        code: 'MIC-001',
        name: 'Rode NTG5 Shotgun Microphone',
        categoryName: 'Thiết bị âm thanh',
        description: 'Micro shotgun chuyên nghiệp, pattern cardioid siêu nhỏ hẹp. Lý tưởng thu âm phỏng vấn, quay phim ngoài trời và studio.',
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop',
        quantity: 5,
        availableQuantity: 5,
        status: 'AVAILABLE',
      },
      {
        code: 'MIC-002',
        name: 'Shure SM7B Dynamic Microphone',
        categoryName: 'Thiết bị âm thanh',
        description: 'Micro dynamic huyền thoại, pattern cardioid, nổi tiếng với âm thanh ấm và đầy đặn. Lựa chọn hàng đầu cho podcast và vocal studio.',
        imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop',
        quantity: 3,
        availableQuantity: 2,
        status: 'AVAILABLE',
      },
      {
        code: 'ACC-001',
        name: 'DJI RS 3 Pro Gimbal',
        categoryName: 'Phụ kiện quay phim',
        description: '3-axis gimbal stabilizer cho DSLR/Mirrorless, tải trọng tối đa 4.5kg, thời lượng pin 12 giờ. Kết nối RSS với Canon/Sony/Nikon.',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        quantity: 2,
        availableQuantity: 2,
        status: 'AVAILABLE',
      },
      {
        code: 'ACC-002',
        name: 'Manfrotto MT055XPRO3 Tripod',
        categoryName: 'Phụ kiện quay phim',
        description: 'Chân máy nhôm cao cấp 3 section, tải trọng 9kg, chiều cao 170cm. Đầu xoay 90° cho chụp góc macro. Thiết kế chắc chắn cho studio.',
        imageUrl: 'https://images.unsplash.com/photo-1483183535261-74f4e9c0f9e5?w=400&h=300&fit=crop',
        quantity: 4,
        availableQuantity: 4,
        status: 'AVAILABLE',
      },
      {
        code: 'LGT-001',
        name: 'Godox SL-200W LED Video Light',
        categoryName: 'Ánh sáng',
        description: 'Đèn LED studio 200W, nhiệt độ màu 5600K, CRI 96+. Độ sáng điều chỉnh 10-100%. Kèm softbox 80x80cm và remote không dây.',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        quantity: 4,
        availableQuantity: 3,
        status: 'AVAILABLE',
      },
      {
        code: 'LGT-002',
        name: 'Neewer 18 inch Ring Light Kit',
        categoryName: 'Ánh sáng',
        description: 'Ring light 18 inch 55W, 3 chế độ màu (3200K/4500K/5500K), điều chỉnh độ sáng vô cấp 10-100%. Kèm chân đứng, phone holder và túi đựng.',
        imageUrl: 'https://images.unsplash.com/photo-1540747913346-19212a4b423f?w=400&h=300&fit=crop',
        quantity: 3,
        availableQuantity: 3,
        status: 'AVAILABLE',
      },
    ];

    for (const eq of equipmentData) {
      const category = createdCategories[eq.categoryName];
      if (!category) continue;

      const [equipment, created] = await Equipment.findOrCreate({
        where: { code: eq.code },
        defaults: {
          code: eq.code,
          name: eq.name,
          categoryId: category.id,
          description: eq.description,
          imageUrl: eq.imageUrl,
          quantity: eq.quantity,
          availableQuantity: eq.availableQuantity,
          status: eq.status,
        },
      });
      console.log(`${created ? '✅ Tạo' : 'ℹ️  Đã có'} Equipment: ${eq.name}`);
    }

    console.log('\n🎉 Seed data hoàn tất!');
    console.log('\n📋 Tài khoản demo:');
    console.log('   Admin: admin@lhu.edu.vn / Admin@123');
    console.log('   User:  user@lhu.edu.vn  / User@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed thất bại:', error.message);
    process.exit(1);
  }
};

seed();
