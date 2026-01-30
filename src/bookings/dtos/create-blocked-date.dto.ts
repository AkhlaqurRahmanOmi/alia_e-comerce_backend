import {
  IsDateString,
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateBlockedDateDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  @IsOptional()
  startTime?: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  @IsOptional()
  endTime?: string;
}
