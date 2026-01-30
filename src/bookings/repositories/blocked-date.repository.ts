import { Injectable } from '@nestjs/common';
import { BlockedDate, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';

@Injectable()
export class BlockedDateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BlockedDate[]> {
    return this.prisma.blockedDate.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async findById(id: number): Promise<BlockedDate | null> {
    return this.prisma.blockedDate.findUnique({
      where: { id },
    });
  }

  async findByDate(date: Date): Promise<BlockedDate | null> {
    return this.prisma.blockedDate.findUnique({
      where: { date },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<BlockedDate[]> {
    return this.prisma.blockedDate.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(data: Partial<BlockedDate>): Promise<BlockedDate> {
    return this.prisma.blockedDate.create({
      data: data as Prisma.BlockedDateCreateInput,
    });
  }

  async update(id: number, data: Partial<BlockedDate>): Promise<BlockedDate> {
    return this.prisma.blockedDate.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.blockedDate.delete({
      where: { id },
    });
  }
}
