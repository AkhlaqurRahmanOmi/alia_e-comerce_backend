import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentRepository } from './repositories/payment.repository';
// import { PesapalProvider } from './providers/pesapal.provider';
// import { MpesaProvider } from './providers/mpesa.provider';
// import { PaymentGatewayFactory } from './providers/payment-gateway.factory';

/**
 * Payments Module (Simplified for Cash-On-Delivery)
 * Tracks payment status for orders
 * Online payment gateways (Pesapal, M-Pesa) are disabled
 * Only CASH_ON_DELIVERY payment method is supported
 */
@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentRepository,
    // Online payment providers disabled
    // PesapalProvider,
    // MpesaProvider,
    // PaymentGatewayFactory,
  ],
  exports: [PaymentsService, PaymentRepository],
})
export class PaymentsModule {}
