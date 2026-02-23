import {
  PrismaClient,
  ShippingMethodType,
} from '../../../src/generated/prisma/client';

export async function seedShippingMethods(prisma: PrismaClient) {
  console.log('🚚 Seeding shipping methods...');

  const shippingMethods = [
    {
      name: 'Standard Shipping',
      code: 'standard',
      type: ShippingMethodType.standard,
      description: 'Standard delivery within 7-10 business days. Free shipping on orders over $100.',
      baseRate: 5.99,
      freeThreshold: 100.0,
      minDays: 7,
      maxDays: 10,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Express Shipping',
      code: 'express',
      type: ShippingMethodType.express,
      description: 'Fast delivery within 3-5 business days.',
      baseRate: 12.99,
      freeThreshold: null,
      minDays: 3,
      maxDays: 5,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Next Day Delivery',
      code: 'overnight',
      type: ShippingMethodType.overnight,
      description: 'Get your order delivered the next business day.',
      baseRate: 24.99,
      freeThreshold: null,
      minDays: 1,
      maxDays: 2,
      isActive: true,
      sortOrder: 3,
    },
  ];

  // Upsert all shipping methods
  let count = 0;
  for (const method of shippingMethods) {
    await prisma.shippingMethod.upsert({
      where: { code: method.code },
      update: {
        name: method.name,
        type: method.type,
        description: method.description,
        baseRate: method.baseRate,
        freeThreshold: method.freeThreshold,
        minDays: method.minDays,
        maxDays: method.maxDays,
        isActive: method.isActive,
        sortOrder: method.sortOrder,
      },
      create: method,
    });
    count++;
  }

  console.log(`✅ Created/updated ${count} shipping methods`);
  console.log('✅ Shipping methods seeding completed!');
}
