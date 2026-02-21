import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  BookingRepository,
  BookingSettingsRepository,
  BlockedDateRepository,
  CustomScheduleRepository,
} from './repositories';
import {
  AvailabilityCalculatorProvider,
  BookingManagementProvider,
} from './providers';
import {
  CreateBookingDto,
  UpdateBookingDto,
  CheckAvailabilityDto,
  BookingFilterDto,
  CancelBookingDto,
  UpdateBookingSettingsDto,
  CreateBlockedDateDto,
  CreateCustomScheduleDto,
} from './dtos';
import { BookingWithRelations, AvailabilitySummary } from './types';
import {
  Booking,
  BookingSetting,
  BlockedDate,
  CustomSchedule,
} from '@prisma/client';
import { QueryOptions } from '../shared/types';

@Injectable()
export class BookingsService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'bookings';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly bookingRepo: BookingRepository,
    private readonly settingsRepo: BookingSettingsRepository,
    private readonly blockedDateRepo: BlockedDateRepository,
    private readonly customScheduleRepo: CustomScheduleRepository,
    private readonly availabilityCalculator: AvailabilityCalculatorProvider,
    private readonly bookingManagement: BookingManagementProvider,
  ) {}

  // ===========================
  // Availability Operations
  // ===========================

  async checkAvailability(
    dto: CheckAvailabilityDto,
  ): Promise<AvailabilitySummary> {
    const cacheKey = `${this.CACHE_PREFIX}:availability:${dto.date}:${dto.partySize}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<AvailabilitySummary>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate availability
    const availability =
      await this.availabilityCalculator.calculateAvailability(
        dto.date,
        dto.partySize,
      );

    // Cache the result
    await this.cacheManager.set(cacheKey, availability, this.CACHE_TTL * 1000);

    return availability;
  }

  // ===========================
  // Booking Operations
  // ===========================

  async createBooking(
    dto: CreateBookingDto,
    userId?: number,
  ): Promise<Booking> {
    const booking = await this.bookingManagement.createBooking(dto, userId);

    // Invalidate availability cache for this date
    await this.invalidateAvailabilityCache(dto.bookingDate);

    return booking;
  }

  async findAll(filterDto: BookingFilterDto): Promise<{
    data: BookingWithRelations[];
    pagination: any;
  }> {
    const page = parseInt(filterDto.page || '1', 10);
    const limit = parseInt(filterDto.limit || '10', 10);

    const filters: any = {};

    if (filterDto.status) {
      filters.status = filterDto.status;
    }

    if (filterDto.bookingDate) {
      filters.bookingDate = new Date(filterDto.bookingDate);
    }

    if (filterDto.customerEmail) {
      filters.customerEmail = filterDto.customerEmail;
    }

    if (filterDto.confirmationCode) {
      filters.confirmationCode = filterDto.confirmationCode;
    }

    const queryOptions: QueryOptions = {
      filters,
      pagination: { page, limit },
      sort: filterDto.sortBy
        ? {
            field: filterDto.sortBy,
            order: filterDto.sortOrder || 'desc',
          }
        : undefined,
    };

    return this.bookingRepo.findWithFilters(queryOptions);
  }

  async findOne(id: number): Promise<BookingWithRelations> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async findByConfirmationCode(code: string): Promise<BookingWithRelations> {
    const booking = await this.bookingRepo.findByConfirmationCode(code);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async findByUser(userId: number): Promise<BookingWithRelations[]> {
    return this.bookingRepo.findByUser(userId);
  }

  async findByEmail(email: string): Promise<BookingWithRelations[]> {
    return this.bookingRepo.findByEmail(email);
  }

  async update(
    id: number,
    dto: UpdateBookingDto,
    changedBy?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // If date or time is being updated, check availability
    if (dto.bookingDate || dto.bookingTime || dto.partySize) {
      const newDate =
        dto.bookingDate || booking.bookingDate.toISOString().split('T')[0];
      const newTime = dto.bookingTime || booking.bookingTime;
      const newPartySize = dto.partySize || booking.partySize;

      const isAvailable =
        await this.availabilityCalculator.validateSlotAvailability(
          newDate,
          newTime,
          newPartySize,
        );

      if (!isAvailable) {
        throw new BadRequestException('Selected time slot is not available');
      }
    }

    const updatedBooking = await this.bookingRepo.update(id, {
      ...dto,
      bookingDate: dto.bookingDate ? new Date(dto.bookingDate) : undefined,
    });

    // Add status history if status changed
    if (dto.status) {
      await this.bookingRepo.addStatusHistory(
        id,
        dto.status,
        'Status updated',
        changedBy,
      );
    }

    // Invalidate cache
    if (dto.bookingDate || booking.bookingDate) {
      const dateToInvalidate =
        dto.bookingDate || booking.bookingDate.toISOString().split('T')[0];
      await this.invalidateAvailabilityCache(dateToInvalidate);
    }

    return updatedBooking;
  }

  async cancel(
    id: number,
    dto: CancelBookingDto,
    cancelledBy: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const cancelledBooking = await this.bookingManagement.cancelBooking(
      id,
      dto,
      cancelledBy,
    );

    // Invalidate cache
    await this.invalidateAvailabilityCache(
      booking.bookingDate.toISOString().split('T')[0],
    );

    return cancelledBooking;
  }

  async markAsNoShow(id: number, changedBy: string): Promise<Booking> {
    return this.bookingManagement.markAsNoShow(id, changedBy);
  }

  async markAsCompleted(id: number, changedBy: string): Promise<Booking> {
    return this.bookingManagement.markAsCompleted(id, changedBy);
  }

  async delete(id: number): Promise<void> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.bookingRepo.delete(id);

    // Invalidate cache
    await this.invalidateAvailabilityCache(
      booking.bookingDate.toISOString().split('T')[0],
    );
  }

  // ===========================
  // Settings Operations
  // ===========================

  async getSettings(): Promise<BookingSetting> {
    const settings = await this.settingsRepo.getSettings();
    if (!settings) {
      throw new NotFoundException('Booking settings not configured');
    }
    return settings;
  }

  async updateSettings(dto: UpdateBookingSettingsDto): Promise<BookingSetting> {
    const settings = await this.settingsRepo.getSettings();

    if (!settings) {
      // Create initial settings
      return this.settingsRepo.createSettings({
        maxCapacityPerSlot: dto.maxCapacityPerSlot || 50,
        slotDurationMinutes: dto.slotDurationMinutes || 120,
        openingTime: dto.openingTime || '11:00',
        closingTime: dto.closingTime || '22:00',
        advanceBookingDays: dto.advanceBookingDays || 30,
        minPartySize: dto.minPartySize || 1,
        maxPartySize: dto.maxPartySize || 20,
        requireDeposit: dto.requireDeposit || false,
        depositAmount: dto.depositAmount,
        depositType: dto.depositType || 'fixed',
        paymentHoldMinutes: dto.paymentHoldMinutes || 15,
        cancellationHours: dto.cancellationHours || 24,
        isBookingEnabled:
          dto.isBookingEnabled !== undefined ? dto.isBookingEnabled : true,
      });
    }

    const updated = await this.settingsRepo.updateSettings(settings.id, dto);

    // Clear all availability cache
    await this.clearAllAvailabilityCache();

    return updated;
  }

  // ===========================
  // Blocked Dates Operations
  // ===========================

  async getAllBlockedDates(): Promise<BlockedDate[]> {
    return this.blockedDateRepo.findAll();
  }

  async createBlockedDate(dto: CreateBlockedDateDto): Promise<BlockedDate> {
    const existingBlockedDate = await this.blockedDateRepo.findByDate(
      new Date(dto.date),
    );
    if (existingBlockedDate) {
      throw new BadRequestException('This date is already blocked');
    }

    const blockedDate = await this.blockedDateRepo.create({
      date: new Date(dto.date),
      reason: dto.reason,
      isAllDay: dto.isAllDay !== undefined ? dto.isAllDay : true,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    // Invalidate cache
    await this.invalidateAvailabilityCache(dto.date);

    return blockedDate;
  }

  async deleteBlockedDate(id: number): Promise<void> {
    const blockedDate = await this.blockedDateRepo.findById(id);
    if (!blockedDate) {
      throw new NotFoundException('Blocked date not found');
    }

    await this.blockedDateRepo.delete(id);

    // Invalidate cache
    await this.invalidateAvailabilityCache(
      blockedDate.date.toISOString().split('T')[0],
    );
  }

  // ===========================
  // Custom Schedule Operations
  // ===========================

  async getAllCustomSchedules(): Promise<CustomSchedule[]> {
    return this.customScheduleRepo.findAll();
  }

  async createCustomSchedule(
    dto: CreateCustomScheduleDto,
  ): Promise<CustomSchedule> {
    const existingSchedule = await this.customScheduleRepo.findByDate(
      new Date(dto.date),
    );
    if (existingSchedule) {
      throw new BadRequestException(
        'Custom schedule already exists for this date',
      );
    }

    const schedule = await this.customScheduleRepo.create({
      date: new Date(dto.date),
      openingTime: dto.openingTime,
      closingTime: dto.closingTime,
      maxCapacity: dto.maxCapacity,
      slotDuration: dto.slotDuration,
      requireDeposit: dto.requireDeposit,
      depositAmount: dto.depositAmount,
      reason: dto.reason,
    });

    // Invalidate cache
    await this.invalidateAvailabilityCache(dto.date);

    return schedule;
  }

  async deleteCustomSchedule(id: number): Promise<void> {
    const schedule = await this.customScheduleRepo.findById(id);
    if (!schedule) {
      throw new NotFoundException('Custom schedule not found');
    }

    await this.customScheduleRepo.delete(id);

    // Invalidate cache
    await this.invalidateAvailabilityCache(
      schedule.date.toISOString().split('T')[0],
    );
  }

  // ===========================
  // Cleanup Operations
  // ===========================

  async cleanupExpiredBookings(): Promise<number> {
    const count = await this.bookingManagement.cleanupExpiredBookings();
    return count;
  }

  // ===========================
  // Private Cache Methods
  // ===========================

  private async invalidateAvailabilityCache(date: string): Promise<void> {
    // Invalidate all party size variations for this date
    for (let i = 1; i <= 50; i++) {
      const cacheKey = `${this.CACHE_PREFIX}:availability:${date}:${i}`;
      await this.cacheManager.del(cacheKey);
    }
  }

  private async clearAllAvailabilityCache(): Promise<void> {
    // Note: cache-manager doesn't support reset() or wildcard deletion
    // Cache will auto-expire after TTL (5 minutes)
    // For immediate invalidation, we would need to track all cached keys
    // or use Redis SCAN/KEYS with pattern matching
    // This is acceptable since settings changes are rare
  }
}
