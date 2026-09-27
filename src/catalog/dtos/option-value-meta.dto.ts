import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Structured payload for `OptionValue.meta`.
 *
 * The column stays `Json?` in the database, but the shape is validated on the
 * way in — the global ValidationPipe runs with `forbidNonWhitelisted`, so a
 * typo such as `imges` is rejected with a 400 instead of stored silently.
 *
 * Which fields are *required* still depends on the option's `displayType` and
 * is enforced separately by `OptionManagementProvider.validateMetaForDisplayType`
 * (`color_swatch` needs `hex`, `image_swatch` needs `imageUrl`, and so on).
 * Everything here is optional because one class serves every display type.
 */
export class OptionValueMetaDto {
  /** CSS hex colour backing a `color_swatch`, e.g. `#1B264F`. */
  @IsString()
  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'meta.hex must be a CSS hex colour, for example #1B264F',
  })
  hex?: string;

  /** The swatch thumbnail itself — required by `image_swatch`. */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  /** Pattern identifier for `pattern_swatch`, when no `imageUrl` is given. */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  pattern?: string;

  /** Backing number for the `number` display type. */
  @IsNumber()
  @IsOptional()
  numericValue?: number;

  /**
   * Gallery shown when this value is selected, most representative first.
   *
   * This is what replaces per-variant imagery: a colour looks the same in every
   * size, so one entry here serves all of that colour's variants. Distinct from
   * `imageUrl`, which is just the swatch chip. Accepts absolute URLs and
   * app-relative paths alike, since uploads may be served from either.
   */
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images?: string[];
}
