import { Injectable } from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { CouponWithRelations } from '../types';

@Injectable()
export class CouponCalculationProvider {
  /**
   * Calculate discount amount based on coupon type
   */
  calculateDiscount(
    coupon: CouponWithRelations,
    orderAmount: number,
    shippingAmount?: number,
  ): number {
    switch (coupon.discountType) {
      case DiscountType.percentage:
        return this.calculatePercentageDiscount(
          coupon.discountAmount,
          orderAmount,
        );

      case DiscountType.fixed:
        return this.calculateFixedDiscount(coupon.discountAmount, orderAmount);

      case DiscountType.shipping:
        return this.calculateShippingDiscount(
          coupon.discountAmount,
          shippingAmount || 0,
        );

      default:
        return 0;
    }
  }

  /**
   * Calculate percentage discount
   */
  private calculatePercentageDiscount(
    percentage: number,
    orderAmount: number,
  ): number {
    // Ensure percentage is between 0 and 100
    const validPercentage = Math.min(Math.max(percentage, 0), 100);
    const discount = (orderAmount * validPercentage) / 100;
    // Round to 2 decimal places
    return Math.round(discount * 100) / 100;
  }

  /**
   * Calculate fixed amount discount
   */
  private calculateFixedDiscount(
    fixedAmount: number,
    orderAmount: number,
  ): number {
    // Discount cannot exceed order amount
    return Math.min(fixedAmount, orderAmount);
  }

  /**
   * Calculate shipping discount
   */
  private calculateShippingDiscount(
    discountAmount: number,
    shippingAmount: number,
  ): number {
    // If discount is 100%, free shipping
    if (discountAmount >= 100) {
      return shippingAmount;
    }

    // Otherwise, apply percentage or fixed discount to shipping
    if (discountAmount <= 100) {
      // Treat as percentage
      return Math.round((shippingAmount * discountAmount) / 100 * 100) / 100;
    } else {
      // Treat as fixed amount
      return Math.min(discountAmount, shippingAmount);
    }
  }

  /**
   * Calculate final order amount after discount
   */
  calculateFinalAmount(
    orderAmount: number,
    discountAmount: number,
    shippingAmount?: number,
    couponType?: DiscountType,
  ): number {
    if (couponType === DiscountType.shipping && shippingAmount) {
      // For shipping discount, reduce shipping cost
      return orderAmount + shippingAmount - discountAmount;
    }

    // For other discounts, reduce order total
    const finalAmount = orderAmount - discountAmount;
    return Math.max(finalAmount, 0); // Ensure non-negative
  }

  /**
   * Format discount for display
   */
  formatDiscount(
    discountType: DiscountType,
    discountAmount: number,
  ): string {
    switch (discountType) {
      case DiscountType.percentage:
        return `${discountAmount}% off`;

      case DiscountType.fixed:
        return `$${discountAmount.toFixed(2)} off`;

      case DiscountType.shipping:
        if (discountAmount >= 100) {
          return 'Free shipping';
        }
        return `${discountAmount}% off shipping`;

      default:
        return 'Discount';
    }
  }

  /**
   * Validate discount amount based on type
   */
  validateDiscountAmount(
    discountType: DiscountType,
    discountAmount: number,
  ): boolean {
    switch (discountType) {
      case DiscountType.percentage:
        return discountAmount > 0 && discountAmount <= 100;

      case DiscountType.fixed:
        return discountAmount > 0;

      case DiscountType.shipping:
        return discountAmount > 0;

      default:
        return false;
    }
  }
}
