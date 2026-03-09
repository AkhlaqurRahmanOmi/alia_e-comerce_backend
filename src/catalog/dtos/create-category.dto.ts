import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  iconUrl?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  slug: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;
}
