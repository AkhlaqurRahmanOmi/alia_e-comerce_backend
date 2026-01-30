import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping of old permissions to new granular permissions
const OLD_TO_NEW_PERMISSION_MAP = {
  'manage:users': ['users:view', 'users:create', 'users:update', 'users:delete'],
  'manage:products': ['products:view', 'products:create', 'products:update', 'products:delete'],
  'manage:orders': ['orders:view', 'orders:create', 'orders:update', 'orders:delete'],
  'manage:inventory': ['inventory:view', 'inventory:create', 'inventory:update', 'inventory:delete'],
  'manage:bundles': ['bundles:view', 'bundles:create', 'bundles:update', 'bundles:delete'],
  'manage:coupons': ['coupons:view', 'coupons:create', 'coupons:update', 'coupons:delete'],
  'view:reports': ['reports:view'],
};

// All modules that need permissions
const MODULES = [
  'users',
  'roles',
  'products',
  'categories',
  'inventory',
  'orders',
  'carts',
  'reviews',
  'coupons',
  'bundles',
  'shipping',
  'payments',
  'notifications',
  'reports',
  'wishlists',
  'addresses',
] as const;

// Standard CRUD actions
const CRUD_ACTIONS = ['view', 'create', 'update', 'delete'] as const;

// Special permissions for specific modules
const SPECIAL_PERMISSIONS = [
  { name: 'orders:cancel', description: 'Cancel orders' },
  { name: 'orders:refund', description: 'Refund orders' },
  { name: 'orders:approve', description: 'Approve orders' },
  { name: 'reports:export', description: 'Export reports' },
  { name: 'inventory:adjust', description: 'Adjust inventory levels' },
  { name: 'inventory:transfer', description: 'Transfer inventory between locations' },
  { name: 'reviews:approve', description: 'Approve reviews' },
  { name: 'reviews:reject', description: 'Reject reviews' },
  { name: 'coupons:activate', description: 'Activate coupons' },
  { name: 'coupons:deactivate', description: 'Deactivate coupons' },
  { name: 'coupons:assign', description: 'Assign coupons to products, categories, or users' },
  { name: 'notifications:send', description: 'Send notifications' },
  { name: 'users:assign-roles', description: 'Assign roles to users' },
  { name: 'users:remove-roles', description: 'Remove roles from users' },
];

// Role-permission mappings for new roles/modules
const ROLE_PERMISSIONS = {
  ADMIN: 'all', // Admin gets all permissions
  MANAGER: [
    // Products
    'products:view',
    'products:create',
    'products:update',
    'products:delete',
    // Categories
    'categories:view',
    'categories:create',
    'categories:update',
    'categories:delete',
    // Inventory
    'inventory:view',
    'inventory:create',
    'inventory:update',
    'inventory:adjust',
    'inventory:transfer',
    // Orders
    'orders:view',
    'orders:update',
    'orders:cancel',
    'orders:approve',
    // Reviews
    'reviews:view',
    'reviews:approve',
    'reviews:reject',
    'reviews:delete',
    // Coupons
    'coupons:view',
    'coupons:create',
    'coupons:update',
    'coupons:delete',
    'coupons:activate',
    'coupons:deactivate',
    'coupons:assign',
    // Bundles
    'bundles:view',
    'bundles:create',
    'bundles:update',
    'bundles:delete',
    // Reports
    'reports:view',
    'reports:export',
    // Users (limited)
    'users:view',
    // Shipping
    'shipping:view',
    'shipping:create',
    'shipping:update',
    // Notifications
    'notifications:view',
    'notifications:send',
  ],
  CUSTOMER: [
    // Products (read-only for customers)
    'products:view',
    'categories:view',
    // Orders (own orders only - enforced in code)
    'orders:view',
    'orders:create',
    'orders:cancel',
    // Carts
    'carts:view',
    'carts:create',
    'carts:update',
    'carts:delete',
    // Reviews
    'reviews:view',
    'reviews:create',
    'reviews:update',
    'reviews:delete',
    // Wishlists
    'wishlists:view',
    'wishlists:create',
    'wishlists:update',
    'wishlists:delete',
    // Addresses
    'addresses:view',
    'addresses:create',
    'addresses:update',
    'addresses:delete',
    // Notifications (own notifications)
    'notifications:view',
    // Shipping (view only)
    'shipping:view',
  ],
};

