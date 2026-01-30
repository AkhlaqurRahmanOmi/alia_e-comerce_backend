# CMS API Documentation

## Overview

The CMS (Content Management System) module manages **static homepage sections only**. Dynamic sections (products, events, reviews) use their respective existing APIs.

**Architecture:** `Controller → Service → Provider → Repository → Prisma`

---

## Static Sections Managed by CMS

| Section | Description | Content Type |
|---------|-------------|--------------|
| `header` | Logo, navigation menu, top bar, search | Full content in JSON |
| `heroBanner` | Carousel slides with images, titles, buttons | Full content in JSON |
| `featuresBar` | 4 feature items (365 days return, free shipping, etc.) | Full content in JSON |
| `ourStory` | About section with text and images | Full content in JSON |
| `storeLocations` | Wine Shop & Liquor Shop maps and addresses | Full content in JSON |
| `footer` | Footer links, social media, copyright | Full content in JSON |

---

## Dynamic Sections (Use Existing APIs)

| Section | API Endpoint | Description |
|---------|--------------|-------------|
| Best Sellers | `GET /api/products?sortBy=sales&limit=6` | Top selling products |
| Premium Wines | `GET /api/products?featured=true&category=wines` | Featured wine categories |
| Upcoming Events | `GET /api/events?upcoming=true&limit=3` | Future events (module TBD) |
| Beers & Spirits | `GET /api/products?category=beers-spirits&limit=4` | Beers & spirits products |
| Customer Reviews | `GET /api/reviews?featured=true&limit=4` | Featured customer reviews |

---

## API Endpoints

### 1. Get Homepage (Public)

**Endpoint:** `GET /api/cms/homepage`

**Authentication:** None (Public)

**Cache:** 5 minutes (300000ms)

**Description:** Returns all static homepage sections for frontend display.

**Response:**
```json
{
  "header": {
    "isActive": true,
    "logo": "/logo.png",
    "topBar": {
      "phone": "+254 123 456 789",
      "email": "info@wineshop.com"
    },
    "navigation": [
      { "label": "Home", "link": "/" },
      { "label": "Shop", "link": "/shop" },
      { "label": "About", "link": "/about" }
    ]
  },
  "heroBanner": {
    "isActive": true,
    "slides": [
      {
        "imageUrl": "/images/banner1.jpg",
        "title": "Discover Sophisticated Wines",
        "subtitle": "of California & Washington In Kenya",
        "buttons": [
          { "text": "Shop Wine", "link": "/shop" },
          { "text": "New Earth & Wine", "link": "/new" }
        ]
      }
    ],
    "settings": {
      "autoplay": true,
      "speed": 5000,
      "showArrows": true,
      "showDots": true
    }
  },
  "featuresBar": {
    "isActive": true,
    "features": [
      {
        "icon": "return",
        "title": "365 DAYS RETURN",
        "subtitle": "Money back guarantee"
      },
      {
        "icon": "shipping",
        "title": "FREE SHIPPING",
        "subtitle": "On orders over KSh 10,000"
      },
      {
        "icon": "payment",
        "title": "SECURED PAYMENT",
        "subtitle": "100% secure transactions"
      },
      {
        "icon": "support",
        "title": "24/7 SUPPORT",
        "subtitle": "Dedicated customer service"
      }
    ]
  },
  "ourStory": {
    "isActive": true,
    "title": "Our Story",
    "subtitle": "About California Wines By Rose",
    "content": "California Wines By Rose brings you the finest selection...",
    "images": [
      "/images/story1.jpg",
      "/images/story2.jpg",
      "/images/story3.jpg"
    ]
  },
  "storeLocations": {
    "isActive": true,
    "locations": [
      {
        "name": "Wine Shop",
        "address": "123 Main Street, Nairobi",
        "phone": "+254 123 456 789",
        "hours": "Mon-Sat: 9am-9pm, Sun: 10am-6pm",
        "mapImage": "/images/map-wine-shop.jpg",
        "coordinates": { "lat": -1.2921, "lng": 36.8219 }
      },
      {
        "name": "Liquor Shop",
        "address": "456 Second Avenue, Nairobi",
        "phone": "+254 987 654 321",
        "hours": "Mon-Sat: 10am-10pm, Sun: 12pm-8pm",
        "mapImage": "/images/map-liquor-shop.jpg",
        "coordinates": { "lat": -1.2864, "lng": 36.8172 }
      }
    ]
  },
  "footer": {
    "isActive": true,
    "logo": "/logo.png",
    "description": "California Wines By Rose - Your trusted wine partner",
    "sections": [
      {
        "title": "Shop",
        "links": [
          { "label": "All Products", "link": "/shop" },
          { "label": "New Arrivals", "link": "/shop/new" },
          { "label": "Best Sellers", "link": "/shop/bestsellers" }
        ]
      },
      {
        "title": "Company",
        "links": [
          { "label": "About Us", "link": "/about" },
          { "label": "Contact", "link": "/contact" },
          { "label": "Careers", "link": "/careers" }
        ]
      }
    ],
    "social": [
      { "platform": "facebook", "url": "https://facebook.com/..." },
      { "platform": "instagram", "url": "https://instagram.com/..." },
      { "platform": "twitter", "url": "https://twitter.com/..." }
    ],
    "copyright": "© 2025 California Wines By Rose. All rights reserved.",
    "paymentMethods": ["visa", "mastercard", "mpesa"]
  }
}
```

