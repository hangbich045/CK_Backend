'use strict';

/**
 * @file import-devices.js
 * @description Script đọc file Excel 'thiết bị cho web.xlsx' và tìm hình ảnh từ 'img web',
 *              sau đó upload lên Cloudinary (hoặc lưu local fallback) và import dữ liệu thiết bị vào server (MSSQL - Sequelize).
 *
 * Cách chạy:
 *   node import-devices.js               # Import thiết bị (upsert)
 *   npm run import:devices               # Tương tự qua npm script
 *   node import-devices.js --reset       # Xóa dữ liệu thiết bị cũ trước khi import mới
 *   node import-devices.js --local-only  # Không upload Cloudinary, dùng ảnh tĩnh local /uploads/equipment
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const cloudinary = require('cloudinary').v2;
const { sequelize } = require('./src/config/database');
const { EquipmentCategory, Equipment } = require('./src/models');

// Cấu hình Cloudinary nếu có credentials
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ============================================================
// 1. TÌM ĐƯỜNG DẪN FILE EXCEL VÀ THƯ MỤC ẢNH
// ============================================================
function findExcelFile() {
  const candidatePaths = [
    path.resolve(__dirname, '..', 'thiết bị cho web.xlsx'),
    path.resolve(__dirname, 'thiết bị cho web.xlsx'),
    path.resolve(process.cwd(), 'thiết bị cho web.xlsx'),
    path.resolve(process.cwd(), '..', 'thiết bị cho web.xlsx'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findImgWebDir() {
  const candidateDirs = [
    path.resolve(__dirname, '..', 'img web'),
    path.resolve(__dirname, 'img web'),
    path.resolve(process.cwd(), 'img web'),
    path.resolve(process.cwd(), '..', 'img web'),
  ];
  for (const d of candidateDirs) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) return d;
  }
  return null;
}

// ============================================================
// 2. KHỚP FILE ẢNH TỪ LINK TRONG EXCEL VỚI THƯ MỤC 'img web'
// ============================================================
function resolveLocalImagePath(rawImgLink, imgWebDir, availableFiles) {
  if (!rawImgLink) return null;

  let clean = String(rawImgLink).trim();
  if (clean.startsWith('"')) clean = clean.substring(1);
  if (clean.endsWith('"')) clean = clean.substring(0, clean.length - 1);
  clean = clean.trim();

  const filename = path.basename(clean);
  if (!filename) return null;

  // 1. Khớp chính xác tên file
  const exactPath = path.join(imgWebDir, filename);
  if (fs.existsSync(exactPath)) return exactPath;

  // 2. Khớp không phân biệt chữ hoa chữ thường
  const lowerName = filename.toLowerCase();
  const matched = availableFiles.find((f) => f.toLowerCase() === lowerName);
  if (matched) return path.join(imgWebDir, matched);

  // 3. Khớp mờ (fuzzy) dựa trên tên không có dấu gạch/khoảng trắng
  const strippedName = lowerName.replace(/[^a-z0-9]/g, '');
  const fuzzyMatched = availableFiles.find((f) => {
    const s = f.toLowerCase().replace(/[^a-z0-9]/g, '');
    return s.includes(strippedName) || strippedName.includes(s);
  });
  if (fuzzyMatched) return path.join(imgWebDir, fuzzyMatched);

  return null;
}

// ============================================================
// 3. TẠO MÃ THIẾT BỊ NẾU EXCEL BỊ TRỐNG HOẶC TRÙNG
// ============================================================
function generateMeaningfulCode(name, rawCode) {
  if (rawCode !== undefined && rawCode !== null && String(rawCode).trim() !== '') {
    return String(rawCode).trim();
  }

  const n = String(name || '').toLowerCase();
  if (n.includes('canon') && n.includes('r8')) return 'CANON-EOS-R8';
  if (n.includes('rf 24-105') || n.includes('rf 24-105mm')) return 'CANON-RF-24-105';
  if (n.includes('rf 14-35') || n.includes('rf 14-35mm')) return 'CANON-RF-14-35';
  if (n.includes('amaran') || n.includes('300c')) return 'AMARAN-300C';
  if (n.includes('lp-e17')) return 'PIN-CANON-LP-E17';
  if (n.includes('v1c') || n.includes('godox v1')) return 'GODOX-V1C-PRO';

  // Slugify mặc định
  return (
    'DEV-' +
    n
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toUpperCase()
      .slice(0, 15)
  );
}

// Chuẩn hóa tên thiết bị (sửa lỗi chính tả như 'Mảy ảnh' -> 'Máy ảnh')
function cleanEquipmentName(name) {
  let cleaned = String(name || '').trim();
  if (cleaned.startsWith('Mảy ảnh')) {
    cleaned = 'Máy ảnh' + cleaned.substring(7);
  }
  return cleaned;
}

// ============================================================
// 4. MAIN IMPORT FUNCTION
// ============================================================
async function runImport() {
  const isReset = process.argv.includes('--reset');
  const isLocalOnly = process.argv.includes('--local-only');

  console.log('\n=============================================================');
  console.log('🚀 SCRIPT NHẬP THIẾT BỊ TỪ FILE EXCEL VÀO SERVER');
  console.log('=============================================================');

  // Kiểm tra file Excel
  const excelPath = findExcelFile();
  if (!excelPath) {
    console.error('❌ Không tìm thấy file Excel "thiết bị cho web.xlsx"!');
    process.exit(1);
  }
  console.log(`📄 File Excel:      ${excelPath}`);

  // Kiểm tra thư mục ảnh
  const imgWebDir = findImgWebDir();
  if (!imgWebDir) {
    console.error('❌ Không tìm thấy thư mục "img web"!');
    process.exit(1);
  }
  const availableImgFiles = fs.readdirSync(imgWebDir);
  console.log(`🖼️  Thư mục ảnh:     ${imgWebDir} (${availableImgFiles.length} files)`);

  // Thư mục upload local fallback
  const localUploadDir = path.resolve(__dirname, 'uploads', 'equipment');
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
  console.log(`💾 Local backup dir: ${localUploadDir}`);

  // Trạng thái Cloudinary
  if (isLocalOnly) {
    console.log('⚡ Chế độ:           Chỉ dùng Local Storage (--local-only)');
  } else if (hasCloudinary) {
    console.log(`☁️  Cloudinary:       Đã kích hoạt (${process.env.CLOUDINARY_CLOUD_NAME})`);
  } else {
    console.log('⚠️  Cloudinary:       Chưa cấu hình credentials, tự động dùng ảnh local');
  }

  // Kết nối Database
  console.log('\n🔌 Đang kết nối database MSSQL...');
  await sequelize.authenticate();
  console.log('✅ Kết nối database thành công!');

  if (isReset) {
    console.log('⚠️  Đang xóa dữ liệu thiết bị và danh mục cũ (--reset)...');
    await Equipment.destroy({ where: {}, truncate: false });
    await EquipmentCategory.destroy({ where: {}, truncate: false });
    console.log('🧹 Đã xóa sạch thiết bị và danh mục cũ.');
  }

  // ============================================================
  // ĐỌC VÀ PARSE FILE EXCEL
  // ============================================================
  console.log('\n📖 Đang đọc dữ liệu từ file Excel...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  const worksheet = workbook.worksheets[0];

  const rawRows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Bỏ qua tiêu đề
    const v = row.values;
    const rawCode = v[1];
    const rawName = cleanEquipmentName(v[2]);
    const desc = v[3] ? String(v[3]).trim() : '';
    const qty = parseInt(v[4], 10) || 1;
    const category = v[5] ? String(v[5]).trim() : 'Thiết bị khác';
    const rawStatus = v[6] ? String(v[6]).trim().toUpperCase() : 'AVAILABLE';
    const rawImg = v[7] ? String(v[7]).trim() : '';

    if (!rawName) return;

    let status = 'AVAILABLE';
    if (rawStatus.includes('BẢO TRÌ') || rawStatus.includes('MAINTENANCE')) {
      status = 'MAINTENANCE';
    } else if (rawStatus.includes('MƯỢN') || rawStatus.includes('BORROWED')) {
      status = 'BORROWED';
    }

    rawRows.push({
      rowNumber,
      rawCode,
      name: rawName,
      description: desc,
      quantity: qty,
      category,
      status,
      rawImg,
    });
  });

  console.log(`📊 Đã đọc ${rawRows.length} dòng dữ liệu từ Excel.`);

  // ============================================================
  // GOM NHÓM THIẾT BỊ (AGGREGATE QUANTITIES)
  // Ví dụ: 10 dòng bộ đàm Kenwood -> 1 thiết bị số lượng 10
  // ============================================================
  const groupedMap = new Map();

  for (const row of rawRows) {
    const key = `${row.name.toLowerCase()}___${row.category.toLowerCase()}`;
    if (groupedMap.has(key)) {
      const existing = groupedMap.get(key);
      existing.quantity += row.quantity;
      existing.rows.push(row.rowNumber);
      if (!existing.rawCode && row.rawCode) {
        existing.rawCode = row.rawCode;
      }
    } else {
      groupedMap.set(key, {
        rawCode: row.rawCode,
        name: row.name,
        category: row.category,
        description: row.description,
        quantity: row.quantity,
        status: row.status,
        rawImg: row.rawImg,
        rows: [row.rowNumber],
      });
    }
  }

  const distinctEquipments = Array.from(groupedMap.values());
  console.log(`📦 Sau khi tổng hợp số lượng: Có ${distinctEquipments.length} loại thiết bị độc lập.`);

  // ============================================================
  // TẠO HOẶC CẬP NHẬT DANH MỤC (CATEGORIES)
  // ============================================================
  console.log('\n📁 Đang đồng bộ danh mục (EquipmentCategory)...');
  const distinctCategories = Array.from(new Set(distinctEquipments.map((e) => e.category)));
  const categoryRecords = {};

  for (const catName of distinctCategories) {
    const [category, created] = await EquipmentCategory.findOrCreate({
      where: { name: catName },
      defaults: {
        name: catName,
        description: `Danh mục thiết bị: ${catName}`,
      },
    });
    categoryRecords[catName] = category;
    console.log(`   ${created ? '➕ Tạo mới' : '✓ Đã có sẵn'}: "${catName}" (ID: ${category.id})`);
  }

  // ============================================================
  // XỬ LÝ ẢNH & IMPORT THIẾT BỊ
  // ============================================================
  console.log('\n🖼️  Đang xử lý hình ảnh và nhập thiết bị vào database...\n');

  // Cache ảnh đã upload để không upload lại cùng 1 file
  const imageCache = new Map();
  const usedCodes = new Set();

  // Load các mã code đã có trong database để tránh xung đột
  const existingInDb = await Equipment.findAll({ attributes: ['code'] });
  existingInDb.forEach((e) => usedCodes.add(String(e.code)));

  let successCount = 0;
  let failCount = 0;
  const summaryReport = [];

  for (let i = 0; i < distinctEquipments.length; i++) {
    const item = distinctEquipments[i];
    const indexStr = `[${i + 1}/${distinctEquipments.length}]`;

    // 1. Tạo mã thiết bị duy nhất
    let baseCode = generateMeaningfulCode(item.name, item.rawCode);
    let finalCode = baseCode;
    let suffix = 1;
    while (usedCodes.has(finalCode)) {
      finalCode = `${baseCode}-${suffix++}`;
    }
    usedCodes.add(finalCode);

    // 2. Tìm ảnh trong thư mục 'img web'
    const localImgPath = resolveLocalImagePath(item.rawImg, imgWebDir, availableImgFiles);
    let finalImageUrl = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60';

    if (localImgPath) {
      const imgFileName = path.basename(localImgPath);

      // Sao chép vào thư mục uploads/equipment làm local backup
      const backupPath = path.join(localUploadDir, imgFileName);
      try {
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(localImgPath, backupPath);
        }
      } catch (err) {
        // bỏ qua lỗi copy nhẹ
      }

      const localUrl = `/uploads/equipment/${encodeURIComponent(imgFileName)}`;

      if (imageCache.has(imgFileName)) {
        finalImageUrl = imageCache.get(imgFileName);
        console.log(`${indexStr} 🔄 Dùng lại URL ảnh đã upload cho: "${item.name}"`);
      } else if (!isLocalOnly && hasCloudinary) {
        process.stdout.write(`${indexStr} ☁️  Đang upload "${imgFileName}" lên Cloudinary... `);
        try {
          const uploadRes = await cloudinary.uploader.upload(localImgPath, {
            folder: 'lhu-media/equipment',
            use_filename: true,
            unique_filename: false,
            overwrite: false,
          });
          finalImageUrl = uploadRes.secure_url;
          imageCache.set(imgFileName, finalImageUrl);
          console.log(`Xong! URL: ${finalImageUrl}`);
        } catch (uploadErr) {
          console.log(`\n   ⚠️ Lỗi upload Cloudinary (${uploadErr.message}). Chuyển sang dùng ảnh local.`);
          finalImageUrl = localUrl;
          imageCache.set(imgFileName, localUrl);
        }
      } else {
        finalImageUrl = localUrl;
        imageCache.set(imgFileName, localUrl);
        console.log(`${indexStr} 📁 Dùng ảnh local: ${localUrl}`);
      }
    } else {
      console.warn(`${indexStr} ⚠️ Không tìm thấy ảnh cho "${item.rawImg}". Dùng ảnh placeholder.`);
    }

    // 3. Lưu vào Database (Sequelize)
    try {
      const category = categoryRecords[item.category];
      if (!category) {
        throw new Error(`Không tìm thấy category "${item.category}"`);
      }

      // Kiểm tra thiết bị đã có theo code hoặc theo tên
      let equipment = await Equipment.findOne({ where: { code: finalCode } });
      if (!equipment) {
        equipment = await Equipment.findOne({ where: { name: item.name } });
      }

      const equipmentPayload = {
        code: finalCode,
        name: item.name,
        categoryId: category.id,
        description: item.description,
        quantity: item.quantity,
        availableQuantity: item.quantity,
        status: item.status,
        imageUrl: finalImageUrl,
        location: 'Kho Thiết bị Studio - ĐH LHU',
      };

      if (equipment) {
        await equipment.update(equipmentPayload);
        console.log(`   ✅ [CẬP NHẬT] [${finalCode}] ${item.name} | SL: ${item.quantity} | DM: ${item.category}\n`);
      } else {
        await Equipment.create(equipmentPayload);
        console.log(`   ✅ [TẠO MỚI]  [${finalCode}] ${item.name} | SL: ${item.quantity} | DM: ${item.category}\n`);
      }

      summaryReport.push({
        code: finalCode,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        image: finalImageUrl.startsWith('http') ? finalImageUrl.slice(0, 50) + '...' : finalImageUrl,
      });

      successCount++;
    } catch (dbError) {
      console.error(`   ❌ Lỗi lưu DB cho [${finalCode}] ${item.name}:`, dbError.message, '\n');
      failCount++;
    }
  }

  // ============================================================
  // BÁO CÁO TỔNG KẾT
  // ============================================================
  console.log('=============================================================');
  console.log('🎉 TỔNG KẾT QUÁ TRÌNH NHẬP THIẾT BỊ VÀO DATABASE');
  console.log('=============================================================');
  console.log(`   - Tổng số dòng trong Excel:   ${rawRows.length} dòng`);
  console.log(`   - Tổng số loại thiết bị:       ${distinctEquipments.length} loại`);
  console.log(`   - Tổng số lượng thiết bị (SL): ${distinctEquipments.reduce((sum, e) => sum + e.quantity, 0)} cái`);
  console.log(`   - Thành công:                 ${successCount} / ${distinctEquipments.length}`);
  if (failCount > 0) {
    console.log(`   - Thất bại:                   ${failCount}`);
  }
  console.log('=============================================================\n');

  console.log('📋 Danh sách thiết bị đã nhập vào hệ thống:');
  console.table(summaryReport);

  process.exit(0);
}

runImport().catch((err) => {
  console.error('\n❌ Lỗi nghiêm trọng khi thực thi script:', err);
  process.exit(1);
});