async function main() {
  console.log('🔄 Starting permissions migration...\n');

  // ============================================
  // 1. FETCH OLD PERMISSIONS AND THEIR ROLES
  // ============================================
  console.log('📋 Fetching existing permissions and role assignments...');

  const oldPermissions = await prisma.permission.findMany({
    include: {
      rolePermissions: {
        include: {
          role: true,
        },
      },
    },
  });

  console.log(`   ✅ Found ${oldPermissions.length} existing permissions\n`);

  // ============================================
  // 2. CREATE NEW PERMISSIONS
  // ============================================
  console.log('🔐 Creating new granular permissions...');

  const createdPermissions: Map<string, number> = new Map();

  // Create all CRUD permissions for each module
  for (const module of MODULES) {
    for (const action of CRUD_ACTIONS) {
      const permissionName = `${module}:${action}`;

      // Check if permission already exists
      let permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        permission = await prisma.permission.create({
          data: {
            name: permissionName,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module}`,
          },
        });
      }

      createdPermissions.set(permissionName, permission.id);
    }
  }

  console.log(`   ✅ Created/verified ${MODULES.length * CRUD_ACTIONS.length} CRUD permissions`);

  // Create special permissions
  for (const specialPerm of SPECIAL_PERMISSIONS) {
    let permission = await prisma.permission.findUnique({
      where: { name: specialPerm.name },
    });

    if (!permission) {
      permission = await prisma.permission.create({
        data: specialPerm,
      });
    }

    createdPermissions.set(specialPerm.name, permission.id);
  }

  console.log(`   ✅ Created/verified ${SPECIAL_PERMISSIONS.length} special permissions\n`);

  // ============================================
  // 3. MIGRATE OLD PERMISSIONS TO NEW ONES
  // ============================================
  console.log('🔄 Migrating old permissions to new granular permissions...');

  let migratedCount = 0;

  for (const oldPermission of oldPermissions) {
    const newPermissionNames = OLD_TO_NEW_PERMISSION_MAP[oldPermission.name];

    if (newPermissionNames) {
      console.log(`   📦 Migrating "${oldPermission.name}"...`);

      // For each role that had the old permission
      for (const rolePermission of oldPermission.rolePermissions) {
        const roleId = rolePermission.roleId;

        // Assign all new granular permissions to that role
        for (const newPermName of newPermissionNames) {
          const newPermId = createdPermissions.get(newPermName);

          if (newPermId) {
            // Check if role-permission relationship already exists
            const existingRolePerm = await prisma.rolePermission.findUnique({
              where: {
                roleId_permissionId: {
                  roleId,
                  permissionId: newPermId,
                },
              },
            });

            if (!existingRolePerm) {
              await prisma.rolePermission.create({
                data: {
                  roleId,
                  permissionId: newPermId,
                },
              });
              migratedCount++;
            }
          }
        }
      }

      // Delete old role-permission relationships
      await prisma.rolePermission.deleteMany({
        where: { permissionId: oldPermission.id },
      });

      // Delete old permission
      await prisma.permission.delete({
        where: { id: oldPermission.id },
      });

      console.log(`      ✅ Migrated to ${newPermissionNames.length} new permissions`);
    } else {
      console.log(`   ⚠️  No migration mapping for "${oldPermission.name}" - keeping as is`);
    }
  }

  console.log(`   ✅ Migrated ${migratedCount} permission assignments\n`);

  // ============================================
  // 4. ENSURE ROLES EXIST AND ASSIGN PERMISSIONS
  // ============================================
  console.log('👥 Ensuring roles have correct permissions...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'Administrator with full system access' },
    create: {
      name: 'ADMIN',
      description: 'Administrator with full system access',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: { description: 'Manager with extended access to manage products, inventory, and orders' },
    create: {
      name: 'MANAGER',
      description: 'Manager with extended access to manage products, inventory, and orders',
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: { description: 'Customer with access to shopping features' },
    create: {
      name: 'CUSTOMER',
      description: 'Customer with access to shopping features',
    },
  });

  // Assign ALL permissions to ADMIN (if not already assigned)
  const allPermissionIds = Array.from(createdPermissions.values());
  let adminPermCount = 0;
  for (const permissionId of allPermissionIds) {
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId,
        },
      },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId,
        },
      });
      adminPermCount++;
    }
  }
  console.log(`   ✅ Ensured ADMIN has all ${allPermissionIds.length} permissions (added ${adminPermCount} new)`);

  // Assign specific permissions to MANAGER
  const managerPermissions = ROLE_PERMISSIONS.MANAGER;
  let managerPermCount = 0;
  for (const permName of managerPermissions) {
    const permissionId = createdPermissions.get(permName);
    if (permissionId) {
      const existing = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId,
          },
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: managerRole.id,
            permissionId,
          },
        });
        managerPermCount++;
      }
    }
  }
  console.log(`   ✅ Ensured MANAGER has ${managerPermissions.length} permissions (added ${managerPermCount} new)`);

  // Assign specific permissions to CUSTOMER
  const customerPermissions = ROLE_PERMISSIONS.CUSTOMER;
  let customerPermCount = 0;
  for (const permName of customerPermissions) {
    const permissionId = createdPermissions.get(permName);
    if (permissionId) {
      const existing = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: customerRole.id,
            permissionId,
          },
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: customerRole.id,
            permissionId,
          },
        });
        customerPermCount++;
      }
    }
  }
  console.log(`   ✅ Ensured CUSTOMER has ${customerPermissions.length} permissions (added ${customerPermCount} new)\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('🎉 Permissions migration completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Total Permissions: ${createdPermissions.size}`);
  console.log(`   - CRUD Permissions: ${MODULES.length * CRUD_ACTIONS.length}`);
  console.log(`   - Special Permissions: ${SPECIAL_PERMISSIONS.length}`);
  console.log(`   - Modules Covered: ${MODULES.length}`);
  console.log(`   - Old Permissions Migrated: ${Object.keys(OLD_TO_NEW_PERMISSION_MAP).length}`);
  console.log(`   - Roles: 3 (ADMIN, MANAGER, CUSTOMER)`);
  console.log(`   - ADMIN permissions: ${allPermissionIds.length} (all)`);
  console.log(`   - MANAGER permissions: ${managerPermissions.length}`);
  console.log(`   - CUSTOMER permissions: ${customerPermissions.length}\n`);

  console.log('📋 Migration mapping:');
  Object.entries(OLD_TO_NEW_PERMISSION_MAP).forEach(([oldPerm, newPerms]) => {
    console.log(`   ✓ ${oldPerm} → ${newPerms.join(', ')}`);
  });

  console.log('\n📋 Modules with full CRUD permissions:');
  MODULES.forEach((module) => {
    console.log(`   - ${module}: view, create, update, delete`);
  });

  console.log('\n📋 Special permissions:');
  SPECIAL_PERMISSIONS.forEach((perm) => {
    console.log(`   - ${perm.name}: ${perm.description}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during permissions migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
