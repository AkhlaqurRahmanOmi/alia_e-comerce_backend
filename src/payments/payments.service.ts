import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../core/config/prisma/prisma.service';
// import { PaymentGatewayFactory } from './providers/payment-gateway.factory';
import { PaymentRepository } from './repositories/payment.repository';
import {
  InitiatePaymentDto,
  PaymentGateway,
} from './dtos/initiate-payment.dto';
import { VerifyPaymentDto } from './dtos/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    // @Optional() private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly paymentRepository: PaymentRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Initiate a payment transaction
   */
  async initiatePayment(dto: InitiatePaymentDto) {
    try {
      this.logger.log(
        `Initiating payment for order ${dto.orderId} via ${dto.gateway}`,
      );

      // Verify order exists and is not already paid
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        include: { payments: true },
      });

      if (!order) {
        throw new NotFoundException(`Order ${dto.orderId} not found`);
      }

      // Check if order already has a successful payment
      const successfulPayment =
        await this.paymentRepository.findSuccessfulPaymentByOrderId(
          dto.orderId,
        );

      if (successfulPayment) {
        throw new BadRequestException('Order already has a successful payment');
      }

      // Handle Cash-On-Delivery payment
      if (dto.gateway === PaymentGateway.CASH_ON_DELIVERY) {
        // Generate a simple transaction ID for COD
        const transactionId = `COD-${Date.now()}-${dto.orderId}`;

        // Create payment record in database with pending status
        const payment = await this.paymentRepository.createPayment({
          orderId: dto.orderId,
          amount: dto.amount,
          gateway: dto.gateway,
          provider: 'Cash On Delivery',
          transactionId: transactionId,
          status: PaymentStatus.pending, // Will be marked as captured when cash is received
        });

        // Log the initiation
        await this.paymentRepository.createTransactionLog({
          paymentId: payment.id,
          eventType: 'payment_initiated',
          amount: dto.amount,
          status: 'pending',
          payload: { method: 'cash_on_delivery', ...dto.metadata },
        });

        return {
          success: true,
          data: {
            payment: {
              id: payment.id,
              transactionId: payment.transactionId,
              status: payment.status,
              amount: payment.amount,
              gateway: payment.gateway,
            },
            message:
              'Cash on delivery payment initiated. Cash will be collected upon delivery.',
          },
        };
      }

      // Online payment gateways are disabled
      throw new BadRequestException(
        `Payment gateway '${dto.gateway}' is not supported. Only Cash-On-Delivery is available.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initiate payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify payment status (for Cash-On-Delivery, returns current DB status)
   */
  async verifyPayment(dto: VerifyPaymentDto) {
    try {
      this.logger.log(`Verifying payment: ${dto.transactionId}`);

      // Find payment in database
      const payment = await this.paymentRepository.findByTransactionId(
        dto.transactionId,
      );

      if (!payment) {
        throw new NotFoundException(
          `Payment with transaction ID ${dto.transactionId} not found`,
        );
      }

      // For Cash-On-Delivery, return current status from database
      // Admin can manually update status when cash is received
      return {
        success: true,
        payment: {
          id: payment.id,
          transactionId: payment.transactionId,
          status: payment.status,
          amount: payment.amount,
          gateway: payment.gateway,
        },
        message:
          payment.status === 'pending'
            ? 'Awaiting cash payment on delivery'
            : `Payment ${payment.status}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle payment callback from gateway (disabled for Cash-On-Delivery)
   */
  async handleCallback(gateway: string, payload: any) {
    try {
      this.logger.log(`Handling ${gateway} callback - Not supported for COD`);

      // Online payment callbacks are not supported
      throw new BadRequestException(
        'Payment callbacks are not supported. Only Cash-On-Delivery is available.',
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle callback: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPayment(transactionId: string) {
    const payment =
      await this.paymentRepository.findByTransactionId(transactionId);

    if (!payment) {
      throw new NotFoundException(
        `Payment with transaction ID ${transactionId} not found`,
      );
    }

    // Map status for frontend compatibility: captured -> completed
    const frontendStatus =
      payment.status === 'captured' ? 'completed' : payment.status;

    return {
      id: payment.id,
      orderId: payment.orderId,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: frontendStatus,
      gateway: payment.gateway,
      provider: payment.provider,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      transactionLogs: (payment as any).transactionLogs || [],
    };
  }

  /**
   * Get all payments for an order
   */
  async getOrderPayments(orderId: number) {
    const payments = await this.paymentRepository.findByOrderId(orderId);
    const stats = await this.paymentRepository.getOrderPaymentStats(orderId);

    return {
      payments: payments.map((payment) => ({
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status === 'captured' ? 'completed' : payment.status,
        gateway: payment.gateway,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
      stats,
    };
  }

  /**
   * Get available payment gateways (Cash-On-Delivery only)
   */
  getAvailableGateways() {
    return {
      gateways: [
        {
          id: PaymentGateway.CASH_ON_DELIVERY,
          name: 'Cash On Delivery',
          description: 'Pay with cash when you receive your order',
          enabled: true,
        },
      ],
    };
  }

  /**
   * Update order status
   */
  private async updateOrderStatus(orderId: number, status: OrderStatus) {
    try {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          currentStatus: status,
          updatedAt: new Date(),
        },
      });

      // Create order status history
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: status.toString(),
          note: `Order status updated after payment`,
        },
      });

      this.logger.log(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update order status: ${error.message}`,
        error.stack,
      );
      // Don't throw - payment was successful, order update is secondary
    }
  }
}
