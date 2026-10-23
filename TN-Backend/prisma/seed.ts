import { PrismaClient, Role, EquipmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_HOMEPAGE_CONTENT } from '../src/homepage-content/homepage-content.defaults';
import {
  DEFAULT_HOMEPAGE_GALLERY,
  DEFAULT_HOMEPAGE_SECTION,
  DEFAULT_HOMEPAGE_SERVICES,
} from '../src/homepage-content/homepage.defaults';
import { repairHomepageContentDateFields } from '../src/homepage-content/homepage-content.repair';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await repairHomepageContentDateFields(prisma);

  // Create admin user
  const adminEmail = 'admin@studio.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    const admin = await prisma.user.create({
      data: {
        fullName: 'Studio Administrator',
        email: adminEmail,
        password: hashedPassword,
        employeeCode: 'ADMIN001',
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log('Admin account created:', admin.email);
  } else {
    console.log('Admin account already exists:', existingAdmin.email);
  }

  // Create Hoàng Thiện's admin account with a fixed _id
  const hoangThienId = '6a700fd2a1cda912d86d15ec';
  const hoangThienEmail = 'hoangthien110104@gmail.com';
  const existingHoangThien = await prisma.user.findUnique({
    where: { email: hoangThienEmail },
  });

  if (!existingHoangThien) {
    await prisma.user.create({
      data: {
        id: hoangThienId,
        fullName: 'Hoàng Thiện',
        email: hoangThienEmail,
        // Pre-hashed password (already bcrypt hashed)
        password: '$2b$10$9BN8h8L6bITtQ0FsqT0G8eML6L0tCKsxvhecTEbYDZkU1OQCGtgqy',
        employeeCode: 'NV001344',
        role: Role.ADMIN,
        isActive: true,
        avatarUrl: null,
        verificationToken: null,
        tokenExpiresAt: null,
      },
    });
    console.log('Hoàng Thiện admin account created:', hoangThienEmail);
  } else {
    console.log('Hoàng Thiện account already exists:', existingHoangThien.email);
  }


  // Create default categories (Máy ảnh, Micro, Đèn, Tripod, Lens)
  const defaultCategories = ['Máy ảnh', 'Micro', 'Đèn', 'Tripod', 'Lens'];
  for (const catName of defaultCategories) {
    const existingCat = await prisma.equipmentCategory.findUnique({
      where: { name: catName },
    });
    if (!existingCat) {
      await prisma.equipmentCategory.create({
        data: { name: catName },
      });
      console.log(`Category seeded: ${catName}`);
    }
  }

  // ──────────────────────────────────────────────
  // Seed homepage data (always delete & recreate)
  // ──────────────────────────────────────────────

  // HomepageContent
  await prisma.homepageContent.deleteMany();
  await prisma.homepageContent.create({ data: DEFAULT_HOMEPAGE_CONTENT });
  console.log('✅ HomepageContent regenerated.');

  // HomepageService
  await prisma.homepageService.deleteMany();
  await prisma.homepageService.createMany({ data: DEFAULT_HOMEPAGE_SERVICES });
  console.log('✅ HomepageService items regenerated.');

  // HomepageGallery
  await prisma.homepageGallery.deleteMany();
  await prisma.homepageGallery.createMany({ data: DEFAULT_HOMEPAGE_GALLERY });
  console.log('✅ HomepageGallery items regenerated.');

  // HomepageSection
  await prisma.homepageSection.deleteMany();
  await prisma.homepageSection.create({ data: DEFAULT_HOMEPAGE_SECTION });
  console.log('✅ HomepageSection regenerated.');


  // Create some default equipments if empty
  const equipmentCount = await prisma.equipment.count();
  if (equipmentCount === 0) {
    const sampleEquipments = [
      {
        code: 'CAM-SONY-A7S3',
        name: 'Máy ảnh Sony Alpha A7S III',
        category: 'Máy ảnh',
        description: 'Máy ảnh quay phim chuyên nghiệp 4K 120fps lý tưởng cho Studio.',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60',
        quantity: 5,
        availableQuantity: 5,
        status: EquipmentStatus.AVAILABLE,
      },
      {
        code: 'LENS-SONY-2470GM',
        name: 'Ống kính Sony FE 24-70mm f/2.8 GM II',
        category: 'Lens',
        description: 'Ống kính zoom tiêu chuẩn khẩu độ lớn f/2.8 chất lượng tối cao.',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=60',
        quantity: 3,
        availableQuantity: 3,
        status: EquipmentStatus.AVAILABLE,
      },
      {
        code: 'MIC-RODE-WIRELESS',
        name: 'Microphone Rode Wireless PRO',
        category: 'Micro',
        description: 'Bộ microphone thu âm không dây 2 kênh chuyên nghiệp thu âm podcast và quay video.',
        image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=60',
        quantity: 10,
        availableQuantity: 10,
        status: EquipmentStatus.AVAILABLE,
      },
      {
        code: 'LIGHT-APUTURE-600D',
        name: 'Đèn Studio Aputure LS 600d Pro',
        category: 'Đèn',
        description: 'Đèn LED COB nguồn điểm ánh sáng ban ngày siêu sáng cho Studio.',
        image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60',
        quantity: 2,
        availableQuantity: 2,
        status: EquipmentStatus.AVAILABLE,
      },
    ];

    for (const eq of sampleEquipments) {
      await prisma.equipment.create({ data: eq });
    }
    console.log('Sample equipments seeded.');
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