---

### 2. Get Homepage (Admin)

**Endpoint:** `GET /api/cms/admin/homepage`

**Authentication:** Required (JWT + `cms:read` permission)

**Description:** Returns full homepage database record for admin panel.

**Response:**
```json
{
  "id": 1,
  "header": { ... },
  "heroBanner": { ... },
  "featuresBar": { ... },
  "ourStory": { ... },
  "storeLocations": { ... },
  "footer": { ... },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-12T10:30:00.000Z"
}
```

---

### 3. Update Section (Admin)

**Endpoint:** `PATCH /api/cms/admin/sections/:sectionName`

**Authentication:** Required (JWT + `cms:update` permission)

**Description:** Update a specific static section dynamically.

**Valid Section Names:**
- `header`
- `hero-banner`
- `features-bar`
- `our-story`
- `store-locations`
- `footer`

**Request Body:**
```json
{
  "content": {
    "isActive": true,
    // Section-specific content
  }
}
```

**Example: Update Hero Banner**
```bash
PATCH /api/cms/admin/sections/hero-banner
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": {
    "isActive": true,
    "slides": [
      {
        "imageUrl": "/images/new-banner.jpg",
        "title": "Summer Wine Sale",
        "subtitle": "Up to 50% Off",
        "buttons": [
          { "text": "Shop Now", "link": "/shop" }
        ]
      }
    ],
    "settings": {
      "autoplay": true,
      "speed": 3000
    }
  }
}
```

**Response:**
```json
{
  "section": "hero-banner",
  "content": {
    "isActive": true,
    "slides": [ ... ]
  },
  "updatedAt": "2025-01-12T15:45:00.000Z"
}
```

**Error Responses:**

