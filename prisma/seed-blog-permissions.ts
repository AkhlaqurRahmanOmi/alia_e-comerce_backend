import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BLOG_PERMISSIONS = [
  'blog:view',
  'blog:create',
  'blog:update',
  'blog:delete',
  'blog:publish',
] as const;

type BlogPermission = typeof BLOG_PERMISSIONS[number];

async function ensurePermission(name: BlogPermission, description?: string) {
  const perm = await prisma.permission.upsert({
    where: { name },
    update: { description },
    create: { name, description: description ?? name },
  });
  return perm.id;
}

async function ensureRole(name: 'ADMIN' | 'MANAGER' | 'CUSTOMER', description: string) {
  const role = await prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
  return role.id;
}

async function attachPermissionToRole(roleId: number, permissionId: number) {
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    update: {},
    create: { roleId, permissionId },
  });
}

async function main() {
  console.log('🔐 Seeding blog permissions...');

  // 1) Ensure blog permissions exist
  const permIds = new Map<BlogPermission, number>();
  for (const perm of BLOG_PERMISSIONS) {
    const id = await ensurePermission(
      perm,
      {
        'blog:view': 'View blog posts',
        'blog:create': 'Create blog posts',
        'blog:update': 'Update blog posts',
        'blog:delete': 'Delete blog posts',
        'blog:publish': 'Publish and unpublish blog posts',
      }[perm],
    );
    permIds.set(perm, id);
  }

  // 2) Ensure roles exist
  const adminRoleId = await ensureRole('ADMIN', 'Administrator with full system access');
  const managerRoleId = await ensureRole('MANAGER', 'Manager with access to manage blog and catalog');
  const customerRoleId = await ensureRole('CUSTOMER', 'Customer with access to shopping features');

  // 3) Assign blog permissions to roles
  // ADMIN: all blog permissions
  for (const id of permIds.values()) {
    await attachPermissionToRole(adminRoleId, id);
  }

  // MANAGER: blog CRUD + publish
  for (const key of ['blog:view', 'blog:create', 'blog:update', 'blog:delete', 'blog:publish'] as BlogPermission[]) {
    const id = permIds.get(key)!;
    await attachPermissionToRole(managerRoleId, id);
  }

  // CUSTOMER: blog:view only
  await attachPermissionToRole(customerRoleId, permIds.get('blog:view')!);

  console.log('✅ Blog permissions seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding blog permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
