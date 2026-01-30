import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  label?: string;

  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MaxLength(255)
  addressLine1: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(100)
  state: string;

  @IsString()
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string;

  @IsBoolean()
  @IsOptional()
  isDefaultBilling?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefaultShipping?: boolean;
}
