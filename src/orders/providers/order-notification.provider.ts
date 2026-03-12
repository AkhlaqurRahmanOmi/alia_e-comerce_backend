import { Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@/generated/prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationChannel } from '../../notifications/enums';

const OrderNotificationEvents = {
  CREATED: 'order.created',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  STATUS_UPDATED: 'order.status_updated',
} as const;

type OrderNotificationOrder = Order & {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  orderItems?: Array<{
    quantity: number;
    lineTotal: number;
    productNameSnapshot?: string | null;
    variantSkuSnapshot?: string | null;
    variant?: {
      sku?: string | null;
      currency?: string | null;
      product?: {
        name?: string | null;
      } | null;
    } | null;
    bundle?: {
      name?: string | null;
    } | null;
  }>;
  billingAddress?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  shippingAddress?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  shippingMethod?: {
    minDays?: number | null;
    maxDays?: number | null;
  } | null;
  shipments?: Array<{
    carrier?: string | null;
    trackingNumber?: string | null;
    shippedAt?: Date | string | null;
    deliveredAt?: Date | string | null;
    createdAt?: Date | string | null;
  }>;
};

interface OrderEmailConfiguration {
  event: string;
  templateName: string;
  subject: string;
  bypassPreferences?: boolean;
  data?: Record<string, any>;
}

