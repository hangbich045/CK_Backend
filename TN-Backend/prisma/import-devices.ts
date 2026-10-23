import { PrismaClient, EquipmentStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Configure Cloudinary if credentials exist
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

// Helper to generate clean, readable code from product name if code is missing in Excel
function getSuggestedCode(name: string, rawCode?: string | number): string {
  if (rawCode !== undefined && rawCode !== null && String(rawCode).trim() !== '') {
    return String(rawCode).trim();
  }

  const n = name.toLowerCase();
  if (n.includes('canon') && n.includes('r8')) return 'CANON-EOS-R8';
  if (n.includes('rf 24-105') || n.includes('rf 24-105mm')) return 'CANON-RF-24-105';
  if (n.includes('rf 14-35') || n.includes('rf 14-35mm')) return 'CANON-RF-14-35';
  if (n.includes('amaran') || n.includes('300c')) return 'AMARAN-300C';
  if (n.includes('lp-e17')) return 'PIN-CANON-LP-E17';
  if (n.includes('v1c') || n.includes('godox v1')) return 'GODOX-V1C-PRO';

  // Fallback slugify
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 24);
}

// Find image file locally in `img web` folder
function resolveLocalImagePath(rawImgLink: string, imgWebDir: string): string | null {
  if (!rawImgLink) return null;

  // Remove surrounding quotes and trim
  const cleanPath = String(rawImgLink).replace(/^"|"$/g, '').trim();

  // 1. Direct path check (if it exists)
  if (fs.existsSync(cleanPath)) {
    return cleanPath;
  }

  // 2. Extract filename and check inside `img web` directory
  const filename = path.basename(cleanPath);
  const targetPath = path.join(imgWebDir, filename);
  if (fs.existsSync(targetPath)) {
    return targetPath;
  }

  // 3. Case-insensitive search in `img web` directory
  if (fs.existsSync(imgWebDir)) {
    const files = fs.readdirSync(imgWebDir);
    const found = files.find(f => f.toLowerCase() === filename.toLowerCase());
    if (found) {
      return path.join(imgWebDir, found);
    }
  }

  return null;
}

