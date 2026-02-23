import { PrismaClient } from '../../../src/generated/prisma/client';

export async function seedFashionCategories(prisma: PrismaClient) {
  console.log('👗 Seeding fashion categories...');

  // Helper function to create category with slug
  const createCategory = async (
    name: string,
    description: string,
    parentId: number | null = null,
  ) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return prisma.category.upsert({
      where: { slug },
      update: { name, description, parentId },
      create: { name, description, slug, parentId },
    });
  };

  // ROOT CATEGORIES
  const men = await createCategory('Men', 'Men\'s fashion and accessories');
  const women = await createCategory('Women', 'Women\'s fashion and accessories');
  const kids = await createCategory('Kids', 'Kids fashion and accessories');
  const jewelry = await createCategory('Jewelry', 'Fine jewelry and watches for all');
  const accessories = await createCategory('Accessories', 'Fashion accessories and more');

  console.log('✅ Created 5 root categories');

  // MEN'S CATEGORIES
  const menClothing = await createCategory('Clothing', 'Men\'s clothing', men.id);
  const menShoes = await createCategory('Shoes', 'Men\'s footwear', men.id);
  const menAccessories = await createCategory('Accessories', 'Men\'s accessories', men.id);
  const menJewelry = await createCategory('Jewelry', 'Men\'s jewelry', men.id);

  // Men's Clothing Subcategories
  await createCategory('T-Shirts', 'Men\'s T-shirts and tees', menClothing.id);
  await createCategory('Shirts', 'Men\'s casual and formal shirts', menClothing.id);
  await createCategory('Pants', 'Men\'s pants and trousers', menClothing.id);
  await createCategory('Jeans', 'Men\'s jeans and denim', menClothing.id);
  await createCategory('Jackets', 'Men\'s jackets and coats', menClothing.id);
  await createCategory('Suits', 'Men\'s suits and blazers', menClothing.id);
  await createCategory('Sweaters', 'Men\'s sweaters and hoodies', menClothing.id);
  await createCategory('Shorts', 'Men\'s shorts', menClothing.id);

  // Men's Shoes Subcategories
  await createCategory('Sneakers', 'Men\'s sneakers and athletic shoes', menShoes.id);
  await createCategory('Boots', 'Men\'s boots', menShoes.id);
  await createCategory('Formal Shoes', 'Men\'s dress shoes', menShoes.id);
  await createCategory('Loafers', 'Men\'s loafers and slip-ons', menShoes.id);

  // Men's Accessories Subcategories
  await createCategory('Belts', 'Men\'s belts', menAccessories.id);
  await createCategory('Wallets', 'Men\'s wallets', menAccessories.id);
  await createCategory('Bags', 'Men\'s bags and backpacks', menAccessories.id);
  await createCategory('Ties', 'Men\'s ties and bow ties', menAccessories.id);

  // Men's Jewelry Subcategories
  await createCategory('Watches', 'Men\'s watches', menJewelry.id);
  await createCategory('Bracelets', 'Men\'s bracelets', menJewelry.id);
  await createCategory('Rings', 'Men\'s rings', menJewelry.id);

  console.log('✅ Created men\'s categories');

  // WOMEN'S CATEGORIES
  const womenClothing = await createCategory('Clothing', 'Women\'s clothing', women.id);
  const womenShoes = await createCategory('Shoes', 'Women\'s footwear', women.id);
  const womenAccessories = await createCategory('Accessories', 'Women\'s accessories', women.id);
  const womenJewelry = await createCategory('Jewelry', 'Women\'s jewelry', women.id);

  // Women's Clothing Subcategories
  await createCategory('Dresses', 'Women\'s dresses', womenClothing.id);
  await createCategory('Tops', 'Women\'s tops and blouses', womenClothing.id);
  await createCategory('Skirts', 'Women\'s skirts', womenClothing.id);
  await createCategory('Pants', 'Women\'s pants and trousers', womenClothing.id);
  await createCategory('Jeans', 'Women\'s jeans and denim', womenClothing.id);
  await createCategory('Outerwear', 'Women\'s jackets and coats', womenClothing.id);
  await createCategory('Activewear', 'Women\'s activewear and sportswear', womenClothing.id);
  await createCategory('Sweaters', 'Women\'s sweaters and cardigans', womenClothing.id);

  // Women's Shoes Subcategories
  await createCategory('Heels', 'Women\'s heels and pumps', womenShoes.id);
  await createCategory('Flats', 'Women\'s flats and ballet shoes', womenShoes.id);
  await createCategory('Sneakers', 'Women\'s sneakers', womenShoes.id);
  await createCategory('Boots', 'Women\'s boots', womenShoes.id);
  await createCategory('Sandals', 'Women\'s sandals', womenShoes.id);

  // Women's Accessories Subcategories
  await createCategory('Bags', 'Women\'s handbags and purses', womenAccessories.id);
  await createCategory('Scarves', 'Women\'s scarves', womenAccessories.id);
  await createCategory('Hats', 'Women\'s hats and caps', womenAccessories.id);
  await createCategory('Sunglasses', 'Women\'s sunglasses', womenAccessories.id);

  // Women's Jewelry Subcategories
  await createCategory('Necklaces', 'Women\'s necklaces', womenJewelry.id);
  await createCategory('Earrings', 'Women\'s earrings', womenJewelry.id);
  await createCategory('Bracelets', 'Women\'s bracelets', womenJewelry.id);
  await createCategory('Rings', 'Women\'s rings', womenJewelry.id);

  console.log('✅ Created women\'s categories');

  // KIDS CATEGORIES
  const boys = await createCategory('Boys', 'Boys fashion (0-12 years)', kids.id);
  const girls = await createCategory('Girls', 'Girls fashion (0-12 years)', kids.id);

  // Boys Subcategories
  const boysClothing = await createCategory('Clothing', 'Boys clothing', boys.id);
  const boysShoes = await createCategory('Shoes', 'Boys shoes', boys.id);
  await createCategory('T-Shirts', 'Boys T-shirts', boysClothing.id);
  await createCategory('Pants', 'Boys pants', boysClothing.id);
  await createCategory('Jeans', 'Boys jeans', boysClothing.id);
  await createCategory('Sneakers', 'Boys sneakers', boysShoes.id);
  await createCategory('Sandals', 'Boys sandals', boysShoes.id);

  // Girls Subcategories
  const girlsClothing = await createCategory('Clothing', 'Girls clothing', girls.id);
  const girlsShoes = await createCategory('Shoes', 'Girls shoes', girls.id);
  await createCategory('Dresses', 'Girls dresses', girlsClothing.id);
  await createCategory('Tops', 'Girls tops', girlsClothing.id);
  await createCategory('Pants', 'Girls pants', girlsClothing.id);
  await createCategory('Jeans', 'Girls jeans', girlsClothing.id);
  await createCategory('Sneakers', 'Girls sneakers', girlsShoes.id);
  await createCategory('Sandals', 'Girls sandals', girlsShoes.id);

  console.log('✅ Created kids categories');

  // JEWELRY MAIN CATEGORIES (Complete Collection)
  const necklaces = await createCategory('Necklaces', 'Necklaces and chains for all', jewelry.id);
  const earrings = await createCategory('Earrings', 'Earrings for all occasions', jewelry.id);
  const bracelets = await createCategory('Bracelets', 'Bracelets and bangles', jewelry.id);
  const rings = await createCategory('Rings', 'Rings for every style', jewelry.id);
  const watches = await createCategory('Watches', 'Luxury and fashion watches', jewelry.id);

  // Necklaces Subcategories
  await createCategory('Pendants', 'Pendant necklaces', necklaces.id);
  await createCategory('Chains', 'Chain necklaces', necklaces.id);
  await createCategory('Chokers', 'Choker necklaces', necklaces.id);

  // Earrings Subcategories
  await createCategory('Studs', 'Stud earrings', earrings.id);
  await createCategory('Hoops', 'Hoop earrings', earrings.id);
  await createCategory('Drop Earrings', 'Drop and dangle earrings', earrings.id);

  // Bracelets Subcategories
  await createCategory('Bangles', 'Bangle bracelets', bracelets.id);
  await createCategory('Chain Bracelets', 'Chain bracelets', bracelets.id);

  // Rings Subcategories
  await createCategory('Engagement Rings', 'Engagement rings', rings.id);
  await createCategory('Wedding Bands', 'Wedding bands', rings.id);
  await createCategory('Fashion Rings', 'Fashion and statement rings', rings.id);

  // Watches Subcategories
  await createCategory('Men\'s Watches', 'Men\'s luxury and sport watches', watches.id);
  await createCategory('Women\'s Watches', 'Women\'s fashion and elegant watches', watches.id);

  console.log('✅ Created jewelry categories');

  // ACCESSORIES MAIN CATEGORIES
  const bags = await createCategory('Bags', 'All types of bags', accessories.id);
  const belts = await createCategory('Belts', 'Belts for all', accessories.id);
  const walletsAcc = await createCategory('Wallets', 'Wallets and cardholders', accessories.id);
  const scarvesAcc = await createCategory('Scarves', 'Scarves and wraps', accessories.id);
  const hatsAcc = await createCategory('Hats', 'Hats and caps', accessories.id);

  // Bags Subcategories
  await createCategory('Handbags', 'Handbags and purses', bags.id);
  await createCategory('Backpacks', 'Backpacks and daypacks', bags.id);
  await createCategory('Totes', 'Tote bags', bags.id);
  await createCategory('Crossbody', 'Crossbody bags', bags.id);

  console.log('✅ Created accessories categories');

  const totalCategories = await prisma.category.count();
  console.log(`✅ Total categories in database: ${totalCategories}`);
  console.log('✅ Fashion categories seeding completed!');
}
