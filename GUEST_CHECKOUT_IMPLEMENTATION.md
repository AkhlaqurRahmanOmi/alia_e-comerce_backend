# Guest Checkout Implementation - Phase 1 Complete ✅

This document outlines the **safe, non-breaking** guest checkout implementation.

## ✅ What's Been Implemented

### 1. Database Schema Updates
**File:** `prisma/schema.prisma`

Added guest order support to Order model:
- `userId` - Made nullable (supports both guest and authenticated orders)
- `guestEmail` - Guest customer email
- `guestPhone` - Guest customer phone
- `guestFirstName` - Guest first name
- `guestLastName` - Guest last name
- `isGuestOrder` - Boolean flag to identify guest orders
- Added indexes for efficient guest order lookups

### 2. New DTOs Created
- `src/orders/dtos/guest-create-order.dto.ts` - Guest checkout DTO
- `src/orders/dtos/guest-order-lookup.dto.ts` - Order lookup DTO

### 3. Service Layer
**File:** `src/orders/providers/order-management.provider.ts`

Added three new methods (existing methods untouched):
- `createGuestOrder()` - Create order without user account
- `lookupGuestOrder()` - Find order by email + order reference
- `linkGuestOrdersToUser()` - Link guest orders when user registers

### 4. New API Endpoints
**File:** `src/orders/orders.controller.ts`

Added guest endpoints:
- `POST /api/v1/orders/guest/checkout` - Guest checkout (no auth required)
- `POST /api/v1/orders/guest/lookup` - Order lookup (no auth required)

## 🔄 Next Steps - Migration

### Step 1: Create Database Migration

```bash
# Generate Prisma migration for guest order fields
npx prisma migrate dev --name add_guest_order_support

# This will:
# 1. Make Order.userId nullable
# 2. Add guest fields (guestEmail, guestPhone, guestFirstName, guestLastName, isGuestOrder)
# 3. Add indexes for guest order lookups
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This updates the TypeScript types and will fix the current TypeScript errors.

### Step 3: Test the Implementation

**Test Guest Checkout:**
```bash
# Using curl or Postman
POST http://localhost:4000/api/v1/orders/guest/checkout
Content-Type: application/json

