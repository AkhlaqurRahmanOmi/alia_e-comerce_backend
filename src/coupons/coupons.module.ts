import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { PrismaModule } from '../core/config/prisma/prisma.module';

// Repositories
import { CouponRepository, CouponRedemptionRepository } from './repositories';

// Providers
import {
  CouponValidationProvider,
  CouponCalculationProvider,
  CouponManagementProvider,
} from './providers';

@Module({
  imports: [PrismaModule],
  controllers: [CouponsController],
  providers: [
    // Service facade
    CouponsService,

    // Repositories
    CouponRepository,
    CouponRedemptionRepository,

    // Business logic providers
    CouponValidationProvider,
    CouponCalculationProvider,
    CouponManagementProvider,
  ],
  exports: [
    CouponsService, // Export for Cart and Order modules
  ],
})
export class CouponsModule {}
