# ✅ Initial Stock Implementation - Complete Guide

## 🎯 What Was Implemented

**Hybrid Approach (Option 1 + Option 2):**
- ✅ **Always create inventory record** when variant is created (even with 0 quantity)
- ✅ **If `initialStock` is provided**, use that value instead of 0
- ✅ **Automatic inventory movement tracking** for audit trail

---

## 📝 Changes Made

### 1. Updated `CreateVariantDto`
**File:** `src/catalog/dtos/create-variant.dto.ts`

Added two new optional fields:

```typescript
export class CreateVariantDto {
// ... existing fields ...
  
// ✅ NEW: Initial inventory fields
@IsInt()
@IsOptional()
@Min(0)
initialStock?: number;    // Optional: Initial quantity (default: 0)

@IsInt()
@IsOptional()
@Min(1)
locationId?: number;      // Optional: Which warehouse (default: 1)
}
```

---

### 2. Updated Variant Creation Service
**File:** `src/catalog/providers/variant-management.provider.ts`

Modified `createVariant()` method to:
1. Create the variant
2. **Always create inventory record** at specified location (default: location 1)
3. Set quantity to `initialStock` if provided, otherwise 0
4. Create inventory movement record if quantity > 0

---

## 🚀 How to Use

### **Scenario 1: Create Variant Without Initial Stock**

**Request:**
```http
POST /api/v1/catalog/variants
Content-Type: application/json

{
"productId": 1,
"sku": "WINE-001",
"price": 29.99,
"barcode": "123456789",
"weight": 1.5,
"isActive": true
}
```

**What Happens:**
1. ✅ Variant created
2. ✅ Inventory record created at **location 1** with **quantity: 0**
3. ❌ No inventory movement (quantity is 0)

**Result:**
```
Variant Table:
┌────┬───────────┬──────────┬───────┐
│ id │ productId │   sku    │ price │
├────┼───────────┼──────────┼───────┤
│ 1  │     1     │ WINE-001 │ 29.99 │
└────┴───────────┴──────────┴───────┘

VariantInventory Table:
┌────┬───────────┬────────────┬──────────┬──────────┐
│ id │ variantId │ locationId │ quantity │ reserved │
├────┼───────────┼────────────┼──────────┼──────────┤
│ 1  │     1     │      1     │    0     │    0     │
└────┴───────────┴────────────┴──────────┴──────────┘
```

**Benefits:**
- ✅ Inventory record exists (no "missing inventory" errors)
- ✅ Admin can update stock later using inventory endpoints
- ✅ Product shows as "Out of Stock" (quantity: 0)

---

### **Scenario 2: Create Variant With Initial Stock**

**Request:**
```http
POST /api/v1/catalog/variants
Content-Type: application/json

{
"productId": 1,
"sku": "WINE-002",
"price": 39.99,
"barcode": "987654321",
"weight": 1.5,
"isActive": true,
"initialStock": 100,
"locationId": 1
}
```

**What Happens:**
1. ✅ Variant created
2. ✅ Inventory record created at **location 1** with **quantity: 100**
3. ✅ Inventory movement created (type: ADJUSTMENT, reason: INITIAL_STOCK)

**Result:**
```
Variant Table:
┌────┬───────────┬──────────┬───────┐
│ id │ productId │   sku    │ price │
├────┼───────────┼──────────┼───────┤
│ 2  │     1     │ WINE-002 │ 39.99 │
└────┴───────────┴──────────┴───────┘

VariantInventory Table:
┌────┬───────────┬────────────┬──────────┬──────────┐
│ id │ variantId │ locationId │ quantity │ reserved │
├────┼───────────┼────────────┼──────────┼──────────┤
│ 2  │     2     │      1     │   100    │    0     │
└────┴───────────┴────────────┴──────────┴──────────┘

InventoryMovement Table:
┌────┬───────────┬────────────┬──────────┬────────────┬───────────────┬─────────────────────────────────────┐
│ id │ variantId │ locationId │ quantity │    type    │    reason     │               notes                 │
├────┼───────────┼────────────┼──────────┼────────────┼───────────────┼─────────────────────────────────────┤
│ 1  │     2     │      1     │   100    │ ADJUSTMENT │ INITIAL_STOCK │ Initial stock added during variant  │
│    │           │            │          │            │               │ creation                            │
└────┴───────────┴────────────┴──────────┴────────────┴───────────────┴─────────────────────────────────────┘
```

**Benefits:**
- ✅ Variant + Inventory created in **one API call**
- ✅ Product immediately available for sale
- ✅ Full audit trail (inventory movement tracked)

---

### **Scenario 3: Create Variant at Different Location**

**Request:**
```http
POST /api/v1/catalog/variants
Content-Type: application/json

{
"productId": 1,
"sku": "WINE-003",
"price": 49.99,
"initialStock": 50,
"locationId": 2
}
```

**What Happens:**
1. ✅ Variant created
2. ✅ Inventory record created at **location 2** with **quantity: 50**
3. ✅ Inventory movement created

**Result:**
```
VariantInventory Table:
┌────┬───────────┬────────────┬──────────┬──────────┐
│ id │ variantId │ locationId │ quantity │ reserved │
├────┼───────────┼────────────┼──────────┼──────────┤
│ 3  │     3     │      2     │    50    │    0     │
└────┴───────────┴────────────┴──────────┴──────────┘
```

---

## 📊 Behavior Matrix

