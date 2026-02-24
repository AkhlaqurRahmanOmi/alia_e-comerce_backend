import { seedRolesAndPermissions } from './seeds/01-master/roles-permissions.seed';
import { seedNotificationTemplates } from './seeds/01-master/notification-templates.seed';
import { seedShippingMethods } from './seeds/01-master/shipping-methods.seed';
import { seedLocations } from './seeds/01-master/locations.seed';
import { seedFashionCategories } from './seeds/02-fashion-catalog/categories.seed';
import { seedFashionSegments } from './seeds/02-fashion-catalog/segments.seed';
import { seedFashionProducts } from './seeds/02-fashion-catalog/products.seed';
import { seedFashionProductSegments } from './seeds/02-fashion-catalog/product-segments.seed';
import { seedSampleUsers } from './seeds/03-sample-data/users.seed';
import { seedSampleReviews } from './seeds/03-sample-data/reviews.seed';
import { createSeedPrismaClient } from './seed-prisma-client';

const { prisma, pool } = createSeedPrismaClient();

async function main() {
  console.log('🌱 Starting complete database seeding...\n');
  console.log('═'.repeat(60));
  console.log('  FASHION E-COMMERCE DATABASE SEEDING');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // PHASE 1: Master Data
    console.log('📦 PHASE 1: Master Data');
    console.log('─'.repeat(60));
    await seedRolesAndPermissions(prisma);
    console.log('');
    await seedNotificationTemplates(prisma);
    console.log('');
    await seedShippingMethods(prisma);
    console.log('');
    await seedLocations(prisma);
    console.log('');

    // PHASE 2: Fashion Catalog
    console.log('👗 PHASE 2: Fashion Catalog');
    console.log('─'.repeat(60));
    await seedFashionCategories(prisma);
    console.log('');
    await seedFashionSegments(prisma);
    console.log('');
    await seedFashionProducts(prisma);
    console.log('');
    await seedFashionProductSegments(prisma);
    console.log('');

    // PHASE 3: Sample Data
    console.log('🎭 PHASE 3: Sample Data');
    console.log('─'.repeat(60));
    await seedSampleUsers(prisma);
    console.log('');
    await seedSampleReviews(prisma);
    console.log('');

    // Summary
    console.log('═'.repeat(60));
    console.log('  SEEDING SUMMARY');
    console.log('═'.repeat(60));

    const roles = await prisma.role.count();
    const permissions = await prisma.permission.count();
    const templates = await prisma.notificationTemplate.count();
    const shipping = await prisma.shippingMethod.count();
    const categories = await prisma.category.count();
    const segments = await prisma.segment.count();
    const products = await prisma.product.count();
    const productSegments = await prisma.productSegment.count();
    const variants = await prisma.variant.count();
    const users = await prisma.user.count();
    const reviews = await prisma.review.count();

    console.log(`✅ Roles:                  ${roles}`);
    console.log(`✅ Permissions:            ${permissions}`);
    console.log(`✅ Notification Templates: ${templates}`);
    console.log(`✅ Shipping Methods:       ${shipping}`);
    console.log(`✅ Categories:             ${categories}`);
    console.log(`✅ Segments:               ${segments}`);
    console.log(`✅ Products:               ${products}`);
    console.log(`✅ Product Segments:       ${productSegments}`);
    console.log(`✅ Product Variants:       ${variants}`);
    console.log(`✅ Users:                  ${users}`);
    console.log(`✅ Reviews:                ${reviews}`);
    console.log('═'.repeat(60));
    console.log('');
    console.log('✅ Complete database seeding finished successfully!');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('   Admin:    admin@fashion.com / Password@123');
    console.log('   Manager:  manager@fashion.com / Password@123');
    console.log('   Customer: customer1@fashion.com / Password@123');
    console.log('');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
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
