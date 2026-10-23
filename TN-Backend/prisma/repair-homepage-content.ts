import { PrismaClient } from '@prisma/client';
import { repairHomepageContentDateFields } from '../src/homepage-content/homepage-content.repair';

const prisma = new PrismaClient();

async function main() {
  console.log('Repairing HomepageContent date fields...');
  const repairedCount = await repairHomepageContentDateFields(prisma);
  console.log(`Repair finished. ${repairedCount} field update(s) applied.`);
}

main()
  .catch((error) => {
    console.error('HomepageContent repair failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
