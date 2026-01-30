import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Parent Categories
    const electronics = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: { name: 'Electronics', slug: 'electronics' },
    });

    const clothing = await prisma.category.upsert({
        where: { slug: 'clothing' },
        update: {},
        create: { name: 'Clothing', slug: 'clothing' },
    });

    const home = await prisma.category.upsert({
        where: { slug: 'home-garden' },
        update: {},
        create: { name: 'Home & Garden', slug: 'home-garden' },
    });

    // Electronics Subcategories
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
        create: { name: 'Audio', slug: 'audio', parentId: electronics.id },
    });

    // Laptop Subcategories
    const gamingLaptops = await prisma.category.upsert({
        where: { slug: 'gaming-laptops' },
        update: {},
        create: { name: 'Gaming Laptops', slug: 'gaming-laptops', parentId: laptops.id },
    });

    const businessLaptops = await prisma.category.upsert({
        where: { slug: 'business-laptops' },
        update: {},
        create: { name: 'Business Laptops', slug: 'business-laptops', parentId: laptops.id },
    });

    // Clothing Subcategories
    const menClothing = await prisma.category.upsert({
        where: { slug: 'men-clothing' },
        update: {},
        create: { name: 'Men\'s Clothing', slug: 'men-clothing', parentId: clothing.id },
    });

    const womenClothing = await prisma.category.upsert({
        where: { slug: 'women-clothing' },
        update: {},
        create: { name: 'Women\'s Clothing', slug: 'women-clothing', parentId: clothing.id },
    });

    const shoes = await prisma.category.upsert({
        where: { slug: 'shoes' },
        update: {},
        create: { name: 'Shoes', slug: 'shoes', parentId: clothing.id },
    });

    // Home Subcategories
    const kitchen = await prisma.category.upsert({
        where: { slug: 'kitchen' },
        update: {},
        create: { name: 'Kitchen', slug: 'kitchen', parentId: home.id },
    });

    const fitness = await prisma.category.upsert({
        where: { slug: 'fitness' },
        update: {},
        create: { name: 'Fitness', slug: 'fitness', parentId: home.id },
    });

    // Products
    const phone = await prisma.product.upsert({
        where: { seoSlug: 'iphone-15-pro' },
        update: {},
        create: {
            name: 'iPhone 15 Pro',
            seoSlug: 'iphone-15-pro',
            description: 'Latest iPhone with titanium design and A17 Pro chip'
        },
    });

    const gamingLaptop = await prisma.product.upsert({
        where: { seoSlug: 'asus-rog-gaming-laptop' },
        update: {},
        create: {
            name: 'ASUS ROG Gaming Laptop',
            seoSlug: 'asus-rog-gaming-laptop',
            description: 'High-performance gaming laptop with RTX 4080'
        },
    });

    const businessLaptop = await prisma.product.upsert({
        where: { seoSlug: 'thinkpad-x1-carbon' },
        update: {},
        create: {
            name: 'ThinkPad X1 Carbon',
            seoSlug: 'thinkpad-x1-carbon',
            description: 'Ultra-lightweight business laptop'
        },
    });

    const headphones = await prisma.product.upsert({
        where: { seoSlug: 'sony-wh1000xm5' },
        update: {},
        create: {
            name: 'Sony WH-1000XM5',
            seoSlug: 'sony-wh1000xm5',
            description: 'Premium noise-canceling headphones'
        },
    });

    const cottonTshirt = await prisma.product.upsert({
        where: { seoSlug: 'organic-cotton-tshirt' },
        update: {},
        create: {
            name: 'Organic Cotton T-Shirt',
            seoSlug: 'organic-cotton-tshirt',
            description: '100% organic cotton comfortable t-shirt'
        },
    });

    const jeans = await prisma.product.upsert({
        where: { seoSlug: 'premium-denim-jeans' },
        update: {},
        create: {
            name: 'Premium Denim Jeans',
            seoSlug: 'premium-denim-jeans',
            description: 'High-quality denim jeans with perfect fit'
        },
    });

    const sneakers = await prisma.product.upsert({
        where: { seoSlug: 'nike-air-max' },
        update: {},
        create: {
            name: 'Nike Air Max',
            seoSlug: 'nike-air-max',
            description: 'Comfortable running sneakers with air cushioning'
        },
    });

    const coffeeMaker = await prisma.product.upsert({
        where: { seoSlug: 'breville-espresso-machine' },
        update: {},
        create: {
            name: 'Breville Espresso Machine',
            seoSlug: 'breville-espresso-machine',
            description: 'Professional-grade espresso machine for home'
        },
    });

    const yogaMat = await prisma.product.upsert({
        where: { seoSlug: 'eco-yoga-mat' },
        update: {},
        create: {
            name: 'Eco-Friendly Yoga Mat',
            seoSlug: 'eco-yoga-mat',
            description: 'Non-slip yoga mat made from natural rubber'
        },
    });

    // Product Categories
    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: phone.id, categoryId: smartphones.id } },
        update: {},
        create: { productId: phone.id, categoryId: smartphones.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: gamingLaptop.id, categoryId: gamingLaptops.id } },
        update: {},
        create: { productId: gamingLaptop.id, categoryId: gamingLaptops.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: businessLaptop.id, categoryId: businessLaptops.id } },
        update: {},
        create: { productId: businessLaptop.id, categoryId: businessLaptops.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: headphones.id, categoryId: audio.id } },
        update: {},
        create: { productId: headphones.id, categoryId: audio.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: cottonTshirt.id, categoryId: menClothing.id } },
        update: {},
        create: { productId: cottonTshirt.id, categoryId: menClothing.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: jeans.id, categoryId: menClothing.id } },
        update: {},
        create: { productId: jeans.id, categoryId: menClothing.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: sneakers.id, categoryId: shoes.id } },
        update: {},
        create: { productId: sneakers.id, categoryId: shoes.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: coffeeMaker.id, categoryId: kitchen.id } },
        update: {},
        create: { productId: coffeeMaker.id, categoryId: kitchen.id },
    });

    await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: yogaMat.id, categoryId: fitness.id } },
        update: {},
        create: { productId: yogaMat.id, categoryId: fitness.id },
    });

    // Basic variants for testing
    await prisma.variant.upsert({
        where: { sku: 'IPHONE-15-PRO-128' },
        update: {},
        create: { productId: phone.id, sku: 'IPHONE-15-PRO-128', price: 999.99 },
    });

    await prisma.variant.upsert({
        where: { sku: 'COTTON-TSHIRT-M' },
        update: {},
        create: { productId: cottonTshirt.id, sku: 'COTTON-TSHIRT-M', price: 29.99 },
    });

    console.log('✅ Hierarchical catalog seeding completed');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });