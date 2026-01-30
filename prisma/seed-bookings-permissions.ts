import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bookings module permissions
const BOOKINGS_CRUD_PERMISSIONS = ['view', 'create', 'update', 'delete'] as const;

const BOOKINGS_SPECIAL_PERMISSIONS = [
  { name: 'bookings:cancel', description: 'Cancel bookings' },
  { name: 'bookings:manage-settings', description: 'Manage booking settings, blocked dates, and custom schedules' },
];

async function main() {
  console.log('🔄 Starting bookings permissions seed...\n');

  // ============================================
  // 1. CREATE BOOKINGS PERMISSIONS
  // ============================================
  console.log('🔐 Creating bookings permissions...');

  const createdPermissions: Map<string, number> = new Map();

  // Create CRUD permissions for bookings
  for (const action of BOOKINGS_CRUD_PERMISSIONS) {
    const permissionName = `bookings:${action}`;

    let permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      permission = await prisma.permission.create({
        data: {
          name: permissionName,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} bookings`,
        },
      });
      console.log(`   ✅ Created permission: ${permissionName}`);
    } else {
      console.log(`   ℹ️  Permission already exists: ${permissionName}`);
    }

    createdPermissions.set(permissionName, permission.id);
  }

  // Create special permissions
  for (const specialPerm of BOOKINGS_SPECIAL_PERMISSIONS) {
    let permission = await prisma.permission.findUnique({
      where: { name: specialPerm.name },
    });

    if (!permission) {
      permission = await prisma.permission.create({
        data: specialPerm,
      });
      console.log(`   ✅ Created special permission: ${specialPerm.name}`);
    } else {
      console.log(`   ℹ️  Permission already exists: ${specialPerm.name}`);
    }

    createdPermissions.set(specialPerm.name, permission.id);
  }

  console.log(`\n   ✅ Total permissions created/verified: ${createdPermissions.size}\n`);

  // ============================================
  // 2. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  console.log('👥 Assigning bookings permissions to roles...\n');

  // Get roles
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });

  if (!adminRole || !managerRole || !customerRole) {
    console.error('❌ Error: Required roles not found. Please run the main seed first.');
    process.exit(1);
  }

  // ADMIN gets all bookings permissions
  console.log('🔑 Assigning permissions to ADMIN...');
  let adminCount = 0;
  for (const [permName, permId] of createdPermissions) {
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permId,
        },
      },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permId,
        },
      });
      adminCount++;
    }
  }
  console.log(`   ✅ ADMIN: ${adminCount} new permissions assigned (${createdPermissions.size} total)\n`);

  // MANAGER gets all bookings permissions
  console.log('🔑 Assigning permissions to MANAGER...');
  let managerCount = 0;
  for (const [permName, permId] of createdPermissions) {
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permId,
        },
      },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: managerRole.id,
          permissionId: permId,
        },
      });
      managerCount++;
    }
  }
  console.log(`   ✅ MANAGER: ${managerCount} new permissions assigned (${createdPermissions.size} total)\n`);

  // CUSTOMER gets view permission only (to view their own bookings)
  console.log('🔑 Assigning permissions to CUSTOMER...');
  const customerPermissions = ['bookings:view', 'bookings:create', 'bookings:cancel'];
  let customerCount = 0;

  for (const permName of customerPermissions) {
    const permId = createdPermissions.get(permName);
    if (permId) {
      const existing = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: customerRole.id,
            permissionId: permId,
          },
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: customerRole.id,
            permissionId: permId,
          },
        });
        customerCount++;
      }
    }
  }
  console.log(`   ✅ CUSTOMER: ${customerCount} new permissions assigned (${customerPermissions.length} total)\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('🎉 Bookings permissions seed completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Total Permissions: ${createdPermissions.size}`);
  console.log(`   - CRUD Permissions: ${BOOKINGS_CRUD_PERMISSIONS.length}`);
  console.log(`   - Special Permissions: ${BOOKINGS_SPECIAL_PERMISSIONS.length}`);
  console.log(`   - ADMIN permissions: ${createdPermissions.size} (all)`);
  console.log(`   - MANAGER permissions: ${createdPermissions.size} (all)`);
  console.log(`   - CUSTOMER permissions: ${customerPermissions.length}\n`);

  console.log('📋 Bookings permissions created:');
  console.log('   CRUD Permissions:');
  BOOKINGS_CRUD_PERMISSIONS.forEach((action) => {
    console.log(`      ✓ bookings:${action}`);
  });
  console.log('   Special Permissions:');
  BOOKINGS_SPECIAL_PERMISSIONS.forEach((perm) => {
    console.log(`      ✓ ${perm.name}: ${perm.description}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during bookings permissions seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
