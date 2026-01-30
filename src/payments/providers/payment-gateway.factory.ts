import { Injectable, BadRequestException } from '@nestjs/common';
import { IPaymentGateway } from '../interfaces/payment-gateway.interface';
import { PesapalProvider } from './pesapal.provider';
import { MpesaProvider } from './mpesa.provider';
import { PaymentGateway } from '../dtos/initiate-payment.dto';

/**
 * Factory to get the appropriate payment gateway provider
 * This makes it easy to add new payment gateways in the future
 */
@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly pesapalProvider: PesapalProvider,
    private readonly mpesaProvider: MpesaProvider,
  ) {}

  /**
   * Get the payment gateway provider based on the gateway name
   * Note: Online payment gateways (PesaPal, MPesa) are disabled for this client
   * @param gateway - The gateway name
   * @returns The payment gateway provider instance
   */
  getGateway(gateway: PaymentGateway | string): IPaymentGateway {
    switch (gateway.toLowerCase()) {
      case 'pesapal':
        return this.pesapalProvider;

      case 'mpesa':
        return this.mpesaProvider;

      case PaymentGateway.CASH_ON_DELIVERY:
      case 'cash':
        throw new BadRequestException(
          'Cash on delivery does not require a payment gateway',
        );

      default:
        throw new BadRequestException(
          `Unsupported payment gateway: ${gateway}. Currently, only cash on delivery is supported.`,
        );
    }
  }

  /**
   * Get list of all available payment gateways
   */
  getAvailableGateways(): string[] {
    return [PaymentGateway.CASH_ON_DELIVERY];
  }

  /**
   * Check if a gateway is supported
   */
  isGatewaySupported(gateway: string): boolean {
    return this.getAvailableGateways().includes(gateway as PaymentGateway);
  }
}