| `initialStock` | `locationId` | Inventory Created? | Quantity | Movement Created? |
|----------------|--------------|-------------------|----------|-------------------|
| Not provided   | Not provided | ✅ Yes (location 1) | 0        | ❌ No             |
| `0`            | Not provided | ✅ Yes (location 1) | 0        | ❌ No             |
| `100`          | Not provided | ✅ Yes (location 1) | 100      | ✅ Yes            |
| `100`          | `2`          | ✅ Yes (location 2) | 100      | ✅ Yes            |

---

## ⚠️ Important Notes

### **1. Location Must Exist**
If you specify a `locationId`, that location **must exist** in the database, otherwise you'll get an error:

```json
{
"statusCode": 404,
"message": "Location with ID 5 not found. Please create a location first.",
"error": "Not Found"
}
```

**Solution:** Create locations first using:
```http
POST /api/v1/inventory/locations
{
"name": "Main Warehouse",
"address": "123 Main St",
"isActive": true
}
```

---

### **2. Default Location is 1**
If you don't specify `locationId`, it defaults to **location 1**. Make sure location 1 exists in your database!

---

### **3. Inventory Always Created**
Even if you don't provide `initialStock`, an inventory record is **always created** with quantity 0. This prevents:
- ❌ "Missing inventory" errors
- ❌ Need for separate inventory creation
- ❌ Inconsistent data state

---

### **4. Audit Trail**
When `initialStock > 0`, an inventory movement record is automatically created with:
- **Type:** `ADJUSTMENT`
- **Reason:** `INITIAL_STOCK`
- **Notes:** "Initial stock added during variant creation"

This provides full traceability for compliance and auditing.

---

## 🔄 Complete Admin Workflow

### **Step 1: Create Product**
```http
POST /api/v1/catalog/products
{
"name": "Premium Cabernet Sauvignon 2020",
"description": "Full-bodied red wine from Napa Valley",
"isActive": true
}
```

**Response:**
```json
{
"id": 1,
"name": "Premium Cabernet Sauvignon 2020",
"isActive": true
}
```

---

### **Step 2: Create Variant with Initial Stock**
```http
POST /api/v1/catalog/variants
{
"productId": 1,
"sku": "CAB-2020-750ML",
"price": 29.99,
"compareAtPrice": 39.99,
"barcode": "123456789",
"weight": 1.5,
"isActive": true,
"initialStock": 100
}
```

**Response:**
```json
{
"id": 1,
"productId": 1,
"sku": "CAB-2020-750ML",
"price": 29.99,
"compareAtPrice": 39.99,
"isActive": true
}
```

---

### **Step 3: Verify Inventory**
```http
GET /api/v1/inventory/variants/1
```

**Response:**
```json
{
"variantId": 1,
"sku": "CAB-2020-750ML",
"totalQuantity": 100,
"totalReserved": 0,
"availableQuantity": 100,
"inventories": [
    {
      "id": 1,
      "variantId": 1,
      "locationId": 1,
      "quantity": 100,
      "reserved": 0,
      "location": {
        "id": 1,
        "name": "Main Warehouse"
      }
    }
]
}
```

✅ **Done! Product is ready for sale!**

---

## 🎨 Frontend Integration

### **Simple Variant Creation Form**

```typescript
// Frontend code example
async function createVariant(formData) {
const response = await fetch('/api/v1/catalog/variants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId: formData.productId,
      sku: formData.sku,
      price: formData.price,
      barcode: formData.barcode,
      weight: formData.weight,
      isActive: true,
      initialStock: formData.stock || undefined,  // Optional
      locationId: formData.locationId || undefined // Optional
    })
});
  
if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
}
  
return await response.json();
}
```

---

## ✅ Benefits of This Implementation

| Benefit | Description |
|---------|-------------|
| **Simplified Workflow** | Create variant + inventory in one API call |
| **No Missing Inventory** | Inventory record always exists (even with 0 qty) |
| **Backward Compatible** | Existing API calls still work (`initialStock` is optional) |
| **Flexible** | Admin can set stock now or later |
| **Audit Trail** | Full tracking via inventory movements |
| **Error Prevention** | Validates location exists before creating |
| **Consistent Data** | No orphaned variants without inventory |

---

## 🔧 Future Enhancements (Optional)

### **1. Support Multiple Locations During Creation**
```json
{
"sku": "WINE-001",
"price": 29.99,
"inventory": [
    { "locationId": 1, "quantity": 100 },
    { "locationId": 2, "quantity": 50 }
]
}
```

### **2. Bulk Variant Creation**
```json
{
"productId": 1,
"variants": [
    { "sku": "WINE-750ML", "price": 29.99, "initialStock": 100 },
    { "sku": "WINE-1500ML", "price": 49.99, "initialStock": 50 }
]
}
```

---

## 📞 Testing Checklist

- [ ] Create variant without `initialStock` → Inventory created with qty 0
- [ ] Create variant with `initialStock: 100` → Inventory created with qty 100
- [ ] Create variant with `locationId: 2` → Inventory created at location 2
- [ ] Create variant with invalid `locationId` → Error returned
- [ ] Verify inventory movement created when qty > 0
- [ ] Verify no movement created when qty = 0
- [ ] Check product detail endpoint includes inventory data
- [ ] Check product list endpoint includes inventory data

---

**Implementation Complete!** ✅

**Last Updated:** 2025-11-26

