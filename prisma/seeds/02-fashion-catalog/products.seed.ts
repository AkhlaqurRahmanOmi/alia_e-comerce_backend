import { PrismaClient } from '../../../src/generated/prisma/client';

export async function seedFashionProducts(prisma: PrismaClient) {
  console.log('👕 Seeding fashion products...');

  let productCount = 0;
  let variantCount = 0;
  const defaultSeedStock = 10;

  const resolveDefaultLocationId = async () => {
    const existingLocation = await prisma.location.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    if (existingLocation) {
      return existingLocation.id;
    }

    const createdLocation = await prisma.location.create({
      data: {
        name: 'Main Warehouse',
        addressLine1: 'Warehouse District 1',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1207',
        country: 'BD',
      },
      select: { id: true },
    });

    return createdLocation.id;
  };

  const defaultLocationId = await resolveDefaultLocationId();

  // Helper to create product with variants
  const createProduct = async (
    categorySlug: string,
    productData: {
      name: string;
      description: string;
      variants: Array<{
        sku: string;
        price: number;
        size?: string;
        color?: string;
      }>;
    },
  ) => {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      console.warn(`Category ${categorySlug} not found, skipping product ${productData.name}`);
      return;
    }

    const seoSlug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const product = await prisma.product.upsert({
      where: { seoSlug },
      update: {},
      create: {
        name: productData.name,
        seoSlug,
        description: productData.description,
        isActive: true,
      },
    });

    // Link product to category
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: category.id,
      },
    });

    productCount++;

    // Create variants
    for (const variantData of productData.variants) {
      const variant = await prisma.variant.upsert({
        where: { sku: variantData.sku },
        update: {},
        create: {
          productId: product.id,
          sku: variantData.sku,
          price: variantData.price,
          compareAtPrice: variantData.price * 1.2,
          isActive: true,
        },
      });

      await prisma.variantInventory.upsert({
        where: {
          variantId_locationId: {
            variantId: variant.id,
            locationId: defaultLocationId,
          },
        },
        update: {},
        create: {
          variantId: variant.id,
          locationId: defaultLocationId,
          quantity: defaultSeedStock,
          reserved: 0,
        },
      });

      variantCount++;
    }
  };

  const upsertProductOption = async (
    productId: number,
    name: string,
    position: number,
  ) => {
    const existingOption = await prisma.productOption.findFirst({
      where: {
        productId,
        name,
      },
    });

    if (existingOption) {
      return prisma.productOption.update({
        where: { id: existingOption.id },
        data: { position },
      });
    }

    return prisma.productOption.create({
      data: {
        productId,
        name,
        position,
      },
    });
  };

  const upsertOptionValue = async (
    optionId: number,
    value: string,
    position: number,
  ) => {
    const existingValue = await prisma.optionValue.findFirst({
      where: {
        optionId,
        value,
      },
    });

    if (existingValue) {
      return prisma.optionValue.update({
        where: { id: existingValue.id },
        data: { position },
      });
    }

    return prisma.optionValue.create({
      data: {
        optionId,
        value,
        position,
      },
    });
  };

  const createKurtiProduct = async () => {
    const categorySlug = 'kurtis';
    const productName = 'Sunshine Check Two-Piece Kurti Set';
    const shortDescription =
      "A soft and elegant pastel yellow two-piece set designed for a fresh, graceful look. The check-textured kurti is finished with sheer organza details and delicate yellow lace work for a feminine touch. Lightweight and comfortable, it's perfect for daily wear or small occasions. A simple outfit that feels bright, classy, and effortless.";

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      console.warn(`Category ${categorySlug} not found, skipping product ${productName}`);
      return;
    }

    const seoSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const product = await prisma.product.upsert({
      where: { seoSlug },
      update: {
        name: productName,
        description: shortDescription,
        isActive: true,
      },
      create: {
        name: productName,
        seoSlug,
        description: shortDescription,
        isActive: true,
      },
    });

    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: category.id,
      },
    });

    // Keep this product scoped to the Kurti category on reseed.
    await prisma.productCategory.deleteMany({
      where: {
        productId: product.id,
        categoryId: {
          not: category.id,
        },
      },
    });

    productCount++;

    const attributes = [
      { name: 'fabric', value: 'cotton blend with organza/net detailing' },
      { name: 'set_type', value: 'Two-piece set (kurti + pant)' },
      { name: 'design_detail', value: 'Soft check pattern fabric' },
      { name: 'design_detail', value: 'Sheer organza neckline with bow detail' },
      { name: 'design_detail', value: 'Organza flared sleeve cuffs' },
      { name: 'design_detail', value: 'Yellow lace border on neckline, sleeves & hem' },
      { name: 'design_detail', value: 'White straight pant included' },
      { name: 'occasion', value: 'Casual outings' },
      { name: 'occasion', value: 'Daytime events' },
      { name: 'occasion', value: 'Office wear' },
      { name: 'occasion', value: 'Festive mornings' },
    ];

    await prisma.productAttribute.deleteMany({
      where: { productId: product.id },
    });

    await prisma.productAttribute.createMany({
      data: attributes.map((attribute) => ({
        productId: product.id,
        name: attribute.name,
        value: attribute.value,
      })),
      skipDuplicates: true,
    });

    const sizeOption = await upsertProductOption(product.id, 'Size', 1);
    const colorOption = await upsertProductOption(product.id, 'Color', 2);

    const sizeM = await upsertOptionValue(sizeOption.id, 'M (36-38 inches)', 1);
    const sizeL = await upsertOptionValue(sizeOption.id, 'L (39-42 inches)', 2);
    const pastelYellowWhite = await upsertOptionValue(
      colorOption.id,
      'Pastel Yellow & White',
      1,
    );

    const variants = [
      { sku: 'KURTI-SUNSHINE-M', price: 69.99, sizeValueId: sizeM.id },
      { sku: 'KURTI-SUNSHINE-L', price: 69.99, sizeValueId: sizeL.id },
    ];

    for (const variantData of variants) {
      const variant = await prisma.variant.upsert({
        where: { sku: variantData.sku },
        update: {
          productId: product.id,
          price: variantData.price,
          compareAtPrice: Number((variantData.price * 1.2).toFixed(2)),
          isActive: true,
        },
        create: {
          productId: product.id,
          sku: variantData.sku,
          price: variantData.price,
          compareAtPrice: Number((variantData.price * 1.2).toFixed(2)),
          isActive: true,
        },
      });

      await prisma.variantOptionValue.deleteMany({
        where: {
          variantId: variant.id,
          optionId: {
            in: [sizeOption.id, colorOption.id],
          },
        },
      });

      await prisma.variantOptionValue.createMany({
        data: [
          {
            variantId: variant.id,
            optionId: sizeOption.id,
            optionValueId: variantData.sizeValueId,
          },
          {
            variantId: variant.id,
            optionId: colorOption.id,
            optionValueId: pastelYellowWhite.id,
          },
        ],
        skipDuplicates: true,
      });

      await prisma.variantInventory.upsert({
        where: {
          variantId_locationId: {
            variantId: variant.id,
            locationId: defaultLocationId,
          },
        },
        update: {},
        create: {
          variantId: variant.id,
          locationId: defaultLocationId,
          quantity: defaultSeedStock,
          reserved: 0,
        },
      });

      variantCount++;
    }
  };

  console.log('Creating Men\'s Clothing...');

  // MEN'S T-SHIRTS (5 products, 4 variants each)
  await createProduct('t-shirts', {
    name: 'Classic Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt for everyday wear',
    variants: [
      { sku: 'TSHIRT-M-BLACK', price: 19.99 },
      { sku: 'TSHIRT-M-WHITE', price: 19.99 },
      { sku: 'TSHIRT-L-BLACK', price: 19.99 },
      { sku: 'TSHIRT-L-WHITE', price: 19.99 },
    ],
  });

  await createProduct('t-shirts', {
    name: 'V-Neck Premium T-Shirt',
    description: 'Stylish v-neck tee made from premium cotton',
    variants: [
      { sku: 'VNECK-M-NAVY', price: 24.99 },
      { sku: 'VNECK-M-GRAY', price: 24.99 },
      { sku: 'VNECK-L-NAVY', price: 24.99 },
      { sku: 'VNECK-L-GRAY', price: 24.99 },
    ],
  });

  await createProduct('t-shirts', {
    name: 'Graphic Print T-Shirt',
    description: 'Trendy graphic print t-shirt',
    variants: [
      { sku: 'GRAPHIC-M-BLACK', price: 29.99 },
      { sku: 'GRAPHIC-M-BLUE', price: 29.99 },
      { sku: 'GRAPHIC-L-BLACK', price: 29.99 },
    ],
  });

  await createProduct('t-shirts', {
    name: 'Long Sleeve T-Shirt',
    description: 'Long sleeve cotton t-shirt for cooler days',
    variants: [
      { sku: 'LONGSLEEVE-M-BLACK', price: 27.99 },
      { sku: 'LONGSLEEVE-M-GRAY', price: 27.99 },
      { sku: 'LONGSLEEVE-L-BLACK', price: 27.99 },
      { sku: 'LONGSLEEVE-L-NAVY', price: 27.99 },
    ],
  });

  await createProduct('t-shirts', {
    name: 'Polo T-Shirt',
    description: 'Classic polo style t-shirt',
    variants: [
      { sku: 'POLO-M-NAVY', price: 34.99 },
      { sku: 'POLO-M-WHITE', price: 34.99 },
      { sku: 'POLO-L-NAVY', price: 34.99 },
      { sku: 'POLO-L-RED', price: 34.99 },
    ],
  });

  // MEN'S SHIRTS (5 products)
  await createProduct('shirts', {
    name: 'Formal White Dress Shirt',
    description: 'Classic white dress shirt for formal occasions',
    variants: [
      { sku: 'DRESS-M-WHITE', price: 49.99 },
      { sku: 'DRESS-L-WHITE', price: 49.99 },
      { sku: 'DRESS-XL-WHITE', price: 49.99 },
    ],
  });

  await createProduct('shirts', {
    name: 'Casual Linen Shirt',
    description: 'Breathable linen shirt for casual wear',
    variants: [
      { sku: 'LINEN-M-WHITE', price: 44.99 },
      { sku: 'LINEN-M-BEIGE', price: 44.99 },
      { sku: 'LINEN-L-WHITE', price: 44.99 },
    ],
  });

  await createProduct('shirts', {
    name: 'Plaid Flannel Shirt',
    description: 'Cozy flannel shirt with plaid pattern',
    variants: [
      { sku: 'FLANNEL-M-RED', price: 39.99 },
      { sku: 'FLANNEL-M-BLUE', price: 39.99 },
      { sku: 'FLANNEL-L-RED', price: 39.99 },
    ],
  });

  await createProduct('shirts', {
    name: 'Oxford Button-Down Shirt',
    description: 'Classic oxford button-down shirt',
    variants: [
      { sku: 'OXFORD-M-WHITE', price: 54.99 },
      { sku: 'OXFORD-M-BLUE', price: 54.99 },
      { sku: 'OXFORD-L-WHITE', price: 54.99 },
    ],
  });

  await createProduct('shirts', {
    name: 'Short Sleeve Summer Shirt',
    description: 'Light and breezy short sleeve shirt',
    variants: [
      { sku: 'SUMMER-M-WHITE', price: 36.99 },
      { sku: 'SUMMER-M-BLUE', price: 36.99 },
      { sku: 'SUMMER-L-BEIGE', price: 36.99 },
    ],
  });

  // MEN'S JEANS (3 products)
  await createProduct('jeans', {
    name: 'Classic Straight Leg Jeans',
    description: 'Timeless straight leg denim jeans',
    variants: [
      { sku: 'JEANS-32-BLUE', price: 79.99 },
      { sku: 'JEANS-32-BLACK', price: 79.99 },
      { sku: 'JEANS-34-BLUE', price: 79.99 },
    ],
  });

  await createProduct('jeans', {
    name: 'Slim Fit Dark Wash Jeans',
    description: 'Modern slim fit jeans in dark wash',
    variants: [
      { sku: 'SLIMJEANS-32-BLUE', price: 89.99 },
      { sku: 'SLIMJEANS-32-BLACK', price: 89.99 },
      { sku: 'SLIMJEANS-34-BLUE', price: 89.99 },
    ],
  });

  await createProduct('jeans', {
    name: 'Relaxed Fit Jeans',
    description: 'Comfortable relaxed fit denim',
    variants: [
      { sku: 'RELAXJEANS-32-BLUE', price: 74.99 },
      { sku: 'RELAXJEANS-34-BLUE', price: 74.99 },
      { sku: 'RELAXJEANS-36-BLACK', price: 74.99 },
    ],
  });

  console.log('Creating Women\'s Clothing...');

  // WOMEN'S DRESSES (5 products)
  await createProduct('dresses', {
    name: 'Little Black Dress',
    description: 'Classic little black dress',
    variants: [
      { sku: 'LBD-S-BLACK', price: 89.99 },
      { sku: 'LBD-M-BLACK', price: 89.99 },
      { sku: 'LBD-L-BLACK', price: 89.99 },
    ],
  });

  await createProduct('dresses', {
    name: 'Floral Summer Dress',
    description: 'Beautiful floral print summer dress',
    variants: [
      { sku: 'FLORALDRESS-S-PINK', price: 79.99 },
      { sku: 'FLORALDRESS-M-PINK', price: 79.99 },
      { sku: 'FLORALDRESS-M-BLUE', price: 79.99 },
    ],
  });

  await createProduct('dresses', {
    name: 'Maxi Dress',
    description: 'Elegant floor-length maxi dress',
    variants: [
      { sku: 'MAXI-S-BLACK', price: 94.99 },
      { sku: 'MAXI-M-NAVY', price: 94.99 },
      { sku: 'MAXI-L-RED', price: 94.99 },
    ],
  });

  await createProduct('dresses', {
    name: 'Cocktail Dress',
    description: 'Sophisticated cocktail dress',
    variants: [
      { sku: 'COCKTAIL-S-BLACK', price: 119.99 },
      { sku: 'COCKTAIL-M-RED', price: 119.99 },
      { sku: 'COCKTAIL-L-NAVY', price: 119.99 },
    ],
  });

  await createProduct('dresses', {
    name: 'Wrap Dress',
    description: 'Flattering wrap style dress',
    variants: [
      { sku: 'WRAP-S-BLUE', price: 84.99 },
      { sku: 'WRAP-M-BLACK', price: 84.99 },
      { sku: 'WRAP-L-RED', price: 84.99 },
    ],
  });

  // WOMEN'S TOPS (4 products)
  await createProduct('tops', {
    name: 'Silk Blouse',
    description: 'Luxurious silk blouse',
    variants: [
      { sku: 'SILK-S-WHITE', price: 69.99 },
      { sku: 'SILK-M-BLACK', price: 69.99 },
      { sku: 'SILK-M-PINK', price: 69.99 },
    ],
  });

  await createProduct('tops', {
    name: 'Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt',
    variants: [
      { sku: 'WTSHIRT-S-WHITE', price: 24.99 },
      { sku: 'WTSHIRT-M-BLACK', price: 24.99 },
      { sku: 'WTSHIRT-M-PINK', price: 24.99 },
    ],
  });

  await createProduct('tops', {
    name: 'Off-Shoulder Top',
    description: 'Trendy off-shoulder top',
    variants: [
      { sku: 'OFFSHOULDER-S-WHITE', price: 44.99 },
      { sku: 'OFFSHOULDER-M-BLACK', price: 44.99 },
      { sku: 'OFFSHOULDER-M-RED', price: 44.99 },
    ],
  });

  await createProduct('tops', {
    name: 'Knit Sweater',
    description: 'Cozy knit sweater',
    variants: [
      { sku: 'SWEATER-S-BEIGE', price: 59.99 },
      { sku: 'SWEATER-M-GRAY', price: 59.99 },
      { sku: 'SWEATER-L-NAVY', price: 59.99 },
    ],
  });

  await createKurtiProduct();

  console.log('Creating Jewelry...');

  // NECKLACES (4 products)
  await createProduct('pendants', {
    name: 'Gold Pendant Necklace',
    description: 'Elegant gold pendant necklace',
    variants: [{ sku: 'GOLDPENDANT-OS', price: 149.99 }],
  });

  await createProduct('pendants', {
    name: 'Silver Heart Pendant',
    description: 'Beautiful silver heart pendant',
    variants: [{ sku: 'SILVERHEART-OS', price: 89.99 }],
  });

  await createProduct('chains', {
    name: 'Gold Chain Necklace',
    description: 'Classic gold chain necklace',
    variants: [{ sku: 'GOLDCHAIN-OS', price: 199.99 }],
  });

  await createProduct('chains', {
    name: 'Silver Chain Necklace',
    description: 'Elegant silver chain',
    variants: [{ sku: 'SILVERCHAIN-OS', price: 129.99 }],
  });

  // EARRINGS (4 products)
  await createProduct('studs', {
    name: 'Diamond Stud Earrings',
    description: 'Sparkling diamond stud earrings',
    variants: [{ sku: 'DIAMONDSTUD-OS', price: 299.99 }],
  });

  await createProduct('studs', {
    name: 'Pearl Stud Earrings',
    description: 'Classic pearl stud earrings',
    variants: [{ sku: 'PEARLSTUD-OS', price: 79.99 }],
  });

  await createProduct('hoops', {
    name: 'Gold Hoop Earrings',
    description: 'Trendy gold hoop earrings',
    variants: [
      { sku: 'GOLDHOOP-SMALL', price: 119.99 },
      { sku: 'GOLDHOOP-MEDIUM', price: 129.99 },
      { sku: 'GOLDHOOP-LARGE', price: 139.99 },
    ],
  });

  await createProduct('hoops', {
    name: 'Silver Hoop Earrings',
    description: 'Classic silver hoop earrings',
    variants: [
      { sku: 'SILVERHOOP-SMALL', price: 89.99 },
      { sku: 'SILVERHOOP-MEDIUM', price: 99.99 },
    ],
  });

  // RINGS (3 products)
  await createProduct('engagement-rings', {
    name: 'Diamond Engagement Ring',
    description: 'Stunning diamond engagement ring',
    variants: [
      { sku: 'ENGAGERING-6', price: 1999.99 },
      { sku: 'ENGAGERING-7', price: 1999.99 },
      { sku: 'ENGAGERING-8', price: 1999.99 },
    ],
  });

  await createProduct('wedding-bands', {
    name: 'Gold Wedding Band',
    description: 'Classic gold wedding band',
    variants: [
      { sku: 'WEDDINGBAND-6', price: 399.99 },
      { sku: 'WEDDINGBAND-7', price: 399.99 },
      { sku: 'WEDDINGBAND-8', price: 399.99 },
    ],
  });

  await createProduct('fashion-rings', {
    name: 'Statement Ring',
    description: 'Bold fashion statement ring',
    variants: [
      { sku: 'STATEMENTRING-6-GOLD', price: 89.99 },
      { sku: 'STATEMENTRING-7-GOLD', price: 89.99 },
      { sku: 'STATEMENTRING-7-SILVER', price: 89.99 },
    ],
  });

  // WATCHES (4 products)
  await createProduct('men-s-watches', {
    name: 'Luxury Automatic Watch',
    description: 'Premium automatic watch for men',
    variants: [
      { sku: 'LUXWATCH-BLACK', price: 899.99 },
      { sku: 'LUXWATCH-SILVER', price: 899.99 },
    ],
  });

  await createProduct('men-s-watches', {
    name: 'Sport Chronograph Watch',
    description: 'Sporty chronograph watch',
    variants: [
      { sku: 'SPORTWATCH-BLACK', price: 299.99 },
      { sku: 'SPORTWATCH-BLUE', price: 299.99 },
    ],
  });

  await createProduct('women-s-watches', {
    name: 'Elegant Fashion Watch',
    description: 'Elegant watch for women',
    variants: [
      { sku: 'ELEGANTWATCH-GOLD', price: 249.99 },
      { sku: 'ELEGANTWATCH-SILVER', price: 249.99 },
    ],
  });

  await createProduct('women-s-watches', {
    name: 'Minimalist Watch',
    description: 'Sleek minimalist watch',
    variants: [
      { sku: 'MINIWATCH-BLACK', price: 179.99 },
      { sku: 'MINIWATCH-WHITE', price: 179.99 },
    ],
  });

  console.log('Creating Accessories...');

  // BAGS (5 products)
  await createProduct('handbags', {
    name: 'Leather Handbag',
    description: 'Luxurious leather handbag',
    variants: [
      { sku: 'HANDBAG-BLACK', price: 199.99 },
      { sku: 'HANDBAG-BROWN', price: 199.99 },
    ],
  });

  await createProduct('backpacks', {
    name: 'Leather Backpack',
    description: 'Stylish leather backpack',
    variants: [
      { sku: 'BACKPACK-BLACK', price: 149.99 },
      { sku: 'BACKPACK-BROWN', price: 149.99 },
    ],
  });

  await createProduct('totes', {
    name: 'Tote Bag',
    description: 'Spacious tote bag',
    variants: [
      { sku: 'TOTE-BLACK', price: 59.99 },
      { sku: 'TOTE-BEIGE', price: 59.99 },
    ],
  });

  // BELTS & WALLETS (4 products)
  await createProduct('belts', {
    name: 'Leather Belt',
    description: 'Classic leather belt',
    variants: [
      { sku: 'BELT-M-BLACK', price: 39.99 },
      { sku: 'BELT-L-BLACK', price: 39.99 },
      { sku: 'BELT-L-BROWN', price: 39.99 },
    ],
  });

  await createProduct('wallets', {
    name: 'Leather Wallet',
    description: 'Premium leather wallet',
    variants: [
      { sku: 'WALLET-BLACK', price: 49.99 },
      { sku: 'WALLET-BROWN', price: 49.99 },
    ],
  });

  console.log(`✅ Created ${productCount} products with ${variantCount} variants`);
  console.log('✅ Fashion products seeding completed!');
}