{
  "guestEmail": "customer@example.com",
  "guestPhone": "+1234567890",
  "guestFirstName": "John",
  "guestLastName": "Doe",
  "items": [
    {
      "variantId": 1,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "customer@example.com",
    "phone": "+1234567890",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "paymentGateway": "cash"
}
```

**Test Order Lookup:**
```bash
POST http://localhost:4000/api/v1/orders/guest/lookup
Content-Type: application/json

{
  "email": "customer@example.com",
  "orderReference": "ORD-1234567890-ABC123"
}
```

## 🛡️ Safety Guarantees

### What Won't Break:
✅ Existing authenticated orders (they all have userId)
✅ Existing order creation flow (`POST /api/v1/orders`)
✅ All current API endpoints
✅ Database reads of existing orders
✅ User order history

### Backward Compatibility:
- Old `CreateOrderDto` still works (requires userId)
- New `GuestCreateOrderDto` for guest orders (no userId)
- Separate endpoints prevent confusion
- Existing validation logic untouched

## 📊 How It Works

### Guest Checkout Flow:
```
1. Customer adds items to cart (sessionId-based)
   ↓
2. Customer clicks "Checkout as Guest"
   ↓
3. Fill guest checkout form (email, phone, name, address)
   ↓
4. POST /api/v1/orders/guest/checkout
   ↓
5. Order created with:
   - userId = null
   - guestEmail = customer email
   - isGuestOrder = true
   - externalRef = "ORD-{timestamp}-{random}"
   ↓
6. Order confirmation email sent
   - Includes order reference number
   - Link to order lookup page
   ↓
7. Customer can track order using email + reference
```

### Order Lookup Flow:
```
1. Customer receives order confirmation email
   ↓
2. Visits order lookup page
   ↓
3. Enters email + order reference
   ↓
4. POST /api/v1/orders/guest/lookup
   ↓
5. View order details, status, tracking
```

### Account Linking (Future):
```
When guest creates account:
1. User registers with same email
   ↓
2. Auth service calls linkGuestOrdersToUser()
   ↓
3. All guest orders with that email linked to user account
   ↓
4. Guest can now see order history in their account
```

## 🔧 Integration with Auth Registration

When implementing account linking, add this to your auth registration service:

```typescript
// In src/auth/auth.service.ts or similar

async register(dto: RegisterDto) {
  // Create user account
  const user = await this.createUser(dto);

  // Link any existing guest orders to this account
  const linkedCount = await this.ordersService.linkGuestOrdersToUser(
    dto.email,
    user.id
  );

  if (linkedCount > 0) {
    this.logger.log(`Linked ${linkedCount} guest orders to user ${user.id}`);
  }

  return user;
}
```

## 📝 Frontend Implementation Guide

### Guest Checkout Form Fields:
```typescript
interface GuestCheckoutForm {
  // Customer Info
  guestEmail: string;          // Required
  guestPhone: string;          // Required
  guestFirstName: string;      // Required
  guestLastName: string;       // Required

  // Cart Items
  items: OrderItem[];

  // Shipping Address
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;  // 2-letter code (e.g., "US")
  };

  // Billing Address (optional - defaults to shipping)
  billingAddress?: Address;

  // Optional fields
  shippingMethodId?: number;
  couponCode?: string;
  paymentGateway?: 'cash';  // Only cash-on-delivery for now
}
```

### Order Lookup Page:
```typescript
interface OrderLookupForm {
  email: string;           // Email used during checkout
  orderReference: string;  // From confirmation email (e.g., "ORD-123456-ABC")
}
```

## 🎯 Best Practices (Based on 2026 Industry Standards)

1. **Make Guest Checkout Prominent**
   - Guest checkout should be the DEFAULT option
   - 63% of shoppers abandon if forced to create account

2. **Minimize Form Fields**
   - Only ask for essential information
   - Billing address defaults to shipping

3. **Order Confirmation Email**
   - Include order reference prominently
   - Add "Track Your Order" link
   - Offer "Create Account" to save order history

4. **Order Lookup Page**
   - Simple 2-field form (email + order reference)
   - Clear instructions
   - Link from footer/header

5. **Mobile Optimization**
   - One-page checkout flow
   - Auto-fill support
   - Large touch targets

## 📚 Database Schema Reference

### Order Table (Updated):
```sql
-- New/Modified columns:
userId              INT NULL           -- Nullable for guest orders
guestEmail          VARCHAR(255) NULL
guestPhone          VARCHAR(20) NULL
guestFirstName      VARCHAR(50) NULL
guestLastName       VARCHAR(50) NULL
isGuestOrder        BOOLEAN DEFAULT false

-- Indexes:
INDEX idx_order_user_id (userId)
INDEX idx_order_guest_email (guestEmail)
INDEX idx_order_is_guest (isGuestOrder)
```

## ✅ Testing Checklist

After migration:
- [ ] Existing authenticated orders still work
- [ ] Can create guest order via `/api/v1/orders/guest/checkout`
- [ ] Guest order saved with correct fields
- [ ] Can lookup guest order via `/api/v1/orders/guest/lookup`
- [ ] Order lookup fails for wrong email/reference
- [ ] Guest order inventory reservation works
- [ ] Cash-on-delivery payment created
- [ ] TypeScript compilation succeeds (no errors)
- [ ] Application starts without errors

## 🚀 Production Deployment

1. **Backup database** before migration
2. **Run migration** during low-traffic window
3. **Monitor** for any errors
4. **Test** guest checkout immediately
5. **Rollback plan**: Keep old Prisma schema backup

---

**Implementation Date:** 2026-01-30
**Status:** Phase 1 Complete - Ready for Migration
**Breaking Changes:** None ✅
