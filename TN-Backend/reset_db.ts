import { PrismaClient, Role, EquipmentStatus } from '@prisma/client';
import { DEFAULT_HOMEPAGE_CONTENT } from './src/homepage-content/homepage-content.defaults';
import {
  DEFAULT_HOMEPAGE_GALLERY,
  DEFAULT_HOMEPAGE_SECTION,
  DEFAULT_HOMEPAGE_SERVICES,
} from './src/homepage-content/homepage.defaults';
import { repairHomepageContentDateFields } from './src/homepage-content/homepage-content.repair';

const prisma = new PrismaClient();

// The user ID to preserve (as a string). Prisma expects the string representation of the ObjectId.
const TARGET_USER_ID = '6a700fd2a1cda912d86d15ec';

async function main() {
  console.log('🔧 Starting database reset & regeneration...');

  // 1️⃣ Delete dependent records referencing User first
  await prisma.studioBooking.deleteMany({});
  console.log('🗑️ StudioBookings cleared.');
  await prisma.borrowRequest.deleteMany({});
  console.log('🗑️ BorrowRequests cleared.');

  // 2️⃣ Delete all other collections to start from scratch
  await prisma.equipment.deleteMany({});
  console.log('🗑️ Equipment cleared.');

  await prisma.equipmentCategory.deleteMany({});
  console.log('🗑️ Equipment categories cleared.');

  await prisma.homepageContent.deleteMany({});
  console.log('🗑️ Homepage content cleared.');

  await prisma.homepageService.deleteMany({});
  console.log('🗑️ Homepage services cleared.');

  await prisma.homepageGallery.deleteMany({});
  console.log('🗑️ Homepage gallery cleared.');

  await prisma.homepageSection.deleteMany({});
  console.log('🗑️ Homepage sections cleared.');

  // 3️⃣ Delete all users EXCEPT the target admin user
  await prisma.user.deleteMany({
    where: {
      NOT: { id: TARGET_USER_ID },
    },
  });
  console.log('🗑️ Other users cleared.');

  // 4️⃣ Ensure target user exists with the exact details requested
  const existingTargetUser = await prisma.user.findUnique({
    where: { id: TARGET_USER_ID },
  });

  const userData = {
    fullName: 'Hoàng Thiện',
    email: 'hoangthien110104@gmail.com',
    password: '$2b$10$9BN8h8L6bITtQ0FsqT0G8eML6L0tCKsxvhecTEbYDZkU1OQCGtgqy',
    employeeCode: 'NV001344',
    role: Role.ADMIN,
    avatarUrl: null,
    isActive: true,
    verificationToken: null,
    tokenExpiresAt: null,
    createdAt: new Date('2026-08-03T03:49:38.355Z'),
    updatedAt: new Date('2026-08-07T08:21:18.109Z'),
  };

  if (!existingTargetUser) {
    await prisma.user.create({
      data: {
        id: TARGET_USER_ID,
        ...userData,
      },
    });
    console.log('👤 Created target admin account: Hoàng Thiện');
  } else {
    await prisma.user.update({
      where: { id: TARGET_USER_ID },
      data: userData,
    });
    console.log('👤 Updated/Verified target admin account: Hoàng Thiện');
  }

  // 5️⃣ Regenerate Default / Seeding Data
  console.log('🌱 Seeding database...');

  // Repair content dates if necessary
  await repairHomepageContentDateFields(prisma);

  // Seed default categories
  const defaultCategories = ['Máy ảnh', 'Micro', 'Đèn', 'Tripod', 'Lens'];
  for (const catName of defaultCategories) {
    await prisma.equipmentCategory.create({
      data: { name: catName },
    });
  }
  console.log('✅ Categories regenerated.');

  // Seed default homepage content, services, gallery, sections
  await prisma.homepageContent.create({
    data: DEFAULT_HOMEPAGE_CONTENT,
  });
  await prisma.homepageService.createMany({ data: DEFAULT_HOMEPAGE_SERVICES });
  await prisma.homepageGallery.createMany({ data: DEFAULT_HOMEPAGE_GALLERY });
  await prisma.homepageSection.create({ data: DEFAULT_HOMEPAGE_SECTION });
  console.log('✅ Homepage content, services, gallery, sections regenerated.');

  // Seed default equipment items
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
  console.log('✅ Default equipments regenerated.');

  console.log('🎉 Database reset & regeneration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during reset & seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
