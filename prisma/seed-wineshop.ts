import { PrismaClient, ShippingMethodType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🍷 Starting WineShop database seeding...\n');

  // ============================================
  // CLEAR ALL DATA EXCEPT USERS & AUTH
  // ============================================
  console.log('🧹 Cleaning product, order, and review data...');
  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
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
  await prisma.recentlyViewed.deleteMany();
  await prisma.userAddress.deleteMany();

  console.log('✅ Data cleaned (Users & Auth preserved)\n');

  // ============================================
  // 1. CHECK/CREATE ROLES
  // ============================================
  console.log('📋 Checking Roles & Permissions...');

  let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'ADMIN', description: 'Administrator with full access' },
    });
  }

  let customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!customerRole) {
    customerRole = await prisma.role.create({
      data: { name: 'CUSTOMER', description: 'Regular customer' },
    });
  }

  console.log('✅ Roles verified\n');

  // ============================================
  // 2. ADD MORE USERS
  // ============================================
  console.log('👥 Adding customer users...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const additionalCustomers = [
    { email: 'james.towell@example.com', firstName: 'James', lastName: 'Towell' },
    { email: 'anita.oramo@example.com', firstName: 'Anita', lastName: 'Oramo' },
    { email: 'brian.mondale@example.com', firstName: 'Brian', lastName: 'Mondale' },
    { email: 'john.adamu@example.com', firstName: 'John', lastName: 'Adamu' },
    { email: 'peter.wantuchi@example.com', firstName: 'Peter', lastName: 'Wantuchi' },
    { email: 'sarah.johnson@example.com', firstName: 'Sarah', lastName: 'Johnson' },
    { email: 'michael.chen@example.com', firstName: 'Michael', lastName: 'Chen' },
    { email: 'emily.wilson@example.com', firstName: 'Emily', lastName: 'Wilson' },
  ];

  const createdCustomers: any[] = [];
  for (const customer of additionalCustomers) {
    let user = await prisma.user.findUnique({ where: { email: customer.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...customer,
          password: hashedPassword,
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      const existingRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: { userId: user.id, roleId: customerRole!.id }
        }
      });

      if (!existingRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: customerRole!.id },
        });
      }
      console.log(`   ✓ Created user: ${customer.email}`);
    } else {
      console.log(`   ℹ User exists: ${customer.email}`);
    }
    createdCustomers.push(user);
  }

  console.log('✅ Users processed\n');

  // ============================================
  // 3. CATEGORY HIERARCHY
  // ============================================
  console.log('📁 Seeding Category Hierarchy...');

  // Parent Categories
  const wineParent = await prisma.category.create({
    data: { name: 'Wine', description: 'Premium wines from around the world', slug: 'wine' }
  });

  const spiritsParent = await prisma.category.create({
    data: { name: 'Spirits', description: 'Premium spirits and liquors', slug: 'spirits' }
  });

  const beersParent = await prisma.category.create({
    data: { name: 'Beers', description: 'Craft and imported beers', slug: 'beers' }
  });

  const mixersCategory = await prisma.category.create({
    data: { name: 'Mixers', description: 'Cocktail mixers and soft drinks', slug: 'mixers' }
  });

  // Wine Subcategories
  const redWine = await prisma.category.create({
    data: { name: 'Red Wine', description: 'Full-bodied red wines', slug: 'red-wine', parentId: wineParent.id }
  });

  const whiteWine = await prisma.category.create({
    data: { name: 'White Wine', description: 'Crisp and refreshing white wines', slug: 'white-wine', parentId: wineParent.id }
  });

  const sparklingWine = await prisma.category.create({
    data: { name: 'Sparkling Wine', description: 'Champagne and sparkling wines', slug: 'sparkling-wine', parentId: wineParent.id }
  });

  const roseWine = await prisma.category.create({
    data: { name: 'Rosé Wine', description: 'Elegant rosé wines', slug: 'rose-wine', parentId: wineParent.id }
  });

  // Spirit Subcategories
  const whiskey = await prisma.category.create({
    data: { name: 'Whiskey', description: 'Premium whiskeys and bourbons', slug: 'whiskey', parentId: spiritsParent.id }
  });

  const vodka = await prisma.category.create({
    data: { name: 'Vodka', description: 'Premium vodkas', slug: 'vodka', parentId: spiritsParent.id }
  });

  const rum = await prisma.category.create({
    data: { name: 'Rum', description: 'Caribbean and spiced rums', slug: 'rum', parentId: spiritsParent.id }
  });

  const gin = await prisma.category.create({
    data: { name: 'Gin', description: 'Craft and premium gins', slug: 'gin', parentId: spiritsParent.id }
  });

  // Beer Subcategories
  const craftBeer = await prisma.category.create({
    data: { name: 'Craft Beer', description: 'Artisanal craft beers', slug: 'craft-beer', parentId: beersParent.id }
  });

  const lager = await prisma.category.create({
    data: { name: 'Lager', description: 'Classic lagers', slug: 'lager', parentId: beersParent.id }
  });

  const stout = await prisma.category.create({
    data: { name: 'Stout', description: 'Dark stouts and porters', slug: 'stout', parentId: beersParent.id }
  });

  console.log('✅ Categories seeded\n');

  // ============================================
  // 4. SHIPPING METHODS & LOCATION
  // ============================================
  console.log('🚚 Seeding Shipping Methods & Location...');

  await prisma.shippingMethod.createMany({
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
        name: 'STORE PICKUP',
        code: 'STORE_PICKUP',
        type: ShippingMethodType.pickup,
        description: 'Free store pickup at KENKSAL Towers 10AM - 7PM',
        baseRate: 0,
        minDays: 0,
        maxDays: 0,
        isActive: true,
        sortOrder: 3,
      },
    ],
  });

  const location = await prisma.location.create({
    data: {
      name: 'Vino Luxe Lounge - Main Warehouse',
      addressLine1: 'Vino Luxe Lounge, Westlands',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'KE',
    },
  });

  console.log('✅ Shipping & Location seeded\n');

  // ============================================
  // 5. WINE PRODUCTS
  // ============================================
  console.log('🍇 Seeding Wine Products...');

  const wineProducts = [
    // RED WINES
    {
      name: 'Stimson Estate Cellars Cabernet Sauvignon',
      description: 'This timeless Cabernet Sauvignon is fruit-driven and fresh with a hint of earthiness. Delicious on its own but great with your meal. Pairs perfectly with burgers and steaks.',
      category: redWine.id,
      price: 4500,
      compareAtPrice: 5200,
      sku: 'WINE-RED-001',
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
      attributes: {
        'Wine Category': 'Dry Red Wine',
        'Region': 'Washington State, USA',
        'Alcohol Content': '13.5%',
        'Body': 'Full Body',
        'Aroma': 'Berry, Eucalyptus, Oak, Toasty Oak, Caramel',
        'Vintage': '2020',
      },
    },
    {
      name: 'Canon 13 Pinot Noir',
      description: 'Elegant Pinot Noir with delicate flavors of cherry, raspberry, and subtle oak. Perfect for special occasions and pairs wonderfully with duck, salmon, and mushroom dishes.',
      category: redWine.id,
      price: 6089,
      compareAtPrice: 7000,
      sku: 'WINE-RED-002',
      stock: 85,
      imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400',
      attributes: {
        'Wine Category': 'Premium Red Wine',
        'Region': 'California, USA',
        'Alcohol Content': '14.2%',
        'Body': 'Medium Body',
        'Aroma': 'Cherry, Raspberry, Vanilla, Spice',
        'Vintage': '2019',
      },
    },
    {
      name: 'Merlot Estate Selection',
      description: 'Smooth Merlot with flavors of plum, black cherry, and cocoa. Soft tannins make it approachable and easy-drinking. Pairs well with pasta and grilled meats.',
      category: redWine.id,
      price: 3499,
      compareAtPrice: 4000,
      sku: 'WINE-RED-003',
      stock: 102,
      imageUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400',
      attributes: {
        'Wine Category': 'Red Wine',
        'Region': 'Napa Valley, California',
        'Alcohol Content': '13.9%',
        'Body': 'Medium Body',
        'Aroma': 'Plum, Black Cherry, Cocoa, Vanilla',
        'Vintage': '2020',
      },
    },
    {
      name: 'Cabernet Franc Reserve',
      description: 'Medium-bodied Cabernet Franc with notes of raspberry, bell pepper, and tobacco. Elegant and food-friendly, pairs well with roasted vegetables and lamb.',
      category: redWine.id,
      price: 4999,
      compareAtPrice: 5700,
      sku: 'WINE-RED-004',
      stock: 88,
      imageUrl: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400',
      attributes: {
        'Wine Category': 'Premium Red Wine',
        'Region': 'Loire Valley, France',
        'Alcohol Content': '13.2%',
        'Body': 'Medium Body',
        'Aroma': 'Raspberry, Bell Pepper, Tobacco, Herbs',
        'Vintage': '2019',
      },
    },
    {
      name: 'Shiraz Bold Reserve',
      description: 'Full-bodied Shiraz with intense flavors of blackberry, pepper, and smoke. Bold and powerful, perfect for BBQ and hearty stews.',
      category: redWine.id,
      price: 4799,
      compareAtPrice: 5500,
      sku: 'WINE-RED-005',
      stock: 92,
      imageUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400',
      attributes: {
        'Wine Category': 'Bold Red Wine',
        'Region': 'Barossa Valley, Australia',
        'Alcohol Content': '14.5%',
        'Body': 'Full Body',
        'Aroma': 'Blackberry, Pepper, Smoke, Leather',
        'Vintage': '2018',
      },
    },
    {
      name: 'Tempranillo Reserva',
      description: 'Spanish Tempranillo aged in oak barrels. Complex flavors of dark fruit, leather, and tobacco. Excellent with tapas and grilled meats.',
      category: redWine.id,
      price: 5299,
      compareAtPrice: 6100,
      sku: 'WINE-RED-006',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1566754436385-b5a7c1d82a56?w=400',
      attributes: {
        'Wine Category': 'Reserve Red Wine',
        'Region': 'Rioja, Spain',
        'Alcohol Content': '13.8%',
        'Body': 'Full Body',
        'Aroma': 'Dark Fruit, Leather, Tobacco, Vanilla',
        'Vintage': '2017',
      },
    },
    {
      name: 'Zinfandel Old Vine',
      description: 'Rich and jammy Zinfandel from old vines. Intense fruit flavors with hints of spice and pepper. Perfect for bold dishes.',
      category: redWine.id,
      price: 4699,
      compareAtPrice: 5400,
      sku: 'WINE-RED-007',
      stock: 68,
      imageUrl: 'https://images.unsplash.com/photo-1597876121489-2e0c07bebd49?w=400',
      attributes: {
        'Wine Category': 'Bold Red Wine',
        'Region': 'Sonoma, California',
        'Alcohol Content': '15.2%',
        'Body': 'Full Body',
        'Aroma': 'Blackberry Jam, Spice, Pepper, Oak',
        'Vintage': '2019',
      },
    },
    {
      name: 'Malbec Reserva',
      description: 'Argentinian Malbec with deep purple color. Rich flavors of dark fruit, cocoa, and mocha. Pairs beautifully with steak.',
      category: redWine.id,
      price: 4299,
      compareAtPrice: 4900,
      sku: 'WINE-RED-008',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=400',
      attributes: {
        'Wine Category': 'Premium Red Wine',
        'Region': 'Mendoza, Argentina',
        'Alcohol Content': '14.5%',
        'Body': 'Full Body',
        'Aroma': 'Dark Fruit, Cocoa, Mocha, Violet',
        'Vintage': '2019',
      },
    },
    {
      name: 'Sangiovese Chianti Classico',
      description: 'Classic Italian Chianti with bright cherry flavors and herbal notes. Food-friendly and versatile with Italian cuisine.',
      category: redWine.id,
      price: 3899,
      compareAtPrice: 4500,
      sku: 'WINE-RED-009',
      stock: 82,
      imageUrl: 'https://images.unsplash.com/photo-1606458387339-29991e5699d4?w=400',
      attributes: {
        'Wine Category': 'Italian Red Wine',
        'Region': 'Tuscany, Italy',
        'Alcohol Content': '13.5%',
        'Body': 'Medium Body',
        'Aroma': 'Cherry, Herbs, Leather, Earth',
        'Vintage': '2020',
      },
    },
    {
      name: 'Petit Verdot Reserve',
      description: 'Bold and structured Petit Verdot with firm tannins. Dark fruit flavors with hints of violet and spice. Age-worthy wine.',
      category: redWine.id,
      price: 5699,
      compareAtPrice: 6500,
      sku: 'WINE-RED-010',
      stock: 55,
      imageUrl: 'https://images.unsplash.com/photo-1598094116459-cb9886828e6c?w=400',
      attributes: {
        'Wine Category': 'Premium Red Wine',
        'Region': 'Napa Valley, California',
        'Alcohol Content': '14.8%',
        'Body': 'Full Body',
        'Aroma': 'Blackberry, Violet, Spice, Oak',
        'Vintage': '2018',
      },
    },

    // WHITE WINES
    {
      name: 'Chardonnay Reserve Estate',
      description: 'Crisp and refreshing Chardonnay with notes of green apple, pear, and citrus. Aged in oak barrels for added complexity. Perfect with seafood and chicken dishes.',
      category: whiteWine.id,
      price: 3799,
      compareAtPrice: 4300,
      sku: 'WINE-WHITE-001',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=400',
      attributes: {
        'Wine Category': 'Premium White Wine',
        'Region': 'Sonoma Valley, California',
        'Alcohol Content': '13.8%',
        'Body': 'Medium Body',
        'Aroma': 'Green Apple, Pear, Citrus, Butter',
        'Vintage': '2021',
      },
    },
    {
      name: 'Sauvignon Blanc Classic',
      description: 'Vibrant Sauvignon Blanc with zesty citrus notes and herbaceous undertones. Light and refreshing, ideal for warm weather and pairs well with salads and light seafood.',
      category: whiteWine.id,
      price: 3299,
      compareAtPrice: 3800,
      sku: 'WINE-WHITE-002',
      stock: 110,
      imageUrl: 'https://images.unsplash.com/photo-1587233164068-854e78c62b20?w=400',
      attributes: {
        'Wine Category': 'Dry White Wine',
        'Region': 'Marlborough, New Zealand',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Aroma': 'Grapefruit, Lime, Passion Fruit, Grass',
        'Vintage': '2022',
      },
    },
    {
      name: 'Pinot Grigio Classico',
      description: 'Light and crisp Italian Pinot Grigio with notes of lemon, pear, and white flowers. Refreshing and versatile, pairs well with light pasta and seafood.',
      category: whiteWine.id,
      price: 2999,
      compareAtPrice: 3400,
      sku: 'WINE-WHITE-003',
      stock: 125,
      imageUrl: 'https://images.unsplash.com/photo-1596230040045-ee6b8e8a5320?w=400',
      attributes: {
        'Wine Category': 'Light White Wine',
        'Region': 'Friuli, Italy',
        'Alcohol Content': '12%',
        'Body': 'Light Body',
        'Aroma': 'Lemon, Pear, White Flowers',
        'Vintage': '2022',
      },
    },
    {
      name: 'Riesling Sweet Reserve',
      description: 'Sweet German Riesling with notes of apricot, peach, and honey. Perfect as a dessert wine or paired with spicy Asian cuisine.',
      category: whiteWine.id,
      price: 3899,
      compareAtPrice: 4500,
      sku: 'WINE-WHITE-004',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1587396689726-199d2dbeb3c8?w=400',
      attributes: {
        'Wine Category': 'Sweet White Wine',
        'Region': 'Mosel, Germany',
        'Alcohol Content': '8.5%',
        'Body': 'Light Body',
        'Aroma': 'Apricot, Peach, Honey, Floral',
        'Vintage': '2021',
      },
    },
    {
      name: 'Viognier Estate',
      description: 'Aromatic Viognier with notes of peach, apricot, and honeysuckle. Full-bodied white wine that pairs well with spicy dishes and rich seafood.',
      category: whiteWine.id,
      price: 4299,
      compareAtPrice: 4900,
      sku: 'WINE-WHITE-005',
      stock: 72,
      imageUrl: 'https://images.unsplash.com/photo-1596230040045-ee6b8e8a5320?w=400',
      attributes: {
        'Wine Category': 'Aromatic White Wine',
        'Region': 'Rhône Valley, France',
        'Alcohol Content': '13.5%',
        'Body': 'Full Body',
        'Aroma': 'Peach, Apricot, Honeysuckle, Spice',
        'Vintage': '2021',
      },
    },
    {
      name: 'Chenin Blanc Reserve',
      description: 'Versatile Chenin Blanc with tropical fruit flavors and bright acidity. Can be enjoyed young or aged. Pairs well with Asian cuisine.',
      category: whiteWine.id,
      price: 3499,
      compareAtPrice: 4000,
      sku: 'WINE-WHITE-006',
      stock: 88,
      imageUrl: 'https://images.unsplash.com/photo-1588852845002-c0b05fca2468?w=400',
      attributes: {
        'Wine Category': 'Premium White Wine',
        'Region': 'Loire Valley, France',
        'Alcohol Content': '12.8%',
        'Body': 'Medium Body',
        'Aroma': 'Pineapple, Pear, Honey, Citrus',
        'Vintage': '2021',
      },
    },
    {
      name: 'Gewürztraminer Alsace',
      description: 'Exotic and aromatic Gewürztraminer with lychee, rose, and ginger notes. Off-dry style pairs beautifully with spicy Asian dishes.',
      category: whiteWine.id,
      price: 4099,
      compareAtPrice: 4700,
      sku: 'WINE-WHITE-007',
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1587396689726-199d2dbeb3c8?w=400',
      attributes: {
        'Wine Category': 'Aromatic White Wine',
        'Region': 'Alsace, France',
        'Alcohol Content': '13%',
        'Body': 'Medium Body',
        'Aroma': 'Lychee, Rose, Ginger, Spice',
        'Vintage': '2021',
      },
    },
    {
      name: 'Albariño Spanish Coast',
      description: 'Crisp Spanish white with citrus and stone fruit flavors. High acidity makes it perfect with seafood and shellfish.',
      category: whiteWine.id,
      price: 3699,
      compareAtPrice: 4200,
      sku: 'WINE-WHITE-008',
      stock: 78,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=400',
      attributes: {
        'Wine Category': 'Spanish White Wine',
        'Region': 'Rías Baixas, Spain',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Aroma': 'Citrus, Peach, Mineral, Saline',
        'Vintage': '2022',
      },
    },

    // SPARKLING WINES
    {
      name: 'Moët & Chandon Impérial Brut',
      description: 'The world\'s most loved champagne. A vibrant, generous, and alluring champagne with a perfect balance of Pinot Noir, Chardonnay, and Pinot Meunier.',
      category: sparklingWine.id,
      price: 12999,
      compareAtPrice: 15000,
      sku: 'WINE-SPARK-001',
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400',
      attributes: {
        'Wine Category': 'Champagne',
        'Region': 'Champagne, France',
        'Alcohol Content': '12%',
        'Body': 'Light Body',
        'Aroma': 'White Fruit, Citrus, Brioche',
        'Vintage': 'NV',
      },
    },
    {
      name: 'Prosecco DOC Extra Dry',
      description: 'Italian Prosecco with delicate bubbles and notes of white peach, green apple, and honey. Perfect for celebrations and pairs well with appetizers.',
      category: sparklingWine.id,
      price: 2899,
      compareAtPrice: 3300,
      sku: 'WINE-SPARK-002',
      stock: 130,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=400',
      attributes: {
        'Wine Category': 'Sparkling Wine',
        'Region': 'Veneto, Italy',
        'Alcohol Content': '11%',
        'Body': 'Light Body',
        'Aroma': 'Peach, Apple, Honey, Floral',
        'Vintage': 'NV',
      },
    },
    {
      name: 'Veuve Clicquot Yellow Label Brut',
      description: 'Iconic champagne with fine bubbles and complex flavors. Perfect balance of fruit and toasty notes. Ideal for celebrations.',
      category: sparklingWine.id,
      price: 14999,
      compareAtPrice: 17000,
      sku: 'WINE-SPARK-003',
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1560148823-8f8a42b3f6b4?w=400',
      attributes: {
        'Wine Category': 'Premium Champagne',
        'Region': 'Champagne, France',
        'Alcohol Content': '12%',
        'Body': 'Medium Body',
        'Aroma': 'Citrus, Brioche, Almond, Toast',
        'Vintage': 'NV',
      },
    },
    {
      name: 'Cava Brut Reserva',
      description: 'Spanish sparkling wine made in traditional method. Elegant with fine bubbles and crisp acidity. Excellent value alternative to Champagne.',
      category: sparklingWine.id,
      price: 2499,
      compareAtPrice: 2900,
      sku: 'WINE-SPARK-004',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1587396689726-199d2dbeb3c8?w=400',
      attributes: {
        'Wine Category': 'Spanish Sparkling',
        'Region': 'Catalonia, Spain',
        'Alcohol Content': '11.5%',
        'Body': 'Light Body',
        'Aroma': 'Green Apple, Citrus, Almond, Yeast',
        'Vintage': 'NV',
      },
    },
    {
      name: 'Franciacorta DOCG Brut',
      description: 'Italian sparkling wine from Lombardy. Made in the traditional method with extended aging. Complex and refined.',
      category: sparklingWine.id,
      price: 8999,
      compareAtPrice: 10500,
      sku: 'WINE-SPARK-005',
      stock: 42,
      imageUrl: 'https://images.unsplash.com/photo-1596230040045-ee6b8e8a5320?w=400',
      attributes: {
        'Wine Category': 'Italian Sparkling',
        'Region': 'Lombardy, Italy',
        'Alcohol Content': '12.5%',
        'Body': 'Medium Body',
        'Aroma': 'White Fruit, Brioche, Hazelnut, Citrus',
        'Vintage': '2018',
      },
    },
    {
      name: 'Crémant de Bourgogne Brut',
      description: 'Sparkling wine from Burgundy made in traditional method. Elegant and refined with good complexity. Excellent value.',
      category: sparklingWine.id,
      price: 3499,
      compareAtPrice: 4000,
      sku: 'WINE-SPARK-006',
      stock: 68,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=400',
      attributes: {
        'Wine Category': 'French Sparkling',
        'Region': 'Burgundy, France',
        'Alcohol Content': '12%',
        'Body': 'Light Body',
        'Aroma': 'Apple, Pear, Brioche, Citrus',
        'Vintage': 'NV',
      },
    },

    // ROSÉ WINES
    {
      name: 'Provence Rosé',
      description: 'Elegant Provençal rosé with delicate flavors of strawberry, watermelon, and citrus. Crisp and refreshing, perfect for summer days and Mediterranean cuisine.',
      category: roseWine.id,
      price: 4199,
      compareAtPrice: 4800,
      sku: 'WINE-ROSE-001',
      stock: 78,
      imageUrl: 'https://images.unsplash.com/photo-1588852845002-c0b05fca2468?w=400',
      attributes: {
        'Wine Category': 'Dry Rosé',
        'Region': 'Provence, France',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Aroma': 'Strawberry, Watermelon, Citrus, Herbs',
        'Vintage': '2022',
      },
    },
    {
      name: 'Whispering Angel Rosé',
      description: 'The world-famous pale pink rosé from Provence. Delicate and refreshing with notes of red berries and citrus. Perfect for any occasion.',
      category: roseWine.id,
      price: 5999,
      compareAtPrice: 6900,
      sku: 'WINE-ROSE-002',
      stock: 62,
      imageUrl: 'https://images.unsplash.com/photo-1596230040045-ee6b8e8a5320?w=400',
      attributes: {
        'Wine Category': 'Premium Rosé',
        'Region': 'Provence, France',
        'Alcohol Content': '13%',
        'Body': 'Light Body',
        'Aroma': 'Red Berries, Grapefruit, Melon, Floral',
        'Vintage': '2022',
      },
    },
    {
      name: 'Pinot Noir Rosé',
      description: 'Elegant rosé made from Pinot Noir grapes. Bright acidity with flavors of cherry, raspberry, and rose petal. Food-friendly and versatile.',
      category: roseWine.id,
      price: 3699,
      compareAtPrice: 4200,
      sku: 'WINE-ROSE-003',
      stock: 85,
      imageUrl: 'https://images.unsplash.com/photo-1587396689726-199d2dbeb3c8?w=400',
      attributes: {
        'Wine Category': 'Dry Rosé',
        'Region': 'California, USA',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Aroma': 'Cherry, Raspberry, Rose Petal, Citrus',
        'Vintage': '2022',
      },
    },
    {
      name: 'Spanish Garnacha Rosado',
      description: 'Full-flavored Spanish rosé with ripe strawberry and melon notes. Slightly fuller body makes it perfect with grilled foods.',
      category: roseWine.id,
      price: 3299,
      compareAtPrice: 3800,
      sku: 'WINE-ROSE-004',
      stock: 92,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=400',
      attributes: {
        'Wine Category': 'Spanish Rosé',
        'Region': 'Navarra, Spain',
        'Alcohol Content': '13.5%',
        'Body': 'Medium Body',
        'Aroma': 'Strawberry, Melon, Raspberry, Spice',
        'Vintage': '2022',
      },
    },
    {
      name: 'Tavel Rosé',
      description: 'Full-bodied French rosé with deep pink color. Rich flavors of red fruit and herbs. Age-worthy rosé that pairs with hearty dishes.',
      category: roseWine.id,
      price: 4699,
      compareAtPrice: 5400,
      sku: 'WINE-ROSE-005',
      stock: 55,
      imageUrl: 'https://images.unsplash.com/photo-1596230040045-ee6b8e8a5320?w=400',
      attributes: {
        'Wine Category': 'Premium Rosé',
        'Region': 'Rhône Valley, France',
        'Alcohol Content': '14%',
        'Body': 'Full Body',
        'Aroma': 'Red Fruit, Herbs, Spice, Mineral',
        'Vintage': '2021',
      },
    },
    {
      name: 'Bandol Rosé',
      description: 'Provençal rosé with structure and complexity. Made primarily from Mourvèdre grapes. Pairs beautifully with bouillabaisse and Mediterranean seafood.',
      category: roseWine.id,
      price: 5499,
      compareAtPrice: 6300,
      sku: 'WINE-ROSE-006',
      stock: 48,
      imageUrl: 'https://images.unsplash.com/photo-1588852845002-c0b05fca2468?w=400',
      attributes: {
        'Wine Category': 'Premium Rosé',
        'Region': 'Provence, France',
        'Alcohol Content': '13.5%',
        'Body': 'Medium Body',
        'Aroma': 'Red Fruit, Garrigue, Spice, Mineral',
        'Vintage': '2021',
      },
    },
    {
      name: 'Sangiovese Rosato',
      description: 'Italian rosé from Tuscany. Bright acidity with flavors of cherry and herbs. Perfect with Italian antipasti and pizza.',
      category: roseWine.id,
      price: 3499,
      compareAtPrice: 4000,
      sku: 'WINE-ROSE-007',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1587396689726-199d2dbeb3c8?w=400',
      attributes: {
        'Wine Category': 'Italian Rosé',
        'Region': 'Tuscany, Italy',
        'Alcohol Content': '12.5%',
        'Body': 'Light Body',
        'Aroma': 'Cherry, Herbs, Citrus, Mineral',
        'Vintage': '2022',
      },
    },
    {
      name: 'White Zinfandel',
      description: 'American-style rosé with slight sweetness. Refreshing with flavors of strawberry and melon. Perfect for casual summer drinking.',
      category: roseWine.id,
      price: 2499,
      compareAtPrice: 2900,
      sku: 'WINE-ROSE-008',
      stock: 110,
      imageUrl: 'https://images.unsplash.com/photo-1598030812988-6bef4dfd2fc3?w=400',
      attributes: {
        'Wine Category': 'Sweet Rosé',
        'Region': 'California, USA',
        'Alcohol Content': '10.5%',
        'Body': 'Light Body',
        'Aroma': 'Strawberry, Melon, Candy, Floral',
        'Vintage': '2022',
      },
    },
  ];

  const createdWineProducts: any[] = [];
  for (const prod of wineProducts) {
    const product = await prisma.product.create({
      data: {
        name: prod.name,
        description: prod.description,
        seoTitle: prod.name,
        seoDescription: prod.description?.substring(0, 160),
        seoSlug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
          create: Object.entries(prod.attributes).map(([name, value]) => ({ name, value })),
        },
        variants: {
          create: {
            sku: prod.sku,
            price: prod.price,
            compareAtPrice: prod.compareAtPrice,
            currency: 'KES',
            barcode: `BRC${Math.random().toString().substring(2, 15)}`,
            weight: 0.75,
            isActive: true,
            variantInventories: {
              create: {
                locationId: location.id,
                quantity: prod.stock,
                reserved: 0,
              },
            },
          },
        },
      },
    });
    createdWineProducts.push(product);
  }

  console.log(`✅ ${wineProducts.length} Wine Products seeded\n`);

  // ============================================
  // 6. SPIRIT PRODUCTS
  // ============================================
  console.log('🥃 Seeding Spirit Products...');

  const spiritProducts = [
    // WHISKEYS
    {
      name: 'Johnnie Walker Black Label',
      description: 'Premium blended Scotch whisky with rich, complex flavors. Smooth with notes of vanilla, smoke, and dried fruit. Perfect for sipping or mixing.',
      category: whiskey.id,
      price: 4999,
      compareAtPrice: 5700,
      sku: 'SPIRIT-WHIS-001',
      stock: 85,
      imageUrl: 'https://images.unsplash.com/photo-1527281400072-a0f6aa6696e5?w=400',
      attributes: {
        'Spirit Type': 'Blended Scotch Whisky',
        'Origin': 'Scotland',
        'Alcohol Content': '40%',
        'Age': '12 Years',
        'Volume': '750ml',
      },
    },
    {
      name: 'Jack Daniel\'s Old No. 7',
      description: 'Classic Tennessee whiskey with smooth, mellow character. Notes of caramel, vanilla, and oak. America\'s favorite whiskey.',
      category: whiskey.id,
      price: 4299,
      compareAtPrice: 4900,
      sku: 'SPIRIT-WHIS-002',
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400',
      attributes: {
        'Spirit Type': 'Tennessee Whiskey',
        'Origin': 'USA',
        'Alcohol Content': '40%',
        'Age': 'NAS',
        'Volume': '750ml',
      },
    },
    {
      name: 'Jameson Irish Whiskey',
      description: 'Smooth triple-distilled Irish whiskey. Light with notes of vanilla, nuts, and sherry. Perfect for cocktails or neat.',
      category: whiskey.id,
      price: 3799,
      compareAtPrice: 4300,
      sku: 'SPIRIT-WHIS-003',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400',
      attributes: {
        'Spirit Type': 'Irish Whiskey',
        'Origin': 'Ireland',
        'Alcohol Content': '40%',
        'Age': 'NAS',
        'Volume': '750ml',
      },
    },

    // VODKAS
    {
      name: 'Absolut Vodka',
      description: 'Premium Swedish vodka with smooth, clean taste. Made from winter wheat. Perfect for cocktails and mixed drinks.',
      category: vodka.id,
      price: 2999,
      compareAtPrice: 3400,
      sku: 'SPIRIT-VOD-001',
      stock: 150,
      imageUrl: 'https://images.unsplash.com/photo-1556933279-0f8b8d69a38c?w=400',
      attributes: {
        'Spirit Type': 'Premium Vodka',
        'Origin': 'Sweden',
        'Alcohol Content': '40%',
        'Volume': '750ml',
      },
    },
    {
      name: 'Grey Goose Vodka',
      description: 'Ultra-premium French vodka. Smooth and sophisticated with a clean finish. Made from French wheat and spring water.',
      category: vodka.id,
      price: 5999,
      compareAtPrice: 6900,
      sku: 'SPIRIT-VOD-002',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1615332579937-4e3a4b5b6c7f?w=400',
      attributes: {
        'Spirit Type': 'Ultra-Premium Vodka',
        'Origin': 'France',
        'Alcohol Content': '40%',
        'Volume': '750ml',
      },
    },
    {
      name: 'Smirnoff Red Label',
      description: 'Classic vodka with smooth taste. Triple distilled and filtered. Perfect for mixing in cocktails.',
      category: vodka.id,
      price: 2299,
      compareAtPrice: 2600,
      sku: 'SPIRIT-VOD-003',
      stock: 180,
      imageUrl: 'https://images.unsplash.com/photo-1598717957849-5a5f6e2e2b4b?w=400',
      attributes: {
        'Spirit Type': 'Vodka',
        'Origin': 'Russia',
        'Alcohol Content': '37.5%',
        'Volume': '750ml',
      },
    },

    // RUMS
    {
      name: 'Bacardi Superior',
      description: 'Light rum with smooth taste. Perfect for mojitos and daiquiris. Aged and charcoal filtered for smoothness.',
      category: rum.id,
      price: 2799,
      compareAtPrice: 3200,
      sku: 'SPIRIT-RUM-001',
      stock: 140,
      imageUrl: 'https://images.unsplash.com/photo-1617863891824-28fa5c90ffc2?w=400',
      attributes: {
        'Spirit Type': 'Light Rum',
        'Origin': 'Puerto Rico',
        'Alcohol Content': '40%',
        'Age': '1-2 Years',
        'Volume': '750ml',
      },
    },
    {
      name: 'Captain Morgan Spiced Rum',
      description: 'Spiced rum with vanilla and caramel notes. Smooth with hints of cinnamon and spice. Great for mixing or neat.',
      category: rum.id,
      price: 3299,
      compareAtPrice: 3800,
      sku: 'SPIRIT-RUM-002',
      stock: 105,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=400',
      attributes: {
        'Spirit Type': 'Spiced Rum',
        'Origin': 'Jamaica',
        'Alcohol Content': '35%',
        'Age': 'NAS',
        'Volume': '750ml',
      },
    },
    {
      name: 'Havana Club 7 Year',
      description: 'Premium Cuban-style rum aged for 7 years. Rich with notes of vanilla, tobacco, and dried fruit. Perfect for sipping.',
      category: rum.id,
      price: 4499,
      compareAtPrice: 5200,
      sku: 'SPIRIT-RUM-003',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1625822123717-156315bfb3b5?w=400',
      attributes: {
        'Spirit Type': 'Aged Rum',
        'Origin': 'Cuba',
        'Alcohol Content': '40%',
        'Age': '7 Years',
        'Volume': '750ml',
      },
    },

    // GINS
    {
      name: 'Bombay Sapphire',
      description: 'Premium London Dry Gin with 10 botanicals. Smooth and balanced with citrus and juniper notes. Perfect for gin and tonic.',
      category: gin.id,
      price: 3799,
      compareAtPrice: 4300,
      sku: 'SPIRIT-GIN-001',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1602848623226-24e1fd4b99c4?w=400',
      attributes: {
        'Spirit Type': 'London Dry Gin',
        'Origin': 'England',
        'Alcohol Content': '40%',
        'Botanicals': '10',
        'Volume': '750ml',
      },
    },
    {
      name: 'Tanqueray London Dry Gin',
      description: 'Classic London Dry Gin with perfect balance of botanicals. Crisp juniper flavor with hints of citrus. Ideal for martinis.',
      category: gin.id,
      price: 3499,
      compareAtPrice: 4000,
      sku: 'SPIRIT-GIN-002',
      stock: 110,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=400',
      attributes: {
        'Spirit Type': 'London Dry Gin',
        'Origin': 'England',
        'Alcohol Content': '43.1%',
        'Botanicals': '4',
        'Volume': '750ml',
      },
    },
    {
      name: 'Hendrick\'s Gin',
      description: 'Unique gin infused with cucumber and rose petals. Smooth and floral with complex botanical profile. Perfect for sophisticated cocktails.',
      category: gin.id,
      price: 5299,
      compareAtPrice: 6100,
      sku: 'SPIRIT-GIN-003',
      stock: 70,
      imageUrl: 'https://images.unsplash.com/photo-1593096077914-0b453e5d2914?w=400',
      attributes: {
        'Spirit Type': 'Scottish Gin',
        'Origin': 'Scotland',
        'Alcohol Content': '41.4%',
        'Botanicals': '11',
        'Volume': '750ml',
      },
    },
  ];

  const createdSpiritProducts: any[] = [];
  for (const prod of spiritProducts) {
    const product = await prisma.product.create({
      data: {
        name: prod.name,
        description: prod.description,
        seoTitle: prod.name,
        seoDescription: prod.description?.substring(0, 160),
        seoSlug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
          create: Object.entries(prod.attributes).map(([name, value]) => ({ name, value })),
        },
        variants: {
          create: {
            sku: prod.sku,
            price: prod.price,
            compareAtPrice: prod.compareAtPrice,
            currency: 'KES',
            barcode: `BRC${Math.random().toString().substring(2, 15)}`,
            weight: 0.75,
            isActive: true,
            variantInventories: {
              create: {
                locationId: location.id,
                quantity: prod.stock,
                reserved: 0,
              },
            },
          },
        },
      },
    });
    createdSpiritProducts.push(product);
  }

  console.log(`✅ ${spiritProducts.length} Spirit Products seeded\n`);

  // ============================================
  // 7. BEER PRODUCTS
  // ============================================
  console.log('🍺 Seeding Beer Products...');

  const beerProducts = [
    {
      name: 'Tiger Beer',
      description: 'Premium lager with smooth, balanced taste. Refreshing Asian beer with crisp finish. Perfect for meals and celebrations.',
      category: lager.id,
      price: 299,
      compareAtPrice: 350,
      sku: 'BEER-LAG-001',
      stock: 500,
      imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
      attributes: {
        'Beer Type': 'Lager',
        'Origin': 'Singapore',
        'Alcohol Content': '5%',
        'IBU': '20',
        'Volume': '330ml',
      },
    },
    {
      name: 'Busch Light',
      description: 'Light American lager with smooth taste. Low calorie and refreshing. Perfect for hot days and casual drinking.',
      category: lager.id,
      price: 249,
      compareAtPrice: 290,
      sku: 'BEER-LAG-002',
      stock: 600,
      imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
      attributes: {
        'Beer Type': 'Light Lager',
        'Origin': 'USA',
        'Alcohol Content': '4.1%',
        'IBU': '10',
        'Volume': '355ml',
      },
    },
    {
      name: 'Heineken Lager',
      description: 'Classic Dutch lager with distinctive taste. Crisp and refreshing with slightly bitter finish. World\'s most international beer.',
      category: lager.id,
      price: 349,
      compareAtPrice: 400,
      sku: 'BEER-LAG-003',
      stock: 450,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=400',
      attributes: {
        'Beer Type': 'European Lager',
        'Origin': 'Netherlands',
        'Alcohol Content': '5%',
        'IBU': '23',
        'Volume': '330ml',
      },
    },
    {
      name: 'Stella Artois',
      description: 'Premium Belgian lager with 600+ years of brewing heritage. Crisp and refreshing with subtle bitterness. Perfect with meals.',
      category: lager.id,
      price: 399,
      compareAtPrice: 450,
      sku: 'BEER-LAG-004',
      stock: 380,
      imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400',
      attributes: {
        'Beer Type': 'Belgian Lager',
        'Origin': 'Belgium',
        'Alcohol Content': '5.2%',
        'IBU': '24',
        'Volume': '330ml',
      },
    },
    {
      name: 'Sierra Nevada Pale Ale',
      description: 'Iconic American craft beer. Citrusy and piney with perfect hop balance. Bold and flavorful craft IPA.',
      category: craftBeer.id,
      price: 499,
      compareAtPrice: 570,
      sku: 'BEER-CRAFT-001',
      stock: 200,
      imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
      attributes: {
        'Beer Type': 'American Pale Ale',
        'Origin': 'USA',
        'Alcohol Content': '5.6%',
        'IBU': '38',
        'Volume': '355ml',
      },
    },
    {
      name: 'Goose Island IPA',
      description: 'Hoppy American IPA with citrus and tropical fruit notes. Balanced bitterness with clean finish. Award-winning craft beer.',
      category: craftBeer.id,
      price: 549,
      compareAtPrice: 630,
      sku: 'BEER-CRAFT-002',
      stock: 180,
      imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
      attributes: {
        'Beer Type': 'India Pale Ale',
        'Origin': 'USA',
        'Alcohol Content': '5.9%',
        'IBU': '55',
        'Volume': '355ml',
      },
    },
    {
      name: 'Guinness Draught Stout',
      description: 'Iconic Irish stout with creamy head. Rich with notes of coffee and chocolate. Smooth and velvety texture.',
      category: stout.id,
      price: 449,
      compareAtPrice: 520,
      sku: 'BEER-STOUT-001',
      stock: 320,
      imageUrl: 'https://images.unsplash.com/photo-1618885472224-4e7c9e5d82b9?w=400',
      attributes: {
        'Beer Type': 'Irish Stout',
        'Origin': 'Ireland',
        'Alcohol Content': '4.2%',
        'IBU': '45',
        'Volume': '440ml',
      },
    },
    {
      name: 'Murphy\'s Irish Stout',
      description: 'Smooth Irish stout with less bitterness than Guinness. Creamy with notes of dark chocolate and coffee. Easy-drinking dark beer.',
      category: stout.id,
      price: 399,
      compareAtPrice: 460,
      sku: 'BEER-STOUT-002',
      stock: 250,
      imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
      attributes: {
        'Beer Type': 'Irish Stout',
        'Origin': 'Ireland',
        'Alcohol Content': '4%',
        'IBU': '35',
        'Volume': '440ml',
      },
    },
  ];

  const createdBeerProducts: any[] = [];
  for (const prod of beerProducts) {
    const product = await prisma.product.create({
      data: {
        name: prod.name,
        description: prod.description,
        seoTitle: prod.name,
        seoDescription: prod.description?.substring(0, 160),
        seoSlug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
          create: Object.entries(prod.attributes).map(([name, value]) => ({ name, value })),
        },
        variants: {
          create: {
            sku: prod.sku,
            price: prod.price,
            compareAtPrice: prod.compareAtPrice,
            currency: 'KES',
            barcode: `BRC${Math.random().toString().substring(2, 15)}`,
            weight: prod.category === lager.id || prod.category === craftBeer.id ? 0.33 : 0.44,
            isActive: true,
            variantInventories: {
              create: {
                locationId: location.id,
                quantity: prod.stock,
                reserved: 0,
              },
            },
          },
        },
      },
    });
    createdBeerProducts.push(product);
  }

  console.log(`✅ ${beerProducts.length} Beer Products seeded\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('🎉 WineShop database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Parent Categories: 4 (Wine, Spirits, Beers, Mixers)`);
  console.log(`   - Subcategories: 11`);
  console.log(`   - Wine Products: ${wineProducts.length}`);
  console.log(`   - Spirit Products: ${spiritProducts.length}`);
  console.log(`   - Beer Products: ${beerProducts.length}`);
  console.log(`   - Total Products: ${wineProducts.length + spiritProducts.length + beerProducts.length}`);
  console.log(`   - Customer Users: ${createdCustomers.length}`);
  console.log(`   - Shipping Methods: 3`);
  console.log('\n📝 Test Login:');
  console.log('   Customer: james.towell@example.com / Password123!');
  console.log('\n✨ All products have proper category hierarchy, attributes, and inventory!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
