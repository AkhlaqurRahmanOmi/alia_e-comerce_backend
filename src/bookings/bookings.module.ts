import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaModule } from '../core/config/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

// Repositories
import {
  BookingRepository,
  BookingSettingsRepository,
  BlockedDateRepository,
  CustomScheduleRepository,
} from './repositories';

// Providers
import {
  AvailabilityCalculatorProvider,
  BookingManagementProvider,
} from './providers';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes default
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [BookingsController],
  providers: [
    // Service facade
    BookingsService,

    // Repositories
    BookingRepository,
    BookingSettingsRepository,
    BlockedDateRepository,
    CustomScheduleRepository,

    // Business logic providers
    AvailabilityCalculatorProvider,
    BookingManagementProvider,
  ],
  exports: [
    BookingsService, // Export for potential use in other modules
  ],
})
export class BookingsModule {}
