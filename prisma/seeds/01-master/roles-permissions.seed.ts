import { PrismaClient } from '../../../src/generated/prisma/client';

export async function seedRolesAndPermissions(prisma: PrismaClient) {
  console.log('📝 Seeding roles and permissions...');

  // Define all permissions from controllers
  const permissions = [
    // Products & Catalog
    { name: 'products:create', description: 'Create products' },
    { name: 'products:update', description: 'Update products' },
    { name: 'products:delete', description: 'Delete products' },
    { name: 'categories:create', description: 'Create categories' },
    { name: 'categories:update', description: 'Update categories' },
    { name: 'categories:delete', description: 'Delete categories' },

    // Orders & Cart
    { name: 'orders:create', description: 'Create orders' },
    { name: 'orders:view', description: 'View orders' },
    { name: 'orders:update', description: 'Update orders' },
    { name: 'orders:cancel', description: 'Cancel orders' },
    { name: 'carts:view', description: 'View carts' },
    { name: 'carts:update', description: 'Update carts' },
    { name: 'carts:delete', description: 'Delete carts' },

    // Inventory
    { name: 'inventory:create', description: 'Create inventory records' },
    { name: 'inventory:view', description: 'View inventory' },
    { name: 'inventory:update', description: 'Update inventory' },
    { name: 'inventory:delete', description: 'Delete inventory' },
    { name: 'inventory:adjust', description: 'Adjust inventory quantities' },
    { name: 'inventory:transfer', description: 'Transfer inventory between locations' },

    // Users & RBAC
    { name: 'users:create', description: 'Create users' },
    { name: 'users:view', description: 'View users' },
    { name: 'users:update', description: 'Update users' },
    { name: 'users:delete', description: 'Delete users' },
    { name: 'roles:create', description: 'Create roles' },
    { name: 'roles:view', description: 'View roles' },
    { name: 'roles:update', description: 'Update roles' },
    { name: 'roles:delete', description: 'Delete roles' },
    { name: 'roles:assign', description: 'Assign roles to users' },
    { name: 'permissions:create', description: 'Create permissions' },
    { name: 'permissions:view', description: 'View permissions' },
    { name: 'permissions:update', description: 'Update permissions' },
    { name: 'permissions:delete', description: 'Delete permissions' },

    // Reports
    { name: 'reports:view', description: 'View reports' },

    // Coupons
    { name: 'coupons:create', description: 'Create coupons' },
    { name: 'coupons:view', description: 'View coupons' },
    { name: 'coupons:update', description: 'Update coupons' },
    { name: 'coupons:delete', description: 'Delete coupons' },
    { name: 'coupons:assign', description: 'Assign coupons to products/categories/users' },

    // Bundles
    { name: 'bundles:create', description: 'Create product bundles' },
    { name: 'bundles:update', description: 'Update bundles' },
    { name: 'bundles:delete', description: 'Delete bundles' },

    // Notifications
    { name: 'notifications:send', description: 'Send notifications' },
    { name: 'notifications:view', description: 'View notifications' },
    { name: 'notifications:update', description: 'Update notifications' },
    { name: 'notifications:delete', description: 'Delete notifications' },

    // CMS
    { name: 'cms:view', description: 'View CMS content' },
    { name: 'cms:update', description: 'Update CMS content' },

    // Blog
    { name: 'blog:create', description: 'Create blog posts' },
    { name: 'blog:view', description: 'View blog posts' },
    { name: 'blog:update', description: 'Update blog posts' },
    { name: 'blog:delete', description: 'Delete blog posts' },
    { name: 'blog:publish', description: 'Publish blog posts' },

    // Reviews
    { name: 'reviews:create', description: 'Create product reviews' },
    { name: 'reviews:update', description: 'Update reviews' },
    { name: 'reviews:delete', description: 'Delete reviews' },
    { name: 'reviews:approve', description: 'Approve/moderate reviews' },

    // Bookings
    { name: 'bookings:view', description: 'View bookings' },
    { name: 'bookings:update', description: 'Update bookings' },
    { name: 'bookings:delete', description: 'Delete bookings' },
    { name: 'bookings:manage-settings', description: 'Manage booking settings' },

    // Shipping
    { name: 'shipping:view', description: 'View shipping methods' },
    { name: 'shipping:create', description: 'Create shipping methods' },
    { name: 'shipping:update', description: 'Update shipping methods' },
    { name: 'shipping:delete', description: 'Delete shipping methods' },

    // Countries
    { name: 'countries:view', description: 'View countries' },
    { name: 'countries:create', description: 'Create countries' },
    { name: 'countries:update', description: 'Update countries' },
    { name: 'countries:delete', description: 'Delete countries' },
  ];

  // Upsert all permissions
  const createdPermissions: { id: number; name: string }[] = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ Created/updated ${createdPermissions.length} permissions`);

  // Define roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrator with full system access',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Store manager with operational access',
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'Customer' },
    update: {},
    create: {
      name: 'Customer',
      description: 'Regular customer with basic access',
    },
  });

  console.log('✅ Created/updated 3 roles');

  // Assign all permissions to Admin
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`✅ Assigned all permissions to Admin role`);

  // Manager permissions (no users, roles, permissions, cms management)
  const managerPermissionNames = [
    'products:create', 'products:update', 'products:delete',
    'categories:create', 'categories:update', 'categories:delete',
    'orders:create', 'orders:view', 'orders:update', 'orders:cancel',
    'carts:view', 'carts:update', 'carts:delete',
    'inventory:create', 'inventory:view', 'inventory:update', 'inventory:delete',
    'inventory:adjust', 'inventory:transfer',
    'reports:view',
    'coupons:create', 'coupons:view', 'coupons:update', 'coupons:delete', 'coupons:assign',
    'bundles:create', 'bundles:update', 'bundles:delete',
    'reviews:create', 'reviews:update', 'reviews:delete', 'reviews:approve',
    'shipping:view', 'shipping:create', 'shipping:update', 'shipping:delete',
    'bookings:view', 'bookings:update', 'bookings:delete', 'bookings:manage-settings',
  ];

  for (const permName of managerPermissionNames) {
    const permission = createdPermissions.find((p) => p.name === permName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(`✅ Assigned operational permissions to Manager role`);

  // Customer permissions (basic access)
  const customerPermissionNames = [
    'orders:create', 'orders:view', 'orders:cancel',
    'carts:view', 'carts:update',
    'reviews:create', 'reviews:update', 'reviews:delete',
  ];

  for (const permName of customerPermissionNames) {
    const permission = createdPermissions.find((p) => p.name === permName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: customerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: customerRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(`✅ Assigned customer permissions to Customer role`);
  console.log('✅ Roles and permissions seeding completed!');
}

