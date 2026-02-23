import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  position?: number;
}
