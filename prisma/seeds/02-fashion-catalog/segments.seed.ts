import { PrismaClient } from '../../../src/generated/prisma/client';

type SegmentSeed = {
  key: string;
  name: string;
  position: number;
  isActive: boolean;
};

const SEGMENT_SEEDS: SegmentSeed[] = [
  { key: 'featured', name: 'Featured', position: 1, isActive: true },
  { key: 'trending', name: 'Trending', position: 2, isActive: true },
  { key: 'new-arrival', name: 'New Arrival', position: 3, isActive: true },
  { key: 'best-seller', name: 'Best Seller', position: 4, isActive: true },
  { key: 'on-sale', name: 'On Sale', position: 5, isActive: true },
];

export async function seedFashionSegments(prisma: PrismaClient) {
  console.log('Seeding product segments...');

  let upsertedCount = 0;
  for (const segment of SEGMENT_SEEDS) {
    await prisma.segment.upsert({
      where: { key: segment.key },
      update: {
        name: segment.name,
        position: segment.position,
        isActive: segment.isActive,
      },
      create: segment,
    });

    upsertedCount++;
  }

  console.log(`Created/updated ${upsertedCount} segments`);
  console.log('Product segments seeding completed!');
}
