# 📦 Inventory Management API Documentation

## Base URL
```
/api/v1/inventory
```

---

## 🔓 Public Endpoints (No Authentication Required)

### 1. Check Variant Availability
Check if a specific quantity of a variant is available at a location.

**Endpoint:** `GET /inventory/variants/:variantId/availability`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| variantId | number | Yes | Variant ID (path param) |
| locationId | number | Yes | Location ID |
| quantity | number | Yes | Quantity to check |

**Example Request:**
```http
GET /api/v1/inventory/variants/1/availability?locationId=1&quantity=5
```

**Response:**
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 5,
  "available": true
}
```

---

### 2. Get Variant Inventory
Get inventory details for a variant across all locations.

**Endpoint:** `GET /inventory/variants/:variantId`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| variantId | number | Yes | Variant ID |

**Example Request:**
```http
GET /api/v1/inventory/variants/1
```

**Response:**
```json
[
  {
    "id": 1,
    "variantId": 1,
    "locationId": 1,
    "quantity": 100,
    "reserved": 10,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z",
    "variant": {
      "id": 1,
      "productId": 1,
      "sku": "WINE-001",
      "price": 29.99,
      "product": {
        "id": 1,
        "name": "Cabernet Sauvignon 2020"
      }
    },
    "location": {
      "id": 1,
      "name": "Main Warehouse",
      "city": "New York"
    }
  }
]
```

---

### 3. Get Variant Total Quantity
Get total, available, and reserved quantities for a variant across all locations.

**Endpoint:** `GET /inventory/variants/:variantId/total`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| variantId | number | Yes | Variant ID |

**Example Request:**
```http
GET /api/v1/inventory/variants/1/total
```

**Response:**
```json
{
  "variantId": 1,
  "totalQuantity": 250,
  "availableQuantity": 220,
  "reservedQuantity": 30
}
```

---

### 4. Get All Locations
Get list of all inventory locations.

**Endpoint:** `GET /inventory/locations`

**Example Request:**
```http
GET /api/v1/inventory/locations
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Warehouse",
    "addressLine1": "123 Main St",
    "addressLine2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### 5. Get Location by ID
Get details of a specific location.

