import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CompleteProductOptionDto,
  CompleteProductVariantDto,
  GenerateVariantsDto,
  VariantOverrideDto,
} from '../dtos';

/** Longest SKU the schema will accept (`Variant.sku` is VarChar(50)). */
const SKU_MAX_LENGTH = 50;

/** Guard against a pattern that would expand into an unreasonable grid. */
const MAX_COMBINATIONS = 500;

/** One cell of the option grid: option name -> chosen value. */
type Combination = Map<string, { value: string; code: string }>;

@Injectable()
export class VariantGenerationProvider {
  /**
   * Expand a product's options into the variants that back them.
   *
   * Colour × Size is six combinations; `exclude` removes the ones that are not
   * stocked and `overrides` adjusts the rest, so a five-variant product is a
   * dozen lines of payload rather than five hand-written blocks.
   */
  generate(
    options: CompleteProductOptionDto[] | undefined,
    spec: GenerateVariantsDto,
  ): CompleteProductVariantDto[] {
    const axes = (options ?? []).filter((option) => (option.values?.length ?? 0) > 0);

    if (axes.length === 0) {
      throw new BadRequestException(
        'generateVariants needs at least one option with values to expand.',
      );
    }

    this.assertPatternResolves(spec.skuPattern, axes);

    const combinations = this.buildCombinations(axes);
    const kept = combinations.filter(
      (combination) => !this.matchesAny(combination, spec.exclude),
    );

    if (kept.length === 0) {
      throw new BadRequestException(
        'Every generated combination was excluded — nothing left to create.',
      );
    }

    const variants = kept.map((combination) => this.buildVariant(combination, spec));
    this.assertSkusAreUnique(variants);

    return variants;
  }

  /** Every `{Token}` in the pattern must name one of the options. */
  private assertPatternResolves(
    skuPattern: string,
    axes: CompleteProductOptionDto[],
  ): void {
    const known = new Set(axes.map((axis) => this.normalize(axis.name)));
    const tokens = [...skuPattern.matchAll(/{([^{}]+)}/g)].map((match) => match[1]);
    const unknown = tokens.filter((token) => !known.has(this.normalize(token)));

    if (unknown.length > 0) {
      throw new BadRequestException(
        `skuPattern references unknown option(s): ${unknown.join(', ')}. ` +
          `Available: ${axes.map((axis) => axis.name).join(', ')}.`,
      );
    }
  }

  /** Cartesian product of every option's values. */
  private buildCombinations(axes: CompleteProductOptionDto[]): Combination[] {
    const total = axes.reduce((count, axis) => count * (axis.values?.length ?? 0), 1);
    if (total > MAX_COMBINATIONS) {
      throw new BadRequestException(
        `generateVariants would create ${total} variants, above the limit of ` +
          `${MAX_COMBINATIONS}. Narrow the options or list the variants explicitly.`,
      );
    }

    let combinations: Combination[] = [new Map()];

    for (const axis of axes) {
      const next: Combination[] = [];

      for (const partial of combinations) {
        for (const optionValue of axis.values ?? []) {
          const extended: Combination = new Map(partial);
          extended.set(axis.name, {
            value: optionValue.value,
            code: this.tokenFor(optionValue.code, optionValue.value),
          });
          next.push(extended);
        }
      }

      combinations = next;
    }

    return combinations;
  }

  /**
   * A partial selection matches when every pair it names is present in the
   * combination, so `{ Color: "Orange" }` covers the whole orange row.
   */
  private matches(combination: Combination, selection: Record<string, string>): boolean {
    return Object.entries(selection).every(([optionName, optionValue]) => {
      const chosen = this.findInCombination(combination, optionName);
      return (
        chosen !== undefined && this.normalize(chosen.value) === this.normalize(optionValue)
      );
    });
  }

  private matchesAny(
    combination: Combination,
    selections: Record<string, string>[] | undefined,
  ): boolean {
    return (selections ?? []).some((selection) => this.matches(combination, selection));
  }

  private buildVariant(
    combination: Combination,
    spec: GenerateVariantsDto,
  ): CompleteProductVariantDto {
    const applicable = (spec.overrides ?? []).filter((override) =>
      this.matches(combination, override.match),
    );

    // Later overrides win, so fold them in order.
    const resolved = applicable.reduce<Partial<VariantOverrideDto>>(
      (carry, override) => ({ ...carry, ...this.withoutMatch(override) }),
      {},
    );

    const variant = new CompleteProductVariantDto();
    variant.sku = this.buildSku(spec.skuPattern, combination);
    variant.price = resolved.price ?? spec.price;
    variant.compareAtPrice = resolved.compareAtPrice ?? spec.compareAtPrice;
    variant.currency = spec.currency;
    variant.barcode = resolved.barcode;
    variant.weight = resolved.weight ?? spec.weight;
    variant.isActive = resolved.isActive ?? true;
    variant.initialStock = resolved.initialStock ?? spec.initialStock ?? 0;
    variant.locationId = spec.locationId;
    variant.optionSelections = [...combination.entries()].map(
      ([optionName, chosen]) => ({
        optionName,
        optionValue: chosen.value,
      }),
    );

    return variant;
  }

  /** Drop `match` so it is never folded into the variant itself. */
  private withoutMatch(override: VariantOverrideDto): Partial<VariantOverrideDto> {
    const { match: _match, ...rest } = override;
    return Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    );
  }

  private buildSku(skuPattern: string, combination: Combination): string {
    const sku = skuPattern.replace(/{([^{}]+)}/g, (_full, token: string) => {
      const chosen = this.findInCombination(combination, token);
      return chosen?.code ?? '';
    });

    if (sku.length > SKU_MAX_LENGTH) {
      throw new BadRequestException(
        `Generated SKU "${sku}" is ${sku.length} characters, above the ` +
          `${SKU_MAX_LENGTH} character limit. Shorten the pattern or set a ` +
          '`code` on the option values.',
      );
    }

    return sku;
  }

  private assertSkusAreUnique(variants: CompleteProductVariantDto[]): void {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const variant of variants) {
      if (seen.has(variant.sku)) {
        duplicates.add(variant.sku);
      }
      seen.add(variant.sku);
    }

    if (duplicates.size > 0) {
      throw new BadRequestException(
        `skuPattern produced duplicate SKUs: ${[...duplicates].join(', ')}. ` +
          'Give the colliding option values distinct `code` values, or include ' +
          'every option in the pattern.',
      );
    }
  }

  private findInCombination(combination: Combination, optionName: string) {
    for (const [name, chosen] of combination) {
      if (this.normalize(name) === this.normalize(optionName)) {
        return chosen;
      }
    }
    return undefined;
  }

  /** `code` when set, otherwise the value stripped down to something SKU-safe. */
  private tokenFor(code: string | undefined, value: string): string {
    const token = (code ?? value).toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (token.length === 0) {
      throw new BadRequestException(
        `Option value "${value}" has no SKU-safe characters. Set an explicit ` +
          '`code` on it.',
      );
    }

    return token;
  }

  private normalize(input: string): string {
    return input.trim().toLowerCase();
  }
}
