import {
  IsEmail,
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

class GuestAddressDto {
  @ApiProperty({ description: 'First Name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Last Name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'Email Address',
    example: 'customer@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: 'Phone Number', example: '+1234567890' })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @ApiProperty({ description: 'Company Name (optional)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @ApiProperty({ description: 'Address Line 1' })
  @IsString()
  @MaxLength(255)
  addressLine1: string;

  @ApiProperty({ description: 'Address Line 2 (optional)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({ description: 'Postal Code' })
  @IsString()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({ description: 'Country Code (2 letters)', example: 'US' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string;
}

export class GuestCreateOrderDto {
  @ApiProperty({
    description: 'Guest customer email',
    example: 'guest@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  guestEmail: string;

  @ApiProperty({ description: 'Guest customer phone', example: '+1234567890' })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  guestPhone: string;

  @ApiProperty({ description: 'Guest first name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  guestFirstName: string;

  @ApiProperty({ description: 'Guest last name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  guestLastName: string;

  @ApiProperty({ description: 'Order items', type: [GuestOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestOrderItemDto)
  items: GuestOrderItemDto[];

  @ApiProperty({ description: 'Shipping address', type: GuestAddressDto })
  @ValidateNested()
  @Type(() => GuestAddressDto)
  shippingAddress: GuestAddressDto;

  @ApiProperty({
    description: 'Billing address (optional, defaults to shipping)',
    type: GuestAddressDto,
  })
  @ValidateNested()
  @Type(() => GuestAddressDto)
  @IsOptional()
  billingAddress?: GuestAddressDto;

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
