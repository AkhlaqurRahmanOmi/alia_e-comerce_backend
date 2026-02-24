import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
  IsArray,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductAttributeDto } from './create-product-attribute.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  seoTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  seoDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  seoKeywords?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  seoSlug?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  countryId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  segmentIds?: number[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductAttributeDto)
  attributes?: CreateProductAttributeDto[];
}
