import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { BasePaginationDto } from '../../shared/dtos/base-pagination.dto';
import { DiscountType } from '@/generated/prisma/client';

export class CouponFilterDto extends BasePaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