@Injectable()
export class OrderNotificationProvider {
  private readonly logger = new Logger(OrderNotificationProvider.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async sendOrderCreated(order: OrderNotificationOrder): Promise<void> {
    await this.sendOrderEmail(order, {
      event: OrderNotificationEvents.CREATED,
      templateName: 'order-created',
      subject: `Order Confirmation - ${order.externalRef}`,
      bypassPreferences: true,
      data: {
        estimatedDeliveryText: this.buildEstimatedDeliveryText(order),
      },
    });
  }

  async sendOrderStatusChanged(order: OrderNotificationOrder): Promise<void> {
    const configuration = this.resolveStatusEmailConfiguration(order);

    if (!configuration) {
      return;
    }

    await this.sendOrderEmail(order, configuration);
  }

  private async sendOrderEmail(
    order: OrderNotificationOrder,
    configuration: OrderEmailConfiguration,
  ): Promise<void> {
    const data = {
      ...this.buildBaseTemplateData(order),
      ...configuration.data,
    };

    try {
      if (order.userId) {
        const results = await this.notificationsService.send({
          userId: order.userId,
          event: configuration.event,
          channels: [NotificationChannel.EMAIL],
          title: configuration.subject,
          templateName: configuration.templateName,
          data,
          bypassPreferences: configuration.bypassPreferences,
        });

        const emailResult = results.find(
          (result) => result.channel === NotificationChannel.EMAIL,
        );

        if (!emailResult?.success) {
          this.logger.warn(
            `Order email dispatch reported failure for order ${order.id} (${configuration.event})`,
          );
        }

        return;
      }

      const recipientEmail = this.resolveDirectRecipientEmail(order);

      if (!recipientEmail) {
        this.logger.warn(
          `Skipping guest order email for order ${order.id}; no recipient email available`,
        );
        return;
      }

      const emailSent = await this.notificationsService.sendTemplateFileEmail({
        to: recipientEmail,
        templateName: configuration.templateName,
        subject: configuration.subject,
        data,
      });

      if (!emailSent) {
        this.logger.warn(
          `Guest order email send returned false for order ${order.id} (${configuration.event})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send order email for order ${order.id} (${configuration.event}): ${error?.message ?? error}`,
      );
    }
  }

  private buildBaseTemplateData(
    order: OrderNotificationOrder,
  ): Record<string, any> {
    return {
      brandLogoUrl: process.env.EMAIL_BRAND_LOGO_URL || '',
      brandName: process.env.EMAIL_BRAND_NAME || 'Alia Atelier',
      brandHomeUrl: process.env.EMAIL_BRAND_HOME_URL || process.env.FRONTEND_URL,
      supportEmail:
        process.env.CONTACT_EMAIL ||
        process.env.SMTP_FROM_EMAIL ||
        'support@example.com',
      customerName: this.resolveCustomerName(order),
      orderReference: order.externalRef,
      orderDate: order.placedAt || order.createdAt,
      currency: this.resolveCurrency(order),
      orderTotal: order.totalAmount,
      items: this.buildOrderItems(order),
    };
  }

  private buildOrderItems(order: OrderNotificationOrder) {
    return (order.orderItems || []).map((item) => ({
      name:
        item.productNameSnapshot ||
        item.bundle?.name ||
        item.variant?.product?.name ||
        'Order Item',
      sku: item.variantSkuSnapshot || item.variant?.sku || undefined,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));
  }

  private resolveCurrency(order: OrderNotificationOrder): string {
    const itemCurrency = order.orderItems?.find((item) => item.variant?.currency)
      ?.variant?.currency;

    return itemCurrency || process.env.DEFAULT_CURRENCY || 'USD';
  }

  private resolveCustomerName(order: OrderNotificationOrder): string {
    const candidates = [
      this.joinName(order.guestFirstName, order.guestLastName),
      this.joinName(order.user?.firstName, order.user?.lastName),
      this.joinName(order.shippingAddress?.firstName, order.shippingAddress?.lastName),
      this.joinName(order.billingAddress?.firstName, order.billingAddress?.lastName),
    ];

    return candidates.find((name) => !!name) || 'Customer';
  }

  private resolveDirectRecipientEmail(
    order: OrderNotificationOrder,
  ): string | null {
    return (
      order.guestEmail ||
      order.shippingAddress?.email ||
      order.billingAddress?.email ||
      null
    );
  }

  private buildEstimatedDeliveryText(
    order: OrderNotificationOrder,
  ): string | undefined {
    const minDays = order.shippingMethod?.minDays;
    const maxDays = order.shippingMethod?.maxDays;

    if (!minDays && !maxDays) {
      return undefined;
    }

    if (minDays && maxDays) {
      if (minDays === maxDays) {
        return `${minDays} business day${minDays === 1 ? '' : 's'}`;
      }

      return `${minDays}-${maxDays} business days`;
    }

    if (minDays) {
      return `At least ${minDays} business day${minDays === 1 ? '' : 's'}`;
    }

    return `Up to ${maxDays} business day${maxDays === 1 ? '' : 's'}`;
  }

  private resolveStatusEmailConfiguration(
    order: OrderNotificationOrder,
  ): OrderEmailConfiguration | null {
    switch (order.currentStatus) {
      case OrderStatus.shipped: {
        const latestShipment = this.getLatestShipment(order);

        return {
          event: OrderNotificationEvents.SHIPPED,
          templateName: 'order-shipped',
          subject: `Your Order ${order.externalRef} Has Shipped`,
          bypassPreferences: true,
          data: {
            carrier: latestShipment?.carrier || undefined,
            trackingNumber: latestShipment?.trackingNumber || undefined,
            shippedDate: latestShipment?.shippedAt || undefined,
          },
        };
      }

      case OrderStatus.delivered: {
        const latestShipment = this.getLatestShipment(order);

        return {
          event: OrderNotificationEvents.DELIVERED,
          templateName: 'order-delivered',
          subject: `Your Order ${order.externalRef} Has Been Delivered`,
          data: {
            deliveredDate: latestShipment?.deliveredAt || undefined,
          },
        };
      }

      default:
        return {
          event: OrderNotificationEvents.STATUS_UPDATED,
          templateName: 'order-status-updated',
          subject: `Order ${order.externalRef} Status Updated`,
          data: {
            newStatus: this.formatStatus(order.currentStatus),
            statusMessage: this.buildStatusMessage(order.currentStatus),
          },
        };
    }
  }

  private getLatestShipment(order: OrderNotificationOrder) {
    return [...(order.shipments || [])].sort((left, right) => {
      const leftTime = this.toTimestamp(
        left.deliveredAt || left.shippedAt || left.createdAt,
      );
      const rightTime = this.toTimestamp(
        right.deliveredAt || right.shippedAt || right.createdAt,
      );

      return rightTime - leftTime;
    })[0];
  }

  private buildStatusMessage(status: OrderStatus): string | undefined {
    switch (status) {
      case OrderStatus.processing:
        return 'We are preparing your items and will update you again once they ship.';
      case OrderStatus.cancelled:
        return 'Your order has been cancelled. Contact support if you need any help.';
      case OrderStatus.refunded:
        return 'Your refund is being processed. Please allow a little time for the funds to appear.';
      case OrderStatus.pending:
        return 'Your order is currently pending review.';
      default:
        return undefined;
    }
  }

  private formatStatus(status: string): string {
    if (!status) {
      return 'Updated';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private joinName(
    firstName?: string | null,
    lastName?: string | null,
  ): string | null {
    const value = [firstName, lastName].filter(Boolean).join(' ').trim();
    return value || null;
  }

  private toTimestamp(value?: Date | string | null): number {
    if (!value) {
      return 0;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
}
