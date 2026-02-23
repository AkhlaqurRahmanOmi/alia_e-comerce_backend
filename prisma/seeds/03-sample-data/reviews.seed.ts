import { PrismaClient } from '../../../src/generated/prisma/client';

export async function seedSampleReviews(prisma: PrismaClient) {
  console.log('⭐ Seeding sample reviews...');

  // Get sample products
  const products = await prisma.product.findMany({
    take: 30,
  });

  if (products.length === 0) {
    console.warn('No products found. Please run fashion catalog seed first.');
    return;
  }

  // Get customer users
  const customers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'customer',
      },
    },
  });

  if (customers.length === 0) {
    console.warn('No customer users found. Please run users seed first.');
    return;
  }

  const reviewTexts = {
    5: [
      'Absolutely love this product! Exceeded my expectations.',
      'Best purchase I\'ve made in a long time. Highly recommend!',
      'Perfect quality and fit. Will definitely buy again.',
      'Amazing product! Great value for money.',
      'Couldn\'t be happier with this purchase. 5 stars!',
    ],
    4: [
      'Really good product. Would recommend.',
      'Great quality, just wish it came in more colors.',
      'Very satisfied with this purchase. Good value.',
      'Nice product overall. Minor improvements could be made.',
      'Good quality and fast shipping. Happy customer!',
    ],
    3: [
      'It\'s okay. Does the job but nothing special.',
      'Average product. Met my basic expectations.',
      'Decent quality for the price.',
      'Not bad, but I\'ve seen better.',
      'It\'s alright. Good enough.',
    ],
  };

  let reviewCount = 0;

  // Create 3-5 reviews for each product
  for (const product of products) {
    const numReviews = Math.floor(Math.random() * 3) + 3; // 3-5 reviews

    for (let i = 0; i < numReviews; i++) {
      // Random customer
      const customer = customers[Math.floor(Math.random() * customers.length)];

      // Random rating (weighted towards positive)
      const ratingWeights = [5, 5, 5, 5, 4, 4, 4, 3];
      const rating = ratingWeights[Math.floor(Math.random() * ratingWeights.length)];

      // Get review text
      const texts = reviewTexts[rating as keyof typeof reviewTexts];
      const comment = texts[Math.floor(Math.random() * texts.length)];

      try {
        await prisma.review.create({
          data: {
            productId: product.id,
            userId: customer.id,
            rating,
            comment,
            status: 'approved', // approved, pending, or rejected
          },
        });

        reviewCount++;
      } catch (error) {
        // Skip if duplicate or error
        continue;
      }
    }
  }

  console.log(`✅ Created ${reviewCount} sample reviews`);
  console.log('✅ Sample reviews seeding completed!');
}
