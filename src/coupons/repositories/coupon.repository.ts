import { Injectable } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { BaseRepository } from '../../shared/repository/base.repository';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '../../shared/types';
import { CouponWithRelations } from '../types';

@Injectable()
export class CouponRepository extends BaseRepository<Coupon, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<CouponWithRelations | null> {
    return this.prisma.coupon.findUnique({
      where: { id },
      include: {
        couponProducts: {
          include: {
            product: true,
          },
        },
        couponCategories: {
          include: {
            category: true,
          },
        },
        couponUsers: {
          include: {
            user: true,
          },
        },
        couponRedemptions: true,
      },
    }) as Promise<CouponWithRelations | null>;
  }

  async findAll(): Promise<CouponWithRelations[]> {
    return this.prisma.coupon.findMany({
      include: {
        couponProducts: {
          include: {
            product: true,
          },
        },
        couponCategories: {
          include: {
            category: true,
          },
        },
        couponUsers: {
          include: {
            user: true,
          },
        },
        couponRedemptions: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<CouponWithRelations[]>;
  }

  async create(data: Partial<Coupon>): Promise<Coupon> {
    return this.prisma.coupon.create({
      data: data as any,
    });
  }

  async update(id: number, data: Partial<Coupon>): Promise<Coupon> {
    return this.prisma.coupon.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.coupon.delete({
      where: { id },
    });
  }

  async findWithFilters(
    options: QueryOptions,
  ): Promise<PaginatedResult<CouponWithRelations>> {
    const {
      filters = {},
      sort,
      pagination = { page: 1, limit: 10 },
      search,
    } = options;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      ...filters,
    };

    // Add search functionality
    if (search?.query) {
      where.OR = search.fields.map((field) => ({
        [field]: {
          contains: search.query,
          mode: 'insensitive',
        },
      }));
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
        include: {
          couponProducts: {
            include: {
              product: true,
            },
          },
          couponCategories: {
            include: {
              category: true,
            },
          },
          couponUsers: {
            include: {
              user: true,
            },
          },
          couponRedemptions: true,
        },
      }) as Promise<CouponWithRelations[]>,
      this.prisma.coupon.count({ where }),
    ]);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async search(query: string, fields: string[]): Promise<Coupon[]> {
    const where: any = {
      OR: fields.map((field) => ({
        [field]: {
          contains: query,
          mode: 'insensitive',
        },
      })),
    };

    return this.prisma.coupon.findMany({
      where,
    });
  }

  async countTotal(filters?: FilterOptions): Promise<number> {
    return this.prisma.coupon.count({
      where: {
        ...filters,
      },
    });
  }

  // Coupon-specific methods
  async findByCode(code: string): Promise<CouponWithRelations | null> {
    return this.prisma.coupon.findUnique({
      where: { code },
      include: {
        couponProducts: {
          include: {
            product: true,
          },
        },
        couponCategories: {
          include: {
            category: true,
          },
        },
        couponUsers: {
          include: {
            user: true,
          },
        },
        couponRedemptions: true,
      },
    }) as Promise<CouponWithRelations | null>;
  }

  async findActiveByCode(code: string): Promise<CouponWithRelations | null> {
    const now = new Date();
    return this.prisma.coupon.findFirst({
      where: {
        code,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        couponProducts: {
          include: {
            product: true,
          },
        },
        couponCategories: {
          include: {
            category: true,
          },
        },
        couponUsers: {
          include: {
            user: true,
          },
        },
        couponRedemptions: true,
      },
    }) as Promise<CouponWithRelations | null>;
  }

  async findActiveCoupons(): Promise<Coupon[]> {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUserCoupons(userId: number): Promise<CouponWithRelations[]> {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
        couponUsers: {
          some: {
            userId,
          },
        },
      },
      include: {
        couponProducts: {
          include: {
            product: true,
          },
        },
        couponCategories: {
          include: {
            category: true,
          },
        },
        couponUsers: {
          include: {
            user: true,
          },
        },
        couponRedemptions: true,
      },
    }) as Promise<CouponWithRelations[]>;
  }

  async getRedemptionCount(couponId: number): Promise<number> {
    return this.prisma.couponRedemption.count({
      where: { couponId },
    });
  }

  async getRedemptionCountByUser(
    couponId: number,
    userId: number,
  ): Promise<number> {
    return this.prisma.couponRedemption.count({
      where: {
        couponId,
        order: {
          userId,
        },
      },
    });
  }

  // Assignment methods
  async assignToProducts(couponId: number, productIds: number[]): Promise<void> {
    await this.prisma.couponProduct.createMany({
      data: productIds.map((productId) => ({
        couponId,
        productId,
      })),
      skipDuplicates: true,
    });
  }

  async removeFromProducts(
    couponId: number,
    productIds: number[],
  ): Promise<void> {
    await this.prisma.couponProduct.deleteMany({
      where: {
        couponId,
        productId: {
          in: productIds,
        },
      },
    });
  }

  async assignToCategories(
    couponId: number,
    categoryIds: number[],
  ): Promise<void> {
    await this.prisma.couponCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        couponId,
        categoryId,
      })),
      skipDuplicates: true,
    });
  }

  async removeFromCategories(
    couponId: number,
    categoryIds: number[],
  ): Promise<void> {
    await this.prisma.couponCategory.deleteMany({
      where: {
        couponId,
        categoryId: {
          in: categoryIds,
        },
      },
    });
  }

  async assignToUsers(couponId: number, userIds: number[]): Promise<void> {
    await this.prisma.couponUser.createMany({
      data: userIds.map((userId) => ({
        couponId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  async removeFromUsers(couponId: number, userIds: number[]): Promise<void> {
    await this.prisma.couponUser.deleteMany({
      where: {
        couponId,
        userId: {
          in: userIds,
        },
      },
    });
  }
}
