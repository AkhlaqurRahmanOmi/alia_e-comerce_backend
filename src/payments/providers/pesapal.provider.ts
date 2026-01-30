import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentGateway,
  PaymentInitiateResponse,
  PaymentVerifyResponse,
  PaymentCallbackResponse,
} from '../interfaces/payment-gateway.interface';
import { initialisePesapal } from 'pesapal3-sdk';

@Injectable()
export class PesapalProvider implements IPaymentGateway, OnModuleInit {
  private readonly logger = new Logger(PesapalProvider.name);
  private pesapal: any;
  private ipnUrl: string;
  private callbackUrl: string;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.ipnUrl = this.configService.get<string>('PESAPAL_IPN_URL') || '';
    this.callbackUrl = this.configService.get<string>('PESAPAL_CALLBACK_URL') || '';
  }

  async onModuleInit() {
    await this.initializePesapal();
  }

  private async initializePesapal() {
    try {
      const consumerKey = this.configService.get<string>('PESAPAL_CONSUMER_KEY') || '';
      const consumerSecret = this.configService.get<string>(
        'PESAPAL_CONSUMER_SECRET',
      ) || '';
      const environment = this.configService.get<string>(
        'PESAPAL_ENVIRONMENT',
        'sandbox',
      ) || 'sandbox';

      this.logger.log(`Initializing Pesapal SDK in ${environment} mode...`);

      if (!this.ipnUrl) {
        this.logger.warn('No IPN URL configured in environment variables');
      }

      // Use initialisePesapal with the new SDK v1.x API
      this.pesapal = await initialisePesapal({
        PESAPAL_CONSUMER_KEY: consumerKey,
        PESAPAL_CONSUMER_SECRET: consumerSecret,
        PESAPAL_ENVIRONMENT: environment as 'sandbox' | 'live',
        PESAPAL_IPN_URL: this.ipnUrl, // SDK v1.x uses singular IPN_URL
      });

      this.isInitialized = true;
      this.logger.log(`Pesapal SDK initialized successfully. Found ${this.pesapal.ipns?.length || 0} registered IPN(s)`);
    } catch (error) {
      this.logger.error(`Failed to initialize Pesapal SDK: ${error.message}`, error.stack);
      throw error;
    }
  }

  getGatewayName(): string {
    return 'pesapal';
  }

  async initiatePayment(
    orderId: number,
    amount: number,
    currency: string,
    metadata: any,
  ): Promise<PaymentInitiateResponse> {
    try {
      // Ensure SDK is initialized
      if (!this.isInitialized || !this.pesapal) {
        this.logger.warn('Pesapal SDK not initialized, initializing now...');
        await this.initializePesapal();
      }

      this.logger.log(
        `Initiating Pesapal payment for order ${orderId}, amount: ${amount} ${currency}`,
      );

      // Register IPN if not already registered
      await this.registerIPN();

      // Get IPN ID (REQUIRED by Pesapal API v3)
      const notificationId = await this.getIPNId();

      if (!notificationId) {
        const errorMsg = 'No IPN registered. Please register IPN in Pesapal dashboard or ensure PESAPAL_IPN_URL is configured correctly.';
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Prepare payment details according to SDK requirements
      const paymentDetails = {
        id: `ORDER-${orderId}-${Date.now()}`,
        currency: currency,
        amount: amount,
        description: metadata?.description || `Payment for Order #${orderId}`,
        callback_url: this.callbackUrl,
        notification_id: notificationId, // IPN ID from registered IPN (required by API v3)
        billing_address: {
          email_address: metadata?.email || '',
          phone_number: metadata?.phoneNumber || '',
          country_code: metadata?.countryCode || 'KE',
          first_name: metadata?.firstName || '',
          middle_name: '',
          last_name: metadata?.lastName || '',
          line_1: metadata?.address || '',
          line_2: metadata?.address2 || '',
          city: metadata?.city || '',
          state: metadata?.state || '',
          postal_code: metadata?.postalCode || '',
          zip_code: metadata?.postalCode || '',
        },
      };

      const productId = `ORDER-${orderId}-${Date.now()}`;
      const description = metadata?.description || `Payment for Order #${orderId}`;

      const response = await this.pesapal.submitOrder(paymentDetails, productId, description);

      // SDK v1.x returns nested structure: { success, status, pesaPalOrderRes: { ... } }
      const orderData = response.pesaPalOrderRes || response;
      const statusCode = String(response.status || orderData.status);

      if ((response.success || statusCode === '200') && orderData.redirect_url) {
        return {
          success: true,
          redirectUrl: orderData.redirect_url,
          transactionId: orderData.order_tracking_id,
          message: 'Payment initiated successfully',
          metadata: response,
        };
      }

      throw new Error(orderData.error?.message || response.message || 'Failed to initiate payment');
    } catch (error) {
      this.logger.error(
        `Failed to initiate Pesapal payment: ${error.message || JSON.stringify(error)}`,
        error.stack,
      );

      // Log full error details for debugging
      if (error.error) {
        this.logger.error(`Pesapal error details: ${JSON.stringify(error.error)}`);
      }

      return {
        success: false,
        transactionId: '',
        message: error.message || 'Failed to initiate payment with Pesapal',
      };
    }
  }

  async verifyPayment(
    transactionId: string,
  ): Promise<PaymentVerifyResponse> {
    try {
      this.logger.log(`Verifying Pesapal payment: ${transactionId}`);

      const response =
        await this.pesapal.getTransactionStatus(transactionId);

      if (response.status === '200') {
        const status = this.mapPesapalStatus(response.payment_status_description);

        return {
          success: true,
          status,
          transactionId: response.order_tracking_id,
          amount: response.amount,
          currency: response.currency,
          message: response.payment_status_description,
          metadata: response,
        };
      }

      throw new Error(response.message || 'Failed to verify payment');
    } catch (error) {
      this.logger.error(
        `Failed to verify Pesapal payment: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        status: 'failed',
        transactionId,
        message: error.message,
      };
    }
  }

  async handleCallback(payload: any): Promise<PaymentCallbackResponse> {
    try {
      this.logger.log('Processing Pesapal callback');

      const { OrderTrackingId, OrderMerchantReference } = payload;

      // Verify the transaction status
      const verifyResponse = await this.verifyPayment(OrderTrackingId);

      if (!verifyResponse.success) {
        throw new Error('Payment verification failed');
      }

      // Extract order ID from merchant reference
      const orderId = this.extractOrderId(OrderMerchantReference);

      return {
        success: true,
        transactionId: OrderTrackingId,
        orderId: orderId ?? undefined,
        status: verifyResponse.status,
        amount: verifyResponse.amount,
        message: verifyResponse.message,
        metadata: verifyResponse.metadata,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process Pesapal callback: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        transactionId: payload?.OrderTrackingId,
        status: 'failed',
        message: error.message,
      };
    }
  }

  /**
   * Register IPN URL with Pesapal
   */
  private async registerIPN(): Promise<void> {
    try {
      if (!this.ipnUrl) {
        this.logger.warn('IPN URL not configured, skipping registration');
        return;
      }

      // SDK method signature: registerIpn(ipn?: string, notificationMethodType?: 'GET' | 'POST')
      const ipnResponse = await this.pesapal.registerIpn(this.ipnUrl, 'POST');

      if (ipnResponse.status === '200') {
        this.logger.log(`IPN registered successfully: ${this.ipnUrl}`);
      } else {
        this.logger.warn(`IPN registration failed with status ${ipnResponse.status}`);
      }
    } catch (error) {
      this.logger.error(`IPN registration failed: ${error.message}`, error.stack);
      // Don't throw - let it continue to try fetching existing IPNs
    }
  }

  /**
   * Get IPN ID from Pesapal
   */
  private async getIPNId(): Promise<string | undefined> {
    try {
      // SDK should already have IPNs loaded from initialization
      if (this.pesapal.ipns && this.pesapal.ipns.length > 0) {
        const firstIpn = this.pesapal.ipns[0];
        this.logger.log(`Using IPN: ${firstIpn.url} (ID: ${firstIpn.ipn_id})`);
        return firstIpn.ipn_id;
      }

      // Fallback: try to fetch IPNs manually
      this.logger.warn('No IPNs found in SDK, fetching from Pesapal...');
      const ipnList = await this.pesapal.getIpnEndPoints();

      if (ipnList.status === '200' && ipnList.data && ipnList.data.length > 0) {
        this.logger.log(`Found ${ipnList.data.length} registered IPN(s)`);
        return ipnList.data[0].ipn_id;
      }

      this.logger.warn('No IPN endpoints registered in Pesapal account');
      return undefined;
    } catch (error) {
      this.logger.error(`Failed to get IPN ID: ${error.message}`, error.stack);
      return undefined;
    }
  }

  /**
   * Map Pesapal payment status to our internal status
   */
  private mapPesapalStatus(
    pesapalStatus: string,
  ): 'pending' | 'authorized' | 'captured' | 'failed' | 'voided' {
    const statusMap = {
      'PENDING': 'pending',
      'COMPLETED': 'captured',
      'FAILED': 'failed',
      'INVALID': 'failed',
      'REVERSED': 'voided',
    };

    return (statusMap[pesapalStatus?.toUpperCase()] || 'pending') as any;
  }

  /**
   * Extract order ID from merchant reference
   */
  private extractOrderId(reference: string): number | null {
    try {
      // Extract number from format like "ORDER-123-1234567890"
      const match = reference.match(/ORDER-(\d+)-/);
      return match ? parseInt(match[1], 10) : null;
    } catch {
      return null;
    }
  }
}
