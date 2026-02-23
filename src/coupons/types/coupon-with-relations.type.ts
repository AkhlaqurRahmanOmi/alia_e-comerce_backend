import {
  Coupon,
  Product,
  Category,
  User,
  CouponRedemption,
} from '@/generated/prisma/client';

// Type for Coupon with Products
export type CouponWithProducts = Coupon & {
  couponProducts: Array<{
    product: Product;
  }>;
};

// Type for Coupon with Categories
export type CouponWithCategories = Coupon & {
  couponCategories: Array<{
    category: Category;
  }>;
};

// Type for Coupon with Users
export type CouponWithUsers = Coupon & {
  couponUsers: Array<{
    user: User;
  }>;
};

// Type for Coupon with all relations
export type CouponWithRelations = Coupon & {
  couponProducts: Array<{
    product: Product;
  }>;
  couponCategories: Array<{
    category: Category;
  }>;
  couponUsers: Array<{
    user: User;
  }>;
  couponRedemptions: CouponRedemption[];
};

// Type for validation result
export interface CouponValidationResult {
  isValid: boolean;
  coupon?: CouponWithRelations;
  errors?: string[];
  discountAmount?: number;
}

// Type for application result
export interface CouponApplicationResult {
  success: boolean;
  couponId: number;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  message?: string;
}

// Type for coupon statistics
export interface CouponStatistics {
  totalRedemptions: number;
  totalDiscountGiven: number;
  uniqueUsers: number;
  averageDiscountPerOrder: number;
  remainingUses?: number;
}
