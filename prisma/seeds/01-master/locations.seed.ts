import { PrismaClient } from '../../../src/generated/prisma/client';

export async function seedLocations(prisma: PrismaClient) {
  console.log('Seeding inventory locations...');

  const existingCount = await prisma.location.count();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing location(s), skipping location seed`);
    return;
  }

  await prisma.location.createMany({
    data: [
      {
        name: 'Main Warehouse',
        addressLine1: 'Warehouse District 1',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1207',
        country: 'BD',
      },
      {
        name: 'Retail Store',
        addressLine1: 'City Center',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1212',
        country: 'BD',
      },
    ],
  });

  console.log('Created default inventory locations');
}
