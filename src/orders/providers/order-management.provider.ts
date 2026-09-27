import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Order, OrderStatus, UserAddress } from '@/generated/prisma/client';
import { OrderRepository } from '../repositories/order.repository';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  OrderFilterDto,
} from '../dtos';
import { GuestCreateOrderDto } from '../dtos/guest-create-order.dto';
import { PaginatedResult } from '../../shared/types';
import {
  resolveVariantImage,
  VARIANT_IMAGE_INCLUDE,
  VariantImageSources,
} from '../../shared/utils';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { InventoryService } from '../../inventory/inventory.service';
import { BundlesService } from '../../bundles/bundles.service';
import { UnitOfWorkService } from '../../shared/services/unit-of-work.service';
import { ShippingService } from '../../shipping/shipping.service';
import { PaymentsService } from '../../payments/payments.service';
import { PaymentGateway } from '../../payments/dtos/initiate-payment.dto';
import { OrderNotificationProvider } from './order-notification.provider';

@Injectable()
export class OrderManagementProvider {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly bundles: BundlesService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly shippingService: ShippingService,
    private readonly paymentsService: PaymentsService,
    private readonly orderNotifications: OrderNotificationProvider,
  ) {}

  /**
   * Create a new order
   */
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const paymentGateway = this.resolvePaymentGateway(
      createOrderDto.paymentGateway,
    );

    // Step 1: Pre-transaction validation
    await this.validateUserAddresses(createOrderDto);
    await this.validateShippingMethod(createOrderDto);
    await this.validateAndPrepareInventory(createOrderDto.items);

    // Step 2: Create order in transaction
    const order = await this.createOrderInTransaction(createOrderDto);

    // Step 3: Reserve inventory outside transaction
    await this.reserveInventoryForOrder(order, createOrderDto);

    // Step 4: Create COD payment after successful reservation
    await this.createCodPaymentForOrder(order.id, paymentGateway, createOrderDto);

    // Step 5: Return order with full relations
    const createdOrder = await this.getOrderWithRelations(order.id);
    await this.orderNotifications.sendOrderCreated(createdOrder);

    return createdOrder;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: number,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.currentStatus === updateStatusDto.status) {
      return order;
    }

    // If status is changing to 'shipped', fulfill the reserved inventory
    if (updateStatusDto.status === OrderStatus.shipped) {
      await this.fulfillInventoryForOrder(id);
    }

    await this.orderRepository.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.note,
    );

    const updatedOrder = await this.getOrderWithRelations(id);
    await this.orderNotifications.sendOrderStatusChanged(updatedOrder);

    return updatedOrder;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(id: number, cancelDto: CancelOrderDto): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Can cancel pending or processing orders
    if (
      order.currentStatus !== OrderStatus.pending &&
      order.currentStatus !== OrderStatus.processing
    ) {
      throw new BadRequestException(
        'Only pending or processing orders can be cancelled',
      );
    }

    // Release reserved inventory before cancelling
    await this.releaseInventoryForOrder(id);

    await this.orderRepository.updateStatus(
      id,
      OrderStatus.cancelled,
      cancelDto.reason,
    );

    const cancelledOrder = await this.getOrderWithRelations(id);
    await this.orderNotifications.sendOrderStatusChanged(cancelledOrder);

    return cancelledOrder;
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: number): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  /**
   * Get all orders for a user
   */
  async getUserOrders(userId: number): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }

  /**
   * Get all orders with filters
   */
  async getAllOrders(
    filterDto: OrderFilterDto,
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findOrdersWithFilters(filterDto);
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.findByStatus(status);
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Validate user addresses exist and belong to user
   */
  private async validateUserAddresses(dto: CreateOrderDto): Promise<void> {
    if (dto.billingAddressId) {
      await this.validateAddress(dto.billingAddressId, dto.userId, 'Billing');
    }

    if (dto.shippingAddressId) {
      await this.validateAddress(dto.shippingAddressId, dto.userId, 'Shipping');
    }
  }

  /**
   * Validate a single address
   */
  private async validateAddress(
    addressId: number,
    userId: number,
    type: string,
  ): Promise<void> {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException(
        `${type} address with ID ${addressId} not found`,
      );
    }

    if (address.userId !== userId) {
      throw new BadRequestException(
        `${type} address ${addressId} does not belong to user ${userId}`,
      );
    }
  }

  /**
   * Validate shipping method if provided
   */
  private async validateShippingMethod(dto: CreateOrderDto): Promise<void> {
    if (dto.shippingMethodId) {
      const shippingMethod = await this.shippingService.getShippingMethodById(
        dto.shippingMethodId,
      );
      if (!shippingMethod || !shippingMethod.isActive) {
        throw new NotFoundException(
          `Shipping method ${dto.shippingMethodId} not found or inactive`,
        );
      }
    }
  }

  /**
   * Validate inventory and prepare fulfillment locations
   */
  private async validateAndPrepareInventory(
    items: Array<Record<string, any>>,
  ): Promise<void> {
    for (const item of items) {
      // Validate that either variantId or bundleId is provided
      if (!item.variantId && !item.bundleId) {
        throw new BadRequestException(
          `Either variantId or bundleId is required for order item`,
        );
      }

      // Handle bundle items
      if (item.bundleId) {
        await this.bundles.validateBundleForOrder(item.bundleId, item.quantity);
        item['_isBundle'] = true;
        continue;
      }

      // Handle regular variant items
      if (item.variantId) {
        const locationId = await this.inventory.findBestLocationForFulfillment(
          item.variantId,
          item.quantity,
        );

        if (!locationId) {
          throw new BadRequestException(
            `Insufficient inventory for variant ${item.variantId}. Requested: ${item.quantity}`,
          );
        }

        item['_fulfillmentLocationId'] = locationId;
      }
    }
  }

  /**
   * Create order within transaction
   */
  private async createOrderInTransaction(dto: CreateOrderDto): Promise<Order> {
    return this.unitOfWork.transaction(async (tx) => {
      // Calculate order totals
      const { subtotal, variants, shippingCost } =
        await this.calculateOrderTotals(tx, dto.items, dto.shippingMethodId);

      // Generate unique order reference
      const externalRef = await this.generateOrderReference(tx);

      // Create order without addresses
      const newOrder = await tx.order.create({
        data: {
          userId: dto.userId,
          externalRef,
          subtotalAmount: subtotal,
          shippingAmount: shippingCost,
          totalAmount: subtotal + shippingCost,
          shippingMethodId: dto.shippingMethodId,
          currentStatus: OrderStatus.pending,
          placedAt: new Date(),
        },
      });

      // Create address snapshots and link to order
      await this.createAndLinkAddressSnapshots(tx, newOrder.id, dto);

      // Create order items
      await this.createOrderItems(tx, newOrder.id, dto, variants);

      return newOrder;
    });
  }

  /**
   * Calculate order totals and validate variants
   */
  private async calculateOrderTotals(
    tx: any,
    items: Array<Record<string, any>>,
    shippingMethodId?: number,
  ) {
    let subtotal = 0;
    let totalWeight = 0;
    const variants = new Map();

    for (const item of items) {
      const variant = await tx.variant.findUnique({
        where: { id: item.variantId },
        // VARIANT_IMAGE_INCLUDE carries `product` plus everything
        // resolveVariantImage needs to snapshot the line's thumbnail.
        include: VARIANT_IMAGE_INCLUDE,
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} not found`);
      }

      variants.set(item.variantId, variant);
      subtotal += variant.price * item.quantity;
      totalWeight += (variant.weight || 0) * item.quantity;
    }

    // Calculate shipping cost
    let shippingCost = 0;
    if (shippingMethodId) {
      const shippingRate = await this.shippingService.calculateRate({
        shippingMethodId,
        subtotal,
        weight: totalWeight,
      });
      shippingCost = shippingRate.calculatedRate;
    }

    return { subtotal, totalWeight, variants, shippingCost };
  }

  /**
   * Generate unique order reference
   */
  private async generateOrderReference(tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const lastOrder = await tx.order.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const orderNumber = (lastOrder?.id || 0) + 1;
    return `ORD-${year}-${String(orderNumber).padStart(4, '0')}`;
  }

  /**
   * Create OrderAddress snapshots and link to order
   */
  private async createAndLinkAddressSnapshots(
    tx: any,
    orderId: number,
    dto: CreateOrderDto,
  ): Promise<void> {
    if (!dto.billingAddressId) return;

    const userBillingAddress = await tx.userAddress.findUnique({
      where: { id: dto.billingAddressId },
    });

    if (!userBillingAddress) {
      throw new NotFoundException(
        `Billing address ${dto.billingAddressId} not found`,
      );
    }

    // Create billing address snapshot
    const billingOrderAddress = await this.createOrderAddressSnapshot(
      tx,
      orderId,
      userBillingAddress,
      'billing',
    );

    let shippingOrderAddressId: number | undefined;

    // Create shipping address snapshot
    if (dto.shippingAddressId === dto.billingAddressId) {
      // Same address for shipping
      const shippingOrderAddress = await this.createOrderAddressSnapshot(
        tx,
        orderId,
        userBillingAddress,
        'shipping',
      );
      shippingOrderAddressId = shippingOrderAddress.id;
    } else if (dto.shippingAddressId) {
      // Different shipping address
      const userShippingAddress = await tx.userAddress.findUnique({
        where: { id: dto.shippingAddressId },
      });

      if (!userShippingAddress) {
        throw new NotFoundException(
          `Shipping address ${dto.shippingAddressId} not found`,
        );
      }

      const shippingOrderAddress = await this.createOrderAddressSnapshot(
        tx,
        orderId,
        userShippingAddress,
        'shipping',
      );
      shippingOrderAddressId = shippingOrderAddress.id;
    }

    // Update order with address IDs
    await tx.order.update({
      where: { id: orderId },
      data: {
        billingAddressId: billingOrderAddress.id,
        shippingAddressId: shippingOrderAddressId,
      },
    });
  }

  /**
   * Create OrderAddress snapshot from UserAddress
   */
  private async createOrderAddressSnapshot(
    tx: any,
    orderId: number,
    userAddress: UserAddress,
    type: 'billing' | 'shipping',
  ) {
    return tx.orderAddress.create({
      data: {
        orderId,
        type,
        sourceUserAddressId: userAddress.id,
        firstName: userAddress.firstName,
        lastName: userAddress.lastName,
        company: userAddress.company,
        phone: userAddress.phone,
        addressLine1: userAddress.addressLine1,
        addressLine2: userAddress.addressLine2,
        city: userAddress.city,
        state: userAddress.state,
        postalCode: userAddress.postalCode,
        country: userAddress.country,
      },
    });
  }

  /**
   * Create order items
   */
  private async createOrderItems(
    tx: any,
    orderId: number,
    dto: CreateOrderDto,
    variants: Map<number, any>,
  ): Promise<void> {
    for (const item of dto.items) {
      // Skip items without variantId (bundles will be handled separately)
      if (!item.variantId) continue;

      const variant = variants.get(item.variantId);

      await tx.orderItem.create({
        data: {
          orderId,
          variantId: item.variantId,
          bundleId: item.bundleId,
          quantity: item.quantity,
          unitPrice: variant.price,
          lineTotal: variant.price * item.quantity,
          productNameSnapshot: variant.product?.name,
          variantSkuSnapshot: variant.sku,
          imageSnapshot: resolveVariantImage(variant as VariantImageSources),
        },
      });
    }
  }

  /**
   * Reserve inventory for order
   */
  private async reserveInventoryForOrder(
    order: Order,
    dto: { items: Array<Record<string, any>> },
  ): Promise<void> {
    try {
      for (const item of dto.items) {
        if (item['_isBundle'] && item.bundleId) {
          await this.bundles.reserveBundleInventory(
            item.bundleId,
            item.quantity,
            order.id,
          );
          continue;
        }

        if (item.variantId && item['_fulfillmentLocationId']) {
          await this.inventory.reserveStock({
            variantId: item.variantId,
            locationId: item['_fulfillmentLocationId'],
            quantity: item.quantity,
            orderId: order.id,
          });
        }
      }
    } catch (error) {
      await this.orderRepository.updateStatus(
        order.id,
        OrderStatus.cancelled,
        'Inventory reservation failed',
      );
      throw new BadRequestException(
        `Failed to reserve inventory: ${error.message}`,
      );
    }
  }

  /**
   * Fulfill inventory when order is shipped
   */
  private async fulfillInventoryForOrder(orderId: number): Promise<void> {
    const orderWithItems = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                variantInventories: true,
              },
            },
          },
        },
      },
    });

    if (!orderWithItems) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    for (const item of orderWithItems.orderItems) {
      if (!item.variantId) continue;

      const inventory = item.variant?.variantInventories.find(
        (inv) => inv.reserved > 0,
      );

      if (inventory) {
        try {
          await this.inventory.fulfillReservedStock(
            item.variantId,
            inventory.locationId,
            item.quantity,
            orderId,
          );
        } catch (error) {
          throw new BadRequestException(
            `Failed to fulfill inventory for variant ${item.variantSkuSnapshot}: ${error.message}`,
          );
        }
      } else {
        throw new BadRequestException(
          `No reserved inventory found for variant ${item.variantSkuSnapshot}`,
        );
      }
    }
  }

  /**
   * Release inventory when order is cancelled
   */
  private async releaseInventoryForOrder(orderId: number): Promise<void> {
    const orderWithItems = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                variantInventories: true,
              },
            },
          },
        },
      },
    });

    if (!orderWithItems) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    for (const item of orderWithItems.orderItems) {
      if (!item.variantId) continue;

      const inventory = item.variant?.variantInventories.find(
        (inv) => inv.reserved > 0,
      );

      if (inventory) {
        try {
          await this.inventory.releaseStock({
            variantId: item.variantId,
            locationId: inventory.locationId,
            quantity: item.quantity,
            orderId,
          });
        } catch (error) {
          // Log error but don't fail the cancellation
          console.error(
            `Failed to release inventory for variant ${item.variantSkuSnapshot}: ${error.message}`,
          );
        }
      }
    }
  }

  /**
   * Get order with full relations
   */
  private async getOrderWithRelations(orderId: number): Promise<Order> {
    const createdOrder = await this.orderRepository.findById(orderId);
    if (!createdOrder) {
      throw new Error('Failed to create order');
    }
    return createdOrder;
  }

  private resolvePaymentGateway(
    paymentGateway?: PaymentGateway,
  ): PaymentGateway {
    return paymentGateway ?? PaymentGateway.CASH_ON_DELIVERY;
  }

  private async createCodPaymentForOrder(
    orderId: number,
    paymentGateway: PaymentGateway,
    dto: CreateOrderDto | GuestCreateOrderDto,
  ): Promise<void> {
    if (paymentGateway !== PaymentGateway.CASH_ON_DELIVERY) {
      throw new BadRequestException(
        `Payment gateway '${paymentGateway}' is not supported`,
      );
    }

    try {
      await this.paymentsService.createOrReuseCodPayment(orderId, undefined, {
        source: 'order_checkout',
        shippingMethodId: dto.shippingMethodId,
      });
    } catch (error) {
      await this.releaseInventoryForOrder(orderId);
      await this.orderRepository.updateStatus(
        orderId,
        OrderStatus.cancelled,
        'COD payment creation failed',
      );
      throw error;
    }
  }

  // ============================================
  // GUEST ORDER METHODS
  // ============================================

  /**
   * Create a guest order (without user account)
   */
  async createGuestOrder(dto: GuestCreateOrderDto): Promise<Order> {
    const paymentGateway = this.resolvePaymentGateway(dto.paymentGateway);

    // Step 1: Validate shipping method if provided
    if (dto.shippingMethodId) {
      const shippingMethod = await this.shippingService.getShippingMethodById(
        dto.shippingMethodId,
      );
      if (!shippingMethod || !shippingMethod.isActive) {
        throw new NotFoundException(
          `Shipping method ${dto.shippingMethodId} not found or inactive`,
        );
      }
    }

    // Step 2: Validate inventory
    await this.validateAndPrepareInventory(dto.items as Array<Record<string, any>>);

    // Step 3: Create order in transaction
    const order = await this.unitOfWork.transaction(async (tx) => {
      // Calculate order totals
      const { subtotal, variants, shippingCost } =
        await this.calculateOrderTotals(tx, dto.items, dto.shippingMethodId);

      // Generate unique order reference
      const timestamp = Date.now();
      const randomStr = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const externalRef = `ORD-${timestamp}-${randomStr}`;

      // Create guest order
      const newOrder = await tx.order.create({
        data: {
          userId: undefined,
          guestPhone: dto.phone,
          guestFirstName: dto.firstName,
          isGuestOrder: true,
          externalRef,
          subtotalAmount: subtotal,
          shippingAmount: shippingCost,
          totalAmount: subtotal + shippingCost,
          shippingMethodId: dto.shippingMethodId,
          currentStatus: OrderStatus.pending,
          placedAt: new Date(),
        },
      });

      // Create shipping address snapshot
      await tx.orderAddress.create({
        data: {
          orderId: newOrder.id,
          type: 'shipping',
          firstName: dto.firstName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
        },
      });

      // Guest checkout uses the same minimal address for billing and shipping.
      await tx.orderAddress.create({
        data: {
          orderId: newOrder.id,
          type: 'billing',
          firstName: dto.firstName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
        },
      });

      // Create order items
      for (const item of dto.items) {
        if (!item.variantId) continue;

        const variant = variants.get(item.variantId);

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            variantId: item.variantId,
            bundleId: item.bundleId,
            quantity: item.quantity,
            unitPrice: variant.price,
            lineTotal: variant.price * item.quantity,
            productNameSnapshot: variant.product?.name,
            variantSkuSnapshot: variant.sku,
            imageSnapshot: resolveVariantImage(variant as VariantImageSources),
          },
        });
      }

      return newOrder;
    });

    // Step 4: Reserve inventory
    await this.reserveInventoryForOrder(order, dto);

    // Step 5: Create COD payment after successful reservation
    await this.createCodPaymentForOrder(order.id, paymentGateway, dto);

    // Step 6: Return order with full relations
    const createdOrder = await this.getOrderWithRelations(order.id);
    await this.orderNotifications.sendOrderCreated(createdOrder);

    return createdOrder;
  }

  /**
   * Lookup guest order by phone and order reference
   */
  async lookupGuestOrder(
    phone: string,
    orderReference: string,
  ): Promise<Order | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        guestPhone: { equals: phone },
        externalRef: orderReference,
        isGuestOrder: true,
      },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        orderAddresses: true,
        payments: true,
        shipments: true,
      },
    });

    return order;
  }

  /**
   * Link guest orders to user account when they register
   * Called from auth registration service
   */
  async linkGuestOrdersToUser(email: string, userId: number): Promise<number> {
    const result = await this.prisma.order.updateMany({
      where: {
        guestEmail: { equals: email },
        isGuestOrder: true,
        userId: null, // Only link orders that haven't been linked yet
      },
      data: {
        userId: userId,
        // Keep guest info for history
      },
    });

    return result.count;
  }
}
