import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ShippingModule } from '../shipping/shipping.module';
import { BundlesModule } from '../bundles/bundles.module';
import { ReportsModule } from '../reports/reports.module';
import { CmsModule } from '../cms/cms.module';
import { CountryModule } from '../country/country.module';
import { RbacModule } from '../rbac/rbac.module';
// import { BookingsModule } from '../bookings/bookings.module'; // Removed - not needed for this client

/**
 * AdminModule groups all admin-focused business modules
 * These modules contain endpoints primarily used by administrators
 * to manage the e-commerce platform:
 *
 * - Orders: Order management and fulfillment
 * - Cart: Cart administration and abandoned cart tracking
 * - Inventory: Stock management across locations
 * - Bundles: Product bundle management
 * - Country: Country management for wine origin tracking
 * - RBAC: Role and permission management (access control)
 * - Payments: Payment processing and reconciliation
 * - Coupons: Discount and promotion management
 * - Shipping: Shipping methods and rates
 * - Reports: Analytics and business intelligence
 * - CMS: Content Management System for homepage sections
 *
 * Note: Access control is handled by guards (@Roles, @Permissions)
 * in individual controllers, not at the module level.
 */
@Module({
  imports: [
    // Order Management
    OrdersModule,
    CartModule,

    // Inventory & Products
    InventoryModule,
    BundlesModule,
    CountryModule,

    // Access Control
    RbacModule,

    // Payments & Discounts
    PaymentsModule,
    CouponsModule,

    // Fulfillment
    ShippingModule,

    // Analytics
    ReportsModule,

    // Content Management
    // CmsModule,

    // Bookings & Reservations - Removed
    // BookingsModule,
  ],
  exports: [
    OrdersModule,
    CartModule,
    InventoryModule,
    BundlesModule,
    CountryModule,
    RbacModule,
    PaymentsModule,
    CouponsModule,
    ShippingModule,
    ReportsModule,
    // CmsModule,
    // BookingsModule, // Removed - not needed for this client
  ],
})
export class AdminModule {}
