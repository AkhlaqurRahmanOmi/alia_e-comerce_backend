import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Per-combination adjustment. `match` is a partial selection — every variant
 * whose combination contains all of its option/value pairs receives the
 * override. Later entries win over earlier ones.
 *
 * `{ "match": { "Size": "L" }, "price": 27 }` bumps the price of every large,
 * whatever its colour.
 */
export class VariantOverrideDto {
  @IsObject()
  @IsNotEmpty()
  match: Record<string, string>;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  compareAtPrice?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  initialStock?: number;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  barcode?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Expand a product's options into the variants that back them, instead of
 * writing each combination out by hand.
 *
 * Colour × Size with one gap is five variants and ten option selections when
 * written literally; here it is a pattern, a price and one `exclude` entry.
 */
export class GenerateVariantsDto {
  /**
   * SKU template. `{OptionName}` is replaced by that option value's `code`,
   * or by its sanitised value when no code is set — `TEE-{Color}-{Size}`
   * becomes `TEE-GRN-M`. Option names are matched case-insensitively.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  skuPattern: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  compareAtPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  initialStock?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  locationId?: number;

  /**
   * Combinations to skip, as partial selections. `{ "Color": "Orange",
   * "Size": "L" }` drops just that cell; `{ "Color": "Orange" }` drops the
   * whole orange row.
   */
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  exclude?: Record<string, string>[];

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => VariantOverrideDto)
  overrides?: VariantOverrideDto[];
}
