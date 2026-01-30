# Wine Shop E-Commerce API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Common Response Formats](#common-response-formats)
- [Error Codes](#error-codes)
- [API Endpoints](#api-endpoints)
  - [App & Health](#1-app--health)
  - [Authentication](#2-authentication)
  - [User Management](#3-user-management)
  - [Products & Catalog](#4-products--catalog)
  - [Shopping Cart](#5-shopping-cart)
  - [Orders](#6-orders)
  - [Reviews](#7-reviews)
  - [Payments](#8-payments)
  - [Shipping](#9-shipping)
  - [Coupons](#10-coupons)
  - [Bundles](#11-bundles)
  - [Inventory](#12-inventory)
  - [Notifications](#13-notifications)
  - [Blog](#14-blog)
  - [CMS](#15-cms)
  - [Countries](#16-countries)
  - [RBAC](#17-rbac)
  - [Reports](#18-reports)
  - [Bookings & Reservations](#19-bookings--reservations)

---

## Overview

### Base URL
```
http://localhost:4000/api/v1
```

### API Versioning
- **Type**: URI-based versioning
- **Current Version**: v1
- **Format**: `/api/v1/*`

### Content Type
```
Content-Type: application/json
```

### Date Format
All dates are in ISO 8601 format:
```
2025-11-19T15:30:00.000Z
```

---

## Authentication

### Authentication Types

#### 1. No Authentication (Public Endpoints)
No headers required for public endpoints like product browsing, category listing, etc.

#### 2. Bearer Token Authentication
For protected endpoints, include JWT token in Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Getting Access Token

**Endpoint**: `POST /auth/sign-in`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["CUSTOMER"],
    "permissions": ["orders:view", "orders:create"]
  }
}
```

### Permissions System

The API uses a role-based access control (RBAC) system with granular permissions:

**Common Roles**:
- `ADMIN` - Administrator with full access (94 permissions)
- `MANAGER` - Manager with limited admin access (46 permissions)
- `CUSTOMER` - Regular user (24 permissions)

**Permission Format**: `resource:action`

**All Permissions** (94 total):
- **Addresses**: `addresses:create`, `addresses:read`, `addresses:update`, `addresses:delete`
- **Bundles**: `bundles:create`, `bundles:read`, `bundles:update`, `bundles:delete`
- **Carts**: `carts:create`, `carts:read`, `carts:update`, `carts:delete`
- **Categories**: `categories:create`, `categories:read`, `categories:update`, `categories:delete`
- **Coupons**: `coupons:create`, `coupons:view`, `coupons:update`, `coupons:delete`, `coupons:activate`, `coupons:deactivate`, `coupons:assign`
- **Inventory**: `inventory:create`, `inventory:view`, `inventory:update`, `inventory:delete`, `inventory:adjust`, `inventory:transfer`
- **Notifications**: `notifications:create`, `notifications:view`, `notifications:update`, `notifications:delete`, `notifications:send`
- **Orders**: `orders:create`, `orders:view`, `orders:update`, `orders:delete`, `orders:cancel`, `orders:refund`, `orders:approve`
- **Payments**: `payments:create`, `payments:read`, `payments:update`, `payments:delete`
- **Products**: `products:create`, `products:read`, `products:update`, `products:delete`
- **Reports**: `reports:read`, `reports:view`
- **Reviews**: `reviews:create`, `reviews:read`, `reviews:update`, `reviews:delete`, `reviews:approve`, `reviews:reject`
- **Shipping**: `shipping:create`, `shipping:view`, `shipping:update`, `shipping:delete`
- **Users**: `users:create`, `users:view`, `users:update`, `users:delete`, `users:assign-roles`, `users:remove-roles`
- **Wishlists**: `wishlists:create`, `wishlists:read`, `wishlists:update`, `wishlists:delete`
- **Blog**: `blog:create`, `blog:view`, `blog:update`, `blog:delete`, `blog:publish`
- **CMS**: `cms:read`, `cms:update`, `cms:manage`
- **Countries**: `countries:create`, `countries:read`, `countries:update`, `countries:delete`
- **Roles**: `roles:create`, `roles:view`, `roles:read`, `roles:update`, `roles:delete`, `roles:assign`
- **Permissions**: `permissions:create`, `permissions:read`, `permissions:update`, `permissions:delete`

---

## Common Response Formats

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "timestamp": "2025-11-19T15:30:00.000Z",
  "traceId": "abc123"
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "links": {
    "first": "/api/v1/products?page=1",
    "previous": null,
    "next": "/api/v1/products?page=2",
    "last": "/api/v1/products?page=10"
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-11-19T15:30:00.000Z",
  "path": "/api/v1/products",
  "traceId": "abc123",
  "details": [
    {
      "field": "price",
      "message": "price must be a positive number"
    }
  ]
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Description | Common Scenarios |
|------|-------------|------------------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (email, SKU, etc.) |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Server-side errors |

---

## API Endpoints

## 1. App & Health

### Root Endpoint
**GET** `/`

**Authentication**: None

**Purpose**: Health check

**Success Response** (200):
```json
{
  "message": "Wine Shop API is running",
  "version": "1.0.0"
}
```

---

### Test S3 Upload
**POST** `/test-s3`

**Authentication**: None

**Purpose**: Test S3 connection and upload

**Request Body**: Multipart form with file

**Success Response** (200):
```json
{
  "message": "File uploaded successfully",
  "url": "https://s3.amazonaws.com/bucket/filename.jpg"
}
```

---

## 2. Authentication

### Register New User
**POST** `/auth/register`

**Authentication**: None

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (201):
```json
{
  "message": "Registration successful. Please check your email for OTP verification.",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isVerified": false
  }
}
```

---

### Verify Email with OTP
**POST** `/auth/verify-otp`

**Authentication**: None

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Success Response** (200):
```json
{
  "message": "Email verified successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Resend OTP
**POST** `/auth/resend-otp`

**Authentication**: None

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "OTP sent successfully"
}
```

---

### Sign In
**POST** `/auth/sign-in`

**Authentication**: None

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["CUSTOMER"],
    "permissions": ["orders:view", "orders:create"]
  }
}
```

---

### Refresh Tokens
**POST** `/auth/refresh-tokens`

**Authentication**: None

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Logout
**POST** `/auth/logout`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### Request Password Reset
**POST** `/auth/request-password-reset`

**Authentication**: None

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset email sent"
}
```

---

### Reset Password
**POST** `/auth/reset-password`

**Authentication**: None

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset successful"
}
```

---

### Google OAuth Authentication
**POST** `/google-authentication/authenticate`

**Authentication**: None

**Request Body**:
```json
{
  "token": "google_oauth_token"
}
```

**Success Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john.doe@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "provider": "google"
  }
}
```

---

## 3. User Management

### Get Current User Profile
**GET** `/user/profile`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "isVerified": true,
  "roles": ["CUSTOMER"],
  "permissions": ["orders:view", "orders:create"],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get All Users (Admin)
**GET** `/user/all`

**Authentication**: Bearer Token
**Required Permission**: `users:view`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email
- `role` (optional): Filter by role
- `isVerified` (optional): Filter by verification status

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true,
      "roles": [
        {
          "id": 1,
          "name": "CUSTOMER"
        }
      ],
      "permissions": ["orders:view", "orders:create"],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### Get User By ID (Admin)
**GET** `/user/:id`

**Authentication**: Bearer Token
**Required Permission**: `users:view`

**Success Response** (200):
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "isVerified": true,
  "roles": ["CUSTOMER"],
  "permissions": ["orders:view", "orders:create"],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update User (Admin)
**PUT** `/user/:id`
**PATCH** `/user/:id`

**Authentication**: Bearer Token
**Required Permission**: `users:update`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890"
}
```

**Success Response** (200):
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Delete User (Admin)
**DELETE** `/user/:id`

**Authentication**: Bearer Token
**Required Permission**: `users:delete`

**Success Response** (200):
```json
{
  "message": "User deleted successfully"
}
```

---

## 4. Products & Catalog

### List All Products
**GET** `/catalog/products`

**Authentication**: None

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name, description, or SKU
- `categoryId` (optional): Filter by category ID
- `countryId` (optional): Filter by country ID
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `inStock` (optional): Filter by stock availability (true/false)
- `sortBy` (optional): Sort field (name, price, createdAt)
- `sortOrder` (optional): Sort order (asc, desc)
- `featured` (optional): Filter featured products (true/false)
- `status` (optional): Filter by status (active, draft, archived)

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Premium Red Wine",
      "slug": "premium-red-wine",
      "description": "A rich and full-bodied red wine",
      "shortDescription": "Premium red wine with complex flavors",
      "sku": "PRW-001",
      "price": 29.99,
      "compareAtPrice": 39.99,
      "costPrice": 15.00,
      "trackQuantity": true,
      "continueSellingWhenOutOfStock": false,
      "requiresShipping": true,
      "taxable": true,
      "weight": 750,
      "weightUnit": "g",
      "status": "active",
      "visibility": "visible",
      "availableForSale": true,
      "tags": ["wine", "red", "premium"],
      "seoTitle": "Premium Red Wine - Best Quality",
      "seoDescription": "Buy premium red wine online",
      "featured": true,
      "countryId": 1,
      "country": {
        "id": 1,
        "code": "FR",
        "name": "France"
      },
      "images": [
        {
          "id": 1,
          "url": "https://s3.amazonaws.com/bucket/wine1.jpg",
          "altText": "Premium Red Wine Bottle",
          "position": 1
        }
      ],
      "variants": [
        {
          "id": 1,
          "sku": "PRW-001-750ML",
          "price": 29.99,
          "compareAtPrice": 39.99,
          "costPrice": 15.00,
          "position": 1,
          "inventoryQuantity": 100
        }
      ],
      "categories": [
        {
          "id": 1,
          "name": "Red Wine",
          "slug": "red-wine"
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-11-19T15:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### Search Products
**GET** `/catalog/products/search`

**Authentication**: None

**Query Parameters**:
- `q` (required): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `categoryId` (optional): Filter by category ID
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter

**Success Response** (200): Same format as List All Products

---

### Get Product By ID
**GET** `/catalog/products/:id`

**Authentication**: None

**Success Response** (200): Full product details (same structure as list, single object)

---

### Get Product Variants
**GET** `/catalog/products/:id/variants`

**Authentication**: None

**Success Response** (200):
```json
{
  "variants": [
    {
      "id": 1,
      "productId": 1,
      "sku": "PRW-001-750ML",
      "price": 29.99,
      "compareAtPrice": 39.99,
      "costPrice": 15.00,
      "position": 1,
      "inventoryQuantity": 100,
      "weight": 750,
      "weightUnit": "g"
    }
  ]
}
```

---

### Get Product Images
**GET** `/catalog/products/:id/images`

**Authentication**: None

**Success Response** (200):
```json
{
  "images": [
    {
      "id": 1,
      "productId": 1,
      "url": "https://s3.amazonaws.com/bucket/wine1.jpg",
      "altText": "Premium Red Wine Bottle",
      "position": 1
    }
  ]
}
```

---

### Get Product Options
**GET** `/catalog/products/:id/options`

**Authentication**: None

**Success Response** (200):
```json
{
  "options": [
    {
      "id": 1,
      "productId": 1,
      "name": "Size",
      "position": 1,
      "values": [
        {
          "id": 1,
          "value": "750ml"
        }
      ]
    }
  ]
}
```

---

### Get Variant By ID
**GET** `/catalog/variants/:id`

**Authentication**: None

**Success Response** (200):
```json
{
  "id": 1,
  "productId": 1,
  "sku": "PRW-001-750ML",
  "price": 29.99,
  "compareAtPrice": 39.99,
  "costPrice": 15.00,
  "position": 1,
  "inventoryQuantity": 100,
  "product": {
    "id": 1,
    "name": "Premium Red Wine"
  }
}
```

---

### Get Variant Inventory
**GET** `/catalog/variants/:id/inventory`

**Authentication**: None

**Success Response** (200):
```json
{
  "variantId": 1,
  "totalQuantity": 100,
  "availableQuantity": 85,
  "reservedQuantity": 15
}
```

---

### Get Categories
**GET** `/catalog/categories`

**Authentication**: None

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `parentId` (optional): Filter by parent category

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Red Wine",
      "slug": "red-wine",
      "description": "Collection of red wines",
      "parentId": null,
      "position": 1,
      "isActive": true,
      "productCount": 45
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  }
}
```

---

### Get Category By ID
**GET** `/catalog/categories/:id`

**Authentication**: None

**Success Response** (200):
```json
{
  "id": 1,
  "name": "Red Wine",
  "slug": "red-wine",
  "description": "Collection of red wines",
  "parentId": null,
  "position": 1,
  "isActive": true,
  "productCount": 45
}
```

---

### Get Category Products
**GET** `/catalog/categories/:id/products`

**Authentication**: None

**Query Parameters**: Same as List All Products

**Success Response** (200): Same format as List All Products

---

### Create Product (Admin)
**POST** `/catalog/products`

**Authentication**: Bearer Token
**Required Permission**: `products:create`

**Request Body**:
```json
{
  "name": "Premium Red Wine",
  "description": "A rich and full-bodied red wine",
  "shortDescription": "Premium red wine with complex flavors",
  "sku": "PRW-001",
  "price": 29.99,
  "compareAtPrice": 39.99,
  "costPrice": 15.00,
  "trackQuantity": true,
  "continueSellingWhenOutOfStock": false,
  "requiresShipping": true,
  "taxable": true,
  "weight": 750,
  "weightUnit": "g",
  "status": "active",
  "visibility": "visible",
  "tags": ["wine", "red", "premium"],
  "seoTitle": "Premium Red Wine - Best Quality",
  "seoDescription": "Buy premium red wine online",
  "featured": true,
  "countryId": 1,
  "categoryIds": [1, 2]
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "name": "Premium Red Wine",
  "slug": "premium-red-wine",
  "sku": "PRW-001",
  "price": 29.99,
  "status": "active",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Product (Admin)
**PATCH** `/catalog/products/:id`

**Authentication**: Bearer Token
**Required Permission**: `products:update`

**Request Body**: Partial product update (same fields as create, all optional)

**Success Response** (200): Updated product object

---

### Delete Product (Admin)
**DELETE** `/catalog/products/:id`

**Authentication**: Bearer Token
**Required Permission**: `products:delete`

**Success Response** (200):
```json
{
  "message": "Product deleted successfully"
}
```

---

### Publish Product (Admin)
**POST** `/catalog/products/:id/publish`

**Authentication**: Bearer Token
**Required Permission**: `products:update`

**Success Response** (200):
```json
{
  "message": "Product published successfully",
  "product": {
    "id": 1,
    "status": "active"
  }
}
```

---

### Unpublish Product (Admin)
**POST** `/catalog/products/:id/unpublish`

**Authentication**: Bearer Token
**Required Permission**: `products:update`

**Success Response** (200):
```json
{
  "message": "Product unpublished successfully",
  "product": {
    "id": 1,
    "status": "draft"
  }
}
```

---

### Create Product Variant (Admin)
**POST** `/catalog/products/:id/variants`

**Authentication**: Bearer Token
**Required Permission**: `products:create`

**Request Body**:
```json
{
  "sku": "PRW-001-1L",
  "price": 39.99,
  "compareAtPrice": 49.99,
  "costPrice": 20.00,
  "inventoryQuantity": 50,
  "weight": 1000,
  "weightUnit": "g"
}
```

**Success Response** (201):
```json
{
  "id": 2,
  "productId": 1,
  "sku": "PRW-001-1L",
  "price": 39.99,
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Variant (Admin)
**PATCH** `/catalog/variants/:id`

**Authentication**: Bearer Token
**Required Permission**: `products:update`

**Request Body**: Partial variant update

**Success Response** (200): Updated variant object

---

### Delete Variant (Admin)
**DELETE** `/catalog/variants/:id`

**Authentication**: Bearer Token
**Required Permission**: `products:delete`

**Success Response** (200):
```json
{
  "message": "Variant deleted successfully"
}
```

---

### Create Category (Admin)
**POST** `/catalog/categories`

**Authentication**: Bearer Token
**Required Permission**: `categories:create`

**Request Body**:
```json
{
  "name": "White Wine",
  "slug": "white-wine",
  "description": "Collection of white wines",
  "parentId": null,
  "position": 2,
  "isActive": true
}
```

**Success Response** (201):
```json
{
  "id": 2,
  "name": "White Wine",
  "slug": "white-wine",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Category (Admin)
**PATCH** `/catalog/categories/:id`

**Authentication**: Bearer Token
**Required Permission**: `categories:update`

**Request Body**: Partial category update

**Success Response** (200): Updated category object

---

### Delete Category (Admin)
**DELETE** `/catalog/categories/:id`

**Authentication**: Bearer Token
**Required Permission**: `categories:delete`

**Success Response** (200):
```json
{
  "message": "Category deleted successfully"
}
```

---

### Add Product Image (Admin)
**POST** `/catalog/products/:id/images`

**Authentication**: Bearer Token
**Required Permission**: `products:create`

**Request Body**: Multipart form with image file

**Success Response** (201):
```json
{
  "id": 1,
  "productId": 1,
  "url": "https://s3.amazonaws.com/bucket/image.jpg",
  "altText": "Product Image",
  "position": 1
}
```

---

### Delete Product Image (Admin)
**DELETE** `/catalog/products/:productId/images/:imageId`

**Authentication**: Bearer Token
**Required Permission**: `products:delete`

**Success Response** (200):
```json
{
  "message": "Image deleted successfully"
}
```

---

### Create Product Option (Admin)
**POST** `/catalog/products/:id/options`

**Authentication**: Bearer Token
**Required Permission**: `products:create`

**Request Body**:
```json
{
  "name": "Size",
  "position": 1,
  "values": ["750ml", "1L"]
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "productId": 1,
  "name": "Size",
  "position": 1
}
```

---

### Create Complete Product (Admin)
**POST** `/catalog/products/complete`

**Authentication**: Bearer Token
**Required Permission**: `products:create`

**Request Body**:
```json
{
  "name": "Premium Red Wine",
  "description": "A rich and full-bodied red wine",
  "price": 29.99,
  "variants": [
    {
      "sku": "PRW-001-750ML",
      "price": 29.99,
      "inventoryQuantity": 100
    }
  ],
  "options": [
    {
      "name": "Size",
      "values": ["750ml"]
    }
  ],
  "categoryIds": [1]
}
```

**Success Response** (201): Complete product with variants and options

---

### Get My Wishlist
**GET** `/catalog/wishlists/me`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "variantId": 1,
      "variant": {
        "id": 1,
        "sku": "PRW-001-750ML",
        "price": 29.99,
        "product": {
          "id": 1,
          "name": "Premium Red Wine",
          "images": [...]
        }
      },
      "addedAt": "2025-11-19T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-11-01T00:00:00.000Z"
}
```

---

### Get Wishlist Item Count
**GET** `/catalog/wishlists/me/count`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "count": 5
}
```

---

### Add Item to Wishlist
**POST** `/catalog/wishlists/items`

**Authentication**: Bearer Token

**Request Body**:
```json
{
  "variantId": 1
}
```

**Success Response** (201):
```json
{
  "message": "Item added to wishlist",
  "item": {
    "id": 1,
    "variantId": 1,
    "addedAt": "2025-11-19T15:30:00.000Z"
  }
}
```

---

### Remove Item from Wishlist
**DELETE** `/catalog/wishlists/items/:id`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "message": "Item removed from wishlist"
}
```

---

### Clear Wishlist
**DELETE** `/catalog/wishlist/clear`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "message": "Wishlist cleared successfully"
}
```

---

## 5. Shopping Cart

### Get Current Cart
**GET** `/cart/current`

**Authentication**: None (supports session or user cart)

**Success Response** (200):
```json
{
  "id": 1,
  "userId": 1,
  "sessionId": null,
  "status": "active",
  "items": [
    {
      "id": 1,
      "cartId": 1,
      "variantId": 1,
      "bundleId": null,
      "quantity": 2,
      "variant": {
        "id": 1,
        "sku": "PRW-001-750ML",
        "price": 29.99,
        "product": {
          "id": 1,
          "name": "Premium Red Wine",
          "images": [...]
        }
      }
    }
  ],
  "createdAt": "2025-11-19T10:00:00.000Z",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get Cart By ID
**GET** `/cart/:id`

**Authentication**: None

**Success Response** (200): Same as Get Current Cart

---

### Get Cart with Stock Info
**GET** `/cart/:id/stock-info`

**Authentication**: None

**Success Response** (200):
```json
{
  "cart": { ... },
  "stockInfo": [
    {
      "itemId": 1,
      "variantId": 1,
      "requestedQuantity": 2,
      "availableQuantity": 100,
      "inStock": true
    }
  ]
}
```

---

### Get Cart Summary
**GET** `/cart/:id/summary`

**Authentication**: None

**Query Parameters**:
- `discount` (optional): Discount amount
- `taxRate` (optional): Tax rate (e.g., 0.0825 for 8.25%)
- `shippingAmount` (optional): Shipping cost

**Success Response** (200):
```json
{
  "subtotal": 59.98,
  "discount": 0,
  "subtotalAfterDiscount": 59.98,
  "tax": 4.95,
  "shipping": 9.99,
  "total": 74.92,
  "itemCount": 2,
  "items": [
    {
      "variantId": 1,
      "quantity": 2,
      "unitPrice": 29.99,
      "lineTotal": 59.98
    }
  ]
}
```

---

### Add Item to Cart
**POST** `/cart/:id/items`

**Authentication**: None

**Request Body**:
```json
{
  "variantId": 1,
  "quantity": 2
}
```

**Success Response** (201):
```json
{
  "message": "Item added to cart",
  "cart": {
    "id": 1,
    "itemCount": 3
  }
}
```

---

### Update Cart Item
**PATCH** `/cart/:id/items/:itemId`

**Authentication**: None

**Request Body**:
```json
{
  "quantity": 3
}
```

**Success Response** (200):
```json
{
  "message": "Cart item updated",
  "item": {
    "id": 1,
    "quantity": 3
  }
}
```

---

### Remove Cart Item
**DELETE** `/cart/:id/items/:itemId`

**Authentication**: None

**Success Response** (200):
```json
{
  "message": "Item removed from cart"
}
```

---

### Clear Cart
**DELETE** `/cart/:id/items`

**Authentication**: None

**Success Response** (200):
```json
{
  "message": "Cart cleared successfully"
}
```

---

### Validate Cart
**POST** `/cart/:id/validate`

**Authentication**: None

**Success Response** (200):
```json
{
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

---

### Merge Cart
**POST** `/cart/merge`

**Authentication**: Bearer Token

**Request Body**:
```json
{
  "sessionCartId": 1
}
```

**Success Response** (200):
```json
{
  "message": "Carts merged successfully",
  "cart": { ... }
}
```

---

### Check Stock
**GET** `/cart/stock-check/:variantId`

**Authentication**: None

**Query Parameters**:
- `quantity` (required): Quantity to check

**Success Response** (200):
```json
{
  "variantId": 1,
  "requestedQuantity": 5,
  "availableQuantity": 100,
  "inStock": true
}
```

---

### Get All Carts (Admin)
**GET** `/admin/carts`

**Authentication**: Bearer Token
**Required Permission**: `carts:read`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (active, abandoned, converted, expired)
- `userId` (optional): Filter by user ID

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "status": "active",
      "itemCount": 3,
      "totalValue": 89.97,
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "lastActivityAt": "2025-11-19T15:00:00.000Z",
      "createdAt": "2025-11-19T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 450,
    "totalPages": 45
  }
}
```

---

### Get Abandoned Carts (Admin)
**GET** `/admin/carts/abandoned`

**Authentication**: Bearer Token
**Required Permission**: `carts:read`

**Query Parameters**:
- `days` (optional): Days since abandonment (default: 1)

**Success Response** (200):
```json
{
  "abandonedCarts": [
    {
      "cartId": 1,
      "userId": 1,
      "userEmail": "john.doe@example.com",
      "itemCount": 3,
      "totalValue": 89.97,
      "lastActivityAt": "2025-11-17T15:00:00.000Z",
      "daysSinceAbandoned": 2
    }
  ],
  "summary": {
    "totalAbandoned": 125,
    "totalValue": 11846.25,
    "averageValue": 94.77
  }
}
```

---

### Get Cart Count (Admin)
**GET** `/admin/carts/count`

**Authentication**: Bearer Token
**Required Permission**: `carts:read`

**Query Parameters**:
- `status` (optional): Filter by status

**Success Response** (200):
```json
{
  "count": 450
}
```

---

### Mark Carts as Abandoned (Admin)
**POST** `/admin/carts/mark-abandoned`

**Authentication**: Bearer Token
**Required Permission**: `carts:update`

**Success Response** (200):
```json
{
  "message": "Marked 25 carts as abandoned",
  "count": 25
}
```

---

### Mark Carts as Expired (Admin)
**POST** `/admin/carts/mark-expired`

**Authentication**: Bearer Token
**Required Permission**: `carts:update`

**Success Response** (200):
```json
{
  "message": "Marked 15 carts as expired",
  "count": 15
}
```

---

### Cleanup Expired Carts (Admin)
**DELETE** `/admin/carts/cleanup-expired`

**Authentication**: Bearer Token
**Required Permission**: `carts:delete`

**Success Response** (200):
```json
{
  "message": "Deleted 15 expired carts",
  "count": 15
}
```

---

## 6. Orders

### Create Order
**POST** `/orders`

**Authentication**: Bearer Token
**Required Permission**: `orders:create`

**Request Body**:
```json
{
  "userId": 1,
  "items": [
    {
      "variantId": 1,
      "quantity": 2
    }
  ],
  "billingAddressId": 1,
  "shippingAddressId": 1,
  "shippingMethodId": 1,
  "couponCode": "SAVE10"
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "userId": 1,
  "orderNumber": "ORD-2025-001",
  "status": "pending",
  "subtotal": 59.98,
  "discount": 6.00,
  "tax": 4.45,
  "shipping": 9.99,
  "total": 68.42,
  "items": [
    {
      "id": 1,
      "variantId": 1,
      "quantity": 2,
      "unitPrice": 29.99,
      "lineTotal": 59.98
    }
  ],
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get User Orders
**GET** `/orders`

**Authentication**: Bearer Token
**Required Permission**: `orders:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-2025-001",
      "status": "delivered",
      "total": 68.42,
      "itemCount": 2,
      "createdAt": "2025-11-19T15:30:00.000Z",
      "deliveredAt": "2025-11-24T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

### Get Order By ID
**GET** `/orders/:id`

**Authentication**: Bearer Token
**Required Permission**: `orders:view`

**Success Response** (200):
```json
{
  "id": 1,
  "userId": 1,
  "orderNumber": "ORD-2025-001",
  "status": "delivered",
  "subtotal": 59.98,
  "discount": 6.00,
  "tax": 4.45,
  "shipping": 9.99,
  "total": 68.42,
  "items": [
    {
      "id": 1,
      "variantId": 1,
      "quantity": 2,
      "unitPrice": 29.99,
      "lineTotal": 59.98,
      "variant": {
        "id": 1,
        "sku": "PRW-001-750ML",
        "product": {
          "id": 1,
          "name": "Premium Red Wine"
        }
      }
    }
  ],
  "billingAddress": { ... },
  "shippingAddress": { ... },
  "payment": {
    "status": "completed",
    "method": "card"
  },
  "createdAt": "2025-11-19T15:30:00.000Z",
  "deliveredAt": "2025-11-24T10:00:00.000Z"
}
```

---

### Cancel Order
**PATCH** `/orders/:id/cancel`

**Authentication**: Bearer Token
**Required Permission**: `orders:cancel`

**Success Response** (200):
```json
{
  "message": "Order cancelled successfully",
  "order": {
    "id": 1,
    "status": "cancelled"
  }
}
```

---

### Get All Orders (Admin)
**GET** `/admin/orders`

**Authentication**: Bearer Token
**Required Permission**: `orders:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `userId` (optional): Filter by user ID
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

**Success Response** (200): Similar to Get User Orders with additional admin fields

---

### Get Order By ID (Admin)
**GET** `/admin/orders/:id`

**Authentication**: Bearer Token
**Required Permission**: `orders:view`

**Success Response** (200): Same as user Get Order By ID with additional admin fields

---

### Update Order Status (Admin)
**PATCH** `/admin/orders/:id/status`

**Authentication**: Bearer Token
**Required Permission**: `orders:update`

**Request Body**:
```json
{
  "status": "shipped",
  "trackingNumber": "1Z999AA10123456784",
  "notes": "Shipped via UPS"
}
```

**Success Response** (200):
```json
{
  "message": "Order status updated",
  "order": {
    "id": 1,
    "status": "shipped",
    "trackingNumber": "1Z999AA10123456784",
    "updatedAt": "2025-11-19T16:00:00.000Z"
  }
}
```

---

## 7. Reviews

### Get All Reviews
**GET** `/reviews`

**Authentication**: None

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (pending, approved, rejected)
- `rating` (optional): Filter by rating (1-5)

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "productId": 1,
      "rating": 5,
      "title": "Excellent wine!",
      "content": "Best wine I've ever tasted...",
      "status": "approved",
      "helpfulCount": 15,
      "user": {
        "firstName": "John",
        "lastName": "D."
      },
      "images": [
        {
          "id": 1,
          "imageUrl": "https://example.com/review1.jpg"
        }
      ],
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### Get Review By ID
**GET** `/reviews/:id`

**Authentication**: None

**Success Response** (200): Single review object (same structure as list item)

---

### Get Product Reviews
**GET** `/reviews/products/:productId`

**Authentication**: None
**Caching**: 300 seconds

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `rating` (optional): Filter by rating
- `sortBy` (optional): Sort field (createdAt, rating, helpful)

**Success Response** (200): Same format as Get All Reviews

---

### Get Product Review Statistics
**GET** `/reviews/products/:productId/statistics`

**Authentication**: None

**Success Response** (200):
```json
{
  "productId": 1,
  "totalReviews": 150,
  "averageRating": 4.5,
  "ratingDistribution": {
    "5": 80,
    "4": 45,
    "3": 15,
    "2": 7,
    "1": 3
  }
}
```

---

### Get My Reviews
**GET** `/reviews/my-reviews`

**Authentication**: Bearer Token

**Success Response** (200): Same format as Get All Reviews

---

### Create Review
**POST** `/reviews`

**Authentication**: Bearer Token
**Required Permission**: `reviews:create`

**Request Body**:
```json
{
  "productId": 1,
  "rating": 5,
  "title": "Great wine!",
  "content": "Loved this wine. Will buy again!"
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "userId": 1,
  "productId": 1,
  "rating": 5,
  "title": "Great wine!",
  "content": "Loved this wine. Will buy again!",
  "status": "pending",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Review
**PATCH** `/reviews/:id`

**Authentication**: Bearer Token
**Required Permission**: `reviews:update`

**Request Body**:
```json
{
  "rating": 4,
  "title": "Updated title",
  "content": "Updated content"
}
```

**Success Response** (200): Updated review object

---

### Delete Review
**DELETE** `/reviews/:id`

**Authentication**: Bearer Token
**Required Permission**: `reviews:delete`

**Success Response** (200):
```json
{
  "message": "Review deleted successfully"
}
```

---

### Upload Review Images
**POST** `/reviews/:id/images`

**Authentication**: Bearer Token
**Required Permission**: `reviews:create`

**Request Body**: Multipart form with image files

**Success Response** (201):
```json
{
  "message": "Images uploaded successfully",
  "images": [
    {
      "id": 1,
      "reviewId": 1,
      "imageUrl": "https://example.com/review-image.jpg"
    }
  ]
}
```

---

### Delete Review Image
**DELETE** `/reviews/:reviewId/images/:imageId`

**Authentication**: Bearer Token
**Required Permission**: `reviews:delete`

**Success Response** (200):
```json
{
  "message": "Image deleted successfully"
}
```

---

### Update Review Status (Admin)
**PATCH** `/reviews/:id/status`

**Authentication**: Bearer Token
**Required Permission**: `reviews:approve`

**Request Body**:
```json
{
  "status": "approved"
}
```

**Success Response** (200):
```json
{
  "message": "Review status updated",
  "review": {
    "id": 1,
    "status": "approved"
  }
}
```

---

## 8. Payments

### Initiate Payment
**POST** `/payments/initiate`

**Authentication**: None

**Request Body**:
```json
{
  "orderId": 1,
  "gateway": "pesapal",
  "amount": 68.42,
  "currency": "USD",
  "returnUrl": "https://example.com/payment/success",
  "cancelUrl": "https://example.com/payment/cancel"
}
```

**Success Response** (200):
```json
{
  "transactionId": "TXN-123456",
  "paymentUrl": "https://payment-gateway.com/checkout/...",
  "expiresAt": "2025-11-19T16:30:00.000Z"
}
```

---

### Verify Payment
**POST** `/payments/verify`

**Authentication**: None

**Request Body**:
```json
{
  "transactionId": "TXN-123456"
}
```

**Success Response** (200):
```json
{
  "transactionId": "TXN-123456",
  "status": "completed",
  "orderId": 1,
  "amount": 68.42,
  "currency": "USD",
  "verifiedAt": "2025-11-19T15:35:00.000Z"
}
```

---

### Get Payment
**GET** `/payments/:transactionId`

**Authentication**: None

**Success Response** (200):
```json
{
  "transactionId": "TXN-123456",
  "orderId": 1,
  "gateway": "pesapal",
  "status": "completed",
  "amount": 68.42,
  "currency": "USD",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get Order Payments
**GET** `/payments/order/:orderId`

**Authentication**: None

**Success Response** (200):
```json
{
  "payments": [
    {
      "transactionId": "TXN-123456",
      "gateway": "pesapal",
      "status": "completed",
      "amount": 68.42,
      "currency": "USD",
      "createdAt": "2025-11-19T15:30:00.000Z"
    }
  ]
}
```

---

### Get Available Payment Gateways
**GET** `/payments`

**Authentication**: None

**Success Response** (200):
```json
{
  "gateways": [
    {
      "id": "pesapal",
      "name": "Pesapal",
      "isActive": true,
      "supportedCurrencies": ["USD", "KES"]
    },
    {
      "id": "mpesa",
      "name": "M-Pesa",
      "isActive": true,
      "supportedCurrencies": ["KES"]
    }
  ]
}
```

---

### Pesapal Callback
**POST** `/payments/callback/pesapal`

**Authentication**: None

**Purpose**: IPN callback from Pesapal gateway (webhook)

---

### M-Pesa Callback
**POST** `/payments/callback/mpesa`

**Authentication**: None

**Purpose**: Payment callback from M-Pesa gateway (webhook)

---

## 9. Shipping

### Get Active Shipping Methods
**GET** `/shipping/active`

**Authentication**: None

**Success Response** (200):
```json
{
  "shippingMethods": [
    {
      "id": 1,
      "name": "Standard Shipping",
      "description": "3-5 business days",
      "estimatedDays": "3-5",
      "baseRate": 9.99,
      "freeShippingThreshold": 100,
      "isActive": true
    },
    {
      "id": 2,
      "name": "Express Shipping",
      "description": "1-2 business days",
      "estimatedDays": "1-2",
      "baseRate": 19.99,
      "freeShippingThreshold": null,
      "isActive": true
    }
  ]
}
```

---

### Calculate All Shipping Rates
**POST** `/shipping/calculate-all`

**Authentication**: None

**Request Body**:
```json
{
  "subtotal": 85.50,
  "weight": 4.5
}
```

**Success Response** (200):
```json
{
  "rates": [
    {
      "shippingMethodId": 1,
      "name": "Standard Shipping",
      "rate": 9.99,
      "estimatedDays": "3-5",
      "isFreeShipping": false
    },
    {
      "shippingMethodId": 2,
      "name": "Express Shipping",
      "rate": 19.99,
      "estimatedDays": "1-2",
      "isFreeShipping": false
    }
  ]
}
```

---

### Calculate Shipping Rate
**POST** `/shipping/calculate`

**Authentication**: None

**Request Body**:
```json
{
  "shippingMethodId": 1,
  "subtotal": 85.50,
  "weight": 4.5
}
```

**Success Response** (200):
```json
{
  "shippingMethodId": 1,
  "name": "Standard Shipping",
  "rate": 9.99,
  "estimatedDays": "3-5",
  "isFreeShipping": false
}
```

---

### Get Cheapest Shipping Option
**POST** `/shipping/cheapest`

**Authentication**: None

**Request Body**:
```json
{
  "subtotal": 85.50,
  "weight": 4.5
}
```

**Success Response** (200):
```json
{
  "shippingMethodId": 1,
  "name": "Standard Shipping",
  "rate": 9.99,
  "estimatedDays": "3-5"
}
```

---

### Get Fastest Shipping Option
**POST** `/shipping/fastest`

**Authentication**: None

**Request Body**:
```json
{
  "subtotal": 85.50,
  "weight": 4.5
}
```

**Success Response** (200):
```json
{
  "shippingMethodId": 2,
  "name": "Express Shipping",
  "rate": 19.99,
  "estimatedDays": "1-2"
}
```

---

### Get All Shipping Methods (Admin)
**GET** `/shipping`

**Authentication**: Bearer Token
**Required Permission**: `shipping:view`

**Success Response** (200):
```json
{
  "shippingMethods": [
    {
      "id": 1,
      "name": "Standard Shipping",
      "description": "3-5 business days",
      "estimatedDays": "3-5",
      "baseRate": 9.99,
      "freeShippingThreshold": 100,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Shipping Method By ID (Admin)
**GET** `/shipping/:id`

**Authentication**: Bearer Token
**Required Permission**: `shipping:view`

**Success Response** (200): Single shipping method object

---

### Create Shipping Method (Admin)
**POST** `/shipping`

**Authentication**: Bearer Token
**Required Permission**: `shipping:create`

**Request Body**:
```json
{
  "name": "Next Day Delivery",
  "description": "Guaranteed next day delivery",
  "estimatedDays": "1",
  "baseRate": 29.99,
  "freeShippingThreshold": null,
  "isActive": true
}
```

**Success Response** (201):
```json
{
  "id": 3,
  "name": "Next Day Delivery",
  "baseRate": 29.99,
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Shipping Method (Admin)
**PATCH** `/shipping/:id`

**Authentication**: Bearer Token
**Required Permission**: `shipping:update`

**Request Body**: Partial shipping method update

**Success Response** (200): Updated shipping method object

---

### Delete Shipping Method (Admin)
**DELETE** `/shipping/:id`

**Authentication**: Bearer Token
**Required Permission**: `shipping:delete`

**Success Response** (200):
```json
{
  "message": "Shipping method deleted successfully"
}
```

---

### Toggle Active Status (Admin)
**PATCH** `/shipping/:id/toggle`

**Authentication**: Bearer Token
**Required Permission**: `shipping:update`

**Success Response** (200):
```json
{
  "message": "Shipping method status toggled",
  "isActive": false
}
```

---

## 10. Coupons

### Validate Coupon
**POST** `/coupons/validate`

**Authentication**: Bearer Token

**Request Body**:
```json
{
  "code": "SAVE20",
  "orderAmount": 150,
  "productIds": [1, 2],
  "categoryIds": [1]
}
```

**Success Response** (200):
```json
{
  "isValid": true,
  "coupon": {
    "id": 1,
    "code": "SAVE20",
    "discountType": "percentage",
    "discountAmount": 20
  },
  "calculatedDiscount": 30.00,
  "finalAmount": 120.00,
  "message": "Coupon is valid"
}
```

---

### Apply Coupon
**POST** `/coupons/apply`

**Authentication**: Bearer Token

**Request Body**:
```json
{
  "code": "SAVE20",
  "orderId": 1
}
```

**Success Response** (200):
```json
{
  "message": "Coupon applied successfully",
  "discount": 30.00
}
```

---

### Get My Available Coupons
**GET** `/coupons/my-coupons`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "code": "SAVE20",
      "discountType": "percentage",
      "discountAmount": 20,
      "minOrderAmount": 100,
      "endDate": "2025-12-31T23:59:59.000Z",
      "isUsed": false,
      "remainingUses": 1
    }
  ]
}
```

---

### Create Coupon (Admin)
**POST** `/coupons`

**Authentication**: Bearer Token
**Required Permission**: `coupons:create`

**Request Body**:
```json
{
  "code": "SAVE20",
  "discountType": "percentage",
  "discountAmount": 20,
  "minOrderAmount": 100,
  "maxUses": 1000,
  "maxUsesPerUser": 1,
  "isActive": true,
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.000Z"
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "code": "SAVE20",
  "discountType": "percentage",
  "discountAmount": 20,
  "isActive": true,
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get All Coupons (Admin)
**GET** `/coupons/all`

**Authentication**: Bearer Token
**Required Permission**: `coupons:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `isActive` (optional): Filter by active status

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "code": "SAVE20",
      "discountType": "percentage",
      "discountAmount": 20,
      "minOrderAmount": 100,
      "maxUses": 1000,
      "currentUses": 245,
      "isActive": true,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Get Coupon By ID (Admin)
**GET** `/coupons/:id`

**Authentication**: Bearer Token
**Required Permission**: `coupons:view`

**Success Response** (200): Single coupon object with full details

---

### Update Coupon (Admin)
**PUT** `/coupons/:id`

**Authentication**: Bearer Token
**Required Permission**: `coupons:update`

**Request Body**: Partial coupon update

**Success Response** (200): Updated coupon object

---

### Delete Coupon (Admin)
**DELETE** `/coupons/:id`

**Authentication**: Bearer Token
**Required Permission**: `coupons:delete`

**Success Response** (200):
```json
{
  "message": "Coupon deleted successfully"
}
```

---

### Activate Coupon (Admin)
**PATCH** `/coupons/:id/activate`

**Authentication**: Bearer Token
**Required Permission**: `coupons:update`

**Success Response** (200):
```json
{
  "message": "Coupon activated",
  "coupon": {
    "id": 1,
    "isActive": true
  }
}
```

---

### Deactivate Coupon (Admin)
**PATCH** `/coupons/:id/deactivate`

**Authentication**: Bearer Token
**Required Permission**: `coupons:update`

**Success Response** (200):
```json
{
  "message": "Coupon deactivated",
  "coupon": {
    "id": 1,
    "isActive": false
  }
}
```

---

### Assign Coupon to Products (Admin)
**POST** `/coupons/:id/products`

**Authentication**: Bearer Token
**Required Permission**: `coupons:assign`

**Request Body**:
```json
{
  "productIds": [1, 2, 3]
}
```

**Success Response** (200):
```json
{
  "message": "Coupon assigned to 3 products"
}
```

---

### Remove Coupon from Products (Admin)
**DELETE** `/coupons/:id/products/batch`

**Authentication**: Bearer Token
**Required Permission**: `coupons:assign`

**Request Body**:
```json
{
  "productIds": [1, 2]
}
```

**Success Response** (200):
```json
{
  "message": "Coupon removed from 2 products"
}
```

---

### Assign Coupon to Categories (Admin)
**POST** `/coupons/:id/categories`

**Authentication**: Bearer Token
**Required Permission**: `coupons:assign`

**Request Body**:
```json
{
  "categoryIds": [1, 2]
}
```

**Success Response** (200):
```json
{
  "message": "Coupon assigned to 2 categories"
}
```

---

### Assign Coupon to Users (Admin)
**POST** `/coupons/:id/users`

**Authentication**: Bearer Token
**Required Permission**: `coupons:assign`

**Request Body**:
```json
{
  "userIds": [1, 2, 3]
}
```

**Success Response** (200):
```json
{
  "message": "Coupon assigned to 3 users"
}
```

---

### Get Coupon Redemption History (Admin)
**GET** `/coupons/:id/redemptions`

**Authentication**: Bearer Token
**Required Permission**: `coupons:view`

**Success Response** (200):
```json
{
  "redemptions": [
    {
      "orderId": 1,
      "userId": 1,
      "discountAmount": 30.00,
      "redeemedAt": "2025-11-19T15:30:00.000Z"
    }
  ],
  "totalRedemptions": 245,
  "totalDiscountGiven": 7350.00
}
```

---

### Get Coupon Statistics (Admin)
**GET** `/coupons/:id/stats`

**Authentication**: Bearer Token
**Required Permission**: `coupons:view`

**Success Response** (200):
```json
{
  "couponId": 1,
  "code": "SAVE20",
  "totalUses": 245,
  "maxUses": 1000,
  "utilizationRate": 24.5,
  "totalDiscountGiven": 7350.00,
  "averageDiscountPerUse": 30.00
}
```

---

## 11. Bundles

### Get All Bundles
**GET** `/bundles`

**Authentication**: None
**Caching**: 300 seconds

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `isActive` (optional): Filter active bundles

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Wine Tasting Bundle",
      "description": "3 premium wines for tasting",
      "bundlePrice": 79.99,
      "regularPrice": 99.97,
      "savings": 19.98,
      "savingsPercent": 20.0,
      "isActive": true,
      "items": [
        {
          "id": 1,
          "variantId": 1,
          "quantity": 1,
          "variant": {
            "id": 1,
            "sku": "PRW-001-750ML",
            "price": 29.99,
            "product": {
              "name": "Premium Red Wine"
            }
          }
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

### Get Active Bundles
**GET** `/bundles/active`

**Authentication**: None
**Caching**: 300 seconds

**Success Response** (200): Same format as Get All Bundles, filtered for active only

---

### Get Bundle By ID
**GET** `/bundles/:id`

**Authentication**: None

**Success Response** (200): Single bundle object with full details

---

### Check Bundle Availability
**GET** `/bundles/:id/availability`

**Authentication**: None

**Success Response** (200):
```json
{
  "bundleId": 1,
  "isAvailable": true,
  "items": [
    {
      "variantId": 1,
      "requiredQuantity": 1,
      "availableQuantity": 100,
      "inStock": true
    }
  ]
}
```

---

### Get Bundle Pricing
**GET** `/bundles/:id/pricing`

**Authentication**: None

**Success Response** (200):
```json
{
  "bundleId": 1,
  "bundlePrice": 79.99,
  "regularPrice": 99.97,
  "savings": 19.98,
  "savingsPercent": 20.0
}
```

---

### Get Bundle Suggestions for Variant
**GET** `/bundles/suggestions/variant/:variantId`

**Authentication**: None

**Success Response** (200):
```json
{
  "suggestions": [
    {
      "id": 1,
      "name": "Wine Tasting Bundle",
      "bundlePrice": 79.99,
      "savings": 19.98
    }
  ]
}
```

---

### Get Bundle Suggestions (Batch)
**POST** `/bundles/suggestions/batch`

**Authentication**: None

**Request Body**:
```json
{
  "variantIds": [1, 2, 3]
}
```

**Success Response** (200):
```json
{
  "suggestions": [
    {
      "id": 1,
      "name": "Wine Tasting Bundle",
      "matchedVariants": [1, 2],
      "savings": 19.98
    }
  ]
}
```

---

### Get Cart-Based Bundle Recommendations
**POST** `/bundles/suggestions/cart`

**Authentication**: None

**Request Body**:
```json
{
  "cartId": 1
}
```

**Success Response** (200):
```json
{
  "recommendations": [
    {
      "id": 1,
      "name": "Wine Tasting Bundle",
      "bundlePrice": 79.99,
      "potentialSavings": 19.98
    }
  ]
}
```

---

### Get Bundles Sorted by Savings
**GET** `/bundles/sorted/savings`

**Authentication**: None

**Query Parameters**:
- `limit` (optional): Number of results

**Success Response** (200):
```json
{
  "bundles": [
    {
      "id": 1,
      "name": "Wine Tasting Bundle",
      "bundlePrice": 79.99,
      "savings": 19.98,
      "savingsPercent": 20.0
    }
  ]
}
```

---

### Get Bundles Sorted by Savings Percentage
**GET** `/bundles/sorted/savings-percent`

**Authentication**: None

**Query Parameters**:
- `limit` (optional): Number of results

**Success Response** (200): Same format as sorted by savings

---

### Create Bundle (Admin)
**POST** `/bundles`

**Authentication**: Bearer Token
**Required Permission**: `bundles:create`

**Request Body**:
```json
{
  "name": "Wine Tasting Bundle",
  "description": "3 premium wines for tasting",
  "bundlePrice": 79.99,
  "isActive": true,
  "items": [
    {
      "variantId": 1,
      "quantity": 1
    },
    {
      "variantId": 2,
      "quantity": 1
    }
  ]
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "name": "Wine Tasting Bundle",
  "bundlePrice": 79.99,
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Bundle (Admin)
**PATCH** `/bundles/:id`

**Authentication**: Bearer Token
**Required Permission**: `bundles:update`

**Request Body**: Partial bundle update

**Success Response** (200): Updated bundle object

---

### Delete Bundle (Admin)
**DELETE** `/bundles/:id`

**Authentication**: Bearer Token
**Required Permission**: `bundles:delete`

**Success Response** (200):
```json
{
  "message": "Bundle deleted successfully"
}
```

---

### Add Item to Bundle (Admin)
**POST** `/bundles/:id/items`

**Authentication**: Bearer Token
**Required Permission**: `bundles:create`

**Request Body**:
```json
{
  "variantId": 3,
  "quantity": 1
}
```

**Success Response** (201):
```json
{
  "message": "Item added to bundle",
  "item": {
    "id": 3,
    "variantId": 3,
    "quantity": 1
  }
}
```

---

### Remove Item from Bundle (Admin)
**DELETE** `/bundles/:id/items/:itemId`

**Authentication**: Bearer Token
**Required Permission**: `bundles:delete`

**Success Response** (200):
```json
{
  "message": "Item removed from bundle"
}
```

---

## 12. Inventory

### Check Variant Availability
**GET** `/inventory/variants/:variantId/availability`

**Authentication**: None

**Success Response** (200):
```json
{
  "variantId": 1,
  "isAvailable": true,
  "totalQuantity": 100,
  "availableQuantity": 85
}
```

---

### Get Variant Inventory
**GET** `/inventory/variants/:variantId`

**Authentication**: None

**Success Response** (200):
```json
{
  "variantId": 1,
  "totalQuantity": 100,
  "availableQuantity": 85,
  "reservedQuantity": 15,
  "locations": [
    {
      "locationId": 1,
      "locationName": "Main Warehouse",
      "quantity": 70,
      "available": 60,
      "reserved": 10
    },
    {
      "locationId": 2,
      "locationName": "Store Front",
      "quantity": 30,
      "available": 25,
      "reserved": 5
    }
  ]
}
```

---

### Get Variant Total Quantity
**GET** `/inventory/variants/:variantId/total`

**Authentication**: None

**Success Response** (200):
```json
{
  "variantId": 1,
  "totalQuantity": 100
}
```

---

### Get All Locations
**GET** `/inventory/locations`

**Authentication**: None

**Success Response** (200):
```json
{
  "locations": [
    {
      "id": 1,
      "name": "Main Warehouse",
      "address": "123 Warehouse Rd",
      "isActive": true
    }
  ]
}
```

---

### Get Location By ID
**GET** `/inventory/locations/:id`

**Authentication**: None

**Success Response** (200):
```json
{
  "id": 1,
  "name": "Main Warehouse",
  "address": "123 Warehouse Rd",
  "city": "City",
  "country": "US",
  "isActive": true
}
```

---

### Get Location Inventory
**GET** `/inventory/locations/:id/inventory`

**Authentication**: None

**Success Response** (200):
```json
{
  "locationId": 1,
  "locationName": "Main Warehouse",
  "inventory": [
    {
      "variantId": 1,
      "quantity": 70,
      "available": 60,
      "reserved": 10
    }
  ]
}
```

---

### Create Location (Admin)
**POST** `/inventory/locations`

**Authentication**: Bearer Token
**Required Permission**: `inventory:create`

**Request Body**:
```json
{
  "name": "Store Front",
  "address": "456 Main St",
  "city": "City",
  "country": "US",
  "isActive": true
}
```

**Success Response** (201):
```json
{
  "id": 2,
  "name": "Store Front",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Location (Admin)
**PATCH** `/inventory/locations/:id`

**Authentication**: Bearer Token
**Required Permission**: `inventory:update`

**Request Body**: Partial location update

**Success Response** (200): Updated location object

---

### Delete Location (Admin)
**DELETE** `/inventory/locations/:id`

**Authentication**: Bearer Token
**Required Permission**: `inventory:delete`

**Success Response** (200):
```json
{
  "message": "Location deleted successfully"
}
```

---

### Get All Inventory (Admin)
**GET** `/inventory/all`

**Authentication**: Bearer Token
**Required Permission**: `inventory:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `locationId` (optional): Filter by location

**Success Response** (200):
```json
{
  "data": [
    {
      "variantId": 1,
      "locationId": 1,
      "quantity": 70,
      "available": 60,
      "reserved": 10,
      "variant": {
        "sku": "PRW-001-750ML",
        "product": {
          "name": "Premium Red Wine"
        }
      },
      "location": {
        "name": "Main Warehouse"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "totalPages": 50
  }
}
```

---

### Get Low Stock Items (Admin)
**GET** `/inventory/low-stock`

**Authentication**: Bearer Token
**Required Permission**: `inventory:view`

**Query Parameters**:
- `threshold` (optional): Low stock threshold (default: 10)

**Success Response** (200):
```json
{
  "lowStockItems": [
    {
      "variantId": 5,
      "totalQuantity": 8,
      "threshold": 10,
      "variant": {
        "sku": "PRW-005-750ML",
        "product": {
          "name": "Rare Vintage"
        }
      }
    }
  ]
}
```

---

### Adjust Inventory (Admin)
**POST** `/inventory/adjust`

**Authentication**: Bearer Token
**Required Permission**: `inventory:adjust`

**Request Body**:
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 50,
  "type": "addition",
  "reason": "New shipment received",
  "referenceNumber": "PO-2025-001"
}
```

**Success Response** (200):
```json
{
  "message": "Inventory adjusted successfully",
  "movement": {
    "id": 1,
    "variantId": 1,
    "locationId": 1,
    "quantity": 50,
    "type": "addition",
    "newBalance": 120
  }
}
```

---

### Transfer Inventory (Admin)
**POST** `/inventory/transfer`

**Authentication**: Bearer Token
**Required Permission**: `inventory:transfer`

**Request Body**:
```json
{
  "variantId": 1,
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 20,
  "reason": "Restock store front"
}
```

**Success Response** (200):
```json
{
  "message": "Inventory transferred successfully",
  "transfer": {
    "variantId": 1,
    "fromLocation": "Main Warehouse",
    "toLocation": "Store Front",
    "quantity": 20
  }
}
```

---

### Reserve Stock (Admin)
**POST** `/inventory/reserve`

**Authentication**: Bearer Token
**Required Permission**: `inventory:update`

**Request Body**:
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 5,
  "orderId": 1
}
```

**Success Response** (200):
```json
{
  "message": "Stock reserved successfully",
  "reservation": {
    "variantId": 1,
    "quantity": 5,
    "orderId": 1
  }
}
```

---

### Release Reserved Stock (Admin)
**POST** `/inventory/release`

**Authentication**: Bearer Token
**Required Permission**: `inventory:update`

**Request Body**:
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 5,
  "orderId": 1
}
```

**Success Response** (200):
```json
{
  "message": "Reserved stock released successfully"
}
```

---

### Fulfill Reserved Stock (Admin)
**POST** `/inventory/fulfill`

**Authentication**: Bearer Token
**Required Permission**: `inventory:update`

**Request Body**:
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 5,
  "orderId": 1
}
```

**Success Response** (200):
```json
{
  "message": "Reserved stock fulfilled successfully"
}
```

---

### Find Best Fulfillment Location (Admin)
**GET** `/inventory/variants/:variantId/best-location`

**Authentication**: Bearer Token
**Required Permission**: `inventory:view`

**Query Parameters**:
- `quantity` (required): Required quantity

**Success Response** (200):
```json
{
  "variantId": 1,
  "requestedQuantity": 5,
  "bestLocation": {
    "locationId": 1,
    "locationName": "Main Warehouse",
    "availableQuantity": 60
  }
}
```

---

### Get Inventory Movements (Admin)
**GET** `/inventory/movements`

**Authentication**: Bearer Token
**Required Permission**: `inventory:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by movement type
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "variantId": 1,
      "locationId": 1,
      "type": "addition",
      "quantity": 50,
      "reason": "New shipment received",
      "referenceNumber": "PO-2025-001",
      "createdAt": "2025-11-19T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "totalPages": 50
  }
}
```

---

### Get Variant Movements (Admin)
**GET** `/inventory/variants/:variantId/movements`

**Authentication**: Bearer Token
**Required Permission**: `inventory:view`

**Success Response** (200): Same format as Get Inventory Movements, filtered by variant

---

### Get Location Movements (Admin)
**GET** `/inventory/locations/:locationId/movements`

**Authentication**: Bearer Token
**Required Permission**: `inventory:view`

**Success Response** (200): Same format as Get Inventory Movements, filtered by location

---

### Get Order Movements
**GET** `/inventory/orders/:orderId/movements`

**Authentication**: None

**Success Response** (200): Inventory movements related to specific order

---

## 13. Notifications

### Send Test Notification
**POST** `/notifications/test`

**Authentication**: None

**Request Body**:
```json
{
  "userId": 1,
  "title": "Test Notification",
  "message": "This is a test"
}
```

**Success Response** (200):
```json
{
  "message": "Test notification sent",
  "notification": {
    "id": 1,
    "userId": 1,
    "title": "Test Notification"
  }
}
```

---

### Send Notification (Admin)
**POST** `/notifications/send`

**Authentication**: Bearer Token
**Required Permission**: `notifications:send`

**Request Body**:
```json
{
  "userId": 1,
  "type": "order_shipped",
  "title": "Your order has shipped!",
  "message": "Order #ORD-2025-001 is on the way",
  "data": {
    "orderId": 1,
    "trackingNumber": "1Z999AA10123456784"
  },
  "priority": "high"
}
```

**Success Response** (200):
```json
{
  "message": "Notification sent successfully",
  "notification": {
    "id": 1,
    "userId": 1,
    "type": "order_shipped",
    "createdAt": "2025-11-19T15:30:00.000Z"
  }
}
```

---

### Get Notifications (Admin)
**GET** `/notifications`

**Authentication**: Bearer Token
**Required Permission**: `notifications:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "type": "order_shipped",
      "title": "Your order has shipped!",
      "message": "Order #ORD-2025-001 is on the way",
      "priority": "high",
      "isRead": false,
      "createdAt": "2025-11-19T15:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Get Notification By ID
**GET** `/notifications/:id`

**Authentication**: Bearer Token
**Required Permission**: `notifications:view`

**Success Response** (200): Single notification object

---

### Get User Notifications
**GET** `/notifications/user/:userId`

**Authentication**: Bearer Token
**Required Permission**: `notifications:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `isRead` (optional): Filter by read status
- `type` (optional): Filter by notification type

**Success Response** (200): Same format as Get Notifications

---

### Get Unread Notifications
**GET** `/notifications/user/:userId/unread`

**Authentication**: Bearer Token
**Required Permission**: `notifications:view`

**Success Response** (200): Same format as Get Notifications, unread only

---

### Get Unread Count
**GET** `/notifications/user/:userId/unread/count`

**Authentication**: Bearer Token
**Required Permission**: `notifications:view`

**Success Response** (200):
```json
{
  "userId": 1,
  "unreadCount": 5
}
```

---

### Mark Notifications as Read
**PUT** `/notifications/mark-as-read`

**Authentication**: Bearer Token
**Required Permission**: `notifications:update`

**Request Body**:
```json
{
  "notificationIds": [1, 2, 3]
}
```

**Success Response** (200):
```json
{
  "message": "Notifications marked as read",
  "updatedCount": 3
}
```

---

### Mark All as Read
**PUT** `/notifications/user/:userId/mark-all-read`

**Authentication**: Bearer Token
**Required Permission**: `notifications:update`

**Success Response** (200):
```json
{
  "message": "All notifications marked as read",
  "updatedCount": 12
}
```

---

### Delete Notification
**DELETE** `/notifications/:id`

**Authentication**: Bearer Token
**Required Permission**: `notifications:delete`

**Success Response** (200):
```json
{
  "message": "Notification deleted successfully"
}
```

---

### Delete Multiple Notifications
**DELETE** `/notifications`

**Authentication**: Bearer Token
**Required Permission**: `notifications:delete`

**Request Body**:
```json
{
  "notificationIds": [1, 2, 3]
}
```

**Success Response** (200):
```json
{
  "message": "Notifications deleted successfully",
  "deletedCount": 3
}
```

---

### Create Notification Template (Admin)
**POST** `/notifications/templates`

**Authentication**: Bearer Token

**Request Body**:
```json
{
  "name": "order_shipped",
  "title": "Your order has shipped!",
  "content": "Order {{orderNumber}} is on the way",
  "isActive": true
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "name": "order_shipped",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get Notification Templates
**GET** `/notifications/templates`

**Authentication**: Bearer Token

**Success Response** (200):
```json
{
  "templates": [
    {
      "id": 1,
      "name": "order_shipped",
      "title": "Your order has shipped!",
      "isActive": true
    }
  ]
}
```

---

### Update User Notification Preferences
**PUT** `/notifications/preferences`

**Authentication**: Bearer Token

**Request Body**:
```json
{
  "userId": 1,
  "emailNotifications": true,
  "pushNotifications": false,
  "smsNotifications": false
}
```

**Success Response** (200):
```json
{
  "message": "Preferences updated successfully"
}
```

---

## 14. Blog

### List All Blog Posts
**GET** `/blog`

**Authentication**: None
**Required Permission**: `blog:view`

**Query Parameters**:
- `status` (optional): Filter by status (draft, published, archived)
- `search` (optional): Search by title or content
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sortField` (optional): Sort field
- `sortOrder` (optional): Sort order (asc, desc)

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "title": "Wine Tasting Guide",
      "slug": "wine-tasting-guide",
      "excerpt": "Learn the basics of wine tasting...",
      "content": "Full blog post content...",
      "status": "published",
      "publishedAt": "2025-11-01T10:00:00.000Z",
      "createdAt": "2025-10-25T15:30:00.000Z",
      "updatedAt": "2025-11-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### List Published Blog Posts
**GET** `/blog/published`

**Authentication**: None
**Required Permission**: `blog:view`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response** (200): Same format as List All Blog Posts

---

### Get Blog Post by Slug
**GET** `/blog/slug/:slug`

**Authentication**: None
**Required Permission**: `blog:view`

**Success Response** (200):
```json
{
  "id": 1,
  "title": "Wine Tasting Guide",
  "slug": "wine-tasting-guide",
  "excerpt": "Learn the basics of wine tasting...",
  "content": "Full blog post content with detailed information...",
  "status": "published",
  "publishedAt": "2025-11-01T10:00:00.000Z",
  "createdAt": "2025-10-25T15:30:00.000Z",
  "updatedAt": "2025-11-01T10:00:00.000Z"
}
```

---

### Get Blog Post by ID
**GET** `/blog/:id`

**Authentication**: None
**Required Permission**: `blog:view`

**Success Response** (200): Same as Get by Slug

---

### Create Blog Post (Admin)
**POST** `/blog`

**Authentication**: Bearer Token
**Required Permission**: `blog:create`

**Request Body**:
```json
{
  "title": "Wine Tasting Guide",
  "slug": "wine-tasting-guide",
  "excerpt": "Learn the basics of wine tasting...",
  "content": "Full blog post content...",
  "status": "draft"
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "title": "Wine Tasting Guide",
  "slug": "wine-tasting-guide",
  "status": "draft",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Blog Post (Admin)
**PATCH** `/blog/:id`

**Authentication**: Bearer Token
**Required Permission**: `blog:update`

**Request Body**:
```json
{
  "title": "Updated Wine Tasting Guide",
  "content": "Updated content...",
  "status": "published"
}
```

**Success Response** (200):
```json
{
  "id": 1,
  "title": "Updated Wine Tasting Guide",
  "status": "published",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Delete Blog Post (Admin)
**DELETE** `/blog/:id`

**Authentication**: Bearer Token
**Required Permission**: `blog:delete`

**Success Response** (200):
```json
{
  "message": "Blog post deleted successfully"
}
```

---

### Publish Blog Post (Admin)
**POST** `/blog/:id/publish`

**Authentication**: Bearer Token
**Required Permission**: `blog:publish`

**Request Body** (optional):
```json
{
  "publishedAt": "2025-11-19T15:30:00.000Z"
}
```

**Success Response** (200):
```json
{
  "message": "Blog post published successfully",
  "post": {
    "id": 1,
    "status": "published",
    "publishedAt": "2025-11-19T15:30:00.000Z"
  }
}
```

---

### Unpublish Blog Post (Admin)
**POST** `/blog/:id/unpublish`

**Authentication**: Bearer Token
**Required Permission**: `blog:publish`

**Success Response** (200):
```json
{
  "message": "Blog post unpublished successfully",
  "post": {
    "id": 1,
    "status": "draft",
    "publishedAt": null
  }
}
```

---

## 15. CMS

### Get Homepage Data (Public)
**GET** `/cms/homepage`

**Authentication**: None
**Caching**: 5 minutes

**Success Response** (200):
```json
{
  "header": {
    "logo": {
      "url": "https://example.com/logo.png",
      "altText": "Wine Shop Logo"
    },
    "navigation": [
      {
        "label": "Products",
        "url": "/products"
      }
    ],
    "topBar": {
      "message": "Free shipping on orders over $100",
      "isActive": true
    }
  },
  "heroBanner": {
    "isActive": true,
    "slides": [
      {
        "title": "Premium Wine Collection",
        "subtitle": "Discover our finest wines",
        "image": "https://example.com/hero1.jpg",
        "buttonText": "Shop Now",
        "buttonUrl": "/products"
      }
    ]
  },
  "featuresBar": {
    "isActive": true,
    "features": [
      {
        "icon": "shipping",
        "title": "Free Shipping",
        "description": "On orders over $100"
      }
    ]
  },
  "ourStory": {
    "isActive": true,
    "title": "Our Story",
    "content": "We are passionate about bringing you the finest wines...",
    "image": "https://example.com/story.jpg"
  },
  "storeLocations": {
    "isActive": true,
    "title": "Visit Our Stores",
    "locations": [
      {
        "name": "Downtown Store",
        "address": "123 Main St, City, State 12345",
        "phone": "+1-234-567-8900",
        "hours": "Mon-Sat: 10AM-8PM, Sun: 12PM-6PM"
      }
    ]
  },
  "footer": {
    "companyInfo": {
      "name": "Wine Shop",
      "description": "Your premium wine destination",
      "logo": "https://example.com/footer-logo.png"
    },
    "links": [...],
    "socialMedia": [...],
    "contact": {
      "email": "info@wineshop.com",
      "phone": "+1-234-567-8900",
      "address": "123 Wine St, City, State 12345"
    }
  }
}
```

---

### Get Homepage Data for Admin
**GET** `/cms/admin/homepage`

**Authentication**: Bearer Token
**Required Permission**: `cms:read`

**Success Response** (200): Full database record with all sections and metadata

---

### Update CMS Section (Admin)
**PATCH** `/cms/admin/sections/:sectionName`

**Authentication**: Bearer Token
**Required Permission**: `cms:update`

**Valid Section Names**:
- `header` - Logo, nav menu, top bar
- `hero-banner` - Carousel slides
- `features-bar` - 4 feature items
- `our-story` - About section
- `store-locations` - Maps and addresses
- `footer` - Footer content

**Request Body**:
```json
{
  "content": {
    "isActive": true,
    "slides": [
      {
        "title": "New Wine Collection",
        "subtitle": "Discover our latest arrivals",
        "image": "https://example.com/new-hero.jpg",
        "buttonText": "Explore",
        "buttonUrl": "/new-arrivals"
      }
    ]
  }
}
```

**Success Response** (200):
```json
{
  "message": "Section updated successfully",
  "section": "hero-banner",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

## 16. Countries

### Get All Countries
**GET** `/countries`

**Authentication**: None
**Caching**: 5 minutes

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search by name or code

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "code": "US",
      "name": "United States",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "code": "FR",
      "name": "France",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 195,
    "totalPages": 4
  }
}
```

---

### Search Countries
**GET** `/countries/search`

**Authentication**: None

**Query Parameters**:
- `q` (required): Search query (name or code)
- `limit` (optional): Items limit (default: 10, max: 50)

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "code": "US",
      "name": "United States"
    }
  ],
  "meta": {
    "query": "united",
    "total": 3,
    "limit": 10
  }
}
```

---

### Get Countries Count
**GET** `/countries/count`

**Authentication**: None

**Success Response** (200):
```json
{
  "count": 195
}
```

---

### Get Country By Code
**GET** `/countries/code/:code`

**Authentication**: None

**Success Response** (200):
```json
{
  "id": 1,
  "code": "US",
  "name": "United States",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### Get Country By ID
**GET** `/countries/:id`

**Authentication**: None

**Success Response** (200): Same as Get Country By Code

---

### Create Country (Admin)
**POST** `/countries`

**Authentication**: Bearer Token
**Required Permission**: `countries:create`

**Request Body**:
```json
{
  "code": "IT",
  "name": "Italy"
}
```

**Success Response** (201):
```json
{
  "id": 3,
  "code": "IT",
  "name": "Italy",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Update Country (Admin)
**PATCH** `/countries/:id`

**Authentication**: Bearer Token
**Required Permission**: `countries:update`

**Request Body**:
```json
{
  "name": "Italian Republic"
}
```

**Success Response** (200):
```json
{
  "id": 3,
  "code": "IT",
  "name": "Italian Republic",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Delete Country (Admin)
**DELETE** `/countries/:id`

**Authentication**: Bearer Token
**Required Permission**: `countries:delete`

**Success Response** (200):
```json
{
  "message": "Country deleted successfully"
}
```

---

## 17. RBAC

### Create Role (Admin)
**POST** `/rbac/roles`

**Authentication**: Bearer Token
**Required Permission**: `roles:create`

**Request Body**:
```json
{
  "name": "MODERATOR",
  "description": "Can moderate content and reviews"
}
```

**Success Response** (201):
```json
{
  "id": 4,
  "name": "MODERATOR",
  "description": "Can moderate content and reviews",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get All Roles (Admin)
**GET** `/rbac/roles`

**Authentication**: Bearer Token
**Required Permission**: `roles:read`
**Caching**: 5 minutes

**Success Response** (200):
```json
{
  "roles": [
    {
      "id": 1,
      "name": "ADMIN",
      "description": "Full system access",
      "userCount": 2,
      "permissions": [
        {
          "id": 1,
          "name": "users:view",
          "description": "View users"
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Role By ID (Admin)
**GET** `/rbac/roles/:id`

**Authentication**: Bearer Token
**Required Permission**: `roles:read`
**Caching**: 5 minutes

**Success Response** (200):
```json
{
  "id": 1,
  "name": "ADMIN",
  "description": "Full system access",
  "userCount": 2,
  "permissions": [
    {
      "id": 1,
      "name": "users:view",
      "description": "View users"
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get Role By Name (Admin)
**GET** `/rbac/roles/name/:name`

**Authentication**: Bearer Token
**Required Permission**: `roles:read`

**Success Response** (200): Same as Get Role By ID

---

### Update Role (Admin)
**PATCH** `/rbac/roles/:id`

**Authentication**: Bearer Token
**Required Permission**: `roles:update`

**Request Body**:
```json
{
  "description": "Updated description"
}
```

**Success Response** (200):
```json
{
  "id": 1,
  "name": "ADMIN",
  "description": "Updated description",
  "updatedAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Delete Role (Admin)
**DELETE** `/rbac/roles/:id`

**Authentication**: Bearer Token
**Required Permission**: `roles:delete`

**Success Response** (200):
```json
{
  "message": "Role deleted successfully"
}
```

---

### Assign Permissions to Role (Admin)
**POST** `/rbac/roles/:id/permissions`

**Authentication**: Bearer Token
**Required Permission**: `roles:assign`

**Request Body**:
```json
{
  "permissionIds": [1, 2, 3, 4, 5]
}
```

**Success Response** (200):
```json
{
  "message": "Permissions assigned successfully",
  "role": {
    "id": 1,
    "name": "ADMIN",
    "permissionCount": 20
  }
}
```

---

### Remove Permissions from Role (Admin)
**DELETE** `/rbac/roles/:id/permissions/batch`

**Authentication**: Bearer Token
**Required Permission**: `roles:assign`

**Request Body**:
```json
{
  "permissionIds": [1, 2]
}
```

**Success Response** (200):
```json
{
  "message": "Permissions removed successfully",
  "role": {
    "id": 1,
    "name": "ADMIN",
    "permissionCount": 18
  }
}
```

---

### Remove Single Permission from Role (Admin)
**DELETE** `/rbac/roles/:id/permissions/:permissionId`

**Authentication**: Bearer Token
**Required Permission**: `roles:assign`

**Success Response** (200):
```json
{
  "message": "Permission removed successfully"
}
```

---

### Create Permission (Admin)
**POST** `/rbac/permissions`

**Authentication**: Bearer Token
**Required Permission**: `permissions:create`

**Request Body**:
```json
{
  "name": "analytics:view",
  "description": "View analytics dashboard"
}
```

**Success Response** (201):
```json
{
  "id": 95,
  "name": "analytics:view",
  "description": "View analytics dashboard",
  "createdAt": "2025-11-19T15:30:00.000Z"
}
```

---

### Get All Permissions (Admin)
**GET** `/rbac/permissions`

**Authentication**: Bearer Token
**Required Permission**: `permissions:read`
**Caching**: 5 minutes

**Success Response** (200):
```json
{
  "permissions": [
    {
      "id": 1,
      "name": "users:view",
      "description": "View users",
      "roleCount": 3,
      "roles": [
        {
          "id": 1,
          "name": "ADMIN"
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Permission By ID (Admin)
**GET** `/rbac/permissions/:id`

**Authentication**: Bearer Token
**Required Permission**: `permissions:read`

**Success Response** (200): Single permission object

---

### Get Permission By Name (Admin)
**GET** `/rbac/permissions/name/:name`

**Authentication**: Bearer Token
**Required Permission**: `permissions:read`

**Success Response** (200): Single permission object

---

### Update Permission (Admin)
**PATCH** `/rbac/permissions/:id`

**Authentication**: Bearer Token
**Required Permission**: `permissions:update`

**Request Body**:
```json
{
  "description": "Updated description"
}
```

**Success Response** (200): Updated permission object

---

### Delete Permission (Admin)
**DELETE** `/rbac/permissions/:id`

**Authentication**: Bearer Token
**Required Permission**: `permissions:delete`

**Success Response** (200):
```json
{
  "message": "Permission deleted successfully"
}
```

---

### Search Roles and Permissions (Admin)
**GET** `/rbac/search`

**Authentication**: Bearer Token
**Required Permission**: `roles:read`
**Caching**: 2 minutes

**Query Parameters**:
- `q` (required): Search query

**Success Response** (200):
```json
{
  "roles": [
    {
      "id": 1,
      "name": "ADMIN",
      "description": "Full system access"
    }
  ],
  "permissions": [
    {
      "id": 1,
      "name": "users:view",
      "description": "View users"
    }
  ]
}
```

---

## 18. Reports

### Get Sales Overview Report (Admin)
**GET** `/admin/reports/sales/overview`

**Authentication**: Bearer Token
**Required Permission**: `reports:view`

**Query Parameters**:
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**Success Response** (200):
```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-19"
  },
  "summary": {
    "totalRevenue": 45678.90,
    "totalOrders": 234,
    "averageOrderValue": 195.20,
    "totalItems": 567
  },
  "breakdown": [
    {
      "date": "2025-11-01",
      "revenue": 1234.56,
      "orders": 8,
      "averageOrderValue": 154.32
    }
  ]
}
```

---

### Get Top Customers Report (Admin)
**GET** `/admin/reports/sales/top-customers`

**Authentication**: Bearer Token
**Required Permission**: `reports:view`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `limit` (optional): Number of results (default: 10)

**Success Response** (200):
```json
{
  "topCustomers": [
    {
      "userId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "totalOrders": 15,
      "totalRevenue": 2925.75,
      "averageOrderValue": 195.05
    }
  ]
}
```

---

### Get Best Selling Products Report (Admin)
**GET** `/admin/reports/sales/best-selling-products`

**Authentication**: Bearer Token
**Required Permission**: `reports:view`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `limit` (optional): Number of results (default: 10)

**Success Response** (200):
```json
{
  "bestSellingProducts": [
    {
      "productId": 1,
      "productName": "Premium Red Wine",
      "totalQuantitySold": 345,
      "totalRevenue": 10340.55,
      "orderCount": 145
    }
  ]
}
```

---

### Get Revenue By Category Report (Admin)
**GET** `/admin/reports/sales/by-category`

**Authentication**: Bearer Token
**Required Permission**: `reports:view`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Success Response** (200):
```json
{
  "revenueByCategory": [
    {
      "categoryId": 1,
      "categoryName": "Red Wine",
      "totalRevenue": 23456.78,
      "orderCount": 145,
      "itemsSold": 389
    }
  ]
}
```

---

### Get AOV Trends Report (Admin)
**GET** `/admin/reports/sales/aov-trends`

**Authentication**: Bearer Token
**Required Permission**: `reports:view`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Success Response** (200):
```json
{
  "aovTrends": [
    {
      "date": "2025-11-01",
      "averageOrderValue": 195.20,
      "orderCount": 8
    }
  ],
  "overallAOV": 195.20
}
```

---

### Get Order Status Breakdown Report (Admin)
**GET** `/admin/reports/orders/status`

**Authentication**: Bearer Token
**Required Permission**: `reports:view`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Success Response** (200):
```json
{
  "statusBreakdown": {
    "pending": 15,
    "processing": 25,
    "shipped": 45,
    "delivered": 180,
    "cancelled": 14
  },
  "total": 279
}
```

---

### Get Cart Statistics Report (Admin)
**GET** `/admin/reports/carts/statistics`

**Authentication**: Bearer Token
**Required Permission**: `reports:read`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Success Response** (200):
```json
{
  "summary": {
    "totalCarts": 450,
    "activeCarts": 125,
    "abandonedCarts": 275,
    "convertedCarts": 50,
    "abandonmentRate": 61.1,
    "conversionRate": 11.1
  },
  "averageCartValue": 95.50,
  "totalCartValue": 42975.00
}
```

---

### Get Abandoned Cart Details Report (Admin)
**GET** `/admin/reports/carts/abandoned`

**Authentication**: Bearer Token
**Required Permission**: `reports:read`

**Query Parameters**:
- `days` (optional): Days since abandonment (default: 1)

**Success Response** (200): Same as Get Abandoned Carts in Cart Admin section

---

### Get Average Cart Value Report (Admin)
**GET** `/admin/reports/carts/average-value`

**Authentication**: Bearer Token
**Required Permission**: `reports:read`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Success Response** (200):
```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-19"
  },
  "averageCartValue": 95.50,
  "totalCarts": 450,
  "totalValue": 42975.00
}
```

---

### Get Cart Report Overview (Admin)
**GET** `/admin/reports/carts/overview`

**Authentication**: Bearer Token
**Required Permission**: `reports:read`

**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date

**Success Response** (200): Comprehensive cart report combining statistics, trends, and insights

---

### Get Dashboard Summary Report (Admin)
**GET** `/admin/reports/dashboard`

**Authentication**: Bearer Token
**Required Permission**: `reports:read`

**Query Parameters**:
- `startDate` (optional): Start date (default: last 30 days)
- `endDate` (optional): End date

**Success Response** (200):
```json
{
  "period": {
    "startDate": "2025-10-20",
    "endDate": "2025-11-19"
  },
  "sales": {
    "totalRevenue": 45678.90,
    "totalOrders": 234,
    "averageOrderValue": 195.20,
    "growthPercent": 12.5
  },
  "customers": {
    "totalCustomers": 1250,
    "newCustomers": 85,
    "returningCustomers": 149,
    "customerRetentionRate": 63.7
  },
  "products": {
    "totalProducts": 150,
    "activeProducts": 145,
    "lowStockProducts": 12,
    "outOfStockProducts": 3
  },
  "orders": {
    "pending": 15,
    "processing": 25,
    "shipped": 45,
    "delivered": 180,
    "cancelled": 14
  },
  "carts": {
    "totalCarts": 450,
    "activeCarts": 125,
    "abandonedCarts": 275,
    "abandonmentRate": 61.1
  }
}
```

---

## 19. Bookings & Reservations

### Overview
The Bookings API provides table reservation functionality. See [BOOKINGS_API.md](./BOOKINGS_API.md) for complete documentation.

### Quick Links
- [Check Availability](./BOOKINGS_API.md#191-check-availability) - `GET /bookings/availability`
- [Create Booking](./BOOKINGS_API.md#193-create-booking) - `POST /bookings`
- [Get My Bookings](./BOOKINGS_API.md#195-get-my-bookings) - `GET /bookings/my-bookings`
- [Cancel Booking](./BOOKINGS_API.md#196-cancel-own-booking) - `PATCH /bookings/:id/cancel`

### Admin Features
- [Manage Bookings](./BOOKINGS_API.md#197-get-all-bookings-admin)
- [Booking Settings](./BOOKINGS_API.md#1914-get-full-settings-admin)
- [Blocked Dates](./BOOKINGS_API.md#1916-get-all-blocked-dates-admin)
- [Custom Schedules](./BOOKINGS_API.md#1919-get-all-custom-schedules-admin)

### Key Features
- Real-time availability checking with caching
- Guest and registered user bookings
- Optional deposit payments via Stripe
- Automated booking expiration for unpaid reservations
- Admin management with RBAC permissions
- Custom schedules for special days (e.g., New Year's Eve)
- Blocked dates for holidays/closures
- Complete booking history audit trail

### Permissions
- `bookings:view` - View bookings
- `bookings:create` - Create bookings
- `bookings:update` - Update bookings
- `bookings:delete` - Delete bookings
- `bookings:cancel` - Cancel bookings
- `bookings:manage-settings` - Manage settings, blocked dates, and custom schedules

### Cache Configuration
- Availability: 5 minutes
- Auto-invalidation on booking changes

**Total Endpoints**: 21

For detailed documentation, see [BOOKINGS_API.md](./BOOKINGS_API.md)

---

## Rate Limiting

The API implements rate limiting:

- **Anonymous requests**: 100 requests per 15 minutes per IP
- **Authenticated requests**: 1000 requests per 15 minutes per user
- **Admin requests**: 5000 requests per 15 minutes

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1732032600
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 10, max: 100): Items per page

**Response includes**:
```json
{
  "data": [ ... ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "links": {
    "first": "/api/v1/products?page=1&limit=20",
    "previous": "/api/v1/products?page=1&limit=20",
    "next": "/api/v1/products?page=3&limit=20",
    "last": "/api/v1/products?page=5&limit=20"
  }
}
```

---

## Caching

The API implements caching for performance:

- **Product listings**: 5 minutes
- **Categories**: 10 minutes
- **CMS homepage**: 5 minutes
- **Bundles**: 5 minutes
- **Product reviews**: 5 minutes
- **RBAC roles/permissions**: 5 minutes
- **Shipping methods**: 10 minutes
- **Countries**: 5 minutes
- **Booking availability**: 5 minutes

Cache can be bypassed with `Cache-Control: no-cache` header for authenticated admin requests.

---

## Support

For API support:
- **Email**: api-support@wineshop.com
- **Documentation**: https://docs.wineshop.com/api
- **Status Page**: https://status.wineshop.com

---

**Document Version**: 3.1.0
**Last Updated**: 2025-11-21
**API Version**: v1
**Total Endpoints**: 221+
