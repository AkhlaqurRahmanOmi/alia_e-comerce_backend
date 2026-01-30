import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CouponRepository,
  CouponRedemptionRepository,
} from './repositories';
import {
  CouponValidationProvider,
  CouponCalculationProvider,
  CouponManagementProvider,
} from './providers';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  ApplyCouponDto,
  CouponFilterDto,
  AssignProductsDto,
  AssignCategoriesDto,
  AssignUsersDto,
} from './dtos';
import {
  CouponWithRelations,
  CouponValidationResult,
  CouponApplicationResult,
  CouponStatistics,
} from './types';
import { PaginatedResult } from '../shared/types';

@Injectable()
export class CouponsService {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly redemptionRepository: CouponRedemptionRepository,
    private readonly validationProvider: CouponValidationProvider,
    private readonly calculationProvider: CouponCalculationProvider,
    private readonly managementProvider: CouponManagementProvider,
  ) {}

  // ===========================
  // Admin Operations
  // ===========================

  /**
   * Create a new coupon
   */
  async create(
    createCouponDto: CreateCouponDto,
  ): Promise<CouponWithRelations> {
    return this.managementProvider.createCoupon(createCouponDto);
  }

  /**
   * Get all coupons with filters and pagination
   */
  async findAll(
    filterDto: CouponFilterDto,
  ): Promise<PaginatedResult<CouponWithRelations>> {
    const queryOptions: any = {
      pagination: {
        page: filterDto.page || 1,
        limit: filterDto.limit || 10,
      },
      filters: {},
    };

    // Add search filter
    if (filterDto.search) {
      queryOptions.search = {
        query: filterDto.search,
        fields: ['code'],
      };
    }

    // Add discount type filter
    if (filterDto.discountType) {
      queryOptions.filters.discountType = filterDto.discountType;
    }

    // Add isActive filter
    if (filterDto.isActive !== undefined) {
      queryOptions.filters.isActive = filterDto.isActive;
    }

    // Add sorting
    if (filterDto.sortBy) {
      queryOptions.sort = {
        field: filterDto.sortBy,
        order: filterDto.sortOrder || 'asc',
      };
    }

    return this.couponRepository.findWithFilters(queryOptions);
  }

  /**
   * Get a single coupon by ID
   */
  async findOne(id: number): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  /**
   * Update a coupon
   */
  async update(
    id: number,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponWithRelations> {
    return this.managementProvider.updateCoupon(id, updateCouponDto);
  }

  /**
   * Delete a coupon
   */
  async remove(id: number): Promise<{ message: string }> {
    await this.managementProvider.deleteCoupon(id);
    return { message: 'Coupon deleted successfully' };
  }

  /**
   * Activate a coupon
   */
  async activate(id: number): Promise<CouponWithRelations> {
    return this.managementProvider.activateCoupon(id);
  }

  /**
   * Deactivate a coupon
   */
  async deactivate(id: number): Promise<CouponWithRelations> {
    return this.managementProvider.deactivateCoupon(id);
  }

  /**
   * Assign coupon to products
   */
  async assignToProducts(
    id: number,
    assignProductsDto: AssignProductsDto,
  ): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.assignToProducts(
      id,
      assignProductsDto.productIds,
    );

    const updatedCoupon = await this.couponRepository.findById(id);
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found after assignment');
    }

    return updatedCoupon;
  }

  /**
   * Remove coupon from products
   */
  async removeFromProducts(
    id: number,
    productIds: number[],
  ): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.removeFromProducts(id, productIds);

    const updatedCoupon = await this.couponRepository.findById(id);
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found after removal');
    }

    return updatedCoupon;
  }

  /**
   * Assign coupon to categories
   */
  async assignToCategories(
    id: number,
    assignCategoriesDto: AssignCategoriesDto,
  ): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.assignToCategories(
      id,
      assignCategoriesDto.categoryIds,
    );

    const updatedCoupon = await this.couponRepository.findById(id);
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found after assignment');
    }

    return updatedCoupon;
  }

  /**
   * Remove coupon from categories
   */
  async removeFromCategories(
    id: number,
    categoryIds: number[],
  ): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.removeFromCategories(id, categoryIds);

    const updatedCoupon = await this.couponRepository.findById(id);
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found after removal');
    }

    return updatedCoupon;
  }

  /**
   * Assign coupon to users
   */
  async assignToUsers(
    id: number,
    assignUsersDto: AssignUsersDto,
  ): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.assignToUsers(id, assignUsersDto.userIds);

    const updatedCoupon = await this.couponRepository.findById(id);
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found after assignment');
    }

    return updatedCoupon;
  }

  /**
   * Remove coupon from users
   */
  async removeFromUsers(
    id: number,
    userIds: number[],
  ): Promise<CouponWithRelations> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponRepository.removeFromUsers(id, userIds);

    const updatedCoupon = await this.couponRepository.findById(id);
    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found after removal');
    }

    return updatedCoupon;
  }

  /**
   * Get coupon redemption history
   */
  async getRedemptionHistory(id: number) {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return this.redemptionRepository.findByCoupon(id);
  }

  /**
   * Get coupon statistics
   */
  async getStatistics(id: number): Promise<CouponStatistics> {
    return this.managementProvider.getCouponStatistics(id);
  }

  // ===========================
  // Customer Operations
  // ===========================

  /**
   * Validate a coupon code
   */
  async validateCoupon(
    validateCouponDto: ValidateCouponDto,
  ): Promise<CouponValidationResult> {
    return this.validationProvider.validateCoupon(
      validateCouponDto.code,
      validateCouponDto.userId,
      validateCouponDto.orderAmount,
      validateCouponDto.productIds,
      validateCouponDto.categoryIds,
    );
  }

  /**
   * Apply coupon to cart/order
   */
  async applyCoupon(
    applyCouponDto: ApplyCouponDto,
    userId: number,
    orderAmount: number,
    shippingAmount?: number,
  ): Promise<CouponApplicationResult> {
    // Validate the coupon
    const validationResult = await this.validationProvider.validateCoupon(
      applyCouponDto.code,
      userId,
      orderAmount,
    );

    if (!validationResult.isValid || !validationResult.coupon) {
      return {
        success: false,
        couponId: 0,
        discountAmount: 0,
        originalAmount: orderAmount,
        finalAmount: orderAmount,
        message: validationResult.errors?.join(', '),
      };
    }

    // Calculate discount
    const discountAmount = this.calculationProvider.calculateDiscount(
      validationResult.coupon,
      orderAmount,
      shippingAmount,
    );

    const finalAmount = this.calculationProvider.calculateFinalAmount(
      orderAmount,
      discountAmount,
      shippingAmount,
      validationResult.coupon.discountType,
    );

    return {
      success: true,
      couponId: validationResult.coupon.id,
      discountAmount: Math.round(discountAmount * 100) / 100,
      originalAmount: orderAmount,
      finalAmount: Math.round(finalAmount * 100) / 100,
      message: 'Coupon applied successfully',
    };
  }

  /**
   * Get user's available coupons
   */
  async getUserCoupons(userId: number): Promise<CouponWithRelations[]> {
    return this.couponRepository.findUserCoupons(userId);
  }

  /**
   * Redeem a coupon (called during order creation)
   */
  async redeemCoupon(
    couponId: number,
    orderId: number,
    userId: number,
    amountApplied: number,
  ): Promise<void> {
    // Validate the coupon one more time before redemption
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Note: We're passing 0 as orderAmount because we're validating before the order total is finalized
    // In a real scenario, you might want to pass the actual order amount
    await this.validationProvider.validateCouponForOrder(
      couponId,
      userId,
      amountApplied,
    );

    // Create redemption record
    await this.redemptionRepository.create({
      orderId,
      couponId,
      amountApplied,
    });
  }

  /**
   * Reverse coupon redemption (called during order cancellation)
   */
  async reverseRedemption(orderId: number): Promise<void> {
    await this.redemptionRepository.deleteByOrder(orderId);
  }
}