```json
// Invalid section name
{
  "statusCode": 400,
  "message": "Invalid section name: invalid-section. Valid sections: header, hero-banner, features-bar, our-story, store-locations, footer"
}

// Homepage not configured
{
  "statusCode": 404,
  "message": "Homepage not configured yet"
}

// Missing permissions
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

---

## Database Schema

```prisma
model HomepageSection {
  id              Int      @id @default(autoincrement())

  // STATIC SECTIONS ONLY
  header          Json?    @db.JsonB
  heroBanner      Json?    @db.JsonB
  featuresBar     Json?    @db.JsonB
  ourStory        Json?    @db.JsonB
  storeLocations  Json?    @db.JsonB
  footer          Json?    @db.JsonB

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("homepage_section")
}
```

**Note:** Only **1 row** exists in this table (single homepage configuration).

---

## Frontend Integration

### React Example

```typescript
// hooks/useCmsApi.ts
export const useCmsApi = () => {
  const getHomepage = async () => {
    return fetch('/api/cms/homepage').then(r => r.json());
  };

  const updateSection = async (sectionName: string, content: any) => {
    return fetch(`/api/cms/admin/sections/${sectionName}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    }).then(r => r.json());
  };

  return { getHomepage, updateSection };
};

// Homepage Component
const Homepage = () => {
  const { getHomepage } = useCmsApi();
  const [cms, setCms] = useState<any>(null);

  useEffect(() => {
    getHomepage().then(setCms);
  }, []);

  if (!cms) return <Loading />;

  return (
    <>
      {cms.header?.isActive && <Header data={cms.header} />}
      {cms.heroBanner?.isActive && <HeroBanner data={cms.heroBanner} />}
      {cms.featuresBar?.isActive && <FeaturesBar data={cms.featuresBar} />}

      {/* Dynamic sections use existing APIs */}
      <BestSellers /> {/* Fetches from /api/products */}
      <PremiumWines /> {/* Fetches from /api/products */}

      {cms.ourStory?.isActive && <OurStory data={cms.ourStory} />}
      {cms.storeLocations?.isActive && <StoreLocations data={cms.storeLocations} />}
      {cms.footer?.isActive && <Footer data={cms.footer} />}
    </>
  );
};

// Admin Panel - Banner Editor
const BannerEditor = () => {
  const { updateSection } = useCmsApi();

  const handleSave = async (bannerData: any) => {
    await updateSection('hero-banner', bannerData);
    toast.success('Banner updated successfully!');
  };

  return <BannerForm onSave={handleSave} />;
};
```

---

## Testing with cURL

### Get Homepage (Public)
```bash
curl -X GET http://localhost:3000/api/cms/homepage
```

### Get Homepage (Admin)
```bash
curl -X GET http://localhost:3000/api/cms/admin/homepage \
  -H "Authorization: Bearer <your-token>"
```

### Update Hero Banner
```bash
curl -X PATCH http://localhost:3000/api/cms/admin/sections/hero-banner \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "content": {
      "isActive": true,
      "slides": [
        {
          "imageUrl": "/banner.jpg",
          "title": "New Title",
          "buttons": [{"text": "Shop", "link": "/shop"}]
        }
      ]
    }
  }'
```

---

## Permissions Required

| Endpoint | Permission | Description |
|----------|------------|-------------|
| `GET /cms/homepage` | None | Public access |
| `GET /cms/admin/homepage` | `cms:read` | View all sections |
| `PATCH /cms/admin/sections/:name` | `cms:update` | Update section content |

---

## Best Practices

1. **Always include `isActive` flag** in section content to allow toggling visibility
2. **Validate section content** on frontend before sending to API
3. **Use caching** - public endpoint is cached for 5 minutes
4. **Keep JSON structures consistent** for easier frontend rendering
5. **Upload images to S3** before saving URLs to CMS
6. **Test on staging** before updating production CMS content

---

## Migration & Setup

### 1. Run Migration
```bash
cd wineshop-backend
npx prisma migrate dev --name add_cms_sections
npx prisma generate
```

### 2. Seed Initial Data
```bash
npm run seed:cms
```

### 3. Verify Setup
```bash
# Check if homepage exists
curl http://localhost:3000/api/cms/homepage
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 CMS Module                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  CmsController (HTTP Endpoints)                 │
│         ↓                                       │
│  CmsService (Coordination Facade)               │
│         ↓                                       │
│  HomepageManagementProvider (Business Logic)    │
│         ↓                                       │
│  HomepageSectionRepository (Database Ops)       │
│         ↓                                       │
│  Prisma (ORM)                                   │
│         ↓                                       │
│  PostgreSQL (homepage_section table)            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Homepage not configured yet"
**Solution:** Run seed script or create initial homepage record manually via admin panel.

### Issue: "Invalid section name"
**Solution:** Check valid section names: `header`, `hero-banner`, `features-bar`, `our-story`, `store-locations`, `footer`

### Issue: 403 Forbidden
**Solution:** Ensure user has `cms:update` or `cms:read` permission assigned.

### Issue: Cache not updating
**Solution:** Wait 5 minutes or flush Redis cache for public endpoint.

---

## Changelog

- **2025-01-12**: Initial CMS implementation with 6 static sections
- Dynamic sections moved to respective APIs (products, reviews, events)
- Removed: `bestSellers`, `premiumWines`, `upcomingEvents`, `beersSpirits`, `customerReviews`, `wineLounge`
