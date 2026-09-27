import { ConflictException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';

/**
 * Cascade helpers for hard-deleting catalog rows.
 *
 * Nothing in the schema declares `onDelete: Cascade` for these relations, so
 * every dependent row is removed explicitly, in foreign-key order. That is
 * deliberate: a database-level cascade would turn any stray `product.delete()`
 * elsewhere in the codebase into a silent data wipe, whereas this is greppable
 * and confined to the delete flows that mean it.
 */

/**
 * Refuse to delete anything an order points at.
 *
 * Order lines keep name, SKU and image snapshots, so they would still render —
 * but the link back to the live variant is what returns, refunds and restocking
 * rely on, and silently severing it loses more than it saves.
 */
export async function assertNotOrdered(
  tx: Prisma.TransactionClient,
  variantIds: number[],
  subject: string,
): Promise<void> {
  if (variantIds.length === 0) {
    return;
  }

  const orderedCount = await tx.orderItem.count({
    where: { variantId: { in: variantIds } },
  });

  if (orderedCount > 0) {
    throw new ConflictException(
      `Cannot delete ${subject}: it appears on ${orderedCount} order line(s). ` +
        'Deleting it would break returns and refunds for those orders.',
    );
  }
}

/**
 * Remove everything hanging off a set of variants — inventory included — so the
 * variants themselves can be deleted.
 *
 * Note this destroys `InventoryMovement`, the stock audit trail: its foreign key
 * is required, so it cannot outlive the variant.
 */
export async function deleteVariantChildren(
  tx: Prisma.TransactionClient,
  variantIds: number[],
): Promise<void> {
  if (variantIds.length === 0) {
    return;
  }

  const where = { variantId: { in: variantIds } };

  // Inventory and its audit trail.
  await tx.inventoryMovement.deleteMany({ where });
  await tx.variantInventory.deleteMany({ where });

  // Presentation and option wiring.
  await tx.variantImage.deleteMany({ where });
  await tx.variantOptionValue.deleteMany({ where });

  // Places a shopper or a bundle may still be pointing at it from.
  await tx.bundleItem.deleteMany({ where });
  await tx.cartItem.deleteMany({ where });
  await tx.wishlistItem.deleteMany({ where });
}

/**
 * Remove a product's own dependents, everything except its variants.
 *
 * Call after {@link deleteVariantChildren}: `OptionValue` cannot go until the
 * `VariantOptionValue` rows referencing it are gone.
 */
export async function deleteProductChildren(
  tx: Prisma.TransactionClient,
  productId: number,
): Promise<void> {
  const where = { productId };

  // Reviews, deepest first.
  const reviewIds = (
    await tx.review.findMany({ where, select: { id: true } })
  ).map((review) => review.id);

  if (reviewIds.length > 0) {
    await tx.reviewImage.deleteMany({ where: { reviewId: { in: reviewIds } } });
    await tx.review.deleteMany({ where });
  }

  // Options: values first, then the options themselves.
  const optionIds = (
    await tx.productOption.findMany({ where, select: { id: true } })
  ).map((option) => option.id);

  if (optionIds.length > 0) {
    await tx.optionValue.deleteMany({ where: { optionId: { in: optionIds } } });
    await tx.productOption.deleteMany({ where });
  }

  await tx.productImage.deleteMany({ where });
  await tx.productCategory.deleteMany({ where });
  await tx.productAttribute.deleteMany({ where });
  await tx.productSegment.deleteMany({ where });
  await tx.couponProduct.deleteMany({ where });
  await tx.recentlyViewed.deleteMany({ where });
}
