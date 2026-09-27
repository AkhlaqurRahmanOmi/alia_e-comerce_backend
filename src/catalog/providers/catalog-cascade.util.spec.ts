import { ConflictException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import {
  assertNotOrdered,
  deleteProductChildren,
  deleteVariantChildren,
} from './catalog-cascade.util';

/**
 * Builds a stand-in transaction client that records the order in which tables
 * are cleared. Foreign-key order is the whole point of these helpers, so the
 * sequence is asserted rather than just the set of calls.
 *
 * Returns the mock twice: `tx` typed for the helpers, `mock` untyped for
 * assertions against the jest spies.
 */
function makeTx(overrides: Record<string, unknown> = {}) {
  const calls: string[] = [];
  const deleter = (table: string) => ({
    deleteMany: jest.fn(() => {
      calls.push(table);
      return Promise.resolve({ count: 0 });
    }),
    findMany: jest.fn(() => Promise.resolve([])),
  });

  const mock = {
    orderItem: { count: jest.fn(() => Promise.resolve(0)) },
    inventoryMovement: deleter('inventoryMovement'),
    variantInventory: deleter('variantInventory'),
    variantImage: deleter('variantImage'),
    variantOptionValue: deleter('variantOptionValue'),
    bundleItem: deleter('bundleItem'),
    cartItem: deleter('cartItem'),
    wishlistItem: deleter('wishlistItem'),
    reviewImage: deleter('reviewImage'),
    review: deleter('review'),
    optionValue: deleter('optionValue'),
    productOption: deleter('productOption'),
    productImage: deleter('productImage'),
    productCategory: deleter('productCategory'),
    productAttribute: deleter('productAttribute'),
    productSegment: deleter('productSegment'),
    couponProduct: deleter('couponProduct'),
    recentlyViewed: deleter('recentlyViewed'),
    ...overrides,
  };

  return {
    tx: mock as unknown as Prisma.TransactionClient,
    mock,
    calls,
  };
}

describe('assertNotOrdered', () => {
  it('passes when nothing has been ordered', async () => {
    const { tx } = makeTx();
    await expect(assertNotOrdered(tx, [1, 2], 'variant X')).resolves.toBeUndefined();
  });

  it('refuses when an order line points at the variant', async () => {
    const { tx } = makeTx({ orderItem: { count: jest.fn(() => Promise.resolve(3)) } });

    await expect(assertNotOrdered(tx, [1], 'variant ABC-1')).rejects.toThrow(
      ConflictException,
    );
    await expect(assertNotOrdered(tx, [1], 'variant ABC-1')).rejects.toThrow(
      /3 order line\(s\)/,
    );
  });

  it('skips the query entirely when there are no variants', async () => {
    const { tx, mock } = makeTx();
    await assertNotOrdered(tx, [], 'product with no variants');
    expect(mock.orderItem.count).not.toHaveBeenCalled();
  });
});

describe('deleteVariantChildren', () => {
  it('clears inventory before anything else, then the rest', async () => {
    const { tx, calls } = makeTx();
    await deleteVariantChildren(tx, [7, 8]);

    expect(calls).toEqual([
      'inventoryMovement',
      'variantInventory',
      'variantImage',
      'variantOptionValue',
      'bundleItem',
      'cartItem',
      'wishlistItem',
    ]);
  });

  it('scopes every delete to the given variants', async () => {
    const { tx, mock } = makeTx();
    await deleteVariantChildren(tx, [7, 8]);

    expect(mock.variantInventory.deleteMany).toHaveBeenCalledWith({
      where: { variantId: { in: [7, 8] } },
    });
  });

  it('does nothing when there are no variants', async () => {
    const { tx, calls } = makeTx();
    await deleteVariantChildren(tx, []);
    expect(calls).toEqual([]);
  });
});

describe('deleteProductChildren', () => {
  it('skips review and option deletes when the product has neither', async () => {
    const { tx, calls } = makeTx();
    await deleteProductChildren(tx, 42);

    expect(calls).toEqual([
      'productImage',
      'productCategory',
      'productAttribute',
      'productSegment',
      'couponProduct',
      'recentlyViewed',
    ]);
  });

  it('removes review images before reviews, and option values before options', async () => {
    const calls: string[] = [];
    const { tx } = makeTx({
      review: {
        findMany: jest.fn(() => Promise.resolve([{ id: 1 }])),
        deleteMany: jest.fn(() => {
          calls.push('review');
          return Promise.resolve({ count: 1 });
        }),
      },
      reviewImage: {
        deleteMany: jest.fn(() => {
          calls.push('reviewImage');
          return Promise.resolve({ count: 1 });
        }),
      },
      productOption: {
        findMany: jest.fn(() => Promise.resolve([{ id: 9 }])),
        deleteMany: jest.fn(() => {
          calls.push('productOption');
          return Promise.resolve({ count: 1 });
        }),
      },
      optionValue: {
        deleteMany: jest.fn(() => {
          calls.push('optionValue');
          return Promise.resolve({ count: 1 });
        }),
      },
    });

    await deleteProductChildren(tx, 42);

    expect(calls.indexOf('reviewImage')).toBeGreaterThanOrEqual(0);
    expect(calls.indexOf('reviewImage')).toBeLessThan(calls.indexOf('review'));
    expect(calls.indexOf('optionValue')).toBeLessThan(calls.indexOf('productOption'));
  });
});
