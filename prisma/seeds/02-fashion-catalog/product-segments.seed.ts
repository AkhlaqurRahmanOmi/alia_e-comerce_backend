import { PrismaClient } from '../../../src/generated/prisma/client';

const MANAGED_SEGMENT_KEYS = [
  'featured',
  'trending',
  'new-arrival',
  'best-seller',
  'on-sale',
] as const;

type ManagedSegmentKey = (typeof MANAGED_SEGMENT_KEYS)[number];

export async function seedFashionProductSegments(prisma: PrismaClient) {
  console.log('Seeding product to segment assignments...');

  const segments = await prisma.segment.findMany({
    where: { key: { in: [...MANAGED_SEGMENT_KEYS] } },
    select: { id: true, key: true },
  });

  const segmentIdByKey = new Map(segments.map((segment) => [segment.key, segment.id]));
  const missingKeys = MANAGED_SEGMENT_KEYS.filter((key) => !segmentIdByKey.has(key));

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing segment seeds for keys: ${missingKeys.join(', ')}. Run segment seed first.`,
    );
  }

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          variants: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  if (products.length === 0) {
    console.warn('No active products found. Skipping product-segment assignment.');
    return;
  }

  const newestProducts = products.slice(0, Math.min(15, products.length)).map((p) => p.id);
  const featuredProducts = [...products]
    .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
    .slice(0, Math.min(12, products.length))
    .map((p) => p.id);
  const bestSellerProducts = [...products]
    .sort((a, b) => b._count.variants - a._count.variants || a.id - b.id)
    .slice(0, Math.min(12, products.length))
    .map((p) => p.id);

  const trendingProducts = products.filter((p) => p.id % 3 === 0).map((p) => p.id);
  if (trendingProducts.length === 0) {
    trendingProducts.push(products[0].id);
  }

  const onSaleProducts = products.filter((p) => p.id % 4 === 0).map((p) => p.id);
  if (onSaleProducts.length === 0) {
    onSaleProducts.push(products[0].id);
  }

  const assignmentsBySegment: Record<ManagedSegmentKey, number[]> = {
    featured: featuredProducts,
    trending: trendingProducts,
    'new-arrival': newestProducts,
    'best-seller': bestSellerProducts,
    'on-sale': onSaleProducts,
  };

  const desiredLinks: Array<{ productId: number; segmentId: number }> = [];

  for (const segmentKey of MANAGED_SEGMENT_KEYS) {
    const segmentId = segmentIdByKey.get(segmentKey);
    if (!segmentId) {
      continue;
    }

    for (const productId of assignmentsBySegment[segmentKey]) {
      desiredLinks.push({ productId, segmentId });
    }
  }

  const allProductIds = products.map((product) => product.id);
  const managedSegmentIds = segments.map((segment) => segment.id);

  // Keep seeding deterministic: reset managed segment links before insert.
  await prisma.productSegment.deleteMany({
    where: {
      productId: { in: allProductIds },
      segmentId: { in: managedSegmentIds },
    },
  });

  if (desiredLinks.length > 0) {
    await prisma.productSegment.createMany({
      data: desiredLinks,
      skipDuplicates: true,
    });
  }

  const totalManagedAssignments = await prisma.productSegment.count({
    where: {
      segmentId: { in: managedSegmentIds },
    },
  });

  console.log(
    `Created/updated ${desiredLinks.length} product-segment links (${totalManagedAssignments} total managed links)`,
  );
  console.log('Product segment assignment seeding completed!');
}
