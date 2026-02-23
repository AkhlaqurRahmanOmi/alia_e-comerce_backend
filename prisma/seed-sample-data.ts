import { seedSampleUsers } from './seeds/03-sample-data/users.seed';
import { seedSampleReviews } from './seeds/03-sample-data/reviews.seed';
import { createSeedPrismaClient } from './seed-prisma-client';

const { prisma, pool } = createSeedPrismaClient();

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
    await pool.end();
  });
