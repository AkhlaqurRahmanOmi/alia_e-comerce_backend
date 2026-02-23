import { seedFashionCategories } from './seeds/02-fashion-catalog/categories.seed';
import { seedFashionProducts } from './seeds/02-fashion-catalog/products.seed';
import { createSeedPrismaClient } from './seed-prisma-client';

const { prisma, pool } = createSeedPrismaClient();

async function main() {
  console.log('🌱 Starting fashion catalog seeding...\n');

  try {
    // Seed categories first (products depend on categories)
    await seedFashionCategories(prisma);
    console.log('');

    // Seed products
    await seedFashionProducts(prisma);
    console.log('');

    console.log('✅ Fashion catalog seeding completed successfully!');
  } catch (error) {
    console.error('❌ Fashion catalog seeding failed:', error);
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
