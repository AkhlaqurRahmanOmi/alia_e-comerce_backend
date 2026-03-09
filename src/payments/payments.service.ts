import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Payment, PaymentStatus } from '@/generated/prisma/client';
import { PrismaService } from '../core/config/prisma/prisma.service';
import { PaymentRepository } from './repositories/payment.repository';
import {
  InitiatePaymentDto,
  PaymentGateway,
} from './dtos/initiate-payment.dto';
import { VerifyPaymentDto } from './dtos/verify-payment.dto';
import { UpdateCodPaymentStatusDto } from './dtos/update-cod-payment-status.dto';

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

      // Handle Cash-On-Delivery payment
      if (dto.gateway === PaymentGateway.CASH_ON_DELIVERY) {
        const payment = await this.createOrReuseCodPayment(
          dto.orderId,
          dto.amount,
          dto.metadata,
        );

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

  async createOrReuseCodPayment(
    orderId: number,
    _requestedAmount?: number,
    _metadata?: Record<string, any>,
  ): Promise<Payment> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const existingPayment =
      await this.paymentRepository.findCodPaymentByOrderId(orderId);

    if (existingPayment) {
      if (
        existingPayment.status === PaymentStatus.pending ||
        existingPayment.status === PaymentStatus.captured
      ) {
        return existingPayment;
      }

      if (existingPayment.status === PaymentStatus.voided) {
        throw new BadRequestException(
          'A voided COD payment already exists for this order',
        );
      }
    }

    return this.paymentRepository.createPayment({
      orderId,
      amount: order.totalAmount,
      gateway: PaymentGateway.CASH_ON_DELIVERY,
      provider: 'Cash On Delivery',
      transactionId: `COD-${orderId}-${Date.now()}`,
      status: PaymentStatus.pending,
    });
  }

  async settleCodPayment(
    transactionId: string,
    dto: UpdateCodPaymentStatusDto,
  ) {
    const payment = await this.paymentRepository.findByTransactionId(
      transactionId,
    );

    if (!payment) {
      throw new NotFoundException(
        `Payment with transaction ID ${transactionId} not found`,
      );
    }

    if (payment.gateway !== PaymentGateway.CASH_ON_DELIVERY) {
      throw new BadRequestException(
        'Only Cash-On-Delivery payments can be settled here',
      );
    }

    if (payment.status !== PaymentStatus.pending) {
      throw new BadRequestException(
        `Only pending COD payments can be updated. Current status: ${payment.status}`,
      );
    }

    if (
      dto.status !== PaymentStatus.captured &&
      dto.status !== PaymentStatus.voided
    ) {
      throw new BadRequestException('Invalid COD settlement status');
    }

    const settledPayment = await this.paymentRepository.settleCodPayment(
      transactionId,
      dto.status,
      dto.note,
    );

    return {
      id: settledPayment.id,
      orderId: settledPayment.orderId,
      transactionId: settledPayment.transactionId,
      amount: settledPayment.amount,
      status:
        settledPayment.status === PaymentStatus.captured
          ? 'completed'
          : settledPayment.status,
      gateway: settledPayment.gateway,
      provider: settledPayment.provider,
      updatedAt: settledPayment.updatedAt,
    };
  }
}
