import {
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class UpdateBookingSettingsDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxCapacityPerSlot?: number;

  @IsNumber()
  @Min(30)
  @Max(240)
  @IsOptional()
  slotDurationMinutes?: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openingTime must be in HH:mm format',
  })
  @IsOptional()
  openingTime?: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closingTime must be in HH:mm format',
  })
  @IsOptional()
  closingTime?: string;

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  advanceBookingDays?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minPartySize?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxPartySize?: number;

  @IsBoolean()
  @IsOptional()
  requireDeposit?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @IsString()
  @IsEnum(['fixed', 'per_person'])
  @IsOptional()
  depositType?: string;

  @IsNumber()
  @Min(5)
  @Max(60)
  @IsOptional()
  paymentHoldMinutes?: number;

  @IsNumber()
  @Min(1)
  @Max(72)
  @IsOptional()
  cancellationHours?: number;

  @IsBoolean()
  @IsOptional()
  isBookingEnabled?: boolean;
}
