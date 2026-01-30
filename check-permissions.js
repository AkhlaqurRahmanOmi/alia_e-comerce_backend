const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    // Get all existing permissions
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
      select: {
        name: true,
        description: true,
      },
    });

    // Get all roles with their permissions
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log('='.repeat(60));
    console.log('EXISTING PERMISSIONS IN DATABASE');
    console.log('='.repeat(60));
    console.log(`Total: ${permissions.length} permissions\n`);

    permissions.forEach((perm, idx) => {
      console.log(`${idx + 1}. ${perm.name}`);
      if (perm.description) {
        console.log(`   Description: ${perm.description}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('EXISTING ROLES AND THEIR PERMISSIONS');
    console.log('='.repeat(60));

    roles.forEach((role) => {
      console.log(`\nRole: ${role.name}`);
      console.log(`Description: ${role.description || 'N/A'}`);
      console.log(`Permissions (${role.rolePermissions.length}):`);
      role.rolePermissions.forEach((rp) => {
        console.log(`  - ${rp.permission.name}`);
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('JSON OUTPUT');
    console.log('='.repeat(60));
    console.log(JSON.stringify({
      permissions: permissions.map(p => p.name),
      roles: roles.map(r => ({
        name: r.name,
        permissions: r.rolePermissions.map(rp => rp.permission.name)
      }))
    }, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
