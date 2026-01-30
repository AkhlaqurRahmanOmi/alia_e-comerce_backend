import { Injectable } from '@nestjs/common';
import { UserAddress } from '@prisma/client';
import { PrismaService } from 'src/core/config/prisma/prisma.service';

@Injectable()
export class UserAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, data: Partial<UserAddress>): Promise<UserAddress> {
    return this.prisma.userAddress.create({
      data: {
        ...data,
        userId,
      } as any,
    });
  }

  async findById(id: number): Promise<UserAddress | null> {
    return this.prisma.userAddress.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: number): Promise<UserAddress[]> {
    return this.prisma.userAddress.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUserId(id: number, userId: number): Promise<UserAddress | null> {
    return this.prisma.userAddress.findFirst({
      where: { id, userId },
    });
  }

  async update(id: number, data: Partial<UserAddress>): Promise<UserAddress> {
    return this.prisma.userAddress.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.userAddress.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findDefaultBilling(userId: number): Promise<UserAddress | null> {
    return this.prisma.userAddress.findFirst({
      where: { userId, isDefaultBilling: true, isActive: true },
    });
  }

  async findDefaultShipping(userId: number): Promise<UserAddress | null> {
    return this.prisma.userAddress.findFirst({
      where: { userId, isDefaultShipping: true, isActive: true },
    });
  }

  async clearDefaultBilling(userId: number): Promise<void> {
    await this.prisma.userAddress.updateMany({
      where: { userId, isDefaultBilling: true },
      data: { isDefaultBilling: false },
    });
  }

  async clearDefaultShipping(userId: number): Promise<void> {
    await this.prisma.userAddress.updateMany({
      where: { userId, isDefaultShipping: true },
      data: { isDefaultShipping: false },
    });
  }

  async updateLastUsed(id: number): Promise<void> {
    await this.prisma.userAddress.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
