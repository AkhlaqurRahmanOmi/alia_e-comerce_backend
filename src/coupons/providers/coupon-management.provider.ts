import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CouponRepository } from '../repositories';
import { CreateCouponDto, UpdateCouponDto } from '../dtos';
import { CouponWithRelations, CouponStatistics } from '../types';
import { CouponCalculationProvider } from './coupon-calculation.provider';

@Injectable()
export class CouponManagementProvider {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly calculationProvider: CouponCalculationProvider,
  ) {}

  /**
   * Create a new coupon with optional relations
   */
  async createCoupon(
    createCouponDto: CreateCouponDto,
  ): Promise<CouponWithRelations> {
    // Check if coupon code already exists
    const existingCoupon = await this.couponRepository.findByCode(
      createCouponDto.code,
    );

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // Validate discount amount
    if (
      !this.calculationProvider.validateDiscountAmount(
        createCouponDto.discountType,
        createCouponDto.discountAmount,
      )
    ) {
      throw new BadRequestException('Invalid discount amount for discount type');
    }

    // Extract relation data
    const { productIds, categoryIds, userIds, ...couponData } =
      createCouponDto;

    // Create the coupon
    const coupon = await this.couponRepository.create({
      ...couponData,
      startDate: couponData.startDate
        ? new Date(couponData.startDate)
        : undefined,
      endDate: couponData.endDate ? new Date(couponData.endDate) : undefined,
    });

    // Assign to products if provided
    if (productIds && productIds.length > 0) {
      await this.couponRepository.assignToProducts(coupon.id, productIds);
    }

    // Assign to categories if provided
    if (categoryIds && categoryIds.length > 0) {
      await this.couponRepository.assignToCategories(coupon.id, categoryIds);
    }

    // Assign to users if provided
    if (userIds && userIds.length > 0) {
      await this.couponRepository.assignToUsers(coupon.id, userIds);
    }

    // Return the created coupon with relations
    const createdCoupon = await this.couponRepository.findById(coupon.id);
    if (!createdCoupon) {
      throw new NotFoundException('Coupon not found after creation');
    }

    return createdCoupon;
  }

  /**
   * Update an existing coupon
   */
  async updateCoupon(
    id: number,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponWithRelations> {
    // Check if coupon exists
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // If updating code, check for conflicts
    if (updateCouponDto.code && updateCouponDto.code !== coupon.code) {
      const existingCoupon = await this.couponRepository.findByCode(
        updateCouponDto.code,
      );
      if (existingCoupon) {
        throw new ConflictException('Coupon code already exists');
      }
    }

    // Validate discount amount if provided
    if (
      updateCouponDto.discountType &&
      updateCouponDto.discountAmount !== undefined
    ) {
      if (
        !this.calculationProvider.validateDiscountAmount(
          updateCouponDto.discountType,
          updateCouponDto.discountAmount,
        )
      ) {
        throw new BadRequestException(
          'Invalid discount amount for discount type',
        );
      }
    }

    // Extract relation data
    const { productIds, categoryIds, userIds, ...couponData } =
      updateCouponDto;

    // Update the coupon
    await this.couponRepository.update(id, {
      ...couponData,
      startDate: couponData.startDate
        ? new Date(couponData.startDate)
        : undefined,
      endDate: couponData.endDate ? new Date(couponData.endDate) : undefined,
    });

    // Update product assignments if provided
    if (productIds !== undefined) {
      // Remove all existing products
      const existingProducts = coupon.couponProducts.map((cp) => cp.product.id);
      if (existingProducts.length > 0) {
        await this.couponRepository.removeFromProducts(id, existingProducts);
      }
      // Add new products
      if (productIds.length > 0) {
        await this.couponRepository.assignToProducts(id, productIds);
      }
    }

    // Update category assignments if provided
    if (categoryIds !== undefined) {
      // Remove all existing categories
      const existingCategories = coupon.couponCategories.map(
        (cc) => cc.category.id,
      );
      if (existingCategories.length > 0) {
        await this.couponRepository.removeFromCategories(
          id,
          existingCategories,
        );
      }
      // Add new categories
      if (categoryIds.length > 0) {
        await this.couponRepository.assignToCategories(id, categoryIds);
      }
    }

    // Update user assignments if provided
    if (userIds !== undefined) {
      // Remove all existing users
      const existingUsers = coupon.couponUsers.map((cu) => cu.user.id);
      if (existingUsers.length > 0) {
        await this.couponRepository.removeFromUsers(id, existingUsers);
      }
      // Add new users
      if (userIds.length > 0) {
        await this.couponRepository.assignToUsers(id, userIds);
      }
    }

    // Return the updated coupon with relations
    const updatedCoupon = await this.couponRepository.findById(id);
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found after update');
    }

    return updatedCoupon;
  }

  /**
   * Get coupon statistics
   */
  async getCouponStatistics(couponId: number): Promise<CouponStatistics> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const totalRedemptions = coupon.couponRedemptions.length;

    const totalDiscountGiven = coupon.couponRedemptions.reduce(
      (sum, redemption) => sum + redemption.amountApplied,
      0,
    );

    // Get unique user count
    const uniqueUserIds = new Set(
      coupon.couponRedemptions.map((r) => r.orderId), // This is a simplification
    );

    const averageDiscountPerOrder =
      totalRedemptions > 0 ? totalDiscountGiven / totalRedemptions : 0;

    const remainingUses = coupon.maxUses
      ? Math.max(0, coupon.maxUses - totalRedemptions)
      : undefined;

    return {
      totalRedemptions,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      uniqueUsers: uniqueUserIds.size,
      averageDiscountPerOrder:
        Math.round(averageDiscountPerOrder * 100) / 100,
      remainingUses,
    };
  }

  /**
   * Activate a coupon
   */
  async activateCoupon(id: number): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.update(id, { isActive: true });

    const activatedCoupon = await this.couponRepository.findById(id);
    if (!activatedCoupon) {
      throw new NotFoundException('Coupon not found after activation');
    }

    return activatedCoupon;
  }

  /**
   * Deactivate a coupon
   */
  async deactivateCoupon(id: number): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.update(id, { isActive: false });

    const deactivatedCoupon = await this.couponRepository.findById(id);
    if (!deactivatedCoupon) {
      throw new NotFoundException('Coupon not found after deactivation');
    }

    return deactivatedCoupon;
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: number): Promise<void> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Check if coupon has been used
    if (coupon.couponRedemptions && coupon.couponRedemptions.length > 0) {
      throw new BadRequestException(
        'Cannot delete coupon that has been redeemed',
      );
    }

    await this.couponRepository.delete(id);
  }
}