**Endpoint:** `GET /inventory/locations/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Location ID |

**Example Request:**
```http
GET /api/v1/inventory/locations/1
```

**Response:**
```json
{
  "id": 1,
  "name": "Main Warehouse",
  "addressLine1": "123 Main St",
  "addressLine2": "Suite 100",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### 6. Get Location Inventory
Get all inventory items at a specific location.

**Endpoint:** `GET /inventory/locations/:id/inventory`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Location ID |

**Example Request:**
```http
GET /api/v1/inventory/locations/1/inventory
```

**Response:**
```json
[
  {
    "id": 1,
    "variantId": 1,
    "locationId": 1,
    "quantity": 100,
    "reserved": 10,
    "variant": {
      "id": 1,
      "sku": "WINE-001",
      "price": 29.99,
      "product": {
        "name": "Cabernet Sauvignon 2020"
      }
    }
  }
]
```

---

### 7. Get Order Movements
Get inventory movements for a specific order.

**Endpoint:** `GET /inventory/orders/:orderId/movements`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | number | Yes | Order ID |

**Example Request:**
```http
GET /api/v1/inventory/orders/1/movements
```

**Response:**
```json
[
  {
    "id": 1,
    "variantId": 1,
    "locationId": 1,
    "orderId": 1,
    "delta": -2,
    "reason": "sale",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "variant": {
      "sku": "WINE-001",
      "product": {
        "name": "Cabernet Sauvignon 2020"
      }
    },
    "location": {
      "name": "Main Warehouse"
    }
  }
]
```

---

## 🔒 Admin Endpoints (Authentication Required)

### 8. Create Location
Create a new inventory location.

**Endpoint:** `POST /inventory/locations`

**Permission Required:** `inventory:manage`

**Request Body:**
```json
{
  "name": "Downtown Store",
  "addressLine1": "456 Market St",
  "addressLine2": "Floor 2",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94102",
  "country": "US"
}
```

**Request Body Schema:**
| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 100 | Location name |
| addressLine1 | string | No | 255 | Address line 1 |
| addressLine2 | string | No | 255 | Address line 2 |
| city | string | No | 100 | City |
| state | string | No | 100 | State/Province |
| postalCode | string | No | 20 | Postal/ZIP code |
| country | string | No | 2 | ISO 2-letter country code |

**Response:**
```json
{
  "id": 2,
  "name": "Downtown Store",
  "addressLine1": "456 Market St",
  "addressLine2": "Floor 2",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94102",
  "country": "US",

### 11. Get All Inventory (Paginated)
Get all inventory records with pagination and filtering.

**Endpoint:** `GET /inventory/all`

**Permission Required:** `inventory:view`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |
| variantId | number | No | - | Filter by variant ID |
| locationId | number | No | - | Filter by location ID |

**Example Request:**
```http
GET /api/v1/inventory/all?page=1&limit=10&locationId=1
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "variantId": 1,
      "locationId": 1,
      "quantity": 100,
      "reserved": 10,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-15T00:00:00.000Z",
      "variant": {
        "id": 1,
        "sku": "WINE-001",
        "price": 29.99,
        "product": {
          "name": "Cabernet Sauvignon 2020"
        }
      },
      "location": {
        "id": 1,
        "name": "Main Warehouse"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 12. Get Low Stock Items
Get items with stock below threshold.

**Endpoint:** `GET /inventory/low-stock`

**Permission Required:** `inventory:view`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| threshold | number | No | 10 | Stock threshold |

**Example Request:**
```http
GET /api/v1/inventory/low-stock?threshold=20
```

**Response:**
```json
[
  {
    "id": 5,
    "variantId": 5,
    "locationId": 1,
    "quantity": 15,
    "reserved": 5,
    "variant": {
      "sku": "WINE-005",
      "product": {
        "name": "Pinot Noir 2021"
      }
    },
    "location": {
      "name": "Main Warehouse"
    }
  }
]
```

---

### 13. Adjust Inventory
Add or remove stock at a location.

**Endpoint:** `POST /inventory/adjust`

**Permission Required:** `inventory:adjust`

**Request Body:**
```json
{
  "variantId": 1,
  "locationId": 1,
  "delta": 50,
  "reason": "purchase",
  "orderId": null,
  "note": "Received new shipment from supplier"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| variantId | number | Yes | Variant ID |
| locationId | number | Yes | Location ID |
| delta | number | Yes | Quantity change (positive = increase, negative = decrease) |
| reason | string | Yes | Adjustment reason (see below) |
| orderId | number | No | Related order ID |
| note | string | No | Additional notes |

**Reason Options:**
- `purchase` - Stock received from supplier
- `sale` - Stock sold to customer
- `return` - Customer return
- `damage` - Damaged goods
- `loss` - Lost/stolen inventory
- `found` - Found inventory
- `adjustment` - Manual adjustment
- `transfer` - Transfer between locations

**Response:**
```json
{
  "id": 1,
  "variantId": 1,
  "locationId": 1,
  "quantity": 150,
  "reserved": 10,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-21T10:00:00.000Z"
}
```

---

### 14. Transfer Inventory
Transfer stock between locations.

**Endpoint:** `POST /inventory/transfer`

**Permission Required:** `inventory:adjust`

**Request Body:**
```json
{
  "variantId": 1,
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 20,
  "note": "Transfer to downtown store for high demand"
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| variantId | number | Yes | Variant ID |
| fromLocationId | number | Yes | Source location ID |
| toLocationId | number | Yes | Destination location ID |
| quantity | number | Yes | Quantity to transfer (must be positive) |
| note | string | No | Transfer notes |

**Response:**
```json
{
  "from": {
    "id": 1,
    "variantId": 1,
    "locationId": 1,
    "quantity": 80,
    "reserved": 10
  },
  "to": {
    "id": 2,
    "variantId": 1,
    "locationId": 2,
    "quantity": 20,
    "reserved": 0
  }
}
```

---

### 15. Reserve Stock
Reserve stock for an order (prevents it from being sold).

**Endpoint:** `POST /inventory/reserve`

**Permission Required:** `inventory:update`

**Request Body:**
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 5,
  "orderId": 123
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| variantId | number | Yes | Variant ID |
| locationId | number | Yes | Location ID |
| quantity | number | Yes | Quantity to reserve (must be positive) |
| orderId | number | No | Related order ID |

**Response:**
```json
{
  "id": 1,
  "variantId": 1,
  "locationId": 1,
  "quantity": 100,
  "reserved": 15,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-21T11:00:00.000Z"
}
```

---

### 16. Release Stock
Release previously reserved stock.

**Endpoint:** `POST /inventory/release`

**Permission Required:** `inventory:update`

**Request Body:**
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 5,
  "orderId": 123
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| variantId | number | Yes | Variant ID |
| locationId | number | Yes | Location ID |
| quantity | number | Yes | Quantity to release (must be positive) |
| orderId | number | No | Related order ID |

**Response:**
```json
{
  "id": 1,
  "variantId": 1,
  "locationId": 1,
  "quantity": 100,
  "reserved": 10,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-21T11:30:00.000Z"
}
```

---

### 17. Fulfill Reserved Stock
Fulfill reserved stock (decreases quantity and reserved count).

**Endpoint:** `POST /inventory/fulfill`

**Permission Required:** `inventory:update`

**Request Body:**
```json
{
  "variantId": 1,
  "locationId": 1,
  "quantity": 5,
  "orderId": 123
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| variantId | number | Yes | Variant ID |
| locationId | number | Yes | Location ID |
| quantity | number | Yes | Quantity to fulfill (must be positive) |
| orderId | number | No | Related order ID |

**Response:**
```json
{
  "id": 1,
  "variantId": 1,
  "locationId": 1,
  "quantity": 95,
  "reserved": 5,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-21T12:00:00.000Z"
}
```

---

### 18. Find Best Location for Fulfillment
Find the best location to fulfill an order based on available stock.

**Endpoint:** `GET /inventory/variants/:variantId/best-location`

**Permission Required:** `inventory:view`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| variantId | number | Yes | Variant ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quantity | number | Yes | Required quantity |

**Example Request:**
```http
GET /api/v1/inventory/variants/1/best-location?quantity=10
```

**Response:**
```json
{
  "variantId": 1,
  "quantity": 10,
  "recommendedLocationId": 1
}
```

---

### 19. Get All Movements (Filtered)
Get inventory movements with filtering and pagination.

**Endpoint:** `GET /inventory/movements`

**Permission Required:** `inventory:view`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |
| variantId | number | No | - | Filter by variant ID |
| locationId | number | No | - | Filter by location ID |
| orderId | number | No | - | Filter by order ID |
| reason | string | No | - | Filter by reason |

**Example Request:**
```http
GET /api/v1/inventory/movements?page=1&limit=10&variantId=1&reason=sale
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "variantId": 1,
      "locationId": 1,
      "orderId": 123,
      "delta": -5,
      "reason": "sale",
      "createdAt": "2025-01-21T10:00:00.000Z",
      "variant": {
        "id": 1,
        "sku": "WINE-001",
        "product": {
          "name": "Cabernet Sauvignon 2020"
        }
      },
      "location": {
        "id": 1,
        "name": "Main Warehouse"
      },
      "order": {
        "id": 123,
        "externalRef": "ORD-2025-001"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 20. Get Variant Movements
Get all inventory movements for a specific variant.

**Endpoint:** `GET /inventory/variants/:variantId/movements`

**Permission Required:** `inventory:view`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| variantId | number | Yes | Variant ID |

**Example Request:**
```http
GET /api/v1/inventory/variants/1/movements
```

**Response:**
```json
[
  {
    "id": 1,
    "variantId": 1,
    "locationId": 1,
    "orderId": 123,
    "delta": -5,
    "reason": "sale",
    "createdAt": "2025-01-21T10:00:00.000Z",
    "location": {
      "name": "Main Warehouse"
    }
  }
]
```

---

### 21. Get Location Movements
Get all inventory movements for a specific location.

**Endpoint:** `GET /inventory/locations/:locationId/movements`

**Permission Required:** `inventory:view`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| locationId | number | Yes | Location ID |

**Example Request:**
```http
GET /api/v1/inventory/locations/1/movements
```

**Response:**
```json
[
  {
    "id": 1,
    "variantId": 1,
    "locationId": 1,
    "orderId": 123,
    "delta": -5,
    "reason": "sale",
    "createdAt": "2025-01-21T10:00:00.000Z",
    "variant": {
      "sku": "WINE-001",
      "product": {
        "name": "Cabernet Sauvignon 2020"
      }
    }
  }
]
```

---

## 📊 Inventory Flow Workflows

### Workflow 1: Initial Stock Setup
```
1. POST /inventory/locations (Create warehouse/store)
2. POST /inventory/adjust (Add initial stock with reason: "purchase")
```

### Workflow 2: Order Processing
```
1. POST /inventory/reserve (Reserve stock when order is placed)
2. POST /inventory/fulfill (Fulfill when order is shipped)
   OR
   POST /inventory/release (Release if order is cancelled)
```

### Workflow 3: Stock Transfer
```
1. GET /inventory/locations (Get available locations)
2. GET /inventory/variants/:id (Check stock levels)
3. POST /inventory/transfer (Transfer between locations)
```

### Workflow 4: Stock Adjustment
```
1. GET /inventory/variants/:id (Check current stock)
2. POST /inventory/adjust (Adjust with appropriate reason)
3. GET /inventory/movements (View adjustment history)
```

### Workflow 5: Low Stock Monitoring
```
1. GET /inventory/low-stock?threshold=20 (Check low stock items)
2. POST /inventory/adjust (Restock items)
```

---

## 🔑 Authentication

For admin endpoints, include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

---

## 📝 Data Models

### VariantInventory
```typescript
{
  id: number;
  variantId: number;
  locationId: number;
  quantity: number;        // Total stock
  reserved: number;        // Reserved for orders
  createdAt: Date;
  updatedAt: Date;
}
```

**Available Quantity** = `quantity - reserved`

### InventoryMovement
```typescript
{
  id: number;
  variantId: number;
  locationId: number;
  orderId?: number;
  delta: number;           // Positive = increase, Negative = decrease
  reason: string;
  createdAt: Date;
}
```

### Location
```typescript
{
  id: number;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;        // ISO 2-letter code
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "quantity must be a positive number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Variant with ID 999 not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Insufficient stock available"
}
```

---

## ✅ Frontend Integration Checklist

### Product Display
- [ ] Check variant availability before showing "Add to Cart"
- [ ] Display available quantity on product pages
- [ ] Show "Out of Stock" when quantity - reserved = 0

### Shopping Cart
- [ ] Validate stock availability when adding items
- [ ] Reserve stock when checkout begins
- [ ] Release stock if checkout is abandoned (timeout)

### Admin Dashboard
- [ ] Display low stock alerts
- [ ] Show inventory levels by location
- [ ] Track inventory movements/history
- [ ] Manage locations (CRUD operations)
- [ ] Adjust stock levels
- [ ] Transfer stock between locations

### Order Management
- [ ] Reserve stock when order is placed
- [ ] Fulfill stock when order is shipped
- [ ] Release stock when order is cancelled
- [ ] Track inventory movements per order

---

## 🎯 Best Practices

1. **Always check availability** before allowing customers to add items to cart
2. **Reserve stock** immediately when checkout begins
3. **Set a timeout** for reserved stock (e.g., 15 minutes) and release if not purchased
4. **Use transactions** for critical operations (reserve, fulfill, transfer)
5. **Track all movements** for audit purposes
6. **Monitor low stock** and set up alerts
7. **Use appropriate reasons** for adjustments to maintain accurate history

---

## 📞 Support

For questions or issues with the Inventory API, please contact the development team.

**Last Updated:** 2025-11-26

  "createdAt": "2025-01-20T00:00:00.000Z",
  "updatedAt": "2025-01-20T00:00:00.000Z"
}
```

---

### 9. Update Location
Update an existing location.

**Endpoint:** `PATCH /inventory/locations/:id`

**Permission Required:** `inventory:manage`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Location ID |

**Request Body (all fields optional):**
```json
{
  "name": "Downtown Store - Updated",
  "city": "San Francisco",
  "state": "CA"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Downtown Store - Updated",
  "addressLine1": "456 Market St",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94102",
  "country": "US",
  "createdAt": "2025-01-20T00:00:00.000Z",
  "updatedAt": "2025-01-21T00:00:00.000Z"
}
```

---

### 10. Delete Location
Delete a location.

**Endpoint:** `DELETE /inventory/locations/:id`

**Permission Required:** `inventory:manage`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Location ID |

**Example Request:**
```http
DELETE /api/v1/inventory/locations/2
```

**Response:**
```json
{
  "message": "Location deleted successfully"
}
```

---

