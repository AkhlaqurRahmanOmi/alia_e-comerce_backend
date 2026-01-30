import { Injectable } from '@nestjs/common';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { BaseRepository } from '../../shared/repository/base.repository';
import {
  FilterOptions,
  PaginatedResult,
  QueryOptions,
} from '../../shared/types';
import { BookingWithRelations } from '../types';

@Injectable()
export class BookingRepository extends BaseRepository<Booking, number> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<BookingWithRelations | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        bookingStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
        bookingPayments: true,
      },
    });
  }

  async findAll(): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      include: {
        user: true,
        bookingStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
        bookingPayments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Partial<Booking>): Promise<Booking> {
    return this.prisma.booking.create({
      data: data as Prisma.BookingCreateInput,
    });
  }

  async update(id: number, data: Partial<Booking>): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.booking.delete({
      where: { id },
    });
  }

  async findWithFilters(
    options: QueryOptions,
  ): Promise<PaginatedResult<BookingWithRelations>> {
    const {
      filters = {},
      sort,
      pagination = { page: 1, limit: 10 },
      search,
    } = options;

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      ...filters,
    };

    if (search?.query) {
      where.OR = search.fields.map((field) => ({
        [field]: {
          contains: search.query,
          mode: 'insensitive',
        },
      }));
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
        include: {
          user: true,
          bookingStatusHistories: {
            orderBy: { createdAt: 'desc' },
          },
          bookingPayments: true,
        },
      }),
      this.prisma.booking.count({ where }),
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

  async search(query: string, fields: string[]): Promise<Booking[]> {
    const where: any = {
      OR: fields.map((field) => ({
        [field]: {
          contains: query,
          mode: 'insensitive',
        },
      })),
    };

    return this.prisma.booking.findMany({
      where,
    });
  }

  async countTotal(filters?: FilterOptions): Promise<number> {
    return this.prisma.booking.count({
      where: {
        ...filters,
      },
    });
  }

  // Booking-specific methods
  async findByConfirmationCode(
    code: string,
  ): Promise<BookingWithRelations | null> {
    return this.prisma.booking.findUnique({
      where: { confirmationCode: code },
      include: {
        user: true,
        bookingStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
        bookingPayments: true,
      },
    });
  }

  async findByUser(userId: number): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        user: true,
        bookingStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
        bookingPayments: true,
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  async findByEmail(email: string): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      where: { customerEmail: email },
      include: {
        user: true,
        bookingStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
        bookingPayments: true,
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['pending', 'confirmed', 'pending_payment'],
        },
      },
      include: {
        user: true,
        bookingStatusHistories: {
          orderBy: { createdAt: 'desc' },
        },
        bookingPayments: true,
      },
      orderBy: { bookingDate: 'asc' },
    });
  }

  async findByDateAndStatus(
    date: Date,
    statuses: BookingStatus[],
  ): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        bookingDate: date,
        status: {
          in: statuses,
        },
      },
    });
  }

  // Get bookings grouped by time slot for a specific date
  async getBookedCapacityByDate(date: Date): Promise<
    {
      bookingTime: string;
      totalBooked: number;
    }[]
  > {
    const result = await this.prisma.booking.groupBy({
      by: ['bookingTime'],
      where: {
        bookingDate: date,
        status: {
          in: ['pending', 'confirmed', 'pending_payment'],
        },
      },
      _sum: {
        partySize: true,
      },
    });

    return result.map((item) => ({
      bookingTime: item.bookingTime,
      totalBooked: item._sum.partySize || 0,
    }));
  }

  async findExpiredPaymentPending(): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        status: 'pending_payment',
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async findUpcomingBookings(hoursAhead: number): Promise<Booking[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        reminderSentAt: null,
        bookingDate: {
          gte: now,
          lte: futureTime,
        },
      },
    });
  }

  // Create booking status history
  async addStatusHistory(
    bookingId: number,
    status: BookingStatus,
    note?: string,
    changedBy?: string,
  ): Promise<void> {
    await this.prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        status,
        note,
        changedBy,
      },
    });
  }
}
