import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionValueMetaDto } from './option-value-meta.dto';

export class CreateOptionValueDto {
  @IsNumber()
  @IsNotEmpty()
  optionId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  value: string;

  /**
   * Short token used when a SKU is built from a pattern, e.g. `GRN` for Green
   * in `TEE-{Color}-{Size}`. Falls back to the sanitised value when omitted.
   */
  @IsString()
  @IsOptional()
  @MaxLength(16)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: 'code may only contain letters, digits, dot, underscore or hyphen',
  })
  code?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  position?: number;

  @ValidateNested()
  @IsOptional()
  @Type(() => OptionValueMetaDto)
  meta?: OptionValueMetaDto;
}
