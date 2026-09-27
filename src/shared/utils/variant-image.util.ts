import { OptionDisplayType, Prisma } from '@/generated/prisma/client';

/**
 * Option display types whose values carry their own imagery in `meta.images`.
 *
 * This mirrors how large fashion marketplaces model apparel: the colour (or
 * pattern) choice owns the gallery, while a text option such as Size never
 * changes what the product looks like.
 */
const SWATCH_DISPLAY_TYPES: OptionDisplayType[] = [
  OptionDisplayType.color_swatch,
  OptionDisplayType.image_swatch,
  OptionDisplayType.pattern_swatch,
];

/**
 * Include fragment a read path needs in order to resolve a variant's imagery.
 * Kept in one place so the cart queries cannot drift apart from each other.
 */
export const VARIANT_IMAGE_INCLUDE = {
  // Deprecated source, retained so products created before the swatch model
  // keep rendering. New products should not write VariantImage rows.
  variantImages: true,
  product: {
    include: { productImages: true },
  },
  variantOptionValues: {
    include: {
      optionValue: true,
      productOption: true,
    },
  },
} satisfies Prisma.VariantInclude;

/** Shape expected inside `OptionValue.meta` for a swatch value. */
interface OptionValueMeta {
  hex?: string;
  images?: string[];
}

/**
 * Structural view of the fields {@link resolveVariantGallery} reads. Declared
 * structurally rather than via `VariantGetPayload` so callers that include
 * extra relations (inventories, option values, …) still satisfy it.
 */
export interface VariantImageSources {
  variantImages?: Array<{
    imageUrl: string;
    position?: number | null;
  }> | null;
  product?: {
    productImages?: Array<{
      imageUrl: string;
      isMain?: boolean | null;
      position?: number | null;
    }> | null;
  } | null;
  variantOptionValues?: Array<{
    productOption?: { displayType: OptionDisplayType } | null;
    optionValue?: { meta?: Prisma.JsonValue | null } | null;
  }> | null;
}

const byPosition = (a: { position?: number | null }, b: { position?: number | null }) =>
  (a.position ?? 0) - (b.position ?? 0);

/** Pull the `images` array out of an OptionValue's free-form `meta` column. */
function readMetaImages(meta?: Prisma.JsonValue | null): string[] {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return [];
  }

  const { images } = meta as OptionValueMeta;
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter(
    (image): image is string => typeof image === 'string' && image.trim().length > 0,
  );
}

/**
 * Resolve the full image gallery for a variant, in priority order:
 *
 *   1. `VariantImage` rows      — deprecated; keeps pre-existing products rendering
 *   2. swatch option value      — the current model: colour owns the gallery
 *   3. the product's own images — safety net
 *
 * Returns an empty array when the product carries no imagery at all.
 */
export function resolveVariantGallery(variant?: VariantImageSources | null): string[] {
  if (!variant) {
    return [];
  }

  const legacy = [...(variant.variantImages ?? [])]
    .sort(byPosition)
    .map((image) => image.imageUrl);
  if (legacy.length > 0) {
    return legacy;
  }

  for (const link of variant.variantOptionValues ?? []) {
    const displayType = link.productOption?.displayType;
    if (!displayType || !SWATCH_DISPLAY_TYPES.includes(displayType)) {
      continue;
    }

    const images = readMetaImages(link.optionValue?.meta);
    if (images.length > 0) {
      return images;
    }
  }

  const productImages = [...(variant.product?.productImages ?? [])].sort(
    (a, b) => Number(b.isMain ?? false) - Number(a.isMain ?? false) || byPosition(a, b),
  );

  return productImages.map((image) => image.imageUrl);
}

/**
 * The single image to show for a variant — cart lines, order summaries, any
 * place with room for one thumbnail. Null when nothing is available.
 */
export function resolveVariantImage(variant?: VariantImageSources | null): string | null {
  return resolveVariantGallery(variant)[0] ?? null;
}
