import { Injectable } from '@nestjs/common';
import { BookingSetting, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';

@Injectable()
export class BookingSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<BookingSetting | null> {
    return this.prisma.bookingSetting.findFirst();
  }

  async createSettings(
    data: Partial<BookingSetting>,
  ): Promise<BookingSetting> {
    return this.prisma.bookingSetting.create({
      data: data as Prisma.BookingSettingCreateInput,
    });
  }

  async updateSettings(
    id: number,
    data: Partial<BookingSetting>,
  ): Promise<BookingSetting> {
    return this.prisma.bookingSetting.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }
}
