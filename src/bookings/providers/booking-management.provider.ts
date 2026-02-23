import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BookingRepository, BookingSettingsRepository } from '../repositories';
import { AvailabilityCalculatorProvider } from './availability-calculator.provider';
import { CreateBookingDto, CancelBookingDto } from '../dtos';
import { Booking, BookingStatus } from '@/generated/prisma/client';

@Injectable()
export class BookingManagementProvider {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly settingsRepo: BookingSettingsRepository,
    private readonly availabilityCalculator: AvailabilityCalculatorProvider,
  ) {}

  async createBooking(
    dto: CreateBookingDto,
    userId?: number,
  ): Promise<Booking> {
    // Validate slot availability
    const isAvailable =
      await this.availabilityCalculator.validateSlotAvailability(
        dto.bookingDate,
        dto.bookingTime,
        dto.partySize,
      );

    if (!isAvailable) {
      throw new BadRequestException(
        'Selected time slot is not available for the requested party size',
      );
    }

    // Get settings to check deposit requirement
    const settings = await this.settingsRepo.getSettings();
    if (!settings) {
      throw new BadRequestException('Booking settings not configured');
    }

    const depositRequired = settings.requireDeposit;
    let depositAmount: number | null = null;

    if (depositRequired) {
      depositAmount =
        settings.depositType === 'per_person'
          ? settings.depositAmount! * dto.partySize
          : settings.depositAmount!;
    }

    // Calculate expiry time for payment hold
    let expiresAt: Date | null = null;
    if (depositRequired) {
      expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + settings.paymentHoldMinutes,
      );
    }

    // Generate unique confirmation code
    const confirmationCode = this.generateConfirmationCode();

    // Create booking
    const booking = await this.bookingRepo.create({
      userId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      bookingDate: new Date(dto.bookingDate),
      bookingTime: dto.bookingTime,
      partySize: dto.partySize,
      specialRequests: dto.specialRequests,
      status: depositRequired ? 'pending_payment' : 'confirmed',
      paymentStatus: depositRequired ? 'pending' : 'not_required',
      depositRequired,
      depositAmount,
      confirmationCode,
      expiresAt,
    });

    // Add status history
    await this.bookingRepo.addStatusHistory(
      booking.id,
      booking.status,
      'Booking created',
      userId ? `user_${userId}` : 'guest',
    );

    return booking;
  }

  async cancelBooking(
    id: number,
    dto: CancelBookingDto,
    cancelledBy: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Check cancellation policy
    const settings = await this.settingsRepo.getSettings();
    if (settings) {
      const bookingDateTime = new Date(booking.bookingDate);
      const [hours, minutes] = booking.bookingTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const hoursDifference =
        (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < settings.cancellationHours) {
        throw new BadRequestException(
          `Cancellation must be made at least ${settings.cancellationHours} hours before the booking time`,
        );
      }
    }

    // Update booking status
    const updatedBooking = await this.bookingRepo.update(id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: dto.reason,
    });

    // Add status history
    await this.bookingRepo.addStatusHistory(
      id,
      'cancelled',
      dto.reason || 'Booking cancelled',
      cancelledBy,
    );

    return updatedBooking;
  }

  async updateBookingStatus(
    id: number,
    status: BookingStatus,
    note?: string,
    changedBy?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updatedBooking = await this.bookingRepo.update(id, {
      status,
    });

    await this.bookingRepo.addStatusHistory(id, status, note, changedBy);

    return updatedBooking;
  }

  async markAsNoShow(id: number, changedBy: string): Promise<Booking> {
    return this.updateBookingStatus(
      id,
      'no_show',
      'Customer did not show up',
      changedBy,
    );
  }

  async markAsCompleted(id: number, changedBy: string): Promise<Booking> {
    return this.updateBookingStatus(
      id,
      'completed',
      'Booking completed successfully',
      changedBy,
    );
  }

  async cleanupExpiredBookings(): Promise<number> {
    const expiredBookings = await this.bookingRepo.findExpiredPaymentPending();

    for (const booking of expiredBookings) {
      await this.bookingRepo.update(booking.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'system',
        cancellationReason: 'Payment not completed in time',
      });

      await this.bookingRepo.addStatusHistory(
        booking.id,
        'cancelled',
        'Payment not completed in time',
        'system',
      );
    }

    return expiredBookings.length;
  }

  private generateConfirmationCode(): string {
    const prefix = 'BK';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  }
}
