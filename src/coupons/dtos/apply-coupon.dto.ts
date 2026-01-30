import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cartId?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  orderId?: number;
}
