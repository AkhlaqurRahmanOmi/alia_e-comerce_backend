import { PrismaClient } from '@prisma/client';
import { seedRolesAndPermissions } from './seeds/01-master/roles-permissions.seed';
import { seedNotificationTemplates } from './seeds/01-master/notification-templates.seed';
import { seedShippingMethods } from './seeds/01-master/shipping-methods.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting master data seeding...\n');

  try {
    // Seed roles and permissions
    await seedRolesAndPermissions(prisma);
    console.log('');

    // Seed notification templates
    await seedNotificationTemplates(prisma);
    console.log('');

    // Seed shipping methods
    await seedShippingMethods(prisma);
    console.log('');

    console.log('✅ Master data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Master data seeding failed:', error);
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
