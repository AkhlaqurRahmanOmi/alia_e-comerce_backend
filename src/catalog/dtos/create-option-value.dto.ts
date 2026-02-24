import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';

export class CreateOptionValueDto {
  @IsNumber()
  @IsNotEmpty()
  optionId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  value: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  position?: number;

  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;
}
