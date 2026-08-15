import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentGateway } from '../../payments/dtos/initiate-payment.dto';
import { ApiProperty } from '@nestjs/swagger';

class GuestOrderItemDto {
  @ApiProperty({ description: 'Variant ID' })
  @IsNumber()
  @IsOptional()
  variantId?: number;

  @ApiProperty({ description: 'Bundle ID' })
  @IsNumber()
  @IsOptional()
  bundleId?: number;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  quantity: number;
}

export class GuestCreateOrderDto {
  @ApiProperty({ description: 'Customer first name', example: 'Omi' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Customer phone', example: '01700000000' })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @ApiProperty({ description: 'Street address', example: 'Road 10, Dhaka' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  addressLine1: string;

  @ApiProperty({ description: 'Order items', type: [GuestOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestOrderItemDto)
  items: GuestOrderItemDto[];

  @ApiProperty({ description: 'Shipping method ID' })
  @IsNumber()
  @IsOptional()
  shippingMethodId?: number;

  @ApiProperty({ description: 'Coupon code (optional)' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({
    description: 'Payment gateway',
    enum: PaymentGateway,
    default: PaymentGateway.CASH_ON_DELIVERY,
  })
  @IsEnum(PaymentGateway)
  @IsOptional()
  paymentGateway?: PaymentGateway;
}
