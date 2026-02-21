import { Injectable, BadRequestException } from '@nestjs/common';
import {
  BookingSettingsRepository,
  BlockedDateRepository,
  CustomScheduleRepository,
  BookingRepository,
} from '../repositories';
import { AvailableSlot, AvailabilitySummary } from '../types';

@Injectable()
export class AvailabilityCalculatorProvider {
  constructor(
    private readonly settingsRepo: BookingSettingsRepository,
    private readonly blockedDateRepo: BlockedDateRepository,
    private readonly customScheduleRepo: CustomScheduleRepository,
    private readonly bookingRepo: BookingRepository,
  ) {}

  async calculateAvailability(
    date: string,
    partySize: number,
  ): Promise<AvailabilitySummary> {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate date is not in the past
    if (bookingDate < today) {
      throw new BadRequestException('Cannot book for past dates');
    }

    // Get settings
    const settings = await this.settingsRepo.getSettings();
    if (!settings) {
      throw new BadRequestException('Booking settings not configured');
    }

    if (!settings.isBookingEnabled) {
      throw new BadRequestException('Booking system is currently disabled');
    }

    // Validate party size
    if (
      partySize < settings.minPartySize ||
      partySize > settings.maxPartySize
    ) {
      throw new BadRequestException(
        `Party size must be between ${settings.minPartySize} and ${settings.maxPartySize}`,
      );
    }

    // Check if date is within advance booking window
    const maxAdvanceDate = new Date(today);
    maxAdvanceDate.setDate(
      maxAdvanceDate.getDate() + settings.advanceBookingDays,
    );
    if (bookingDate > maxAdvanceDate) {
      throw new BadRequestException(
        `Cannot book more than ${settings.advanceBookingDays} days in advance`,
      );
    }

    // Check if date is blocked
    const blockedDate = await this.blockedDateRepo.findByDate(bookingDate);
    if (blockedDate) {
      return {
        date,
        slots: [],
        totalSlots: 0,
        availableSlots: 0,
        isFullyBooked: true,
      };
    }

    // Check for custom schedule
    const customSchedule =
      await this.customScheduleRepo.findByDate(bookingDate);

    const openingTime = customSchedule?.openingTime || settings.openingTime;
    const closingTime = customSchedule?.closingTime || settings.closingTime;
    const slotDuration =
      customSchedule?.slotDuration || settings.slotDurationMinutes;
    const maxCapacity =
      customSchedule?.maxCapacity || settings.maxCapacityPerSlot;

    // Generate time slots
    const slots = this.generateTimeSlots(
      openingTime,
      closingTime,
      slotDuration,
    );

    // Get existing bookings for this date
    const bookedCapacity =
      await this.bookingRepo.getBookedCapacityByDate(bookingDate);

    // Create a map for quick lookup
    const bookedMap = new Map<string, number>();
    bookedCapacity.forEach((item) => {
      bookedMap.set(item.bookingTime, item.totalBooked);
    });

    // Calculate availability for each slot
    const availableSlots: AvailableSlot[] = slots.map((time) => {
      const booked = bookedMap.get(time) || 0;
      const available = maxCapacity - booked;
      const isAvailable = available >= partySize;

      return {
        time,
        capacity: maxCapacity,
        booked,
        available,
        isAvailable,
      };
    });

    const availableSlotsCount = availableSlots.filter(
      (slot) => slot.isAvailable,
    ).length;

    return {
      date,
      slots: availableSlots,
      totalSlots: slots.length,
      availableSlots: availableSlotsCount,
      isFullyBooked: availableSlotsCount === 0,
    };
  }

  private generateTimeSlots(
    openingTime: string,
    closingTime: string,
    slotDuration: number,
  ): string[] {
    const slots: string[] = [];
    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);

    let currentTime = openHour * 60 + openMinute; // Convert to minutes
    const endTime = closeHour * 60 + closeMinute;

    while (currentTime + slotDuration <= endTime) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeString);
      currentTime += slotDuration;
    }

    return slots;
  }

  async validateSlotAvailability(
    date: string,
    time: string,
    partySize: number,
  ): Promise<boolean> {
    const availability = await this.calculateAvailability(date, partySize);
    const slot = availability.slots.find((s) => s.time === time);
    return slot?.isAvailable || false;
  }
}
