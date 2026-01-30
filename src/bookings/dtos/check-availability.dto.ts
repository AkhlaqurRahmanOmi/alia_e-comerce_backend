import { IsDateString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CheckAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  partySize: number;
}
