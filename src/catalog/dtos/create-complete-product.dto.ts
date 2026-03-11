// src/catalog/dtos/create-complete-product.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { CreateVariantDto } from './create-variant.dto';
import { CreateProductOptionDto } from './create-product-option.dto';
import { CreateProductImageDto } from './create-product-image.dto';
import { CreateOptionValueDto } from './create-option-value.dto';

class CompleteOptionValueDto extends OmitType(CreateOptionValueDto, ['optionId'] as const) {}

class CompleteProductOptionDto extends OmitType(CreateProductOptionDto, ['productId'] as const) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompleteOptionValueDto)
  values?: CompleteOptionValueDto[];
}

class CompleteVariantOptionSelectionDto {
  @IsString()
  @IsNotEmpty()
  optionName: string;

  @IsString()
  @IsNotEmpty()
  optionValue: string;
}

class CompleteProductVariantDto extends OmitType(CreateVariantDto, ['productId'] as const) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompleteVariantOptionSelectionDto)
  optionSelections?: CompleteVariantOptionSelectionDto[];
}

class CompleteProductImageDto extends OmitType(CreateProductImageDto, ['productId'] as const) {}

export class CreateCompleteProductDto {
  @ValidateNested()
  @Type(() => CreateProductDto)
  product: CreateProductDto;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompleteProductOptionDto)
  options?: CompleteProductOptionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompleteProductVariantDto)
  variants?: CompleteProductVariantDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompleteProductImageDto)
  images?: CompleteProductImageDto[];
}
