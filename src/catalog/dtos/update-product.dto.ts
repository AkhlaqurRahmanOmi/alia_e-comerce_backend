import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { CreateVariantDto } from './create-variant.dto';
import { CreateProductOptionDto } from './create-product-option.dto';
import { CreateProductImageDto } from './create-product-image.dto';
import { CreateOptionValueDto } from './create-option-value.dto';

// Nested DTO for option values (without optionId since it will be set by parent)
class UpdateOptionValueDto extends OmitType(CreateOptionValueDto, ['optionId']) {}

// Nested DTO for variant option values
class UpdateVariantOptionValueDto {
  @IsInt()
  optionId: number;

  @IsInt()
  optionValueId: number;
}

// Extended option DTO with nested values
class UpdateProductOptionDto extends OmitType(CreateProductOptionDto, ['productId']) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionValueDto)
  values?: UpdateOptionValueDto[];
}

// Extended variant DTO with option values
class UpdateProductVariantDto extends OmitType(CreateVariantDto, ['productId']) {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantOptionValueDto)
  optionValues?: UpdateVariantOptionValueDto[];
}

class UpdateProductImageDto extends OmitType(CreateProductImageDto, ['productId']) {}

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
