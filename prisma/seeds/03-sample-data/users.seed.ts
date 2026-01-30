import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedSampleUsers(prisma: PrismaClient) {
  console.log('👥 Seeding sample users...');

  const password = await bcrypt.hash('Password@123', 10);

  // Get roles
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'Manager' } });
  const customerRole = await prisma.role.findUnique({ where: { name: 'Customer' } });

  if (!adminRole || !managerRole || !customerRole) {
    throw new Error('Roles not found. Please run master seed first.');
  }

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fashion.com' },
    update: {},
    create: {
      email: 'admin@fashion.com',
      password,
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Created admin user: admin@fashion.com');

  // Create Manager User
  const manager = await prisma.user.upsert({
    where: { email: 'manager@fashion.com' },
    update: {},
    create: {
      email: 'manager@fashion.com',
      password,
      firstName: 'Store',
      lastName: 'Manager',
      isVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: manager.id,
        roleId: managerRole.id,
      },
    },
    update: {},
    create: {
      userId: manager.id,
      roleId: managerRole.id,
    },
  });

  console.log('✅ Created manager user: manager@fashion.com');

  // Create Customer Users
  const customerNames = [
    { firstName: 'John', lastName: 'Doe' },
    { firstName: 'Jane', lastName: 'Smith' },
    { firstName: 'Michael', lastName: 'Johnson' },
    { firstName: 'Sarah', lastName: 'Williams' },
    { firstName: 'David', lastName: 'Brown' },
  ];

  for (let i = 0; i < customerNames.length; i++) {
    const customerData = customerNames[i];
    const email = `customer${i + 1}@fashion.com`;

    const customer = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        isVerified: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: customer.id,
          roleId: customerRole.id,
        },
      },
      update: {},
      create: {
        userId: customer.id,
        roleId: customerRole.id,
      },
    });

    console.log(`✅ Created customer user: ${email}`);
  }

  console.log('\n📝 Default Password for all users: Password@123');
  console.log('✅ Sample users seeding completed!');
}
