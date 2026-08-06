import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { CreateVariantDto } from './create-variant.dto';
import { CreateProductOptionDto } from './create-product-option.dto';
import { CreateProductImageDto } from './create-product-image.dto';
import { CreateVariantImageDto } from './create-variant-image.dto';
import { CreateOptionValueDto } from './create-option-value.dto';

class UpdateOptionValueDto extends OmitType(CreateOptionValueDto, ['optionId'] as const) {}

class UpdateVariantOptionValueDto {
  @IsInt()
  optionId: number;

  @IsInt()
  optionValueId: number;
}

class UpdateVariantOptionSelectionDto {
  @IsString()
  @IsNotEmpty()
  optionName: string;

  @IsString()
  @IsNotEmpty()
  optionValue: string;
}

class UpdateProductOptionDto extends OmitType(CreateProductOptionDto, ['productId'] as const) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionValueDto)
  values?: UpdateOptionValueDto[];
}

class UpdateVariantImageDto extends OmitType(CreateVariantImageDto, ['variantId'] as const) {}

class UpdateProductVariantDto extends OmitType(CreateVariantDto, ['productId'] as const) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantOptionValueDto)
  optionValues?: UpdateVariantOptionValueDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantOptionSelectionDto)
  optionSelections?: UpdateVariantOptionSelectionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantImageDto)
  images?: UpdateVariantImageDto[];
}

class UpdateProductImageDto extends OmitType(CreateProductImageDto, ['productId'] as const) {}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionDto)
  options?: UpdateProductOptionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductImageDto)
  images?: UpdateProductImageDto[];

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  categoryIds?: number[];
}
