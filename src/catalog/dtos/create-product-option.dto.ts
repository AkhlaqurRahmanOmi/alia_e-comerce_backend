import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { OptionDisplayType } from '@/generated/prisma/client';

export class CreateProductOptionDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  position?: number;

  @IsEnum(OptionDisplayType)
  @IsOptional()
  displayType?: OptionDisplayType;
}
