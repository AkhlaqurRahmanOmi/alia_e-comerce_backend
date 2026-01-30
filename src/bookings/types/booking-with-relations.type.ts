import { Booking, User, BookingStatusHistory, BookingPayment } from '@prisma/client';

export type BookingWithRelations = Booking & {
  user?: User | null;
  bookingStatusHistories?: BookingStatusHistory[];
  bookingPayments?: BookingPayment[];
};

export type AvailableSlot = {
  time: string;
  capacity: number;
  booked: number;
  available: number;
  isAvailable: boolean;
};

export type AvailabilitySummary = {
  date: string;
  slots: AvailableSlot[];
  totalSlots: number;
  availableSlots: number;
  isFullyBooked: boolean;
};
