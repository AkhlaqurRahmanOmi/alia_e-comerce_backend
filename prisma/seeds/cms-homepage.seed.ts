import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedHomepage() {
  console.log('🌱 Seeding homepage CMS data...');

  // Check if homepage already exists
  const existing = await prisma.homepageSection.findFirst();

  if (existing) {
    console.log('⚠️  Homepage already exists. Updating...');
    await prisma.homepageSection.update({
      where: { id: existing.id },
      data: getHomepageData(),
    });
    console.log('✅ Homepage updated successfully!');
  } else {
    console.log('📝 Creating new homepage...');
    await prisma.homepageSection.create({
      data: getHomepageData(),
    });
    console.log('✅ Homepage created successfully!');
  }

  console.log('🎉 Homepage CMS seeding complete!');
}

function getHomepageData() {
  return {
    // ==================== HEADER ====================
    header: {
      isActive: true,
      topBar: {
        phone: '+254 123 456 789',
        email: 'info@californiawinesby rose.com',
        hours: 'Mon-Sat: 9AM-9PM',
      },
      logo: {
        url: '/images/logo.png',
        alt: 'California Wines By Rose',
      },
      navigation: [
        { label: 'Home', link: '/', active: true },
        { label: 'Shop', link: '/shop', active: true },
        { label: 'About', link: '/about', active: true },
        { label: 'Events', link: '/events', active: true },
        { label: 'Contact', link: '/contact', active: true },
        { label: 'Blog', link: '/blog', active: true },
      ],
      search: {
        enabled: true,
        placeholder: 'Search for wines, spirits...',
      },
      cartIcon: true,
      userMenu: true,
    },

    // ==================== HERO BANNER ====================
    heroBanner: {
      isActive: true,
      slides: [
        {
          id: 1,
          imageUrl: '/images/hero-banner-1.jpg',
          title: 'Discover Sophisticated',
          titleHighlight: 'Wines of California & Washington In Kenya',
          subtitle: 'Experience premium selection from world-renowned vineyards',
          buttons: [
            {
              text: 'Shop Wine',
              link: '/shop',
              variant: 'primary',
              icon: 'wine',
            },
            {
              text: 'New Earth & Wine',
              link: '/shop/new-arrivals',
              variant: 'secondary',
              icon: 'sparkles',
            },
          ],
          buttonRow2: [
            {
              text: 'Download Our App',
              link: '/app',
              variant: 'outline',
              icon: 'download',
            },
          ],
          wineBottles: [
            { position: 'left', image: '/images/bottle-white-wine.png' },
            { position: 'center', image: '/images/bottle-red-wine.png' },
            { position: 'right', image: '/images/bottle-rose-wine.png' },
          ],
        },
        {
          id: 2,
          imageUrl: '/images/hero-banner-2.jpg',
          title: 'Exclusive Summer Collection',
          titleHighlight: 'Limited Time Offer',
          subtitle: 'Up to 50% off on selected premium wines',
          buttons: [
            {
              text: 'Shop Sale',
              link: '/shop/sale',
              variant: 'primary',
            },
            {
              text: 'View Collection',
              link: '/shop/summer',
              variant: 'secondary',
            },
          ],
        },
      ],
      settings: {
        autoplay: true,
        autoplaySpeed: 5000,
        showArrows: true,
        showDots: true,
        pauseOnHover: true,
        animation: 'fade',
      },
    },

    // ==================== FEATURES BAR ====================
    featuresBar: {
      isActive: true,
      features: [
        {
          icon: 'return',
          iconColor: '#8B4513',
          title: '365 DAYS RETURN',
          subtitle: 'Money back guarantee',
          link: '/return-policy',
        },
        {
          icon: 'shipping',
          iconColor: '#8B4513',
          title: 'FREE SHIPPING',
          subtitle: 'On orders over KSh 10,000',
          link: '/shipping-info',
        },
        {
          icon: 'payment',
          iconColor: '#8B4513',
          title: 'SECURED PAYMENT',
          subtitle: '100% secure transactions',
          link: '/payment-security',
        },
        {
          icon: 'support',
          iconColor: '#8B4513',
          title: '24/7 SUPPORT',
          subtitle: 'Dedicated customer service',
          link: '/contact',
        },
      ],
      background: '#F5F5F5',
      layout: 'grid', // or 'horizontal'
    },

    // ==================== OUR STORY ====================
    ourStory: {
      isActive: true,

      // Static About Section
      aboutSection: {
        badge: 'Our Story',
        title: 'About California Wines',
        titleHighlight: 'By Rose',
        description:
          "We're proud to offer a diverse range of over 500 products that cater to all your wine, beer, and liquor needs. At California Wines By Rose, we pride ourselves on providing the finest selection of wines from California and Washington state. Our commitment is to bring you exceptional quality, unparalleled service, and an unforgettable tasting experience.\n\nFrom our curated wine collection to our knowledgeable staff, everything we do is designed to enhance your appreciation of fine wines and spirits. Visit us today and discover why we're Nairobi's premier destination for wine enthusiasts.",
        images: [
          {
            url: '/images/store-interior-1.jpg',
            alt: 'Wine shop interior with extensive collection',
            caption: 'Our Premium Selection',
          },
          {
            url: '/images/store-interior-2.jpg',
            alt: 'Modern wine cellar storage',
            caption: 'Temperature Controlled Storage',
          },
          {
            url: '/images/staff-photo.jpg',
            alt: 'Our expert staff ready to help',
            caption: 'Expert Wine Consultants',
          },
        ],
        cta: {
          text: 'Read More',
          link: '/about',
          variant: 'primary',
        },
        stats: [
          { number: '500+', label: 'Products' },
          { number: '15+', label: 'Years Experience' },
          { number: '10K+', label: 'Happy Customers' },
          { number: '2', label: 'Store Locations' },
        ],
      },

      // Customer Stories Section
      customerStories: {
        enabled: true,
        sectionTitle: 'What Our Customers Say',
        displayLimit: 3,
        stories: [
          {
            id: 1,
            customerName: 'Sarah Kamau',
            customerPhoto: '/images/customer-sarah.jpg',
            customerLocation: 'Westlands, Nairobi',
            storyTitle: 'Exceptional Wine Selection',
            storyContent:
              'I have been a customer for over 3 years and the quality of wines never disappoints. The staff is knowledgeable and always helps me find the perfect bottle for any occasion. California Wines By Rose is my go-to store for premium wines in Nairobi!',
            rating: 5,
            productPurchased: 'California Cabernet Sauvignon 2019',
            date: '2024-11-05',
            featured: true,
            active: true,
          },
          {
            id: 2,
            customerName: 'John Mwangi',
            customerPhoto: '/images/customer-john.jpg',
            customerLocation: 'Karen, Nairobi',
            storyTitle: 'Best Customer Service',
            storyContent:
              'The team at California Wines By Rose went above and beyond to help me select wines for my wedding. They provided tastings and expert recommendations that made our special day even more memorable. Highly recommended!',
            rating: 5,
            productPurchased: 'Washington State Chardonnay 2020',
            date: '2024-10-20',
            featured: true,
            active: true,
          },
          {
            id: 3,
            customerName: 'Grace Ochieng',
            customerPhoto: '/images/customer-grace.jpg',
            customerLocation: 'Kilimani, Nairobi',
            storyTitle: 'Premium Quality Every Time',
            storyContent:
              'As a wine enthusiast, I appreciate the carefully curated collection at California Wines By Rose. Every bottle I purchase is of exceptional quality, and the prices are very competitive. The wine tasting events are also fantastic!',
            rating: 5,
            productPurchased: 'Napa Valley Merlot 2018',
            date: '2024-09-15',
            featured: true,
            active: true,
          },
          {
            id: 4,
            customerName: 'David Otieno',
            customerPhoto: '/images/customer-david.jpg',
            customerLocation: 'Lavington, Nairobi',
            storyTitle: 'Great Experience',
            storyContent:
              'The staff is friendly and the selection is impressive. I found some rare vintages that I had been looking for. Will definitely be coming back!',
            rating: 4,
            productPurchased: 'California Pinot Noir 2021',
            date: '2024-08-10',
            featured: false,
            active: true,
          },
        ],
      },
    },

    // ==================== STORE LOCATIONS ====================
    storeLocations: {
      isActive: true,
      title: 'Visit Our Shops',
      subtitle: 'Experience our premium selection in person',
      locations: [
        {
          id: 1,
          name: 'Wine Shop Karen',
          type: 'flagship',
          mapIframe:
            '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8193!2d36.7522!3d-1.3192!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTknMDkuMCJTIDM2wrA0NScwOC4wIkU!5e0!3m2!1sen!2ske!4v1234567890" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
          description:
            'Our flagship store in Karen offers an extensive wine selection, expert sommeliers, and a premium tasting room. Features include free parking, gift wrapping, and private event hosting.',
        },
        {
          id: 2,
          name: 'Liquor Shop Westlands',
          type: 'retail',
          mapIframe:
            '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.7892!2d36.8039!3d-1.2642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTUnNTEuMCJTIDM2wrA0OCcxNC4wIkU!5e0!3m2!1sen!2ske!4v1234567890" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
          description:
            'Conveniently located in Westlands with ample parking. Quick service, wide selection of spirits and wines, bulk order support, and home delivery available.',
        },
      ],
      deliveryInfo: {
        enabled: true,
        text: 'Free delivery within Nairobi for orders above KSh 10,000',
        link: '/delivery-zones',
      },
    },

    // ==================== FOOTER ====================
    footer: {
      isActive: true,
      logo: {
        url: '/images/logo-light.png',
        alt: 'California Wines By Rose',
      },
      tagline: 'Your trusted partner for premium wines and spirits in Kenya',
      description:
        'Experience the finest selection of wines from California and Washington. Quality, expertise, and exceptional service since 2009.',
      sections: [
        {
          title: 'Shop',
          links: [
            { label: 'All Products', link: '/shop' },
            { label: 'Red Wines', link: '/shop/red-wine' },
            { label: 'White Wines', link: '/shop/white-wine' },
            { label: 'Sparkling Wines', link: '/shop/sparkling' },
            { label: 'Spirits', link: '/shop/spirits' },
            { label: 'Beer', link: '/shop/beer' },
            { label: 'New Arrivals', link: '/shop/new' },
            { label: 'Best Sellers', link: '/shop/bestsellers' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About Us', link: '/about' },
            { label: 'Our Story', link: '/about#story' },
            { label: 'Events', link: '/events' },
            { label: 'Blog', link: '/blog' },
            { label: 'Careers', link: '/careers' },
            { label: 'Contact Us', link: '/contact' },
          ],
        },
        {
          title: 'Customer Service',
          links: [
            { label: 'Help Center', link: '/help' },
            { label: 'Track Order', link: '/track-order' },
            { label: 'Shipping Info', link: '/shipping' },
            { label: 'Returns', link: '/returns' },
            { label: 'Size Guide', link: '/size-guide' },
            { label: 'Gift Cards', link: '/gift-cards' },
          ],
        },
        {
          title: 'Legal',
          links: [
            { label: 'Privacy Policy', link: '/privacy' },
            { label: 'Terms of Service', link: '/terms' },
            { label: 'Cookie Policy', link: '/cookies' },
            { label: 'Age Verification', link: '/age-verification' },
            { label: 'Responsible Drinking', link: '/responsible-drinking' },
          ],
        },
      ],
      newsletter: {
        enabled: true,
        title: 'Subscribe to Our Newsletter',
        subtitle: 'Get exclusive offers, wine tips, and event invitations',
        placeholder: 'Enter your email address',
        buttonText: 'Subscribe',
        privacyText: 'We respect your privacy. Unsubscribe at any time.',
      },
      contact: {
        phone: '+254 712 345 678',
        email: 'info@californiawinesbyrose.com',
        address: 'Ngong Road, Karen, Nairobi, Kenya',
      },
      social: [
        {
          platform: 'facebook',
          url: 'https://facebook.com/californiawinesbyrose',
          icon: 'facebook',
        },
        {
          platform: 'instagram',
          url: 'https://instagram.com/californiawinesbyrose',
          icon: 'instagram',
        },
        {
          platform: 'twitter',
          url: 'https://twitter.com/cawinesbyrose',
          icon: 'twitter',
        },
        {
          platform: 'youtube',
          url: 'https://youtube.com/@californiawinesbyrose',
          icon: 'youtube',
        },
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/company/california-wines-by-rose',
          icon: 'linkedin',
        },
      ],
      paymentMethods: [
        { name: 'Visa', icon: 'visa' },
        { name: 'Mastercard', icon: 'mastercard' },
        { name: 'M-Pesa', icon: 'mpesa' },
        { name: 'PayPal', icon: 'paypal' },
      ],
      certifications: [
        {
          name: 'Licensed by KRA',
          icon: '/images/kra-logo.png',
        },
        {
          name: 'SSL Secured',
          icon: '/images/ssl-badge.png',
        },
      ],
      copyright: '© 2025 California Wines By Rose. All rights reserved.',
      legalText:
        'Drink responsibly. Not for sale to persons under 18 years of age.',
      bottomLinks: [
        { label: 'Sitemap', link: '/sitemap' },
        { label: 'Accessibility', link: '/accessibility' },
      ],
    },
  };
}

// Run seed if called directly
if (require.main === module) {
  seedHomepage()
    .catch((error) => {
      console.error('❌ Error seeding homepage:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
