import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UploadProductImageDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  altText?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  position?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (value === true || value === 'true' || value === '1' || value === 1) {
      return true;
    }

    if (value === false || value === 'false' || value === '0' || value === 0) {
      return false;
    }

    return value;
  })
  isMain?: boolean;
}
