import { Injectable, BadRequestException } from '@nestjs/common';
import { CouponRepository } from '../repositories';
import { CouponValidationResult, CouponWithRelations } from '../types';

@Injectable()
export class CouponValidationProvider {
  constructor(private readonly couponRepository: CouponRepository) {}

  async validateCoupon(
    code: string,
    userId?: number,
    orderAmount?: number,
    productIds?: number[],
    categoryIds?: number[],
  ): Promise<CouponValidationResult> {
    const errors: string[] = [];

    // Find the coupon
    const coupon = await this.couponRepository.findActiveByCode(code);

    if (!coupon) {
      return {
        isValid: false,
        errors: ['Coupon not found or inactive'],
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      errors.push('Coupon is not active');
    }

    // Check date validity
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      errors.push('Coupon is not yet valid');
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      errors.push('Coupon has expired');
    }

    // Check minimum order amount
    if (
      coupon.minOrderAmount &&
      orderAmount &&
      orderAmount < coupon.minOrderAmount
    ) {
      errors.push(
        `Minimum order amount of ${coupon.minOrderAmount} is required`,
      );
    }

    // Check maximum uses
    if (coupon.maxUses) {
      const redemptionCount = await this.couponRepository.getRedemptionCount(
        coupon.id,
      );
      if (redemptionCount >= coupon.maxUses) {
        errors.push('Coupon has reached maximum usage limit');
      }
    }

    // Check maximum uses per user
    if (coupon.maxUsesPerUser && userId) {
      const userRedemptionCount =
        await this.couponRepository.getRedemptionCountByUser(coupon.id, userId);
      if (userRedemptionCount >= coupon.maxUsesPerUser) {
        errors.push('You have reached the maximum usage limit for this coupon');
      }
    }

    // Check product restrictions
    if (
      coupon.couponProducts &&
      coupon.couponProducts.length > 0 &&
      productIds &&
      productIds.length > 0
    ) {
      const allowedProductIds = coupon.couponProducts.map(
        (cp) => cp.product.id,
      );
      const hasValidProduct = productIds.some((id) =>
        allowedProductIds.includes(id),
      );
      if (!hasValidProduct) {
        errors.push('Coupon is not valid for the selected products');
      }
    }

    // Check category restrictions
    if (
      coupon.couponCategories &&
      coupon.couponCategories.length > 0 &&
      categoryIds &&
      categoryIds.length > 0
    ) {
      const allowedCategoryIds = coupon.couponCategories.map(
        (cc) => cc.category.id,
      );
      const hasValidCategory = categoryIds.some((id) =>
        allowedCategoryIds.includes(id),
      );
      if (!hasValidCategory) {
        errors.push('Coupon is not valid for the selected categories');
      }
    }

    // Check user restrictions
    if (coupon.couponUsers && coupon.couponUsers.length > 0 && userId) {
      const allowedUserIds = coupon.couponUsers.map((cu) => cu.user.id);
      if (!allowedUserIds.includes(userId)) {
        errors.push('This coupon is not available for your account');
      }
    }

    // Return validation result
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        coupon,
      };
    }

    return {
      isValid: true,
      coupon,
      errors: [],
    };
  }

  async validateCouponForOrder(
    couponId: number,
    userId: number,
    orderAmount: number,
  ): Promise<void> {
    const coupon = await this.couponRepository.findById(couponId);

    if (!coupon) {
      throw new BadRequestException('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    // Check date validity
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new BadRequestException('Coupon is not yet valid');
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of ${coupon.minOrderAmount} is required`,
      );
    }

    // Check maximum uses
    if (coupon.maxUses) {
      const redemptionCount = await this.couponRepository.getRedemptionCount(
        coupon.id,
      );
      if (redemptionCount >= coupon.maxUses) {
        throw new BadRequestException(
          'Coupon has reached maximum usage limit',
        );
      }
    }

    // Check maximum uses per user
    if (coupon.maxUsesPerUser) {
      const userRedemptionCount =
        await this.couponRepository.getRedemptionCountByUser(coupon.id, userId);
      if (userRedemptionCount >= coupon.maxUsesPerUser) {
        throw new BadRequestException(
          'You have reached the maximum usage limit for this coupon',
        );
      }
    }
  }
}
