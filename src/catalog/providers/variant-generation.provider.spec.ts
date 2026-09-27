import { BadRequestException } from '@nestjs/common';
import { VariantGenerationProvider } from './variant-generation.provider';
import {
  CompleteProductOptionDto,
  GenerateVariantsDto,
} from '../dtos';

const options = (): CompleteProductOptionDto[] =>
  [
    {
      name: 'Color',
      values: [
        { value: 'Green', code: 'GRN' },
        { value: 'Orange', code: 'ORG' },
      ],
    },
    {
      name: 'Size',
      values: [{ value: 'S' }, { value: 'M' }, { value: 'L' }],
    },
  ] as CompleteProductOptionDto[];

const spec = (overrides: Partial<GenerateVariantsDto> = {}): GenerateVariantsDto =>
  ({
    skuPattern: 'DRS-{Color}-{Size}',
    price: 25,
    initialStock: 30,
    ...overrides,
  }) as GenerateVariantsDto;

describe('VariantGenerationProvider', () => {
  let provider: VariantGenerationProvider;

  beforeEach(() => {
    provider = new VariantGenerationProvider();
  });

  it('expands the full grid', () => {
    const variants = provider.generate(options(), spec());

    expect(variants).toHaveLength(6);
    expect(variants.map((v) => v.sku)).toEqual([
      'DRS-GRN-S',
      'DRS-GRN-M',
      'DRS-GRN-L',
      'DRS-ORG-S',
      'DRS-ORG-M',
      'DRS-ORG-L',
    ]);
  });

  it('drops a single excluded cell — the five-variant dress case', () => {
    const variants = provider.generate(
      options(),
      spec({ exclude: [{ Color: 'Orange', Size: 'L' }] }),
    );

    expect(variants).toHaveLength(5);
    expect(variants.map((v) => v.sku)).not.toContain('DRS-ORG-L');
  });

  it('treats a partial exclude as a whole row', () => {
    const variants = provider.generate(options(), spec({ exclude: [{ Color: 'Orange' }] }));

    expect(variants).toHaveLength(3);
    expect(variants.every((v) => v.sku.includes('GRN'))).toBe(true);
  });

  it('gives every variant its option selections', () => {
    const [first] = provider.generate(options(), spec());

    expect(first.optionSelections).toEqual([
      { optionName: 'Color', optionValue: 'Green' },
      { optionName: 'Size', optionValue: 'S' },
    ]);
  });

  it('applies overrides, with later ones winning', () => {
    const variants = provider.generate(
      options(),
      spec({
        overrides: [
          { match: { Size: 'L' }, price: 27 },
          { match: { Color: 'Green', Size: 'L' }, price: 29, initialStock: 5 },
        ],
      }),
    );

    const byKey = Object.fromEntries(variants.map((v) => [v.sku, v]));

    expect(byKey['DRS-ORG-L'].price).toBe(27);
    expect(byKey['DRS-GRN-L'].price).toBe(29);
    expect(byKey['DRS-GRN-L'].initialStock).toBe(5);
    expect(byKey['DRS-GRN-S'].price).toBe(25);
    expect(byKey['DRS-GRN-S'].initialStock).toBe(30);
  });

  it('never leaks `match` onto the variant', () => {
    const [variant] = provider.generate(
      options(),
      spec({ overrides: [{ match: { Color: 'Green' }, price: 26 }] }),
    );

    expect(variant).not.toHaveProperty('match');
  });

  it('falls back to the sanitised value when a code is missing', () => {
    const variants = provider.generate(
      [
        {
          name: 'Size',
          values: [{ value: '750 ml' }],
        },
      ] as CompleteProductOptionDto[],
      spec({ skuPattern: 'WINE-{Size}' }),
    );

    expect(variants[0].sku).toBe('WINE-750ML');
  });

  it('matches option names case-insensitively', () => {
    const variants = provider.generate(
      options(),
      spec({ skuPattern: 'DRS-{color}-{size}', exclude: [{ color: 'Orange' }] }),
    );

    expect(variants).toHaveLength(3);
    expect(variants[0].sku).toBe('DRS-GRN-S');
  });

  describe('rejections', () => {
    it('rejects an unknown token in the pattern', () => {
      expect(() =>
        provider.generate(options(), spec({ skuPattern: 'DRS-{Colour}' })),
      ).toThrow(BadRequestException);
    });

    it('rejects when there are no options to expand', () => {
      expect(() => provider.generate([], spec())).toThrow(BadRequestException);
      expect(() => provider.generate(undefined, spec())).toThrow(BadRequestException);
    });

    it('rejects when every combination is excluded', () => {
      expect(() =>
        provider.generate(
          options(),
          spec({ exclude: [{ Color: 'Green' }, { Color: 'Orange' }] }),
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects duplicate SKUs from an under-specified pattern', () => {
      expect(() =>
        provider.generate(options(), spec({ skuPattern: 'DRS-{Color}' })),
      ).toThrow(/duplicate SKUs/i);
    });

    it('rejects a SKU longer than the column allows', () => {
      expect(() =>
        provider.generate(options(), spec({ skuPattern: `${'X'.repeat(48)}-{Color}-{Size}` })),
      ).toThrow(/character limit/i);
    });

    it('rejects an option value with no SKU-safe characters', () => {
      expect(() =>
        provider.generate(
          [{ name: 'Size', values: [{ value: '—' }] }] as CompleteProductOptionDto[],
          spec({ skuPattern: 'X-{Size}' }),
        ),
      ).toThrow(/SKU-safe/i);
    });

    it('rejects a grid above the combination limit', () => {
      const many = Array.from({ length: 30 }, (_, i) => ({ value: `V${i}` }));
      expect(() =>
        provider.generate(
          [
            { name: 'A', values: many },
            { name: 'B', values: many },
          ] as CompleteProductOptionDto[],
          spec({ skuPattern: '{A}-{B}' }),
        ),
      ).toThrow(/above the limit/i);
    });
  });
});
