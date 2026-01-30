import {
  IsDateString,
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  Min,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomScheduleDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openingTime must be in HH:mm format',
  })
  openingTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closingTime must be in HH:mm format',
  })
  closingTime: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @IsNumber()
  @Min(30)
  @IsOptional()
  slotDuration?: number;

  @IsBoolean()
  @IsOptional()
  requireDeposit?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;
}
