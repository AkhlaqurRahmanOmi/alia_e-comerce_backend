import { PrismaClient, ShippingMethodType, OrderStatus, PaymentStatus, ShipmentStatus, CartStatus, NotificationChannel, BlogPostStatus, RefundStatus, ReturnStatus, ReturnCondition, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🍷 Starting MASTER Wine Shop Database Seeding...\n');
  console.log('=' .repeat(60));

  // ============================================
  // CLEAR ALL DATA (EXCEPT CMS & BOOKING)
  // ============================================
  console.log('\n🧹 Step 1: Cleaning existing data...');

  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.refundItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.fulfillmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.transactionLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderAddress.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.variantInventory.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.couponUser.deleteMany();
  await prisma.couponCategory.deleteMany();
  await prisma.couponProduct.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.variantOptionValue.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.variantImage.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.country.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.blogPost.deleteMany();

  console.log('✅ Data cleaned successfully\n');

  // ============================================
  // STEP 2: ROLES & PERMISSIONS
  // ============================================
  console.log('🔐 Step 2: Seeding Roles & Permissions...');

  const permissions = [
    // User permissions
    { name: 'users:view', description: 'View users' },
    { name: 'users:create', description: 'Create users' },
    { name: 'users:update', description: 'Update users' },
    { name: 'users:delete', description: 'Delete users' },

    // Product permissions
    { name: 'products:view', description: 'View products' },
    { name: 'products:create', description: 'Create products' },
    { name: 'products:update', description: 'Update products' },
    { name: 'products:delete', description: 'Delete products' },

    // Category permissions
    { name: 'categories:view', description: 'View categories' },
    { name: 'categories:create', description: 'Create categories' },
    { name: 'categories:update', description: 'Update categories' },
    { name: 'categories:delete', description: 'Delete categories' },

    // Order permissions
    { name: 'orders:view', description: 'View orders' },
    { name: 'orders:create', description: 'Create orders' },
    { name: 'orders:update', description: 'Update orders' },
    { name: 'orders:cancel', description: 'Cancel orders' },

    // Inventory permissions
    { name: 'inventory:view', description: 'View inventory' },
    { name: 'inventory:create', description: 'Create inventory' },
    { name: 'inventory:update', description: 'Update inventory' },
    { name: 'inventory:delete', description: 'Delete inventory' },
    { name: 'inventory:adjust', description: 'Adjust inventory levels' },
    { name: 'inventory:transfer', description: 'Transfer inventory between locations' },

    // Coupon permissions
    { name: 'coupons:view', description: 'View coupons' },
    { name: 'coupons:create', description: 'Create coupons' },
    { name: 'coupons:update', description: 'Update coupons' },
    { name: 'coupons:delete', description: 'Delete coupons' },
    { name: 'coupons:assign', description: 'Assign coupons to users/products/categories' },

    // Cart permissions
    { name: 'carts:view', description: 'View carts' },
    { name: 'carts:read', description: 'Read cart details' },
    { name: 'carts:create', description: 'Create carts' },
    { name: 'carts:update', description: 'Update carts' },
    { name: 'carts:delete', description: 'Delete carts' },

    // Blog permissions
    { name: 'blog:view', description: 'View blog posts' },
    { name: 'blog:create', description: 'Create blog posts' },
    { name: 'blog:update', description: 'Update blog posts' },
    { name: 'blog:delete', description: 'Delete blog posts' },
    { name: 'blog:publish', description: 'Publish blog posts' },

    // CMS permissions
    { name: 'cms:read', description: 'View CMS homepage sections' },
    { name: 'cms:update', description: 'Update CMS homepage sections' },

    // Review permissions
    { name: 'reviews:view', description: 'View reviews' },
    { name: 'reviews:create', description: 'Create reviews' },
    { name: 'reviews:update', description: 'Update reviews' },
    { name: 'reviews:delete', description: 'Delete reviews' },
    { name: 'reviews:approve', description: 'Approve reviews' },

    // Notification permissions
    { name: 'notifications:view', description: 'View notifications' },
    { name: 'notifications:send', description: 'Send notifications' },
    { name: 'notifications:update', description: 'Update notifications' },
    { name: 'notifications:delete', description: 'Delete notifications' },

    // Report permissions
    { name: 'reports:view', description: 'View reports' },
    { name: 'reports:read', description: 'Read report data' },

    // Role & Permission management
    { name: 'roles:view', description: 'View roles' },
    { name: 'roles:read', description: 'Read role details' },
    { name: 'roles:create', description: 'Create roles' },
    { name: 'roles:update', description: 'Update roles' },
    { name: 'roles:delete', description: 'Delete roles' },
    { name: 'roles:assign', description: 'Assign roles to users' },

    { name: 'permissions:read', description: 'Read permissions' },
    { name: 'permissions:create', description: 'Create permissions' },
    { name: 'permissions:update', description: 'Update permissions' },
    { name: 'permissions:delete', description: 'Delete permissions' },

    // Country permissions
    { name: 'countries:read', description: 'Read countries' },
    { name: 'countries:create', description: 'Create countries' },
    { name: 'countries:update', description: 'Update countries' },
    { name: 'countries:delete', description: 'Delete countries' },

    // Bundle permissions
    { name: 'bundles:view', description: 'View bundles' },
    { name: 'bundles:create', description: 'Create bundles' },
    { name: 'bundles:update', description: 'Update bundles' },
    { name: 'bundles:delete', description: 'Delete bundles' },

    // Shipping permissions
    { name: 'shipping:view', description: 'View shipping methods' },
    { name: 'shipping:create', description: 'Create shipping methods' },
    { name: 'shipping:update', description: 'Update shipping methods' },
    { name: 'shipping:delete', description: 'Delete shipping methods' },

    // Booking permissions
    { name: 'bookings:view', description: 'View bookings' },
    { name: 'bookings:create', description: 'Create bookings' },
    { name: 'bookings:update', description: 'Update bookings' },
    { name: 'bookings:delete', description: 'Delete bookings' },
    { name: 'bookings:manage-settings', description: 'Manage booking settings' },

    // Wishlist permissions
    { name: 'wishlists:view', description: 'View wishlists' },
    { name: 'wishlists:create', description: 'Create wishlists' },
    { name: 'wishlists:update', description: 'Update wishlists' },
    { name: 'wishlists:delete', description: 'Delete wishlists' },

    // Payment permissions
    { name: 'payments:view', description: 'View payments' },
    { name: 'payments:create', description: 'Create/initiate payments' },
    { name: 'payments:update', description: 'Update payment status' },
    { name: 'payments:refund', description: 'Process payment refunds' },

    // Refund permissions
    { name: 'refunds:view', description: 'View refunds' },
    { name: 'refunds:create', description: 'Create refunds' },
    { name: 'refunds:update', description: 'Update refund status' },
    { name: 'refunds:approve', description: 'Approve refunds' },

    // Return permissions
    { name: 'returns:view', description: 'View return requests' },
    { name: 'returns:create', description: 'Create return requests' },
    { name: 'returns:update', description: 'Update return status' },
    { name: 'returns:approve', description: 'Approve return requests' },

    // Shipment permissions
    { name: 'shipments:view', description: 'View shipments' },
    { name: 'shipments:create', description: 'Create shipments' },
    { name: 'shipments:update', description: 'Update shipment status' },
    { name: 'shipments:track', description: 'Track shipments' },

    // Address permissions
    { name: 'addresses:view', description: 'View addresses' },
    { name: 'addresses:create', description: 'Create addresses' },
    { name: 'addresses:update', description: 'Update addresses' },
    { name: 'addresses:delete', description: 'Delete addresses' },

    // Location permissions
    { name: 'locations:view', description: 'View warehouse locations' },
    { name: 'locations:create', description: 'Create warehouse locations' },
    { name: 'locations:update', description: 'Update warehouse locations' },
    { name: 'locations:delete', description: 'Delete warehouse locations' },
  ];

  const createdPermissions = await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  const allPermissions = await prisma.permission.findMany();

  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN', description: 'Administrator with full system access' },
  });

  const managerRole = await prisma.role.create({
    data: { name: 'MANAGER', description: 'Manager with access to manage content and catalog' },
  });

  const customerRole = await prisma.role.create({
    data: { name: 'CUSTOMER', description: 'Customer with access to shopping features' },
  });

  // Assign all permissions to ADMIN
  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Assign specific permissions to MANAGER
  const managerPermNames = [
    'products:view', 'products:create', 'products:update',
    'categories:view', 'categories:create', 'categories:update',
    'orders:view', 'orders:update',
    'inventory:view', 'inventory:update', 'inventory:adjust', 'inventory:transfer',
    'coupons:view', 'coupons:create', 'coupons:update', 'coupons:assign',
    'blog:view', 'blog:create', 'blog:update', 'blog:publish',
    'cms:read', 'cms:update',
    'reviews:view', 'reviews:approve',
    'bundles:view', 'bundles:create', 'bundles:update',
    'reports:view', 'reports:read',
    'bookings:view', 'bookings:update', 'bookings:manage-settings',
    'shipments:view', 'shipments:create', 'shipments:update', 'shipments:track',
    'payments:view',
    'refunds:view', 'refunds:create', 'refunds:approve',
    'returns:view', 'returns:update', 'returns:approve',
    'locations:view',
  ];
  const managerPerms = allPermissions.filter(p => managerPermNames.includes(p.name));
  for (const perm of managerPerms) {
    await prisma.rolePermission.create({
      data: { roleId: managerRole.id, permissionId: perm.id },
    });
  }

  // Assign basic permissions to CUSTOMER
  const customerPermNames = [
    'products:view', 'categories:view', 'bundles:view',
    'orders:view', 'orders:create', 'orders:cancel',
    'blog:view',
    'reviews:view', 'reviews:create',
    'carts:view', 'carts:read', 'carts:create', 'carts:update', 'carts:delete',
    'wishlists:view', 'wishlists:create', 'wishlists:update', 'wishlists:delete',
    'addresses:view', 'addresses:create', 'addresses:update', 'addresses:delete',
    'payments:view', 'payments:create',
    'returns:view', 'returns:create',
    'bookings:view', 'bookings:create',
    'shipments:view', 'shipments:track',
  ];
  const customerPerms = allPermissions.filter(p => customerPermNames.includes(p.name));
  for (const perm of customerPerms) {
    await prisma.rolePermission.create({
      data: { roleId: customerRole.id, permissionId: perm.id },
    });
  }

  console.log(`✅ Created ${allPermissions.length} permissions`);
  console.log(`✅ Created 3 roles: ADMIN, MANAGER, CUSTOMER\n`);

  // ============================================
  // STEP 3: USERS
  // ============================================
  console.log('👥 Step 3: Seeding Users...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@wineshop.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
      verifiedAt: new Date(),
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@wineshop.com',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      isVerified: true,
      verifiedAt: new Date(),
      userRoles: {
        create: { roleId: managerRole.id },
      },
    },
  });

  const customerData = [
    { email: 'james.towell@example.com', firstName: 'James', lastName: 'Towell' },
    { email: 'anita.oramo@example.com', firstName: 'Anita', lastName: 'Oramo' },
    { email: 'brian.mondale@example.com', firstName: 'Brian', lastName: 'Mondale' },
    { email: 'john.adamu@example.com', firstName: 'John', lastName: 'Adamu' },
    { email: 'peter.wantuchi@example.com', firstName: 'Peter', lastName: 'Wantuchi' },
    { email: 'sarah.johnson@example.com', firstName: 'Sarah', lastName: 'Johnson' },
    { email: 'michael.chen@example.com', firstName: 'Michael', lastName: 'Chen' },
    { email: 'emily.wilson@example.com', firstName: 'Emily', lastName: 'Wilson' },
    { email: 'david.otieno@example.com', firstName: 'David', lastName: 'Otieno' },
    { email: 'grace.kamau@example.com', firstName: 'Grace', lastName: 'Kamau' },
  ];

  const customers: any[] = [];
  for (const customer of customerData) {
    const user = await prisma.user.create({
      data: {
        ...customer,
        password: hashedPassword,
        isVerified: true,
        verifiedAt: new Date(),
        userRoles: {
          create: { roleId: customerRole.id },
        },
      },
    });
    customers.push(user);
  }

  console.log(`✅ Created ${customers.length + 2} users (1 admin, 1 manager, ${customers.length} customers)\n`);

  // ============================================
  // STEP 4: COUNTRIES (Wine Origins)
  // ============================================
  console.log('🌍 Step 4: Seeding Countries...');

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'DE', name: 'Germany' },
    { code: 'CL', name: 'Chile' },
    { code: 'PT', name: 'Portugal' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IE', name: 'Ireland' },
    { code: 'CA', name: 'Canada' },
    { code: 'KE', name: 'Kenya' },
  ];

  await prisma.country.createMany({ data: countries });
  const allCountries = await prisma.country.findMany();

  console.log(`✅ Created ${countries.length} countries\n`);

  // ============================================
  // STEP 5: SHIPPING METHODS
  // ============================================
  console.log('🚚 Step 5: Seeding Shipping Methods...');

  const shippingMethods = await prisma.shippingMethod.createMany({
    data: [
      {
        name: 'FREE DELIVERY',
        code: 'FREE_DELIVERY',
        type: ShippingMethodType.standard,
        description: 'Free delivery in Nairobi for orders above KES 6,000',
        baseRate: 0,
        freeThreshold: 6000,
        minDays: 1,
        maxDays: 3,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'FLAT RATE DELIVERY',
        code: 'FLAT_RATE',
        type: ShippingMethodType.standard,
        description: 'KSh 300 flat rate for orders below KES 6,000',
        baseRate: 300,
        minDays: 1,
        maxDays: 3,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'EXPRESS DELIVERY',
        code: 'EXPRESS',
        type: ShippingMethodType.express,
        description: 'Same day delivery within Nairobi CBD - KSh 500',
        baseRate: 500,
        minDays: 0,
        maxDays: 1,
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'STORE PICKUP',
        code: 'STORE_PICKUP',
        type: ShippingMethodType.pickup,
        description: 'Free store pickup at our location 10AM - 7PM',
        baseRate: 0,
        minDays: 0,
        maxDays: 0,
        isActive: true,
        sortOrder: 4,
      },
    ],
  });

  const allShippingMethods = await prisma.shippingMethod.findMany();

  console.log(`✅ Created ${allShippingMethods.length} shipping methods\n`);

  // ============================================
  // STEP 6: LOCATION (Warehouse)
  // ============================================
  console.log('📍 Step 6: Seeding Location...');

  const location = await prisma.location.create({
    data: {
      name: 'California Wines By Rose - Main Warehouse',
      addressLine1: 'Westlands, Nairobi',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
    },
  });

  console.log(`✅ Created warehouse location\n`);

  // ============================================
  // STEP 7: CATEGORIES (Hierarchical)
  // ============================================
  console.log('📁 Step 7: Seeding Categories...');

  const wineParent = await prisma.category.create({
    data: { name: 'Wine', description: 'Premium wines from around the world', slug: 'wine' },
  });

  const spiritsParent = await prisma.category.create({
    data: { name: 'Spirits', description: 'Premium spirits and liquors', slug: 'spirits' },
  });

  const beersParent = await prisma.category.create({
    data: { name: 'Beers', description: 'Craft and imported beers', slug: 'beers' },
  });

  const accessoriesParent = await prisma.category.create({
    data: { name: 'Accessories', description: 'Wine accessories and glassware', slug: 'accessories' },
  });

  // Wine Subcategories
  const redWine = await prisma.category.create({
    data: { name: 'Red Wine', description: 'Full-bodied red wines', slug: 'red-wine', parentId: wineParent.id },
  });

  const whiteWine = await prisma.category.create({
    data: { name: 'White Wine', description: 'Crisp and refreshing white wines', slug: 'white-wine', parentId: wineParent.id },
  });

  const sparklingWine = await prisma.category.create({
    data: { name: 'Sparkling Wine', description: 'Champagne and sparkling wines', slug: 'sparkling-wine', parentId: wineParent.id },
  });

  const roseWine = await prisma.category.create({
    data: { name: 'Rosé Wine', description: 'Elegant rosé wines', slug: 'rose-wine', parentId: wineParent.id },
  });

  const dessertWine = await prisma.category.create({
    data: { name: 'Dessert Wine', description: 'Sweet dessert wines', slug: 'dessert-wine', parentId: wineParent.id },
  });

  // Spirit Subcategories
  const whiskey = await prisma.category.create({
    data: { name: 'Whiskey', description: 'Premium whiskeys and bourbons', slug: 'whiskey', parentId: spiritsParent.id },
  });

  const vodka = await prisma.category.create({
    data: { name: 'Vodka', description: 'Premium vodkas', slug: 'vodka', parentId: spiritsParent.id },
  });

  const rum = await prisma.category.create({
    data: { name: 'Rum', description: 'Caribbean and spiced rums', slug: 'rum', parentId: spiritsParent.id },
  });

  const gin = await prisma.category.create({
    data: { name: 'Gin', description: 'Craft and premium gins', slug: 'gin', parentId: spiritsParent.id },
  });

  const tequila = await prisma.category.create({
    data: { name: 'Tequila', description: 'Authentic Mexican tequila', slug: 'tequila', parentId: spiritsParent.id },
  });

  const cognac = await prisma.category.create({
    data: { name: 'Cognac', description: 'French cognac and brandy', slug: 'cognac', parentId: spiritsParent.id },
  });

  // Beer Subcategories
  const craftBeer = await prisma.category.create({
    data: { name: 'Craft Beer', description: 'Artisanal craft beers', slug: 'craft-beer', parentId: beersParent.id },
  });

  const lager = await prisma.category.create({
    data: { name: 'Lager', description: 'Classic lagers', slug: 'lager', parentId: beersParent.id },
  });

  const stout = await prisma.category.create({
    data: { name: 'Stout', description: 'Dark stouts and porters', slug: 'stout', parentId: beersParent.id },
  });

  const ale = await prisma.category.create({
    data: { name: 'Ale', description: 'Traditional ales and IPAs', slug: 'ale', parentId: beersParent.id },
  });

  // Accessories Subcategories
  const glassware = await prisma.category.create({
    data: { name: 'Glassware', description: 'Wine glasses and decanters', slug: 'glassware', parentId: accessoriesParent.id },
  });

  const openers = await prisma.category.create({
    data: { name: 'Openers & Tools', description: 'Corkscrews and wine tools', slug: 'openers-tools', parentId: accessoriesParent.id },
  });

  console.log(`✅ Created 4 parent categories and 18 subcategories\n`);

  // ============================================
  // STEP 8: PRODUCTS WITH IMAGES & ATTRIBUTES
  // ============================================
  console.log('🍇 Step 8: Seeding Products (Wines, Spirits, Beers, Accessories)...');

  const usCountry = allCountries.find(c => c.code === 'US');
  const frCountry = allCountries.find(c => c.code === 'FR');
  const itCountry = allCountries.find(c => c.code === 'IT');
  const esCountry = allCountries.find(c => c.code === 'ES');
  const arCountry = allCountries.find(c => c.code === 'AR');
  const auCountry = allCountries.find(c => c.code === 'AU');
  const nzCountry = allCountries.find(c => c.code === 'NZ');
  const deCountry = allCountries.find(c => c.code === 'DE');

  const wineProducts = [
    // RED WINES
    {
      name: 'Napa Valley Cabernet Sauvignon 2019',
      description: 'Rich and full-bodied Cabernet from Napa Valley. Dark fruit flavors with notes of cedar, tobacco, and vanilla. Perfectly balanced with firm tannins and a long finish. Pairs excellently with grilled steaks and aged cheeses.',
      countryId: usCountry?.id,
      category: redWine.id,
      price: 8500,
      compareAtPrice: 10000,
      sku: 'WINE-RED-CAB-001',
      stock: 85,
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
      attributes: {
        'Wine Type': 'Cabernet Sauvignon',
        'Region': 'Napa Valley, California',
        'Alcohol Content': '14.5%',
        'Body': 'Full Body',
        'Vintage': '2019',
        'Aging': '18 months in French oak',
      },
    },
    {
      name: 'Bordeaux Château Reserve 2018',
      description: 'Classic Bordeaux blend from a prestigious château. Complex layers of black currant, plum, and earthy notes. Elegant structure with silky tannins. A wine that showcases the best of French winemaking tradition.',
      countryId: frCountry?.id,
      category: redWine.id,
      price: 12500,
      compareAtPrice: 15000,
      sku: 'WINE-RED-BOR-001',
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
      attributes: {
        'Wine Type': 'Bordeaux Blend',
        'Region': 'Bordeaux, France',
        'Alcohol Content': '13.5%',
        'Body': 'Full Body',
        'Vintage': '2018',
        'Aging': '24 months in oak barrels',
      },
    },
    {
      name: 'Tuscan Chianti Classico DOCG 2020',
      description: 'Authentic Chianti Classico with bright cherry flavors, dried herbs, and a hint of leather. Medium-bodied with vibrant acidity. Perfect with pasta, pizza, and Italian cuisine. The black rooster seal guarantees quality.',
      countryId: itCountry?.id,
      category: redWine.id,
      price: 4500,
      compareAtPrice: 5200,
      sku: 'WINE-RED-CHI-001',
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800',
      attributes: {
        'Wine Type': 'Sangiovese',
        'Region': 'Tuscany, Italy',
        'Alcohol Content': '13%',
        'Body': 'Medium Body',
        'Vintage': '2020',
        'Certification': 'DOCG',
      },
    },
    {
      name: 'Rioja Gran Reserva 2015',
      description: 'Exceptional Spanish red wine aged for extended period. Complex aromas of dried fruit, leather, tobacco, and vanilla. Smooth and refined with a long elegant finish. A true expression of Rioja winemaking.',
      countryId: esCountry?.id,
      category: redWine.id,
      price: 7800,
      compareAtPrice: 9000,
      sku: 'WINE-RED-RIO-001',
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800',
      attributes: {
        'Wine Type': 'Tempranillo',
        'Region': 'Rioja, Spain',
        'Alcohol Content': '13.8%',
        'Body': 'Full Body',
        'Vintage': '2015',
        'Aging': '60 months total aging',
      },
    },
    {
      name: 'Mendoza Malbec Reserve 2019',
      description: 'Bold Argentinian Malbec with intense dark fruit flavors. Notes of blackberry, plum, cocoa, and violet. Velvety tannins and excellent structure. Perfect for grilled meats and BBQ.',
      countryId: arCountry?.id,
      category: redWine.id,
      price: 5200,
      compareAtPrice: 6000,
      sku: 'WINE-RED-MAL-001',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800',
      attributes: {
        'Wine Type': 'Malbec',
        'Region': 'Mendoza, Argentina',
        'Alcohol Content': '14.5%',
        'Body': 'Full Body',
        'Vintage': '2019',
        'Elevation': '3000 feet above sea level',
      },
    },
    {
      name: 'Oregon Pinot Noir Estate 2020',
      description: 'Elegant Pinot Noir with delicate red fruit flavors. Cherry, raspberry, and subtle earthy notes with silky tannins. Bright acidity makes it food-friendly. Showcases the terroir of Oregon.',
      countryId: usCountry?.id,
      category: redWine.id,
      price: 6800,
      compareAtPrice: 7800,
      sku: 'WINE-RED-PIN-001',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1566754436385-b5a7c1d82a56?w=800',
      attributes: {
        'Wine Type': 'Pinot Noir',
        'Region': 'Willamette Valley, Oregon',
        'Alcohol Content': '13.5%',
        'Body': 'Medium Body',
        'Vintage': '2020',
        'Sustainable': 'Organic practices',
      },
    },
    {
      name: 'Barossa Valley Shiraz 2018',
      description: 'Powerful Australian Shiraz with bold blackberry and pepper flavors. Rich and concentrated with hints of smoke, leather, and dark chocolate. Full-bodied with excellent aging potential.',
      countryId: auCountry?.id,
      category: redWine.id,
      price: 7200,
      compareAtPrice: 8500,
      sku: 'WINE-RED-SHI-001',
      stock: 68,
      imageUrl: 'https://images.unsplash.com/photo-1597876121489-2e0c07bebd49?w=800',
      attributes: {
        'Wine Type': 'Shiraz',
        'Region': 'Barossa Valley, Australia',
        'Alcohol Content': '14.8%',
        'Body': 'Full Body',
        'Vintage': '2018',
        'Aging': '20 months in American oak',
      },
    },

    // WHITE WINES
    {
      name: 'Sonoma Chardonnay Reserve 2021',
      description: 'Elegant California Chardonnay with balanced oak influence. Flavors of ripe apple, pear, vanilla, and butter. Creamy texture with bright acidity. Perfect with seafood, chicken, and creamy pasta.',
      countryId: usCountry?.id,
      category: whiteWine.id,
      price: 5500,
      compareAtPrice: 6500,
      sku: 'WINE-WHITE-CHA-001',
      stock: 110,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=800',
      attributes: {
        'Wine Type': 'Chardonnay',
        'Region': 'Sonoma County, California',
        'Alcohol Content': '13.8%',
        'Body': 'Medium Body',
        'Vintage': '2021',
        'Aging': 'Partial oak fermentation',
      },
    },
    {
      name: 'Marlborough Sauvignon Blanc 2022',
      description: 'Vibrant New Zealand Sauvignon Blanc bursting with tropical fruit. Passion fruit, grapefruit, and fresh herbs. Crisp and refreshing with zesty acidity. The perfect summer wine.',
      countryId: nzCountry?.id,
      category: whiteWine.id,
      price: 4200,
      compareAtPrice: 4800,
      sku: 'WINE-WHITE-SAU-001',
      stock: 135,
      imageUrl: 'https://images.unsplash.com/photo-1587233164068-854e78c62b20?w=800',
      attributes: {
        'Wine Type': 'Sauvignon Blanc',
        'Region': 'Marlborough, New Zealand',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Vintage': '2022',
        'Character': 'Crisp and zesty',
      },
    },
    {
      name: 'Alsace Riesling Grand Cru 2020',
      description: 'Exceptional German-style Riesling from Alsace. Beautiful balance of sweetness and acidity. Flavors of peach, apricot, honey, and mineral notes. Age-worthy white wine with elegance.',
      countryId: frCountry?.id,
      category: whiteWine.id,
      price: 6200,
      compareAtPrice: 7200,
      sku: 'WINE-WHITE-RIE-001',
      stock: 55,
      imageUrl: 'https://images.unsplash.com/photo-1596230040045-ee6b8e8a5320?w=800',
      attributes: {
        'Wine Type': 'Riesling',
        'Region': 'Alsace, France',
        'Alcohol Content': '12%',
        'Body': 'Medium Body',
        'Vintage': '2020',
        'Classification': 'Grand Cru',
      },
    },
    {
      name: 'Friuli Pinot Grigio DOC 2022',
      description: 'Premium Italian Pinot Grigio with more body and flavor than typical versions. Ripe pear, white peach, and almond notes. Crisp and clean finish. Excellent with seafood and light dishes.',
      countryId: itCountry?.id,
      category: whiteWine.id,
      price: 3800,
      compareAtPrice: 4400,
      sku: 'WINE-WHITE-PIN-001',
      stock: 145,
      imageUrl: 'https://images.unsplash.com/photo-1587396689726-199d2dbeb3c8?w=800',
      attributes: {
        'Wine Type': 'Pinot Grigio',
        'Region': 'Friuli, Italy',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Vintage': '2022',
        'Certification': 'DOC',
      },
    },

    // SPARKLING WINES
    {
      name: 'Moët & Chandon Impérial Brut NV',
      description: 'The world\'s most loved champagne. Vibrant, generous, and alluring with perfect balance of Pinot Noir, Chardonnay, and Pinot Meunier. Fine bubbles with flavors of white fruit, citrus, and brioche.',
      countryId: frCountry?.id,
      category: sparklingWine.id,
      price: 14500,
      compareAtPrice: 17000,
      sku: 'WINE-SPARK-MOE-001',
      stock: 55,
      imageUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800',
      attributes: {
        'Wine Type': 'Champagne',
        'Region': 'Champagne, France',
        'Alcohol Content': '12%',
        'Style': 'Brut',
        'Vintage': 'Non-Vintage',
        'Aging': 'Minimum 30 months',
      },
    },
    {
      name: 'Veuve Clicquot Yellow Label Brut NV',
      description: 'Iconic champagne in the distinctive yellow label. Complex with fine bubbles and perfect balance. Notes of fruit, brioche, and vanilla. Ideal for celebrations and special occasions.',
      countryId: frCountry?.id,
      category: sparklingWine.id,
      price: 16500,
      compareAtPrice: 19000,
      sku: 'WINE-SPARK-VEU-001',
      stock: 42,
      imageUrl: 'https://images.unsplash.com/photo-1560148823-8f8a42b3f6b4?w=800',
      attributes: {
        'Wine Type': 'Champagne',
        'Region': 'Champagne, France',
        'Alcohol Content': '12%',
        'Style': 'Brut',
        'Vintage': 'Non-Vintage',
        'House': 'Since 1772',
      },
    },
    {
      name: 'Prosecco Superiore DOCG Extra Dry',
      description: 'Premium Italian Prosecco from the heart of the region. Delicate bubbles with notes of white peach, pear, and honeysuckle. Fresh and fruity with floral aromatics. Perfect for aperitifs.',
      countryId: itCountry?.id,
      category: sparklingWine.id,
      price: 3200,
      compareAtPrice: 3800,
      sku: 'WINE-SPARK-PRO-001',
      stock: 160,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=800',
      attributes: {
        'Wine Type': 'Prosecco',
        'Region': 'Valdobbiadene, Italy',
        'Alcohol Content': '11%',
        'Style': 'Extra Dry',
        'Vintage': 'NV',
        'Certification': 'DOCG Superiore',
      },
    },
    {
      name: 'Cava Brut Reserva Catalunya',
      description: 'Traditional method Spanish sparkling wine. Fine persistent bubbles with citrus, apple, and toasted almond notes. Excellent quality at great value. A wonderful Champagne alternative.',
      countryId: esCountry?.id,
      category: sparklingWine.id,
      price: 2800,
      compareAtPrice: 3300,
      sku: 'WINE-SPARK-CAV-001',
      stock: 125,
      imageUrl: 'https://images.unsplash.com/photo-1587396689726-199d2dbeb3c8?w=800',
      attributes: {
        'Wine Type': 'Cava',
        'Region': 'Catalonia, Spain',
        'Alcohol Content': '11.5%',
        'Style': 'Brut Reserva',
        'Vintage': 'NV',
        'Aging': 'Minimum 15 months',
      },
    },

    // ROSÉ WINES
    {
      name: 'Provence Rosé Côtes de Provence AOC',
      description: 'Elegant pale pink rosé from the heart of Provence. Delicate flavors of strawberry, watermelon, and citrus. Crisp, refreshing, and food-friendly. The quintessential summer wine.',
      countryId: frCountry?.id,
      category: roseWine.id,
      price: 4800,
      compareAtPrice: 5500,
      sku: 'WINE-ROSE-PRO-001',
      stock: 105,
      imageUrl: 'https://images.unsplash.com/photo-1588852845002-c0b05fca2468?w=800',
      attributes: {
        'Wine Type': 'Rosé',
        'Region': 'Provence, France',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Vintage': '2022',
        'Certification': 'AOC',
      },
    },
    {
      name: 'Whispering Angel Rosé 2022',
      description: 'The world-famous pale rosé from Château d\'Esclans. Delicate and refreshing with red berry and citrus notes. Elegant, sophisticated, and versatile. A cult favorite globally.',
      countryId: frCountry?.id,
      category: roseWine.id,
      price: 6800,
      compareAtPrice: 7800,
      sku: 'WINE-ROSE-WHI-001',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1596230040045-ee6b8e8a5320?w=800',
      attributes: {
        'Wine Type': 'Rosé',
        'Region': 'Provence, France',
        'Alcohol Content': '13%',
        'Body': 'Light Body',
        'Vintage': '2022',
        'Producer': 'Château d\'Esclans',
      },
    },
  ];

  const spiritProducts = [
    // WHISKEY
    {
      name: 'Johnnie Walker Black Label 12 Year',
      description: 'Iconic blended Scotch whisky with rich, complex flavors. Smooth with notes of vanilla, dried fruit, and smoke. Perfect for sipping neat or in classic cocktails. A staple in any bar.',
      countryId: allCountries.find(c => c.code === 'GB')?.id,
      category: whiskey.id,
      price: 5500,
      compareAtPrice: 6300,
      sku: 'SPIRIT-WHIS-JOH-001',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1527281400072-a0f6aa6696e5?w=800',
      attributes: {
        'Spirit Type': 'Blended Scotch Whisky',
        'Origin': 'Scotland',
        'Alcohol Content': '40%',
        'Age': '12 Years',
        'Volume': '750ml',
      },
    },
    {
      name: 'Jack Daniel\'s Old No. 7 Tennessee Whiskey',
      description: 'America\'s best-selling whiskey. Smooth and mellow with notes of caramel, vanilla, and toasted oak. Charcoal mellowed for exceptional smoothness. Great for cocktails or on the rocks.',
      countryId: usCountry?.id,
      category: whiskey.id,
      price: 4800,
      compareAtPrice: 5500,
      sku: 'SPIRIT-WHIS-JAC-001',
      stock: 140,
      imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800',
      attributes: {
        'Spirit Type': 'Tennessee Whiskey',
        'Origin': 'USA',
        'Alcohol Content': '40%',
        'Volume': '750ml',
        'Process': 'Charcoal mellowed',
      },
    },
    {
      name: 'Glenfiddich 12 Year Single Malt Scotch',
      description: 'Classic Speyside single malt whisky. Light and fruity with notes of pear, apple, and oak. Smooth and approachable. Perfect introduction to single malt Scotch.',
      countryId: allCountries.find(c => c.code === 'GB')?.id,
      category: whiskey.id,
      price: 7200,
      compareAtPrice: 8500,
      sku: 'SPIRIT-WHIS-GLE-001',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800',
      attributes: {
        'Spirit Type': 'Single Malt Scotch',
        'Origin': 'Speyside, Scotland',
        'Alcohol Content': '40%',
        'Age': '12 Years',
        'Volume': '750ml',
      },
    },
    {
      name: 'Jameson Irish Whiskey',
      description: 'Triple-distilled Irish whiskey with smooth, balanced character. Notes of vanilla, nuts, and sherry. Versatile for mixing or enjoying neat. Ireland\'s most popular whiskey.',
      countryId: allCountries.find(c => c.code === 'IE')?.id,
      category: whiskey.id,
      price: 4200,
      compareAtPrice: 4800,
      sku: 'SPIRIT-WHIS-JAM-001',
      stock: 125,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=800',
      attributes: {
        'Spirit Type': 'Irish Whiskey',
        'Origin': 'Ireland',
        'Alcohol Content': '40%',
        'Volume': '750ml',
        'Distillation': 'Triple distilled',
      },
    },

    // VODKA
    {
      name: 'Grey Goose Vodka',
      description: 'Ultra-premium French vodka made from French wheat and spring water. Exceptionally smooth with a clean finish. The standard for luxury vodka. Perfect for martinis.',
      countryId: frCountry?.id,
      category: vodka.id,
      price: 6800,
      compareAtPrice: 7800,
      sku: 'SPIRIT-VOD-GRE-001',
      stock: 85,
      imageUrl: 'https://images.unsplash.com/photo-1556933279-0f8b8d69a38c?w=800',
      attributes: {
        'Spirit Type': 'Premium Vodka',
        'Origin': 'France',
        'Alcohol Content': '40%',
        'Volume': '750ml',
        'Distillation': 'Single origin wheat',
      },
    },
    {
      name: 'Absolut Vodka Original',
      description: 'Premium Swedish vodka made from winter wheat. Clean, pure taste with subtle grain character. Ideal for mixing in any cocktail. One of the world\'s best-selling vodkas.',
      countryId: allCountries.find(c => c.code === 'SE')?.id,
      category: vodka.id,
      price: 3500,
      compareAtPrice: 4000,
      sku: 'SPIRIT-VOD-ABS-001',
      stock: 165,
      imageUrl: 'https://images.unsplash.com/photo-1615332579937-4e3a4b5b6c7f?w=800',
      attributes: {
        'Spirit Type': 'Vodka',
        'Origin': 'Sweden',
        'Alcohol Content': '40%',
        'Volume': '750ml',
        'Made From': 'Winter wheat',
      },
    },

    // RUM
    {
      name: 'Havana Club 7 Year Añejo Rum',
      description: 'Premium Cuban-style rum aged for 7 years. Rich and complex with notes of vanilla, tobacco, oak, and dried fruit. Smooth enough for sipping neat. Excellent in classic rum cocktails.',
      countryId: allCountries.find(c => c.code === 'CU')?.id || usCountry?.id,
      category: rum.id,
      price: 5200,
      compareAtPrice: 6000,
      sku: 'SPIRIT-RUM-HAV-001',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1625822123717-156315bfb3b5?w=800',
      attributes: {
        'Spirit Type': 'Aged Rum',
        'Origin': 'Cuba',
        'Alcohol Content': '40%',
        'Age': '7 Years',
        'Volume': '750ml',
      },
    },
    {
      name: 'Captain Morgan Spiced Rum',
      description: 'Caribbean rum blended with spices and natural flavors. Notes of vanilla, caramel, cinnamon, and clove. Smooth and easy-drinking. Popular for mixing.',
      countryId: allCountries.find(c => c.code === 'JM')?.id || usCountry?.id,
      category: rum.id,
      price: 3800,
      compareAtPrice: 4400,
      sku: 'SPIRIT-RUM-CAP-001',
      stock: 145,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=800',
      attributes: {
        'Spirit Type': 'Spiced Rum',
        'Origin': 'Jamaica',
        'Alcohol Content': '35%',
        'Volume': '750ml',
        'Character': 'Spiced',
      },
    },

    // GIN
    {
      name: 'Hendrick\'s Gin',
      description: 'Unique Scottish gin infused with cucumber and rose petals. Smooth and floral with complex botanicals. Perfect for sophisticated cocktails. A modern gin classic.',
      countryId: allCountries.find(c => c.code === 'GB')?.id,
      category: gin.id,
      price: 6200,
      compareAtPrice: 7200,
      sku: 'SPIRIT-GIN-HEN-001',
      stock: 82,
      imageUrl: 'https://images.unsplash.com/photo-1602848623226-24e1fd4b99c4?w=800',
      attributes: {
        'Spirit Type': 'Scottish Gin',
        'Origin': 'Scotland',
        'Alcohol Content': '41.4%',
        'Botanicals': '11',
        'Volume': '750ml',
      },
    },
    {
      name: 'Bombay Sapphire Gin',
      description: 'Premium London Dry Gin with 10 hand-selected botanicals. Smooth and balanced with citrus and juniper notes. Iconic blue bottle. Perfect for gin and tonic.',
      countryId: allCountries.find(c => c.code === 'GB')?.id,
      category: gin.id,
      price: 4500,
      compareAtPrice: 5200,
      sku: 'SPIRIT-GIN-BOM-001',
      stock: 110,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=800',
      attributes: {
        'Spirit Type': 'London Dry Gin',
        'Origin': 'England',
        'Alcohol Content': '40%',
        'Botanicals': '10',
        'Volume': '750ml',
      },
    },

    // TEQUILA
    {
      name: 'Patrón Silver Tequila',
      description: 'Premium 100% blue agave tequila. Crystal clear with fresh agave aroma. Smooth and clean with citrus and pepper notes. Perfect for margaritas or sipping.',
      countryId: allCountries.find(c => c.code === 'MX')?.id || usCountry?.id,
      category: tequila.id,
      price: 7500,
      compareAtPrice: 8800,
      sku: 'SPIRIT-TEQ-PAT-001',
      stock: 68,
      imageUrl: 'https://images.unsplash.com/photo-1593096077914-0b453e5d2914?w=800',
      attributes: {
        'Spirit Type': '100% Agave Tequila',
        'Origin': 'Jalisco, Mexico',
        'Alcohol Content': '40%',
        'Type': 'Silver/Blanco',
        'Volume': '750ml',
      },
    },

    // COGNAC
    {
      name: 'Hennessy VS Cognac',
      description: 'Classic French cognac with bold, balanced character. Notes of oak, vanilla, and fruit. Smooth and warming. Perfect after-dinner drink or in premium cocktails.',
      countryId: frCountry?.id,
      category: cognac.id,
      price: 8200,
      compareAtPrice: 9500,
      sku: 'SPIRIT-COG-HEN-001',
      stock: 55,
      imageUrl: 'https://images.unsplash.com/photo-1617863891824-28fa5c90ffc2?w=800',
      attributes: {
        'Spirit Type': 'Cognac',
        'Origin': 'Cognac, France',
        'Alcohol Content': '40%',
        'Grade': 'VS (Very Special)',
        'Volume': '750ml',
      },
    },
  ];

  const beerProducts = [
    {
      name: 'Tiger Beer Premium Lager',
      description: 'Award-winning Asian lager with smooth, balanced taste. Crisp and refreshing with clean finish. Perfect for meals and celebrations. Singapore\'s iconic beer.',
      countryId: allCountries.find(c => c.code === 'SG')?.id || usCountry?.id,
      category: lager.id,
      price: 320,
      compareAtPrice: 380,
      sku: 'BEER-LAG-TIG-001',
      stock: 600,
      imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800',
      attributes: {
        'Beer Type': 'Lager',
        'Origin': 'Singapore',
        'Alcohol Content': '5%',
        'IBU': '20',
        'Volume': '330ml',
      },
    },
    {
      name: 'Heineken Premium Lager',
      description: 'World-famous Dutch lager with distinctive taste. Crisp, refreshing, with slightly bitter finish. Green bottle is iconic. The world\'s most international beer brand.',
      countryId: allCountries.find(c => c.code === 'NL')?.id || usCountry?.id,
      category: lager.id,
      price: 380,
      compareAtPrice: 450,
      sku: 'BEER-LAG-HEI-001',
      stock: 550,
      imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800',
      attributes: {
        'Beer Type': 'European Lager',
        'Origin': 'Netherlands',
        'Alcohol Content': '5%',
        'IBU': '23',
        'Volume': '330ml',
      },
    },
    {
      name: 'Stella Artois Belgian Lager',
      description: 'Premium Belgian lager with 600+ years of brewing heritage. Crisp and refreshing with subtle hop bitterness. Clean finish. Pairs excellently with food.',
      countryId: allCountries.find(c => c.code === 'BE')?.id || usCountry?.id,
      category: lager.id,
      price: 420,
      compareAtPrice: 490,
      sku: 'BEER-LAG-STE-001',
      stock: 480,
      imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800',
      attributes: {
        'Beer Type': 'Belgian Lager',
        'Origin': 'Belgium',
        'Alcohol Content': '5.2%',
        'IBU': '24',
        'Volume': '330ml',
      },
    },
    {
      name: 'Corona Extra Mexican Lager',
      description: 'Iconic Mexican beer with light, crisp taste. Refreshing with subtle fruit notes. Best served with lime. Perfect beach and summer beer.',
      countryId: allCountries.find(c => c.code === 'MX')?.id || usCountry?.id,
      category: lager.id,
      price: 350,
      compareAtPrice: 410,
      sku: 'BEER-LAG-COR-001',
      stock: 650,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=800',
      attributes: {
        'Beer Type': 'Mexican Lager',
        'Origin': 'Mexico',
        'Alcohol Content': '4.6%',
        'IBU': '18',
        'Volume': '355ml',
      },
    },
    {
      name: 'Sierra Nevada Pale Ale',
      description: 'Iconic American craft beer that started the revolution. Citrusy and piney with perfect hop balance. Bold and flavorful. A must-try for craft beer lovers.',
      countryId: usCountry?.id,
      category: craftBeer.id,
      price: 520,
      compareAtPrice: 600,
      sku: 'BEER-CRAFT-SIE-001',
      stock: 280,
      imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800',
      attributes: {
        'Beer Type': 'American Pale Ale',
        'Origin': 'California, USA',
        'Alcohol Content': '5.6%',
        'IBU': '38',
        'Volume': '355ml',
      },
    },
    {
      name: 'Goose Island IPA',
      description: 'Award-winning American IPA with citrus and tropical fruit notes. Balanced bitterness with clean finish. One of the most popular craft IPAs in the world.',
      countryId: usCountry?.id,
      category: craftBeer.id,
      price: 580,
      compareAtPrice: 670,
      sku: 'BEER-CRAFT-GOO-001',
      stock: 240,
      imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800',
      attributes: {
        'Beer Type': 'India Pale Ale',
        'Origin': 'Chicago, USA',
        'Alcohol Content': '5.9%',
        'IBU': '55',
        'Volume': '355ml',
      },
    },
    {
      name: 'Guinness Draught Stout',
      description: 'Ireland\'s legendary stout with creamy head and smooth texture. Rich with notes of coffee and chocolate. Iconic dark beer recognized worldwide.',
      countryId: allCountries.find(c => c.code === 'IE')?.id,
      category: stout.id,
      price: 480,
      compareAtPrice: 560,
      sku: 'BEER-STOUT-GUI-001',
      stock: 420,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=800',
      attributes: {
        'Beer Type': 'Irish Stout',
        'Origin': 'Ireland',
        'Alcohol Content': '4.2%',
        'IBU': '45',
        'Volume': '440ml',
      },
    },
    {
      name: 'Newcastle Brown Ale',
      description: 'Classic English brown ale with smooth, malty character. Notes of caramel and nuts. Easy-drinking with balanced flavor. A British pub favorite.',
      countryId: allCountries.find(c => c.code === 'GB')?.id,
      category: ale.id,
      price: 420,
      compareAtPrice: 490,
      sku: 'BEER-ALE-NEW-001',
      stock: 320,
      imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800',
      attributes: {
        'Beer Type': 'Brown Ale',
        'Origin': 'England',
        'Alcohol Content': '4.7%',
        'IBU': '25',
        'Volume': '330ml',
      },
    },
  ];

  const accessoryProducts = [
    {
      name: 'Riedel Vinum Cabernet/Merlot Wine Glasses (Set of 2)',
      description: 'Professional wine glasses designed specifically for Cabernet and Merlot. Crystal glass with elegant shape that enhances aroma and flavor. Dishwasher safe. Essential for red wine lovers.',
      countryId: allCountries.find(c => c.code === 'AT')?.id || usCountry?.id,
      category: glassware.id,
      price: 4800,
      compareAtPrice: 5800,
      sku: 'ACC-GLASS-RIE-001',
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=800',
      attributes: {
        'Product Type': 'Wine Glasses',
        'Material': 'Crystal Glass',
        'Set Size': '2 glasses',
        'Capacity': '610ml',
        'Dishwasher Safe': 'Yes',
      },
    },
    {
      name: 'Waiter\'s Corkscrew Professional Grade',
      description: 'Professional double-hinged corkscrew used by sommeliers worldwide. Stainless steel with ergonomic design. Includes foil cutter and bottle opener. Makes opening wine effortless.',
      countryId: usCountry?.id,
      category: openers.id,
      price: 1200,
      compareAtPrice: 1500,
      sku: 'ACC-OPEN-WAI-001',
      stock: 125,
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
      attributes: {
        'Product Type': 'Corkscrew',
        'Material': 'Stainless Steel',
        'Type': 'Double-hinged',
        'Features': 'Foil cutter, bottle opener',
        'Professional Grade': 'Yes',
      },
    },
    {
      name: 'Wine Aerator and Decanter Set',
      description: 'Premium wine aerator that enhances flavor instantly. Pour wine through aerator to expose it to oxygen, softening tannins and releasing aromas. Includes elegant stand.',
      countryId: usCountry?.id,
      category: openers.id,
      price: 2800,
      compareAtPrice: 3500,
      sku: 'ACC-AERA-WIN-001',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=800',
      attributes: {
        'Product Type': 'Wine Aerator',
        'Material': 'Acrylic',
        'Includes': 'Stand and filter',
        'Effect': 'Instant aeration',
        'Easy Clean': 'Yes',
      },
    },
  ];

  // Create all products
  const allProducts = [...wineProducts, ...spiritProducts, ...beerProducts, ...accessoryProducts];
  const createdProducts: any[] = [];

  for (const prod of allProducts) {
    const product = await prisma.product.create({
      data: {
        name: prod.name,
        description: prod.description,
        seoTitle: prod.name,
        seoDescription: prod.description?.substring(0, 160),
        seoSlug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        countryId: prod.countryId,
        isActive: true,
        productCategories: {
          create: { categoryId: prod.category },
        },
        productImages: {
          create: [
            { imageUrl: prod.imageUrl, altText: prod.name, position: 1, isMain: true },
          ],
        },
        productAttributes: {
          create: Object.entries(prod.attributes).map(([name, value]) => ({ name, value: String(value) })),
        },
      },
    });
    createdProducts.push({ ...product, ...prod });
  }

  console.log(`✅ Created ${allProducts.length} products (${wineProducts.length} wines, ${spiritProducts.length} spirits, ${beerProducts.length} beers, ${accessoryProducts.length} accessories)\n`);

  // ============================================
  // STEP 9: PRODUCT OPTIONS & VARIANTS
  // ============================================
  console.log('📦 Step 9: Creating Product Options and Multiple Variants...');

  // Add bottle size options to wine and spirit products
  for (const prod of createdProducts.slice(0, 25)) { // First 25 products get multiple variants
    const product = await prisma.product.findUnique({ where: { id: prod.id } });
    if (!product) continue;

    // Create bottle size option
    const sizeOption = await prisma.productOption.create({
      data: {
        productId: prod.id,
        name: 'Bottle Size',
        position: 1,
      },
    });

    const size750 = await prisma.optionValue.create({
      data: { optionId: sizeOption.id, value: '750ml', position: 1 },
    });

    const size1500 = await prisma.optionValue.create({
      data: { optionId: sizeOption.id, value: '1.5L Magnum', position: 2 },
    });

    const size375 = await prisma.optionValue.create({
      data: { optionId: sizeOption.id, value: '375ml Half', position: 3 },
    });

    // Create variants for each size
    const variant750 = await prisma.variant.create({
      data: {
        productId: prod.id,
        sku: `${prod.sku}-750`,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        currency: 'KES',
        barcode: `BRC${Math.random().toString().substring(2, 15)}`,
        weight: 0.75,
        isActive: true,
        variantOptionValues: {
          create: {
            optionId: sizeOption.id,
            optionValueId: size750.id,
          },
        },
        variantInventories: {
          create: {
            locationId: location.id,
            quantity: prod.stock,
            reserved: 0,
          },
        },
      },
    });

    const variant1500 = await prisma.variant.create({
      data: {
        productId: prod.id,
        sku: `${prod.sku}-1500`,
        price: prod.price * 1.8, // Magnum is 1.8x price
        compareAtPrice: prod.compareAtPrice ? prod.compareAtPrice * 1.8 : null,
        currency: 'KES',
        barcode: `BRC${Math.random().toString().substring(2, 15)}`,
        weight: 1.5,
        isActive: true,
        variantOptionValues: {
          create: {
            optionId: sizeOption.id,
            optionValueId: size1500.id,
          },
        },
        variantInventories: {
          create: {
            locationId: location.id,
            quantity: Math.floor(prod.stock / 3),
            reserved: 0,
          },
        },
      },
    });

    const variant375 = await prisma.variant.create({
      data: {
        productId: prod.id,
        sku: `${prod.sku}-375`,
        price: prod.price * 0.6, // Half bottle is 0.6x price
        compareAtPrice: prod.compareAtPrice ? prod.compareAtPrice * 0.6 : null,
        currency: 'KES',
        barcode: `BRC${Math.random().toString().substring(2, 15)}`,
        weight: 0.375,
        isActive: true,
        variantOptionValues: {
          create: {
            optionId: sizeOption.id,
            optionValueId: size375.id,
          },
        },
        variantInventories: {
          create: {
            locationId: location.id,
            quantity: Math.floor(prod.stock / 2),
            reserved: 0,
          },
        },
      },
    });
  }

  // Simple single variant for remaining products
  for (const prod of createdProducts.slice(25)) {
    await prisma.variant.create({
      data: {
        productId: prod.id,
        sku: prod.sku,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        currency: 'KES',
        barcode: `BRC${Math.random().toString().substring(2, 15)}`,
        weight: prod.category === lager.id || prod.category === craftBeer.id ? 0.33 : 0.75,
        isActive: true,
        variantInventories: {
          create: {
            locationId: location.id,
            quantity: prod.stock,
            reserved: 0,
          },
        },
      },
    });
  }

  const allVariants = await prisma.variant.findMany();
  console.log(`✅ Created ${allVariants.length} product variants\n`);

  // ============================================
  // STEP 10: BUNDLES (Gift Sets)
  // ============================================
  console.log('🎁 Step 10: Creating Product Bundles...');

  const bundle1 = await prisma.bundle.create({
    data: {
      name: 'Premium Red Wine Tasting Set',
      description: 'Curated selection of 3 premium red wines from different regions. Perfect for wine tasting at home or as a gift.',
      price: 18500,
      isActive: true,
    },
  });

  const redWineVariants = allVariants.filter(v =>
    createdProducts.find(p => p.id === v.productId && [redWine.id].includes(p.category))
  ).slice(0, 3);

  for (const variant of redWineVariants) {
    await prisma.bundleItem.create({
      data: {
        bundleId: bundle1.id,
        variantId: variant.id,
        quantity: 1,
      },
    });
  }

  const bundle2 = await prisma.bundle.create({
    data: {
      name: 'Spirits Sampler Collection',
      description: 'Premium spirits collection featuring whiskey, vodka, and gin. Perfect for cocktail enthusiasts or as a luxury gift.',
      price: 16800,
      isActive: true,
    },
  });

  const spiritVariants = allVariants.filter(v =>
    createdProducts.find(p => p.id === v.productId && [whiskey.id, vodka.id, gin.id].includes(p.category))
  ).slice(0, 3);

  for (const variant of spiritVariants) {
    await prisma.bundleItem.create({
      data: {
        bundleId: bundle2.id,
        variantId: variant.id,
        quantity: 1,
      },
    });
  }

  const bundle3 = await prisma.bundle.create({
    data: {
      name: 'Craft Beer Discovery Pack (6-pack)',
      description: 'Assortment of 6 premium craft beers from around the world. Great for beer lovers who want to explore different styles.',
      price: 2800,
      isActive: true,
    },
  });

  const beerVariants = allVariants.filter(v =>
    createdProducts.find(p => p.id === v.productId && [craftBeer.id, ale.id].includes(p.category))
  ).slice(0, 2);

  for (const variant of beerVariants) {
    await prisma.bundleItem.create({
      data: {
        bundleId: bundle3.id,
        variantId: variant.id,
        quantity: 3,
      },
    });
  }

  console.log(`✅ Created 3 product bundles\n`);

  // ============================================
  // STEP 11: COUPONS & PROMOTIONS
  // ============================================
  console.log('🎟️ Step 11: Creating Coupons & Promotions...');

  const coupon1 = await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      discountType: DiscountType.percentage,
      discountAmount: 10,
      minOrderAmount: 3000,
      maxUses: 1000,
      maxUsesPerUser: 1,
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    },
  });

  const coupon2 = await prisma.coupon.create({
    data: {
      code: 'FREESHIP',
      discountType: DiscountType.shipping,
      discountAmount: 300,
      minOrderAmount: 5000,
      maxUses: null,
      maxUsesPerUser: null,
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    },
  });

  const coupon3 = await prisma.coupon.create({
    data: {
      code: 'WINE20',
      discountType: DiscountType.percentage,
      discountAmount: 20,
      minOrderAmount: 8000,
      maxUses: null,
      maxUsesPerUser: 3,
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
    },
  });

  // Attach WINE20 to wine categories
  await prisma.couponCategory.createMany({
    data: [
      { couponId: coupon3.id, categoryId: redWine.id },
      { couponId: coupon3.id, categoryId: whiteWine.id },
      { couponId: coupon3.id, categoryId: sparklingWine.id },
      { couponId: coupon3.id, categoryId: roseWine.id },
    ],
  });

  const coupon4 = await prisma.coupon.create({
    data: {
      code: 'SAVE500',
      discountType: DiscountType.fixed,
      discountAmount: 500,
      minOrderAmount: 10000,
      maxUses: 500,
      maxUsesPerUser: 2,
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    },
  });

  // Assign coupons to some users
  await prisma.couponUser.createMany({
    data: [
      { couponId: coupon1.id, userId: customers[0].id },
      { couponId: coupon1.id, userId: customers[1].id },
      { couponId: coupon3.id, userId: customers[2].id },
    ],
  });

  console.log(`✅ Created 4 promotional coupons\n`);

  // Continue in next part due to length...
  console.log('✅ Step 11 completed - Coupons created\n');

  // ============================================
  // STEP 12: USER ADDRESSES
  // ============================================
  console.log('📍 Step 12: Creating User Addresses...');

  const addressData = [
    {
      userId: customers[0].id,
      label: 'Home',
      firstName: 'James',
      lastName: 'Towell',
      phone: '+254712345678',
      addressLine1: 'Riverside Drive, Apartment 12B',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
    {
      userId: customers[1].id,
      label: 'Home',
      firstName: 'Anita',
      lastName: 'Oramo',
      phone: '+254723456789',
      addressLine1: 'Karen Road, Villa 45',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
    {
      userId: customers[1].id,
      label: 'Office',
      firstName: 'Anita',
      lastName: 'Oramo',
      phone: '+254723456789',
      addressLine1: 'Westlands, ABC Place, 5th Floor',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
      isDefaultBilling: false,
      isDefaultShipping: false,
    },
    {
      userId: customers[2].id,
      label: 'Home',
      firstName: 'Brian',
      lastName: 'Mondale',
      phone: '+254734567890',
      addressLine1: 'Kilimani, Argwings Kodhek Road',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
    {
      userId: customers[3].id,
      label: 'Home',
      firstName: 'John',
      lastName: 'Adamu',
      phone: '+254745678901',
      addressLine1: 'Lavington, James Gichuru Road',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
    {
      userId: customers[4].id,
      label: 'Home',
      firstName: 'Peter',
      lastName: 'Wantuchi',
      phone: '+254756789012',
      addressLine1: 'Runda Estate, House Number 23',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
      isDefaultBilling: true,
      isDefaultShipping: true,
    },
  ];

  await prisma.userAddress.createMany({ data: addressData });
  const allAddresses = await prisma.userAddress.findMany();

  console.log(`✅ Created ${allAddresses.length} user addresses\n`);

  // ============================================
  // STEP 13: WISHLISTS
  // ============================================
  console.log('❤️ Step 13: Creating Wishlists...');

  for (const customer of customers.slice(0, 5)) {
    const wishlist = await prisma.wishlist.create({
      data: {
        userId: customer.id,
      },
    });

    // Add 2-4 random variants to wishlist
    const randomVariants = allVariants
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2);

    for (const variant of randomVariants) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          variantId: variant.id,
        },
      });
    }
  }

  console.log(`✅ Created wishlists for 5 customers\n`);

  // ============================================
  // STEP 14: CARTS (Active & Abandoned)
  // ============================================
  console.log('🛒 Step 14: Creating Carts...');

  // Active cart for customer 1
  const cart1 = await prisma.cart.create({
    data: {
      userId: customers[0].id,
      status: CartStatus.active,
      lastActivityAt: new Date(),
    },
  });

  const cartVariants1 = allVariants.slice(5, 8);
  for (const variant of cartVariants1) {
    await prisma.cartItem.create({
      data: {
        cartId: cart1.id,
        variantId: variant.id,
        quantity: Math.floor(Math.random() * 2) + 1,
        unitPrice: variant.price,
        currency: 'KES',
      },
    });
  }

  // Abandoned cart for customer 2
  const cart2 = await prisma.cart.create({
    data: {
      userId: customers[1].id,
      status: CartStatus.abandoned,
      lastActivityAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });

  const cartVariants2 = allVariants.slice(10, 12);
  for (const variant of cartVariants2) {
    await prisma.cartItem.create({
      data: {
        cartId: cart2.id,
        variantId: variant.id,
        quantity: 1,
        unitPrice: variant.price,
        currency: 'KES',
      },
    });
  }

  // Guest cart
  const guestCart = await prisma.cart.create({
    data: {
      sessionId: 'guest-session-' + Math.random().toString(36).substring(7),
      status: CartStatus.active,
      lastActivityAt: new Date(),
    },
  });

  await prisma.cartItem.create({
    data: {
      cartId: guestCart.id,
      variantId: allVariants[0].id,
      quantity: 2,
      unitPrice: allVariants[0].price,
      currency: 'KES',
    },
  });

  console.log(`✅ Created 3 carts (2 user carts, 1 guest cart)\n`);

  // ============================================
  // STEP 15: ORDERS WITH FULL WORKFLOW
  // ============================================
  console.log('📦 Step 15: Creating Sample Orders...');

  const standardShipping = allShippingMethods.find(m => m.code === 'FLAT_RATE');
  const freeShipping = allShippingMethods.find(m => m.code === 'FREE_DELIVERY');
  const expressShipping = allShippingMethods.find(m => m.code === 'EXPRESS');

  // ORDER 1 - Completed order
  const order1Variants = allVariants.slice(0, 3);
  const order1Subtotal = order1Variants.reduce((sum, v) => sum + v.price * 1, 0);
  const order1Total = order1Subtotal + (standardShipping?.baseRate || 0);

  const order1 = await prisma.order.create({
    data: {
      userId: customers[0].id,
      externalRef: 'ORD-' + Date.now(),
      currentStatus: OrderStatus.delivered,
      subtotalAmount: order1Subtotal,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: standardShipping?.baseRate || 0,
      totalAmount: order1Total,
      currency: 'KES',
      shippingMethodId: standardShipping?.id,
      placedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    },
  });

  // Create order addresses
  const userAddress1 = allAddresses.find(a => a.userId === customers[0].id && a.isDefaultShipping);
  if (userAddress1) {
    const orderAddress1 = await prisma.orderAddress.create({
      data: {
        orderId: order1.id,
        type: 'shipping',
        sourceUserAddressId: userAddress1.id,
        firstName: userAddress1.firstName,
        lastName: userAddress1.lastName,
        phone: userAddress1.phone || '',
        addressLine1: userAddress1.addressLine1,
        addressLine2: userAddress1.addressLine2,
        city: userAddress1.city,
        state: userAddress1.state,
        postalCode: userAddress1.postalCode,
        country: userAddress1.country,
      },
    });

    await prisma.order.update({
      where: { id: order1.id },
      data: {
        shippingAddressId: orderAddress1.id,
        billingAddressId: orderAddress1.id,
      },
    });
  }

  // Create order items
  const order1Items: any[] = [];
  for (const variant of order1Variants) {
    const quantity = 1;
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        variantId: variant.id,
        quantity,
        unitPrice: variant.price,
        discountAmount: 0,
        taxAmount: 0,
        lineTotal: variant.price * quantity,
        currency: 'KES',
        productNameSnapshot: createdProducts.find(p => p.id === variant.productId)?.name,
        variantSkuSnapshot: variant.sku,
      },
    });
    order1Items.push(orderItem);
  }

  // Create payment for order 1
  const payment1 = await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: order1Total,
      status: PaymentStatus.captured,
      gateway: 'pesapal',
      provider: 'mpesa',
      transactionId: 'TXN-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  });

  await prisma.transactionLog.create({
    data: {
      paymentId: payment1.id,
      eventType: 'payment_captured',
      amount: order1Total,
      status: 'success',
      payload: JSON.stringify({ orderId: order1.id, method: 'mpesa' }),
    },
  });

  // Create shipment for order 1
  const shipment1 = await prisma.shipment.create({
    data: {
      orderId: order1.id,
      fromLocationId: location.id,
      carrier: 'DHL Kenya',
      service: 'Standard',
      trackingNumber: 'DHL' + Math.random().toString().substring(2, 15),
      status: ShipmentStatus.delivered,
      shippedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  for (const item of order1Items) {
    await prisma.fulfillmentItem.create({
      data: {
        shipmentId: shipment1.id,
        orderItemId: item.id,
        quantity: item.quantity,
      },
    });
  }

  // Create order status history
  await prisma.orderStatusHistory.createMany({
    data: [
      {
        orderId: order1.id,
        status: 'pending',
        note: 'Order placed by customer',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order1.id,
        status: 'processing',
        note: 'Payment confirmed, preparing order',
        createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order1.id,
        status: 'shipped',
        note: 'Order shipped with tracking number',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order1.id,
        status: 'delivered',
        note: 'Order successfully delivered',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Inventory movements for order 1
  for (const item of order1Items) {
    await prisma.inventoryMovement.create({
      data: {
        variantId: item.variantId!,
        locationId: location.id,
        orderId: order1.id,
        delta: -item.quantity,
        reason: 'sale',
      },
    });
  }

  // ORDER 2 - In transit
  const order2Variants = allVariants.slice(15, 17);
  const order2Subtotal = order2Variants.reduce((sum, v) => sum + v.price * 2, 0);
  const order2Total = order2Subtotal;

  const order2 = await prisma.order.create({
    data: {
      userId: customers[1].id,
      externalRef: 'ORD-' + (Date.now() + 1),
      currentStatus: OrderStatus.shipped,
      subtotalAmount: order2Subtotal,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      totalAmount: order2Total,
      currency: 'KES',
      shippingMethodId: freeShipping?.id,
      placedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const userAddress2 = allAddresses.find(a => a.userId === customers[1].id && a.isDefaultShipping);
  if (userAddress2) {
    const orderAddress2 = await prisma.orderAddress.create({
      data: {
        orderId: order2.id,
        type: 'shipping',
        sourceUserAddressId: userAddress2.id,
        firstName: userAddress2.firstName,
        lastName: userAddress2.lastName,
        phone: userAddress2.phone || '',
        addressLine1: userAddress2.addressLine1,
        addressLine2: userAddress2.addressLine2,
        city: userAddress2.city,
        state: userAddress2.state,
        postalCode: userAddress2.postalCode,
        country: userAddress2.country,
      },
    });

    await prisma.order.update({
      where: { id: order2.id },
      data: {
        shippingAddressId: orderAddress2.id,
        billingAddressId: orderAddress2.id,
      },
    });
  }

  for (const variant of order2Variants) {
    const quantity = 2;
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        variantId: variant.id,
        quantity,
        unitPrice: variant.price,
        discountAmount: 0,
        taxAmount: 0,
        lineTotal: variant.price * quantity,
        currency: 'KES',
        productNameSnapshot: createdProducts.find(p => p.id === variant.productId)?.name,
        variantSkuSnapshot: variant.sku,
      },
    });
  }

  const payment2 = await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: order2Total,
      status: PaymentStatus.captured,
      gateway: 'pesapal',
      provider: 'card',
      transactionId: 'TXN-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  });

  const shipment2 = await prisma.shipment.create({
    data: {
      orderId: order2.id,
      fromLocationId: location.id,
      carrier: 'Sendy Kenya',
      service: 'Express',
      trackingNumber: 'SND' + Math.random().toString().substring(2, 15),
      status: ShipmentStatus.shipped,
      shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      {
        orderId: order2.id,
        status: 'pending',
        note: 'Order placed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order2.id,
        status: 'processing',
        note: 'Payment received',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order2.id,
        status: 'shipped',
        note: 'Out for delivery',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // ORDER 3 - Processing
  const order3Variants = allVariants.slice(20, 22);
  const order3Subtotal = order3Variants.reduce((sum, v) => sum + v.price * 1, 0);
  const order3Discount = order3Subtotal * 0.1; // 10% discount
  const order3Total = order3Subtotal - order3Discount + (expressShipping?.baseRate || 0);

  const order3 = await prisma.order.create({
    data: {
      userId: customers[2].id,
      externalRef: 'ORD-' + (Date.now() + 2),
      currentStatus: OrderStatus.processing,
      subtotalAmount: order3Subtotal,
      discountAmount: order3Discount,
      taxAmount: 0,
      shippingAmount: expressShipping?.baseRate || 0,
      totalAmount: order3Total,
      currency: 'KES',
      shippingMethodId: expressShipping?.id,
      placedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const userAddress3 = allAddresses.find(a => a.userId === customers[2].id);
  if (userAddress3) {
    const orderAddress3 = await prisma.orderAddress.create({
      data: {
        orderId: order3.id,
        type: 'shipping',
        sourceUserAddressId: userAddress3.id,
        firstName: userAddress3.firstName,
        lastName: userAddress3.lastName,
        phone: userAddress3.phone || '',
        addressLine1: userAddress3.addressLine1,
        addressLine2: userAddress3.addressLine2,
        city: userAddress3.city,
        state: userAddress3.state,
        postalCode: userAddress3.postalCode,
        country: userAddress3.country,
      },
    });

    await prisma.order.update({
      where: { id: order3.id },
      data: {
        shippingAddressId: orderAddress3.id,
        billingAddressId: orderAddress3.id,
      },
    });
  }

  for (const variant of order3Variants) {
    await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        variantId: variant.id,
        quantity: 1,
        unitPrice: variant.price,
        discountAmount: variant.price * 0.1,
        taxAmount: 0,
        lineTotal: variant.price * 0.9,
        currency: 'KES',
        productNameSnapshot: createdProducts.find(p => p.id === variant.productId)?.name,
        variantSkuSnapshot: variant.sku,
      },
    });
  }

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      amount: order3Total,
      status: PaymentStatus.captured,
      gateway: 'pesapal',
      provider: 'mpesa',
      transactionId: 'TXN-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  });

  await prisma.couponRedemption.create({
    data: {
      orderId: order3.id,
      couponId: coupon1.id,
      amountApplied: order3Discount,
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      {
        orderId: order3.id,
        status: 'pending',
        note: 'Order received',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order3.id,
        status: 'processing',
        note: 'Preparing order for shipment',
        createdAt: new Date(),
      },
    ],
  });

  // ORDER 4 - Cancelled
  const order4Variants = allVariants.slice(25, 26);
  const order4Subtotal = order4Variants.reduce((sum, v) => sum + v.price * 1, 0);
  const order4Total = order4Subtotal + (standardShipping?.baseRate || 0);

  const order4 = await prisma.order.create({
    data: {
      userId: customers[3].id,
      externalRef: 'ORD-' + (Date.now() + 3),
      currentStatus: OrderStatus.cancelled,
      subtotalAmount: order4Subtotal,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: standardShipping?.baseRate || 0,
      totalAmount: order4Total,
      currency: 'KES',
      shippingMethodId: standardShipping?.id,
      placedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const userAddress4 = allAddresses.find(a => a.userId === customers[3].id);
  if (userAddress4) {
    const orderAddress4 = await prisma.orderAddress.create({
      data: {
        orderId: order4.id,
        type: 'shipping',
        sourceUserAddressId: userAddress4.id,
        firstName: userAddress4.firstName,
        lastName: userAddress4.lastName,
        phone: userAddress4.phone || '',
        addressLine1: userAddress4.addressLine1,
        addressLine2: userAddress4.addressLine2,
        city: userAddress4.city,
        state: userAddress4.state,
        postalCode: userAddress4.postalCode,
        country: userAddress4.country,
      },
    });

    await prisma.order.update({
      where: { id: order4.id },
      data: {
        shippingAddressId: orderAddress4.id,
        billingAddressId: orderAddress4.id,
      },
    });
  }

  for (const variant of order4Variants) {
    await prisma.orderItem.create({
      data: {
        orderId: order4.id,
        variantId: variant.id,
        quantity: 1,
        unitPrice: variant.price,
        discountAmount: 0,
        taxAmount: 0,
        lineTotal: variant.price,
        currency: 'KES',
        productNameSnapshot: createdProducts.find(p => p.id === variant.productId)?.name,
        variantSkuSnapshot: variant.sku,
      },
    });
  }

  await prisma.payment.create({
    data: {
      orderId: order4.id,
      amount: order4Total,
      status: PaymentStatus.voided,
      gateway: 'pesapal',
      provider: 'mpesa',
      transactionId: 'TXN-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      {
        orderId: order4.id,
        status: 'pending',
        note: 'Order created',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order4.id,
        status: 'cancelled',
        note: 'Cancelled by customer - requested wrong item',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log(`✅ Created 4 sample orders (delivered, shipped, processing, cancelled)\n`);

  // ============================================
  // STEP 16: RETURNS & REFUNDS
  // ============================================
  console.log('↩️ Step 16: Creating Return Requests & Refunds...');

  // Create a return request for order 1 (completed order)
  const returnRequest1 = await prisma.returnRequest.create({
    data: {
      orderId: order1.id,
      userId: customers[0].id,
      status: ReturnStatus.approved,
      reason: 'Product damaged during shipping',
      requestedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.returnItem.create({
    data: {
      returnRequestId: returnRequest1.id,
      orderItemId: order1Items[0].id,
      quantity: 1,
      reason: 'Bottle was broken, leaking wine',
      condition: ReturnCondition.damaged,
    },
  });

  // Create refund for the return
  const refundAmount = order1Items[0].lineTotal;
  const refund1 = await prisma.refund.create({
    data: {
      orderId: order1.id,
      paymentId: payment1.id,
      amount: refundAmount,
      currency: 'KES',
      status: RefundStatus.processed,
      reason: 'Product damaged - approved return',
    },
  });

  await prisma.refundItem.create({
    data: {
      refundId: refund1.id,
      orderItemId: order1Items[0].id,
      quantity: 1,
      amount: refundAmount,
    },
  });

  console.log(`✅ Created 1 return request with refund\n`);

  // ============================================
  // STEP 17: PRODUCT REVIEWS
  // ============================================
  console.log('⭐ Step 17: Creating Product Reviews...');

  const reviewsData = [
    {
      userId: customers[0].id,
      productId: createdProducts[0].id,
      orderItemId: order1Items[0].id,
      rating: 5,
      comment: 'Excellent Cabernet! Rich and full-bodied with amazing depth. Perfect with steak. Will definitely buy again!',
      status: 'approved',
    },
    {
      userId: customers[0].id,
      productId: createdProducts[1].id,
      orderItemId: order1Items[1]?.id,
      rating: 4,
      comment: 'Great Bordeaux blend. Complex flavors and elegant finish. A bit pricey but worth it for special occasions.',
      status: 'approved',
    },
    {
      userId: customers[1].id,
      productId: createdProducts[2].id,
      orderItemId: null,
      rating: 5,
      comment: 'Love this Chianti! Perfect acidity and pairs wonderfully with Italian food. Authentic taste.',
      status: 'approved',
    },
    {
      userId: customers[2].id,
      productId: createdProducts[14].id,
      orderItemId: null,
      rating: 5,
      comment: 'Moët never disappoints! Perfect for celebrations. Fine bubbles and elegant taste.',
      status: 'approved',
    },
    {
      userId: customers[3].id,
      productId: createdProducts[20].id,
      orderItemId: null,
      rating: 4,
      comment: 'Smooth whiskey with great flavor profile. Good value for the price.',
      status: 'approved',
    },
  ];

  for (const reviewData of reviewsData) {
    const review = await prisma.review.create({
      data: reviewData,
    });
  }

  console.log(`✅ Created ${reviewsData.length} product reviews\n`);

  // ============================================
  // STEP 18: RECENTLY VIEWED
  // ============================================
  console.log('👀 Step 18: Creating Recently Viewed Products...');

  const recentlyViewedData: any[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      recentlyViewedData.push({
        userId: customers[i].id,
        productId: createdProducts[j * 5].id,
        lastViewedAt: new Date(Date.now() - (j * 2) * 60 * 60 * 1000), // Stagger by hours
      });
    }
  }

  await prisma.recentlyViewed.createMany({
    data: recentlyViewedData,
  });

  console.log(`✅ Created ${recentlyViewedData.length} recently viewed records\n`);

  // ============================================
  // STEP 19: NOTIFICATION TEMPLATES
  // ============================================
  console.log('📧 Step 19: Creating Notification Templates...');

  const notificationTemplates = [
    {
      name: 'Order Placed',
      event: 'order.placed',
      channel: NotificationChannel.email,
      subject: 'Order Confirmation #{{orderNumber}}',
      template: 'Thank you for your order! Your order #{{orderNumber}} has been received and is being processed.',
      isActive: true,
    },
    {
      name: 'Order Shipped',
      event: 'order.shipped',
      channel: NotificationChannel.email,
      subject: 'Your Order Has Shipped! #{{orderNumber}}',
      template: 'Great news! Your order #{{orderNumber}} has been shipped. Tracking number: {{trackingNumber}}',
      isActive: true,
    },
    {
      name: 'Order Delivered',
      event: 'order.delivered',
      channel: NotificationChannel.email,
      subject: 'Order Delivered #{{orderNumber}}',
      template: 'Your order #{{orderNumber}} has been successfully delivered. We hope you enjoy your purchase!',
      isActive: true,
    },
    {
      name: 'Order Shipped SMS',
      event: 'order.shipped',
      channel: NotificationChannel.sms,
      subject: null,
      template: 'Your California Wines By Rose order #{{orderNumber}} has shipped! Track: {{trackingNumber}}',
      isActive: true,
    },
    {
      name: 'Welcome Email',
      event: 'user.registered',
      channel: NotificationChannel.email,
      subject: 'Welcome to California Wines By Rose!',
      template: 'Welcome {{firstName}}! Thank you for joining California Wines By Rose. Use code WELCOME10 for 10% off your first order!',
      isActive: true,
    },
  ];

  await prisma.notificationTemplate.createMany({
    data: notificationTemplates,
  });

  console.log(`✅ Created ${notificationTemplates.length} notification templates\n`);

  // ============================================
  // STEP 20: NOTIFICATIONS
  // ============================================
  console.log('🔔 Step 20: Creating Sample Notifications...');

  const notifications = [
    {
      userId: customers[0].id,
      event: 'order.placed',
      channel: NotificationChannel.email,
      title: 'Order Confirmation',
      message: `Thank you for your order! Your order #${order1.externalRef} has been received and is being processed.`,
      status: 'sent',
      sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      userId: customers[0].id,
      event: 'order.shipped',
      channel: NotificationChannel.email,
      title: 'Order Shipped',
      message: `Your order #${order1.externalRef} has been shipped with tracking number ${shipment1.trackingNumber}`,
      status: 'sent',
      sentAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    },
    {
      userId: customers[1].id,
      event: 'order.placed',
      channel: NotificationChannel.email,
      title: 'Order Confirmation',
      message: `Thank you for your order! Your order #${order2.externalRef} has been received.`,
      status: 'sent',
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: customers[2].id,
      event: 'order.placed',
      channel: NotificationChannel.email,
      title: 'Order Confirmation',
      message: `Thank you for your order! Your order #${order3.externalRef} has been received.`,
      status: 'sent',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  await prisma.notification.createMany({
    data: notifications,
  });

  console.log(`✅ Created ${notifications.length} notifications\n`);

  // ============================================
  // STEP 21: NOTIFICATION PREFERENCES
  // ============================================
  console.log('⚙️ Step 21: Creating Notification Preferences...');

  for (const customer of customers.slice(0, 5)) {
    await prisma.notificationPreference.createMany({
      data: [
        {
          userId: customer.id,
          event: 'order.placed',
          channel: NotificationChannel.email,
          enabled: true,
        },
        {
          userId: customer.id,
          event: 'order.shipped',
          channel: NotificationChannel.email,
          enabled: true,
        },
        {
          userId: customer.id,
          event: 'order.shipped',
          channel: NotificationChannel.sms,
          enabled: true,
        },
        {
          userId: customer.id,
          event: 'order.delivered',
          channel: NotificationChannel.email,
          enabled: true,
        },
      ],
    });
  }

  console.log(`✅ Created notification preferences for 5 users\n`);

  // ============================================
  // STEP 22: BLOG POSTS
  // ============================================
  console.log('📝 Step 22: Creating Blog Posts...');

  const blogPosts = [
    {
      title: 'Understanding Wine Tannins: A Complete Guide',
      slug: 'understanding-wine-tannins-complete-guide',
      excerpt: 'Learn what tannins are, how they affect wine taste, and why they matter for your wine experience.',
      content: '<h2>What Are Tannins?</h2><p>Tannins are naturally occurring compounds found in grape skins, seeds, and stems. They create that dry, puckering sensation in your mouth when drinking red wine...</p><h2>Why Tannins Matter</h2><p>Tannins provide structure and aging potential to wine. They also pair wonderfully with protein-rich foods...</p>',
      status: BlogPostStatus.published,
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Perfect Wine Pairings for Kenyan Cuisine',
      slug: 'perfect-wine-pairings-kenyan-cuisine',
      excerpt: 'Discover which wines pair best with your favorite Kenyan dishes, from nyama choma to pilau.',
      content: '<h2>Nyama Choma & Red Wine</h2><p>Grilled meat pairs perfectly with bold red wines like Cabernet Sauvignon or Shiraz...</p><h2>Seafood & White Wine</h2><p>Fresh fish from the coast pairs beautifully with crisp Sauvignon Blanc...</p>',
      status: BlogPostStatus.published,
      image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
      publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'How to Store Wine at Home: Essential Tips',
      slug: 'how-to-store-wine-at-home-tips',
      excerpt: 'Proper wine storage is crucial for maintaining quality. Learn the basics of storing wine in Nairobi\'s climate.',
      content: '<h2>Temperature Matters</h2><p>Keep wine at 12-18°C for optimal aging. In Nairobi\'s warm climate, consider a wine fridge...</p><h2>Humidity & Position</h2><p>Store bottles on their side to keep the cork moist. Aim for 60-70% humidity...</p>',
      status: BlogPostStatus.published,
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Champagne vs Prosecco: What\'s the Difference?',
      slug: 'champagne-vs-prosecco-difference',
      excerpt: 'Both are sparkling wines, but they\'re quite different. Let\'s explore what sets them apart.',
      content: '<h2>Production Method</h2><p>Champagne uses traditional method with secondary fermentation in bottle. Prosecco uses tank method...</p><h2>Taste Profile</h2><p>Champagne tends to be more complex with brioche notes. Prosecco is fruitier and lighter...</p>',
      status: BlogPostStatus.published,
      image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=1200',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Top 10 Wine Cocktails to Try This Summer',
      slug: 'top-10-wine-cocktails-summer',
      excerpt: 'Wine cocktails are refreshing and easy to make. Here are our favorite recipes for summer entertaining.',
      content: '<h2>1. Classic Sangria</h2><p>Red wine with fresh fruit and brandy - a crowd favorite...</p><h2>2. Aperol Spritz</h2><p>Prosecco, Aperol, and soda water for the perfect aperitif...</p>',
      status: BlogPostStatus.draft,
      image: 'https://images.unsplash.com/photo-1560148823-8f8a42b3f6b4?w=1200',
      publishedAt: null,
    },
  ];

  await prisma.blogPost.createMany({
    data: blogPosts,
  });

  console.log(`✅ Created ${blogPosts.length} blog posts\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('=' .repeat(60));
  console.log('🎉 MASTER SEED COMPLETED SUCCESSFULLY!\n');
  console.log('📊 Database Population Summary:');
  console.log('=' .repeat(60));
  console.log(`✅ Roles: 3 (ADMIN, MANAGER, CUSTOMER)`);
  console.log(`✅ Permissions: ${allPermissions.length}`);
  console.log(`✅ Users: ${customers.length + 2} (1 admin, 1 manager, ${customers.length} customers)`);
  console.log(`✅ Countries: ${countries.length}`);
  console.log(`✅ Shipping Methods: ${allShippingMethods.length}`);
  console.log(`✅ Locations: 1 warehouse`);
  console.log(`✅ Categories: 22 (4 parent + 18 subcategories)`);
  console.log(`✅ Products: ${allProducts.length} (${wineProducts.length} wines, ${spiritProducts.length} spirits, ${beerProducts.length} beers, ${accessoryProducts.length} accessories)`);
  console.log(`✅ Variants: ${allVariants.length} (with multiple sizes for premium products)`);
  console.log(`✅ Bundles: 3 gift sets`);
  console.log(`✅ Coupons: 4 promotional codes`);
  console.log(`✅ User Addresses: ${allAddresses.length}`);
  console.log(`✅ Wishlists: 5 customer wishlists`);
  console.log(`✅ Carts: 3 (2 user carts, 1 guest cart)`);
  console.log(`✅ Orders: 4 (delivered, shipped, processing, cancelled)`);
  console.log(`✅ Payments: 4 with transaction logs`);
  console.log(`✅ Shipments: 2 with tracking`);
  console.log(`✅ Returns & Refunds: 1 return request with refund`);
  console.log(`✅ Reviews: ${reviewsData.length} product reviews`);
  console.log(`✅ Recently Viewed: ${recentlyViewedData.length} records`);
  console.log(`✅ Notification Templates: ${notificationTemplates.length}`);
  console.log(`✅ Notifications: ${notifications.length}`);
  console.log(`✅ Blog Posts: ${blogPosts.length} (4 published, 1 draft)`);
  console.log('=' .repeat(60));
  console.log('\n🔑 TEST ACCOUNTS:');
  console.log('   Admin:    admin@wineshop.com / Password123!');
  console.log('   Manager:  manager@wineshop.com / Password123!');
  console.log('   Customer: james.towell@example.com / Password123!');
  console.log('             anita.oramo@example.com / Password123!');
  console.log('=' .repeat(60));
  console.log('\n🎟️ TEST COUPONS:');
  console.log('   WELCOME10  - 10% off first order (min KES 3,000)');
  console.log('   FREESHIP   - Free shipping (min KES 5,000)');
  console.log('   WINE20     - 20% off wine category (min KES 8,000)');
  console.log('   SAVE500    - KES 500 off (min KES 10,000)');
  console.log('=' .repeat(60));
  console.log('\n✨ ALL TABLES POPULATED WITH WINE SHOP DATA!');
  console.log('🍷 Ready for testing and development!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during master seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
