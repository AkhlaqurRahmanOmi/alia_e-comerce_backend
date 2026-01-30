import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

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
}
