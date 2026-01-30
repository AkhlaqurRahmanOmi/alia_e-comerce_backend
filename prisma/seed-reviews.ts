import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding review data...');

  // Get or create test users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  let user1 = await prisma.user.findFirst({ where: { email: 'john.doe@example.com' } });
  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
      },
    });
  }

  let user2 = await prisma.user.findFirst({ where: { email: 'jane.smith@example.com' } });
  if (!user2) {
    user2 = await prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
      },
    });
  }

  let user3 = await prisma.user.findFirst({ where: { email: 'bob.wilson@example.com' } });
  if (!user3) {
    user3 = await prisma.user.create({
      data: {
        email: 'bob.wilson@example.com',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Wilson',
      },
    });
  }

  console.log('✅ Users ready');

  // Get existing products
  const phone = await prisma.product.findFirst({ where: { seoSlug: 'iphone-15-pro' } });
  const gamingLaptop = await prisma.product.findFirst({ where: { seoSlug: 'asus-rog-gaming-laptop' } });
  const headphones = await prisma.product.findFirst({ where: { seoSlug: 'sony-wh1000xm5' } });
  const tshirt = await prisma.product.findFirst({ where: { seoSlug: 'organic-cotton-tshirt' } });

  if (!phone || !tshirt) {
    throw new Error('Required products not found. Run base seed first.');
  }

  // Get or create variants
  let phoneVariant = await prisma.variant.findFirst({ where: { sku: 'IPHONE-15-PRO-128' } });
  let tshirtVariant = await prisma.variant.findFirst({ where: { sku: 'COTTON-TSHIRT-M' } });

  let laptopVariant, headphonesVariant;

  if (gamingLaptop) {
    laptopVariant = await prisma.variant.findFirst({ where: { productId: gamingLaptop.id } });
    if (!laptopVariant) {
      laptopVariant = await prisma.variant.create({
        data: {
          productId: gamingLaptop.id,
          sku: 'ASUS-ROG-LAPTOP',
          price: 2499.99,
        },
      });
    }
  }

  if (headphones) {
    headphonesVariant = await prisma.variant.findFirst({ where: { productId: headphones.id } });
    if (!headphonesVariant) {
      headphonesVariant = await prisma.variant.create({
        data: {
          productId: headphones.id,
          sku: 'SONY-WH1000XM5',
          price: 399.99,
        },
      });
    }
  }

  let orderCount = 0;
  let reviewCount = 0;

  // Create orders and reviews
  if (phoneVariant && tshirtVariant) {
    const order1 = await prisma.order.create({
      data: {
        userId: user1.id,
        subtotalAmount: 1029.98,
        totalAmount: 1029.98,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        variantId: phoneVariant.id,
        quantity: 1,
        unitPrice: 999.99,
        lineTotal: 999.99,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        variantId: tshirtVariant.id,
        quantity: 1,
        unitPrice: 29.99,
        lineTotal: 29.99,
      },
    });

    orderCount++;

    // Create reviews
    const review1 = await prisma.review.create({
      data: {
        userId: user1.id,
        productId: phone.id,
        rating: 5,
        comment: 'Absolutely love this phone! The titanium design feels premium, the camera is incredible, and the A17 Pro chip makes everything super smooth. Battery life easily lasts me a full day. Worth every penny!',
        status: 'approved',
      },
    });

    await prisma.reviewImage.createMany({
      data: [
        {
          reviewId: review1.id,
          imageUrl: 'https://images.unsplash.com/photo-1592286927505-c4d8c0e5a0a5',
        },
        {
          reviewId: review1.id,
          imageUrl: 'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80',
        },
      ],
    });

    const review4 = await prisma.review.create({
      data: {
        userId: user1.id,
        productId: tshirt.id,
        rating: 4,
        comment: 'Very comfortable and soft t-shirt. The organic cotton feels great on the skin. Fits true to size. Only wish it came in more colors!',
        status: 'approved',
      },
    });

    reviewCount += 2;
  }

  if (laptopVariant && gamingLaptop) {
    const order2 = await prisma.order.create({
      data: {
        userId: user2.id,
        subtotalAmount: 2499.99,
        totalAmount: 2499.99,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        variantId: laptopVariant.id,
        quantity: 1,
        unitPrice: 2499.99,
        lineTotal: 2499.99,
      },
    });

    orderCount++;

    const review2 = await prisma.review.create({
      data: {
        userId: user2.id,
        productId: gamingLaptop.id,
        rating: 4,
        comment: 'Great gaming laptop with excellent performance! RTX 4080 handles all modern games at high settings. Only minor complaint is the fan noise during intensive gaming sessions, but that\'s expected. Highly recommended for serious gamers.',
        status: 'approved',
      },
    });

    await prisma.reviewImage.create({
      data: {
        reviewId: review2.id,
        imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302',
      },
    });

    reviewCount++;
  }

  if (headphonesVariant && headphones) {
    const order3 = await prisma.order.create({
      data: {
        userId: user3.id,
        subtotalAmount: 399.99,
        totalAmount: 399.99,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        variantId: headphonesVariant.id,
        quantity: 1,
        unitPrice: 399.99,
        lineTotal: 399.99,
      },
    });

    orderCount++;

    const review3 = await prisma.review.create({
      data: {
        userId: user3.id,
        productId: headphones.id,
        rating: 5,
        comment: 'Best headphones I\'ve ever owned! The noise cancellation is phenomenal - I can focus completely even in noisy environments. Sound quality is crisp and clear across all genres. Super comfortable for long wear.',
        status: 'approved',
      },
    });

    await prisma.reviewImage.createMany({
      data: [
        {
          reviewId: review3.id,
          imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
        },
        {
          reviewId: review3.id,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        },
      ],
    });

    reviewCount++;
  }

  // Add one more review for phone
  if (phone) {
    await prisma.review.create({
      data: {
        userId: user2.id,
        productId: phone.id,
        rating: 3,
        comment: 'Decent phone but overpriced for what you get. Camera is good but not revolutionary. Battery life is okay.',
        status: 'pending',
      },
    });
    reviewCount++;
  }

  console.log('✅ Orders created');
  console.log('✅ Reviews created');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 3`);
  console.log(`   - Orders: ${orderCount}`);
  console.log(`   - Reviews: ${reviewCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
