import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @IsDateString()
  @IsNotEmpty()
  bookingDate: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'bookingTime must be in HH:mm format (e.g., 14:30)',
  })
  bookingTime: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  partySize: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'customerPhone must be a valid phone number',
  })
  customerPhone: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  specialRequests?: string;
}
