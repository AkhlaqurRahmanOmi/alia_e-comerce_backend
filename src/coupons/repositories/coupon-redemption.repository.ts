import { Injectable } from '@nestjs/common';
import { CouponRedemption } from '@/generated/prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';

@Injectable()
export class CouponRedemptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    orderId: number;
    couponId: number;
    amountApplied: number;
  }): Promise<CouponRedemption> {
    return this.prisma.couponRedemption.create({
      data,
    });
  }

  async findByOrder(orderId: number): Promise<CouponRedemption[]> {
    return this.prisma.couponRedemption.findMany({
      where: { orderId },
      include: {
        coupon: true,
        order: true,
      },
    });
  }

  async findByCoupon(couponId: number): Promise<CouponRedemption[]> {
    return this.prisma.couponRedemption.findMany({
      where: { couponId },
      include: {
        coupon: true,
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndCoupon(
    userId: number,
    couponId: number,
  ): Promise<CouponRedemption[]> {
    return this.prisma.couponRedemption.findMany({
      where: {
        couponId,
        order: {
          userId,
        },
      },
      include: {
        coupon: true,
        order: true,
      },
    });
  }

  async getTotalDiscountByCoupon(couponId: number): Promise<number> {
    const result = await this.prisma.couponRedemption.aggregate({
      where: { couponId },
      _sum: {
        amountApplied: true,
      },
    });
    return result._sum.amountApplied || 0;
  }

  async getUniqueUserCount(couponId: number): Promise<number> {
    const uniqueUsers = await this.prisma.couponRedemption.findMany({
      where: { couponId },
      select: {
        order: {
          select: {
            userId: true,
          },
        },
      },
      distinct: ['orderId'],
    });

    const userIds = new Set(uniqueUsers.map((r) => r.order.userId));
    return userIds.size;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.couponRedemption.delete({
      where: { id },
    });
  }

  async deleteByOrder(orderId: number): Promise<void> {
    await this.prisma.couponRedemption.deleteMany({
      where: { orderId },
    });
  }
}
