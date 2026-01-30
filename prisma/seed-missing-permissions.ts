import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script to add missing RBAC and Country module permissions
 * and assign them to the ADMIN role
 */
async function seedMissingPermissions() {
  try {
    console.log('Starting to seed missing permissions...\n');

    // Define missing permissions
    const missingPermissions = [
      // RBAC Module Permissions
      {
        name: 'roles:assign',
        description: 'Assign permissions to roles',
      },
      {
        name: 'permissions:create',
        description: 'Create new permissions',
      },
      {
        name: 'permissions:read',
        description: 'View permissions',
      },
      {
        name: 'permissions:update',
        description: 'Update existing permissions',
      },
      {
        name: 'permissions:delete',
        description: 'Delete permissions',
      },
      // Country Module Permissions
      {
        name: 'countries:create',
        description: 'Create new countries',
      },
      {
        name: 'countries:read',
        description: 'View countries',
      },
      {
        name: 'countries:update',
        description: 'Update existing countries',
      },
      {
        name: 'countries:delete',
        description: 'Delete countries',
      },
    ];

    console.log(`Preparing to add ${missingPermissions.length} missing permissions:\n`);
    missingPermissions.forEach((perm, idx) => {
      console.log(`${idx + 1}. ${perm.name} - ${perm.description}`);
    });
    console.log('');

    // Create permissions (using createMany to avoid duplicates with skipDuplicates)
    const createResult = await prisma.permission.createMany({
      data: missingPermissions,
      skipDuplicates: true,
    });

    console.log(`✓ Created ${createResult.count} new permissions\n`);

    // Get all the permission IDs we just created (or that already existed)
    const permissionNames = missingPermissions.map((p) => p.name);
    const createdPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: permissionNames,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Found ${createdPermissions.length} permissions to assign to ADMIN role\n`);

    // Get ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
      select: {
        id: true,
        name: true,
      },
    });

    if (!adminRole) {
      throw new Error('ADMIN role not found in database');
    }

    console.log(`Found ADMIN role (ID: ${adminRole.id})\n`);

    // Assign all new permissions to ADMIN role
    const rolePermissionData = createdPermissions.map((permission) => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    }));

    const assignResult = await prisma.rolePermission.createMany({
      data: rolePermissionData,
      skipDuplicates: true,
    });

    console.log(`✓ Assigned ${assignResult.count} new permissions to ADMIN role\n`);

    // Verify final state
    const updatedAdminRole = await prisma.role.findUnique({
      where: { id: adminRole.id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log('='.repeat(60));
    console.log('FINAL ADMIN ROLE STATE');
    console.log('='.repeat(60));
    console.log(`Total permissions assigned to ADMIN: ${updatedAdminRole?.rolePermissions.length}`);
    console.log('\nNewly added permissions:');
    createdPermissions.forEach((perm) => {
      console.log(`  ✓ ${perm.name}`);
    });
    console.log('\n✓ Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seed function
seedMissingPermissions()
  .then(() => {
    console.log('\nSeed script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSeed script failed:', error);
    process.exit(1);
  });
