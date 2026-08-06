import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UploadVariantImageDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  altText?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  position?: number;
}