async function main() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU IMPORT THIẾT BỊ TỪ FILE EXCEL VÀO DATABASE');
  console.log('====================================================\n');

  // Paths
  const possibleExcelPaths = [
    path.resolve(process.cwd(), '..', 'thiết bị cho web.xlsx'),
    path.resolve(process.cwd(), 'thiết bị cho web.xlsx'),
    'c:\\STUDY\\TOT_NGHIEP\\thiết bị cho web.xlsx',
  ];

  let excelPath = '';
  for (const p of possibleExcelPaths) {
    if (fs.existsSync(p)) {
      excelPath = p;
      break;
    }
  }

  if (!excelPath) {
    console.error('❌ Không tìm thấy file Excel "thiết bị cho web.xlsx"!');
    process.exit(1);
  }
  console.log(`📄 File Excel: ${excelPath}`);

  const possibleImgDirs = [
    path.resolve(process.cwd(), '..', 'img web'),
    path.resolve(process.cwd(), 'img web'),
    'c:\\STUDY\\TOT_NGHIEP\\img web',
  ];

  let imgWebDir = '';
  for (const d of possibleImgDirs) {
    if (fs.existsSync(d)) {
      imgWebDir = d;
      break;
    }
  }

  if (!imgWebDir) {
    console.error('❌ Không tìm thấy thư mục "img web"!');
    process.exit(1);
  }
  console.log(`🖼️  Thư mục ảnh: ${imgWebDir}\n`);

  // Read workbook using ExcelJS
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  const worksheet = workbook.worksheets[0];

  // Group items by Name + Category to aggregate quantities (e.g. 10 Kenwood walkie talkies, 4 Godox flashes, etc.)
  const grouped = new Map<string, any>();
  const defaultPlaceholder =
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60';

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const values = row.values as any[];
    const rawCode = values[1];
    const rawName = values[2];
    const desc = values[3] ? String(values[3]).trim() : '';
    const qty = parseInt(values[4], 10) || 1;
    const category = values[5] ? String(values[5]).trim() : 'Khác';
    const rawStatus = values[6] ? String(values[6]).trim().toLowerCase() : '';
    const rawImg = values[7] ? String(values[7]).trim() : '';

    if (!rawName) return;
    const name = String(rawName).trim();

    let status: EquipmentStatus = EquipmentStatus.AVAILABLE;
    if (rawStatus.includes('bảo trì')) {
      status = EquipmentStatus.MAINTENANCE;
    } else if (rawStatus.includes('mượn')) {
      status = EquipmentStatus.BORROWED;
    }

    const groupKey = `${name.toLowerCase()}___${category.toLowerCase()}`;

    if (grouped.has(groupKey)) {
      const existing = grouped.get(groupKey);
      existing.quantity += qty;
      existing.rows.push(rowNumber);
      if (!existing.rawCode && rawCode) {
        existing.rawCode = rawCode;
      }
    } else {
      grouped.set(groupKey, {
        rawCode,
        name,
        category,
        description: desc,
        quantity: qty,
        status,
        rawImg,
        rows: [rowNumber],
      });
    }
  });

  console.log(`📊 Đã đọc và tổng hợp thành ${grouped.size} loại thiết bị từ ${worksheet.rowCount - 1} dòng dữ liệu.\n`);

  // 1. Seed Categories
  const categories = new Set<string>();
  for (const item of grouped.values()) {
    if (item.category) categories.add(item.category);
  }

  console.log('📁 Đang đồng bộ danh mục (Categories)...');
  for (const catName of categories) {
    const existing = await prisma.equipmentCategory.findUnique({
      where: { name: catName },
    });
    if (!existing) {
      await prisma.equipmentCategory.create({
        data: { name: catName },
      });
      console.log(`   + Tạo mới danh mục: "${catName}"`);
    } else {
      console.log(`   ✓ Danh mục đã có: "${catName}"`);
    }
  }
  console.log('✅ Hoàn tất đồng bộ danh mục.\n');

  // Cache uploaded image URLs to prevent uploading the same image multiple times
  const imageUploadCache = new Map<string, string>();

  // Assign unique codes
  const usedCodes = new Set<string>();
  let count = 0;
  let successCount = 0;
  let failCount = 0;

  console.log('📦 Đang tải ảnh và cập nhật thiết bị vào cơ sở dữ liệu...\n');

  for (const item of grouped.values()) {
    count++;
    let baseCode = getSuggestedCode(item.name, item.rawCode);
    let finalCode = baseCode;
    let suffix = 1;
    while (usedCodes.has(finalCode)) {
      finalCode = `${baseCode}-${suffix++}`;
    }
    usedCodes.add(finalCode);

    // Resolve Image
    let imageUrl = defaultPlaceholder;
    const localImgPath = resolveLocalImagePath(item.rawImg, imgWebDir);

    if (localImgPath) {
      const imgFileName = path.basename(localImgPath);
      if (imageUploadCache.has(imgFileName)) {
        imageUrl = imageUploadCache.get(imgFileName)!;
        console.log(`[${count}/${grouped.size}] [${finalCode}] "${item.name}" (Sử dụng URL ảnh đã upload: ${imgFileName})`);
      } else {
        try {
          console.log(`[${count}/${grouped.size}] [${finalCode}] Đang upload ảnh "${imgFileName}" lên Cloudinary...`);
          const uploadRes = await cloudinary.uploader.upload(localImgPath, {
            folder: 'equipment',
            use_filename: true,
            unique_filename: false,
          });
          imageUrl = uploadRes.secure_url;
          imageUploadCache.set(imgFileName, imageUrl);
          console.log(`   ☁️  Upload thành công: ${imageUrl}`);
        } catch (uploadError: any) {
          console.warn(`   ⚠️ Lỗi upload Cloudinary cho "${imgFileName}":`, uploadError?.message || uploadError);
          // Fallback to static uploads or default placeholder
          imageUrl = defaultPlaceholder;
        }
      }
    } else {
      console.warn(`[${count}/${grouped.size}] [${finalCode}] ⚠️ Không tìm thấy file ảnh cho "${item.rawImg}". Dùng ảnh mặc định.`);
    }

    try {
      await prisma.equipment.upsert({
        where: { code: finalCode },
        update: {
          name: item.name,
          category: item.category,
          description: item.description,
          image: imageUrl,
          quantity: item.quantity,
          availableQuantity: item.quantity,
          status: item.status,
        },
        create: {
          code: finalCode,
          name: item.name,
          category: item.category,
          description: item.description,
          image: imageUrl,
          quantity: item.quantity,
          availableQuantity: item.quantity,
          status: item.status,
        },
      });

      console.log(`   ✅ Đã lưu thiết bị: [${finalCode}] ${item.name} (Số lượng: ${item.quantity})\n`);
      successCount++;
    } catch (dbErr: any) {
      console.error(`   ❌ Lỗi lưu DB cho thiết bị [${finalCode}]:`, dbErr?.message || dbErr);
      failCount++;
    }
  }

  console.log('====================================================');
  console.log('🎉 TỔNG KẾT QUÁ TRÌNH IMPORT:');
  console.log(`   - Thành công: ${successCount} / ${grouped.size} thiết bị`);
  if (failCount > 0) {
    console.log(`   - Thất bại: ${failCount} thiết bị`);
  }
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nghiêm trọng:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
