import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersService } from './orders.service';
import { OrderManagementProvider } from './providers/order-management.provider';
import { OrderNotificationProvider } from './providers/order-notification.provider';
import { OrderReportsProvider } from './providers/order-reports.provider';
import { OrderRepository } from './repositories/order.repository';
import { InventoryModule } from '../inventory/inventory.module';
import { BundlesModule } from '../bundles/bundles.module';
import { ShippingModule } from '../shipping/shipping.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../core/config/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    BundlesModule,
    ShippingModule,
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [OrdersController, OrdersAdminController],
  providers: [
    OrdersService,
    OrderManagementProvider,
    OrderNotificationProvider,
    OrderReportsProvider,
    OrderRepository,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
