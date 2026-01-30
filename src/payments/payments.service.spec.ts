import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentGatewayFactory } from './providers/payment-gateway.factory';
import { PaymentRepository } from './repositories/payment.repository';
import { PrismaService } from '../core/config/prisma/prisma.service';
import { PesapalProvider } from './providers/pesapal.provider';
import { PaymentStatus, OrderStatus } from '@prisma/client';

describe('PaymentsService - Pesapal Integration', () => {
  let service: PaymentsService;
  let paymentRepository: PaymentRepository;
  let prismaService: PrismaService;
  let pesapalProvider: PesapalProvider;
  let paymentGatewayFactory: PaymentGatewayFactory;

  // Mock data
  const mockOrder = {
    id: 1,
    orderNumber: 'ORD-123456',
    totalAmount: 5000,
    currentStatus: OrderStatus.pending,
    payments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment = {
    id: 1,
    orderId: 1,
    transactionId: 'test-transaction-123',
    amount: 5000,
    gateway: 'pesapal',
    provider: 'pesapal',
    status: PaymentStatus.pending,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPesapalInitResponse = {
    success: true,
    redirectUrl: 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest?orderTrackingId=test-123',
    transactionId: 'test-transaction-123',
    message: 'Payment initiated successfully',
    metadata: {
      status: '200',
      order_tracking_id: 'test-transaction-123',
    },
  };

  const mockPesapalVerifyResponse = {
    success: true,
    status: 'captured' as const,
    transactionId: 'test-transaction-123',
    amount: 5000,
    currency: 'KES',
    message: 'Payment successful',
    metadata: {
      status: '200',
      payment_status_description: 'COMPLETED',
      order_tracking_id: 'test-transaction-123',
      amount: 5000,
      currency: 'KES',
    },
  };

  beforeEach(async () => {
    // Mock PrismaService
    const mockPrismaService = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
    };

    // Mock PaymentRepository
    const mockPaymentRepository = {
      findSuccessfulPaymentByOrderId: jest.fn(),
      createPayment: jest.fn(),
      createTransactionLog: jest.fn(),
      findByTransactionId: jest.fn(),
      updatePaymentStatus: jest.fn(),
      findByOrderId: jest.fn(),
      getOrderPaymentStats: jest.fn(),
    };

    // Mock PesapalProvider
    const mockPesapalProvider = {
      getGatewayName: jest.fn().mockReturnValue('pesapal'),
      initiatePayment: jest.fn(),
      verifyPayment: jest.fn(),
      handleCallback: jest.fn(),
    };

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          PESAPAL_CONSUMER_KEY: 'test-key',
          PESAPAL_CONSUMER_SECRET: 'test-secret',
          PESAPAL_ENVIRONMENT: 'sandbox',
          PESAPAL_IPN_URL: 'http://localhost:4000/api/v1/payments/callback/pesapal',
          PESAPAL_CALLBACK_URL: 'http://localhost:3000/payment/result',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PaymentRepository,
          useValue: mockPaymentRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PesapalProvider,
          useValue: mockPesapalProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PaymentGatewayFactory,
          useValue: {
            getGateway: jest.fn().mockReturnValue(mockPesapalProvider),
            getAvailableGateways: jest.fn().mockReturnValue(['pesapal', 'mpesa']),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepository = module.get<PaymentRepository>(PaymentRepository);
    prismaService = module.get<PrismaService>(PrismaService);
    pesapalProvider = module.get<PesapalProvider>(PesapalProvider);
    paymentGatewayFactory = module.get<PaymentGatewayFactory>(PaymentGatewayFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required dependencies', () => {
      expect(paymentRepository).toBeDefined();
      expect(prismaService).toBeDefined();
      expect(paymentGatewayFactory).toBeDefined();
    });
  });

  describe('initiatePayment', () => {
    const initiatePaymentDto = {
      orderId: 1,
      amount: 5000,
      currency: 'KES',
      gateway: 'pesapal',
      metadata: {
        email: 'test@example.com',
        phoneNumber: '+254712345678',
        firstName: 'John',
        lastName: 'Doe',
        countryCode: 'KE',
        address: '123 Test Street',
        city: 'Nairobi',
        description: 'Payment for Wine Order #1',
      },
    };

    it('should successfully initiate a Pesapal payment', async () => {
      // Setup mocks
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(paymentRepository, 'findSuccessfulPaymentByOrderId').mockResolvedValue(null);
      jest.spyOn(pesapalProvider, 'initiatePayment').mockResolvedValue(mockPesapalInitResponse);
      jest.spyOn(paymentRepository, 'createPayment').mockResolvedValue(mockPayment as any);
      jest.spyOn(paymentRepository, 'createTransactionLog').mockResolvedValue({} as any);

      // Execute
      const result = await service.initiatePayment(initiatePaymentDto);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBeDefined();
      expect(result.payment.transactionId).toBe('test-transaction-123');
      expect(result.payment.status).toBe(PaymentStatus.pending);
      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { payments: true },
      });
      expect(pesapalProvider.initiatePayment).toHaveBeenCalledWith(
        1,
        5000,
        'KES',
        initiatePaymentDto.metadata,
      );
      expect(paymentRepository.createPayment).toHaveBeenCalled();
      expect(paymentRepository.createTransactionLog).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order does not exist', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(service.initiatePayment(initiatePaymentDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.initiatePayment(initiatePaymentDto)).rejects.toThrow(
        'Order 1 not found',
      );
    });

    it('should throw BadRequestException if order already has successful payment', async () => {
      const successfulPayment = { ...mockPayment, status: PaymentStatus.captured };
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(paymentRepository, 'findSuccessfulPaymentByOrderId').mockResolvedValue(successfulPayment as any);

      await expect(service.initiatePayment(initiatePaymentDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.initiatePayment(initiatePaymentDto)).rejects.toThrow(
        'Order already has a successful payment',
      );
    });

    it('should throw BadRequestException if payment gateway fails', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(paymentRepository, 'findSuccessfulPaymentByOrderId').mockResolvedValue(null);
      jest.spyOn(pesapalProvider, 'initiatePayment').mockResolvedValue({
        success: false,
        transactionId: '',
        message: 'Invalid credentials',
      });

      await expect(service.initiatePayment(initiatePaymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyPayment', () => {
    const verifyPaymentDto = {
      transactionId: 'test-transaction-123',
    };

    it('should successfully verify a captured payment', async () => {
      jest.spyOn(paymentRepository, 'findByTransactionId').mockResolvedValue(mockPayment as any);
      jest.spyOn(pesapalProvider, 'verifyPayment').mockResolvedValue(mockPesapalVerifyResponse);
      jest.spyOn(paymentRepository, 'updatePaymentStatus').mockResolvedValue({} as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.orderStatusHistory, 'create').mockResolvedValue({} as any);

      const result = await service.verifyPayment(verifyPaymentDto);

      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('captured');
      expect(paymentRepository.findByTransactionId).toHaveBeenCalledWith('test-transaction-123');
      expect(pesapalProvider.verifyPayment).toHaveBeenCalledWith('test-transaction-123');
      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      jest.spyOn(paymentRepository, 'findByTransactionId').mockResolvedValue(null);

      await expect(service.verifyPayment(verifyPaymentDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.verifyPayment(verifyPaymentDto)).rejects.toThrow(
        'Payment with transaction ID test-transaction-123 not found',
      );
    });

    it('should update order status to processing when payment is captured', async () => {
      jest.spyOn(paymentRepository, 'findByTransactionId').mockResolvedValue(mockPayment as any);
      jest.spyOn(pesapalProvider, 'verifyPayment').mockResolvedValue(mockPesapalVerifyResponse);
      jest.spyOn(paymentRepository, 'updatePaymentStatus').mockResolvedValue({} as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.orderStatusHistory, 'create').mockResolvedValue({} as any);

      await service.verifyPayment(verifyPaymentDto);

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          currentStatus: OrderStatus.processing,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('handleCallback', () => {
    const mockCallbackPayload = {
      OrderTrackingId: 'test-transaction-123',
      OrderMerchantReference: 'ORDER-1-1234567890',
    };

    const mockCallbackResponse = {
      success: true,
      transactionId: 'test-transaction-123',
      orderId: 1,
      status: 'captured' as const,
      amount: 5000,
      message: 'Payment successful',
      metadata: {},
    };

    it('should successfully handle Pesapal callback', async () => {
      jest.spyOn(pesapalProvider, 'handleCallback').mockResolvedValue(mockCallbackResponse);
      jest.spyOn(paymentRepository, 'findByTransactionId').mockResolvedValue(mockPayment as any);
      jest.spyOn(paymentRepository, 'createTransactionLog').mockResolvedValue({} as any);
      jest.spyOn(paymentRepository, 'updatePaymentStatus').mockResolvedValue({} as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.orderStatusHistory, 'create').mockResolvedValue({} as any);

      const result = await service.handleCallback('pesapal', mockCallbackPayload);

      expect(result.success).toBe(true);
      expect(pesapalProvider.handleCallback).toHaveBeenCalledWith(mockCallbackPayload);
      expect(paymentRepository.createTransactionLog).toHaveBeenCalledWith({
        paymentId: 1,
        eventType: 'callback_received',
        amount: 5000,
        status: 'captured',
        payload: mockCallbackPayload,
      });
    });

    it('should return false if payment not found', async () => {
      jest.spyOn(pesapalProvider, 'handleCallback').mockResolvedValue(mockCallbackResponse);
      jest.spyOn(paymentRepository, 'findByTransactionId').mockResolvedValue(null);

      const result = await service.handleCallback('pesapal', mockCallbackPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Payment not found');
    });
  });

  describe('getPayment', () => {
    it('should return payment details', async () => {
      jest.spyOn(paymentRepository, 'findByTransactionId').mockResolvedValue(mockPayment as any);

      const result = await service.getPayment('test-transaction-123');

      expect(result.transactionId).toBe('test-transaction-123');
      expect(result.amount).toBe(5000);
      expect(paymentRepository.findByTransactionId).toHaveBeenCalledWith('test-transaction-123');
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      jest.spyOn(paymentRepository, 'findByTransactionId').mockResolvedValue(null);

      await expect(service.getPayment('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrderPayments', () => {
    it('should return all payments for an order', async () => {
      const mockPayments = [mockPayment];
      const mockStats = {
        totalAttempts: 1,
        successfulPayments: 0,
        totalPaid: 0,
      };

      jest.spyOn(paymentRepository, 'findByOrderId').mockResolvedValue(mockPayments as any);
      jest.spyOn(paymentRepository, 'getOrderPaymentStats').mockResolvedValue(mockStats as any);

      const result = await service.getOrderPayments(1);

      expect(result.payments).toHaveLength(1);
      expect(result.stats).toBeDefined();
      expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(1);
    });
  });

  describe('getAvailableGateways', () => {
    it('should return list of available payment gateways', () => {
      const result = service.getAvailableGateways();

      expect(result.gateways).toBeDefined();
      expect(Array.isArray(result.gateways)).toBe(true);
      expect(paymentGatewayFactory.getAvailableGateways).toHaveBeenCalled();
    });
  });
});
