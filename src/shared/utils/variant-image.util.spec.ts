import { OptionDisplayType } from '@/generated/prisma/client';
import {
  resolveVariantGallery,
  resolveVariantImage,
  VariantImageSources,
} from './variant-image.util';

const colourOption = (
  images: unknown,
  displayType: OptionDisplayType = OptionDisplayType.color_swatch,
) => ({
  productOption: { displayType },
  optionValue: { meta: { hex: '#2E7D32', images } as never },
});

const sizeOption = () => ({
  productOption: { displayType: OptionDisplayType.text },
  optionValue: { meta: null },
});

describe('resolveVariantGallery', () => {
  it('prefers legacy VariantImage rows, ordered by position', () => {
    const variant: VariantImageSources = {
      variantImages: [
        { imageUrl: 'second.webp', position: 2 },
        { imageUrl: 'first.webp', position: 1 },
      ],
      variantOptionValues: [colourOption(['green.webp'])],
    };

    expect(resolveVariantGallery(variant)).toEqual(['first.webp', 'second.webp']);
  });

  it('falls back to the colour option value when no variant images exist', () => {
    const variant: VariantImageSources = {
      variantImages: [],
      variantOptionValues: [sizeOption(), colourOption(['green-1.webp', 'green-2.webp'])],
    };

    expect(resolveVariantGallery(variant)).toEqual(['green-1.webp', 'green-2.webp']);
  });

  it('ignores text options such as Size', () => {
    const variant: VariantImageSources = {
      variantOptionValues: [sizeOption()],
      product: { productImages: [{ imageUrl: 'hero.webp', isMain: true }] },
    };

    expect(resolveVariantGallery(variant)).toEqual(['hero.webp']);
  });

  it('honours image_swatch and pattern_swatch too', () => {
    for (const displayType of [
      OptionDisplayType.image_swatch,
      OptionDisplayType.pattern_swatch,
    ]) {
      const variant: VariantImageSources = {
        variantOptionValues: [colourOption(['swatch.webp'], displayType)],
      };

      expect(resolveVariantGallery(variant)).toEqual(['swatch.webp']);
    }
  });

  it('falls back to the product image, main one first', () => {
    const variant: VariantImageSources = {
      product: {
        productImages: [
          { imageUrl: 'side.webp', isMain: false, position: 1 },
          { imageUrl: 'hero.webp', isMain: true, position: 2 },
        ],
      },
    };

    expect(resolveVariantGallery(variant)).toEqual(['hero.webp', 'side.webp']);
  });

  it('tolerates malformed meta without throwing', () => {
    const cases: VariantImageSources[] = [
      { variantOptionValues: [colourOption('not-an-array')] },
      { variantOptionValues: [colourOption([42, '', '  '])] },
      { variantOptionValues: [{ productOption: null, optionValue: null }] },
    ];

    for (const variant of cases) {
      expect(resolveVariantGallery(variant)).toEqual([]);
    }
  });

  it('returns an empty gallery when there is nothing at all', () => {
    expect(resolveVariantGallery(null)).toEqual([]);
    expect(resolveVariantGallery(undefined)).toEqual([]);
    expect(resolveVariantGallery({})).toEqual([]);
  });
});

describe('resolveVariantImage', () => {
  it('returns the first image of the resolved gallery', () => {
    const variant: VariantImageSources = {
      variantOptionValues: [colourOption(['orange-1.webp', 'orange-2.webp'])],
    };

    expect(resolveVariantImage(variant)).toBe('orange-1.webp');
  });

  it('returns null when nothing resolves', () => {
    expect(resolveVariantImage({})).toBeNull();
  });
});
