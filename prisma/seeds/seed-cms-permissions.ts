import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CMS_PERMISSIONS = [
  'cms:read',
  'cms:update',
  'cms:manage',
] as const;

type CmsPermission = typeof CMS_PERMISSIONS[number];

async function ensurePermission(name: CmsPermission, description?: string) {
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
  console.log('🔐 Seeding CMS permissions...');

  // 1) Ensure CMS permissions exist
  const permIds = new Map<CmsPermission, number>();

  const cmsReadId = await ensurePermission('cms:read', 'View CMS homepage sections');
  permIds.set('cms:read', cmsReadId);

  const cmsUpdateId = await ensurePermission('cms:update', 'Update CMS homepage sections');
  permIds.set('cms:update', cmsUpdateId);

  const cmsManageId = await ensurePermission('cms:manage', 'Full CMS management access');
  permIds.set('cms:manage', cmsManageId);

  console.log(`   ✅ Created/verified ${CMS_PERMISSIONS.length} CMS permissions`);

  // 2) Ensure roles exist
  const adminRoleId = await ensureRole('ADMIN', 'Administrator with full system access');
  const managerRoleId = await ensureRole('MANAGER', 'Manager with access to manage content and catalog');
  const customerRoleId = await ensureRole('CUSTOMER', 'Customer with access to shopping features');

  // 3) Assign CMS permissions to roles

  // ADMIN: all CMS permissions
  for (const id of permIds.values()) {
    await attachPermissionToRole(adminRoleId, id);
  }
  console.log(`   ✅ Assigned all CMS permissions to ADMIN role`);

  // MANAGER: cms:read and cms:update (but not cms:manage)
  await attachPermissionToRole(managerRoleId, permIds.get('cms:read')!);
  await attachPermissionToRole(managerRoleId, permIds.get('cms:update')!);
  console.log(`   ✅ Assigned cms:read and cms:update permissions to MANAGER role`);

  // CUSTOMER: no CMS permissions (customers don't need to manage CMS)
  console.log(`   ✅ No CMS permissions assigned to CUSTOMER role (as expected)`);

  // 4) Verify ADMIN role has ID 1 and assign permissions directly if needed
  const adminRole = await prisma.role.findUnique({ where: { id: 1 } });
  if (adminRole && adminRole.name === 'ADMIN') {
    console.log(`   ✅ Confirmed ADMIN role has ID 1`);

    // Double-check all CMS permissions are assigned to role ID 1
    for (const [permName, permId] of permIds.entries()) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: 1, permissionId: permId } },
        update: {},
        create: { roleId: 1, permissionId: permId },
      });
    }
    console.log(`   ✅ Ensured all CMS permissions are assigned to ADMIN role (ID: 1)`);
  } else {
    console.log(`   ⚠️  ADMIN role does not have ID 1. Current ADMIN role ID: ${adminRoleId}`);
  }

  console.log('✅ CMS permissions seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding CMS permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
