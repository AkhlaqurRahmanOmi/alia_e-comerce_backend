import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  orderAmount?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  productIds?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  categoryIds?: number[];

  @IsNumber()
  @IsOptional()
  userId?: number;
}
