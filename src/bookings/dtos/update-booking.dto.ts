import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @IsDateString()
  @IsOptional()
  bookingDate?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'bookingTime must be in HH:mm format (e.g., 14:30)',
  })
  bookingTime?: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  partySize?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  customerName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'customerPhone must be a valid phone number',
  })
  customerPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  specialRequests?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
}
