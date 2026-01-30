import { Injectable } from '@nestjs/common';
import { CustomSchedule, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';

@Injectable()
export class CustomScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CustomSchedule[]> {
    return this.prisma.customSchedule.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async findById(id: number): Promise<CustomSchedule | null> {
    return this.prisma.customSchedule.findUnique({
      where: { id },
    });
  }

  async findByDate(date: Date): Promise<CustomSchedule | null> {
    return this.prisma.customSchedule.findUnique({
      where: { date },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<CustomSchedule[]> {
    return this.prisma.customSchedule.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(data: Partial<CustomSchedule>): Promise<CustomSchedule> {
    return this.prisma.customSchedule.create({
      data: data as Prisma.CustomScheduleCreateInput,
    });
  }

  async update(
    id: number,
    data: Partial<CustomSchedule>,
  ): Promise<CustomSchedule> {
    return this.prisma.customSchedule.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.customSchedule.delete({
      where: { id },
    });
  }
}
