import { PrismaClient, DiscountType, User, Variant, Location, ShippingMethodType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  // ============================================
  // 1. ROLES & PERMISSIONS
  // ============================================
  console.log('📋 Seeding Roles & Permissions...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator role with full access' },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER', description: 'Customer role with limited access' },
  });

  const permissions = [
    { name: 'manage:users', description: 'Manage users' },
    { name: 'manage:products', description: 'Manage products' },
    { name: 'manage:orders', description: 'Manage orders' },
    { name: 'manage:inventory', description: 'Manage inventory' },
    { name: 'manage:bundles', description: 'Manage product bundles' },
    { name: 'manage:coupons', description: 'Manage coupons' },
    { name: 'view:reports', description: 'View reports' },
  ];

  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  console.log('✅ Roles & Permissions seeded\n');

  // ============================================
  // 2. USERS
  // ============================================
  console.log('👥 Seeding Users...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  const customers = [
    { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe' },
    { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith' },
    { email: 'bob.wilson@example.com', firstName: 'Bob', lastName: 'Wilson' },
    { email: 'alice.johnson@example.com', firstName: 'Alice', lastName: 'Johnson' },
    { email: 'charlie.brown@example.com', firstName: 'Charlie', lastName: 'Brown' },
  ];

  const createdCustomers: User[] = [];
  for (const customer of customers) {
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        ...customer,
        password: hashedPassword,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: customerRole.id } },
      update: {},
      create: { userId: user.id, roleId: customerRole.id },
    });

    createdCustomers.push(user);
  }

  console.log(`✅ ${createdCustomers.length + 1} Users seeded\n`);

  // ============================================
  // 3. USER ADDRESSES
  // ============================================
  console.log('📍 Seeding User Addresses...');

  const addresses = [
    {
      userId: createdCustomers[0].id,
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0101',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
    {
      userId: createdCustomers[1].id,
      label: 'Home',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1-555-0202',
      addressLine1: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
    {
      userId: createdCustomers[2].id,
      label: 'Home',
      firstName: 'Bob',
      lastName: 'Wilson',
      phone: '+1-555-0303',
      addressLine1: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
  ];

  for (const address of addresses) {
    await prisma.userAddress.create({ data: address });
  }

  console.log(`✅ ${addresses.length} Addresses seeded\n`);

  // ============================================
  // 4. CATEGORIES
  // ============================================
  console.log('📂 Seeding Categories...');

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
  });

  const home = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
  });

  const smartphones = await prisma.category.upsert({
    where: { slug: 'smartphones' },
    update: {},
    create: { name: 'Smartphones', slug: 'smartphones', parentId: electronics.id },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: { name: 'Laptops', slug: 'laptops', parentId: electronics.id },
  });

  const audio = await prisma.category.upsert({
    where: { slug: 'audio' },
    update: {},
    create: { name: 'Audio & Headphones', slug: 'audio', parentId: electronics.id },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: { name: 'Accessories', slug: 'accessories', parentId: electronics.id },
  });

  console.log('✅ Categories seeded\n');

  // ============================================
  // 5. PRODUCTS & VARIANTS
  // ============================================
  console.log('📦 Seeding Products & Variants...');

  // iPhone 15 Pro
  const iphone = await prisma.product.upsert({
    where: { seoSlug: 'iphone-15-pro' },
    update: {},
    create: {
      name: 'iPhone 15 Pro',
      seoSlug: 'iphone-15-pro',
      description: 'The most advanced iPhone yet with titanium design, A17 Pro chip, and ProMotion display',
      seoTitle: 'iPhone 15 Pro - Premium Smartphone',
      seoDescription: 'Get the iPhone 15 Pro with titanium design and cutting-edge features',
      isActive: true,
    },
  });

  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: iphone.id, categoryId: smartphones.id } },
    update: {},
    create: { productId: iphone.id, categoryId: smartphones.id },
  });

  const iphoneVariants = [
    { sku: 'IPHONE-15-PRO-128-BLACK', price: 999.99, barcode: '0194253001539', weight: 0.187 },
    { sku: 'IPHONE-15-PRO-256-BLACK', price: 1099.99, barcode: '0194253001546', weight: 0.187 },
    { sku: 'IPHONE-15-PRO-128-BLUE', price: 999.99, barcode: '0194253001553', weight: 0.187 },
    { sku: 'IPHONE-15-PRO-256-BLUE', price: 1099.99, barcode: '0194253001560', weight: 0.187 },
  ];

  const createdIphoneVariants: Variant[] = [];
  for (const variant of iphoneVariants) {
    const v = await prisma.variant.upsert({
      where: { sku: variant.sku },
      update: {},
      create: { ...variant, productId: iphone.id, compareAtPrice: variant.price + 100 },
    });
    createdIphoneVariants.push(v);
  }

  // MacBook Pro
  const macbook = await prisma.product.upsert({
    where: { seoSlug: 'macbook-pro-14' },
    update: {},
    create: {
      name: 'MacBook Pro 14"',
      seoSlug: 'macbook-pro-14',
      description: 'Supercharged by M3 Pro or M3 Max chip. Up to 22 hours battery life.',
      seoTitle: 'MacBook Pro 14" - Professional Laptop',
      isActive: true,
    },
  });

  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: macbook.id, categoryId: laptops.id } },
    update: {},
    create: { productId: macbook.id, categoryId: laptops.id },
  });

  const macbookVariant = await prisma.variant.upsert({
    where: { sku: 'MACBOOK-PRO-14-M3' },
    update: {},
    create: {
      productId: macbook.id,
      sku: 'MACBOOK-PRO-14-M3',
      price: 1999.99,
      compareAtPrice: 2199.99,
      barcode: '0194253245896',
      weight: 1.6,
    },
  });

  // AirPods Pro
  const airpods = await prisma.product.upsert({
    where: { seoSlug: 'airpods-pro-2' },
    update: {},
    create: {
      name: 'AirPods Pro (2nd generation)',
      seoSlug: 'airpods-pro-2',
      description: 'Active Noise Cancellation, Adaptive Audio, and Personalized Spatial Audio',
      isActive: true,
    },
  });

  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: airpods.id, categoryId: audio.id } },
    update: {},
    create: { productId: airpods.id, categoryId: audio.id },
  });

  const airpodsVariant = await prisma.variant.upsert({
    where: { sku: 'AIRPODS-PRO-2-USB-C' },
    update: {},
    create: {
      productId: airpods.id,
      sku: 'AIRPODS-PRO-2-USB-C',
      price: 249.99,
      compareAtPrice: 279.99,
      barcode: '0194253910411',
      weight: 0.056,
    },
  });

  // MagSafe Charger
  const magsafe = await prisma.product.upsert({
    where: { seoSlug: 'magsafe-charger' },
    update: {},
    create: {
      name: 'MagSafe Charger',
      seoSlug: 'magsafe-charger',
      description: 'Wireless charging for iPhone with MagSafe technology',
      isActive: true,
    },
  });

  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: magsafe.id, categoryId: accessories.id } },
    update: {},
    create: { productId: magsafe.id, categoryId: accessories.id },
  });

  const magsafeVariant = await prisma.variant.upsert({
    where: { sku: 'MAGSAFE-CHARGER' },
    update: {},
    create: {
      productId: magsafe.id,
      sku: 'MAGSAFE-CHARGER',
      price: 39.99,
      barcode: '0194252157286',
      weight: 0.112,
    },
  });

  // iPhone Case
  const iphoneCase = await prisma.product.upsert({
    where: { seoSlug: 'iphone-15-pro-silicone-case' },
    update: {},
    create: {
      name: 'iPhone 15 Pro Silicone Case',
      seoSlug: 'iphone-15-pro-silicone-case',
      description: 'Soft-touch finish silicone case with MagSafe compatibility',
      isActive: true,
    },
  });

  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: iphoneCase.id, categoryId: accessories.id } },
    update: {},
    create: { productId: iphoneCase.id, categoryId: accessories.id },
  });

  const iphoneCaseVariants = [
    { sku: 'IPHONE-CASE-BLACK', price: 49.99, barcode: '0194253910428' },
    { sku: 'IPHONE-CASE-BLUE', price: 49.99, barcode: '0194253910435' },
    { sku: 'IPHONE-CASE-RED', price: 49.99, barcode: '0194253910442' },
  ];

  const createdCaseVariants: Variant[] = [];
  for (const variant of iphoneCaseVariants) {
    const v = await prisma.variant.upsert({
      where: { sku: variant.sku },
      update: {},
      create: { ...variant, productId: iphoneCase.id, weight: 0.034 },
    });
    createdCaseVariants.push(v);
  }

  // Sony Headphones
  const sonyHeadphones = await prisma.product.upsert({
    where: { seoSlug: 'sony-wh1000xm5' },
    update: {},
    create: {
      name: 'Sony WH-1000XM5',
      seoSlug: 'sony-wh1000xm5',
      description: 'Industry-leading noise canceling headphones with premium sound quality',
      isActive: true,
    },
  });

  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: sonyHeadphones.id, categoryId: audio.id } },
    update: {},
    create: { productId: sonyHeadphones.id, categoryId: audio.id },
  });

  const sonyVariant = await prisma.variant.upsert({
    where: { sku: 'SONY-WH1000XM5-BLACK' },
    update: {},
    create: {
      productId: sonyHeadphones.id,
      sku: 'SONY-WH1000XM5-BLACK',
      price: 399.99,
      compareAtPrice: 449.99,
      barcode: '0027242923546',
      weight: 0.250,
    },
  });

  console.log(`✅ Products & Variants seeded\n`);

  // ============================================
  // 6. INVENTORY LOCATIONS & STOCK
  // ============================================
  console.log('🏭 Seeding Inventory Locations & Stock...');

  const locations = [
    {
      name: 'Main Warehouse - New York',
      addressLine1: '100 Warehouse Blvd',
      city: 'Brooklyn',
      state: 'NY',
      postalCode: '11201',
      country: 'US',
    },
    {
      name: 'West Coast Distribution Center',
      addressLine1: '500 Commerce Way',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
    },
    {
      name: 'Midwest Fulfillment Center',
      addressLine1: '250 Industrial Drive',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    },
  ];

  const createdLocations: Location[] = [];
  for (const location of locations) {
    const loc = await prisma.location.create({ data: location });
    createdLocations.push(loc);
  }

  // Add inventory for all variants across locations
  const allVariants = [
    ...createdIphoneVariants,
    macbookVariant,
    airpodsVariant,
    magsafeVariant,
    ...createdCaseVariants,
    sonyVariant,
  ];

  for (const variant of allVariants) {
    for (const location of createdLocations) {
      const quantity = Math.floor(Math.random() * 100) + 50; // 50-150 units
      await prisma.variantInventory.create({
        data: {
          variantId: variant.id,
          locationId: location.id,
          quantity,
          reserved: 0,
        },
      });
    }
  }

  console.log(`✅ ${createdLocations.length} Locations with inventory seeded\n`);

  // ============================================
  // 7. BUNDLES
  // ============================================
  console.log('📦 Seeding Bundles...');

  // iPhone Starter Bundle
  const iphoneStarterBundle = await prisma.bundle.create({
    data: {
      name: 'iPhone 15 Pro Starter Bundle',
      description: 'Get your new iPhone with AirPods Pro and MagSafe charger - Save $80!',
      price: 1209.97, // Individual: $999.99 + $249.99 + $39.99 = $1289.97, Save: $80
      isActive: true,
    },
  });

  await prisma.bundleItem.createMany({
    data: [
      { bundleId: iphoneStarterBundle.id, variantId: createdIphoneVariants[0].id, quantity: 1 },
      { bundleId: iphoneStarterBundle.id, variantId: airpodsVariant.id, quantity: 1 },
      { bundleId: iphoneStarterBundle.id, variantId: magsafeVariant.id, quantity: 1 },
    ],
  });

  // iPhone Complete Protection Bundle
  const iphoneCompleteBundle = await prisma.bundle.create({
    data: {
      name: 'iPhone 15 Pro Complete Protection',
      description: 'iPhone with protective case and MagSafe charger - Save $30!',
      price: 1059.97, // Individual: $999.99 + $49.99 + $39.99 = $1089.97, Save: $30
      isActive: true,
    },
  });

  await prisma.bundleItem.createMany({
    data: [
      { bundleId: iphoneCompleteBundle.id, variantId: createdIphoneVariants[0].id, quantity: 1 },
      { bundleId: iphoneCompleteBundle.id, variantId: createdCaseVariants[0].id, quantity: 1 },
      { bundleId: iphoneCompleteBundle.id, variantId: magsafeVariant.id, quantity: 1 },
    ],
  });

  // Apple Ecosystem Bundle
  const appleEcosystemBundle = await prisma.bundle.create({
    data: {
      name: 'Apple Ecosystem Premium Bundle',
      description: 'Complete Apple setup with iPhone, MacBook, and AirPods - Save $250!',
      price: 2999.97, // Individual: $999.99 + $1999.99 + $249.99 = $3249.97, Save: $250
      isActive: true,
    },
  });

  await prisma.bundleItem.createMany({
    data: [
      { bundleId: appleEcosystemBundle.id, variantId: createdIphoneVariants[1].id, quantity: 1 },
      { bundleId: appleEcosystemBundle.id, variantId: macbookVariant.id, quantity: 1 },
      { bundleId: appleEcosystemBundle.id, variantId: airpodsVariant.id, quantity: 1 },
    ],
  });

  // Audio Bundle
  const audioBundle = await prisma.bundle.create({
    data: {
      name: 'Premium Audio Collection',
      description: 'Best of both worlds - Apple and Sony premium audio - Save $100!',
      price: 549.98, // Individual: $249.99 + $399.99 = $649.98, Save: $100
      isActive: true,
    },
  });

  await prisma.bundleItem.createMany({
    data: [
      { bundleId: audioBundle.id, variantId: airpodsVariant.id, quantity: 1 },
      { bundleId: audioBundle.id, variantId: sonyVariant.id, quantity: 1 },
    ],
  });

  console.log('✅ 4 Bundles seeded\n');

  // ============================================
  // 8. SHIPPING METHODS
  // ============================================
  console.log('🚚 Seeding Shipping Methods...');

  const shippingMethods = [
    {
      name: 'Standard Shipping',
      code: 'STANDARD',
      type: ShippingMethodType.standard,
      description: 'Standard ground shipping - Free on orders over $50',
      baseRate: 9.99,
      freeThreshold: 50.00,
      minDays: 5,
      maxDays: 7,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Express Shipping',
      code: 'EXPRESS',
      type: ShippingMethodType.express,
      description: '2-3 day delivery - Free on orders over $100',
      baseRate: 19.99,
      freeThreshold: 100.00,
      minDays: 2,
      maxDays: 3,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Overnight Shipping',
      code: 'OVERNIGHT',
      type: ShippingMethodType.overnight,
      description: 'Next business day delivery',
      baseRate: 29.99,
      freeThreshold: null,
      minDays: 1,
      maxDays: 1,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Same Day Delivery',
      code: 'SAME_DAY',
      type: ShippingMethodType.same_day,
      description: 'Same day delivery for local orders (within 25 miles)',
      baseRate: 39.99,
      freeThreshold: null,
      minDays: 0,
      maxDays: 0,
      isActive: false, // Disabled by default, enable for specific locations
      sortOrder: 4,
    },
    {
      name: 'Store Pickup',
      code: 'PICKUP',
      type: ShippingMethodType.pickup,
      description: 'Pick up your order at our store - Always Free',
      baseRate: 0,
      freeThreshold: 0,
      minDays: 0,
      maxDays: 1,
      isActive: true,
      sortOrder: 0, // Show first
    },
  ];

  for (const method of shippingMethods) {
    await prisma.shippingMethod.upsert({
      where: { code: method.code },
      update: {},
      create: method,
    });
  }

  console.log(`✅ ${shippingMethods.length} Shipping Methods seeded\n`);

  // ============================================
  // 9. COUPONS
  // ============================================
  console.log('🎫 Seeding Coupons...');

  const coupons = [
    {
      code: 'WELCOME10',
      discountType: DiscountType.percentage,
      discountAmount: 10,
      minOrderAmount: 50,
      maxUses: 1000,
      maxUsesPerUser: 1,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
    },
    {
      code: 'BUNDLE20',
      discountType: DiscountType.percentage,
      discountAmount: 20,
      minOrderAmount: 1000,
      maxUses: 500,
      maxUsesPerUser: 1,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
    },
    {
      code: 'FREESHIP',
      discountType: DiscountType.shipping,
      discountAmount: 100,
      minOrderAmount: 100,
      maxUses: null,
      maxUsesPerUser: null,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
    },
    {
      code: 'SAVE50',
      discountType: DiscountType.fixed,
      discountAmount: 50,
      minOrderAmount: 200,
      maxUses: 200,
      maxUsesPerUser: 1,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }

  console.log(`✅ ${coupons.length} Coupons seeded\n`);

  // ============================================
  // 9. ORDERS
  // ============================================
  console.log('🛒 Seeding Orders...');

  // Order 1: John buys iPhone bundle
  const order1 = await prisma.order.create({
    data: {
      userId: createdCustomers[0].id,
      subtotalAmount: 1209.97,
      shippingAmount: 0,
      taxAmount: 108.90,
      totalAmount: 1318.87,
      currentStatus: 'delivered',
      placedAt: new Date('2024-11-01'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      bundleId: iphoneStarterBundle.id,
      quantity: 1,
      unitPrice: 1209.97,
      lineTotal: 1209.97,
      productNameSnapshot: 'iPhone 15 Pro Starter Bundle',
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order1.id,
      status: 'delivered',
      note: 'Order delivered successfully',
    },
  });

  // Order 2: Jane buys MacBook and accessories
  const order2 = await prisma.order.create({
    data: {
      userId: createdCustomers[1].id,
      subtotalAmount: 2049.98,
      shippingAmount: 15.00,
      taxAmount: 184.50,
      totalAmount: 2249.48,
      currentStatus: 'shipped',
      placedAt: new Date('2024-11-10'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        variantId: macbookVariant.id,
        quantity: 1,
        unitPrice: 1999.99,
        lineTotal: 1999.99,
        productNameSnapshot: 'MacBook Pro 14"',
        variantSkuSnapshot: 'MACBOOK-PRO-14-M3',
      },
      {
        orderId: order2.id,
        variantId: createdCaseVariants[1].id,
        quantity: 1,
        unitPrice: 49.99,
        lineTotal: 49.99,
        productNameSnapshot: 'iPhone 15 Pro Silicone Case',
        variantSkuSnapshot: 'IPHONE-CASE-BLUE',
      },
    ],
  });

  // Order 3: Bob buys headphones
  const order3 = await prisma.order.create({
    data: {
      userId: createdCustomers[2].id,
      subtotalAmount: 399.99,
      shippingAmount: 0,
      taxAmount: 36.00,
      totalAmount: 435.99,
      currentStatus: 'processing',
      placedAt: new Date('2024-11-15'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      variantId: sonyVariant.id,
      quantity: 1,
      unitPrice: 399.99,
      lineTotal: 399.99,
      productNameSnapshot: 'Sony WH-1000XM5',
      variantSkuSnapshot: 'SONY-WH1000XM5-BLACK',
    },
  });

  console.log('✅ 3 Orders seeded\n');

  // ============================================
  // 10. REVIEWS
  // ============================================
  console.log('⭐ Seeding Reviews...');

  const reviews = [
    {
      userId: createdCustomers[0].id,
      productId: iphone.id,
      rating: 5,
      comment: 'Absolutely love this iPhone! The titanium design feels premium and the camera quality is outstanding. Battery lasts all day with heavy use.',
      status: 'approved',
    },
    {
      userId: createdCustomers[0].id,
      productId: airpods.id,
      rating: 5,
      comment: 'Best AirPods yet! The noise cancellation is incredible and adaptive audio works flawlessly.',
      status: 'approved',
    },
    {
      userId: createdCustomers[1].id,
      productId: macbook.id,
      rating: 5,
      comment: 'M3 chip is a beast! Handles video editing and coding effortlessly. The display is gorgeous.',
      status: 'approved',
    },
    {
      userId: createdCustomers[2].id,
      productId: sonyHeadphones.id,
      rating: 4,
      comment: 'Great sound quality and comfortable for long listening sessions. Noise cancellation is top-notch but a bit pricey.',
      status: 'approved',
    },
    {
      userId: createdCustomers[3].id,
      productId: iphone.id,
      rating: 4,
      comment: 'Solid phone overall. Camera improvements are noticeable from previous generation. Would prefer USB-C to be faster.',
      status: 'approved',
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review });
  }

  console.log(`✅ ${reviews.length} Reviews seeded\n`);

  // ============================================
  // 11. WISHLISTS
  // ============================================
  console.log('❤️ Seeding Wishlists...');

  const wishlist1 = await prisma.wishlist.create({
    data: { userId: createdCustomers[3].id },
  });

  await prisma.wishlistItem.createMany({
    data: [
      { wishlistId: wishlist1.id, variantId: macbookVariant.id },
      { wishlistId: wishlist1.id, bundleId: appleEcosystemBundle.id },
    ],
  });

  const wishlist2 = await prisma.wishlist.create({
    data: { userId: createdCustomers[4].id },
  });

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist2.id, variantId: sonyVariant.id },
  });

  console.log('✅ Wishlists seeded\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Database seeding completed!\n');
  console.log('📊 Summary:');
  console.log('   - Roles: 2 (ADMIN, CUSTOMER)');
  console.log('   - Permissions: 7');
  console.log('   - Users: 6 (1 admin, 5 customers)');
  console.log('   - Addresses: 3');
  console.log('   - Categories: 7');
  console.log('   - Products: 6');
  console.log('   - Variants: 11');
  console.log('   - Locations: 3');
  console.log('   - Inventory Records: 33 (11 variants × 3 locations)');
  console.log('   - Bundles: 4');
  console.log('   - Shipping Methods: 5');
  console.log('   - Coupons: 4');
  console.log('   - Orders: 3');
  console.log('   - Reviews: 5');
  console.log('   - Wishlists: 2\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
