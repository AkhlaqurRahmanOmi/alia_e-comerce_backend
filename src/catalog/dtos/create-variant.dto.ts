import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
  IsInt,
} from 'class-validator';

export class CreateVariantDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

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

  // ✅ NEW: Initial inventory fields
  @IsInt()
  @IsOptional()
  @Min(0)
  initialStock?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  locationId?: number;
}
