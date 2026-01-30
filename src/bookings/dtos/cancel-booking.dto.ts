import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
