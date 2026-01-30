import { PrismaClient } from '@prisma/client';
import { seedSampleUsers } from './seeds/03-sample-data/users.seed';
import { seedSampleReviews } from './seeds/03-sample-data/reviews.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting sample data seeding...\n');

  try {
    // Seed users first (reviews depend on users)
    await seedSampleUsers(prisma);
    console.log('');

    // Seed reviews
    await seedSampleReviews(prisma);
    console.log('');

    console.log('✅ Sample data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Sample data seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
