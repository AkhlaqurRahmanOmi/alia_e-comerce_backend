# Bookings API Documentation

## 19. Bookings & Reservations

### Overview
The Bookings API provides table reservation functionality for the wine shop. It supports:
- Real-time availability checking
- Guest and registered user bookings
- Optional deposit payments
- Admin booking management
- Custom schedules for special days
- Blocked dates for holidays/closures

### Base Path
```
/bookings
```

### Permissions
- `bookings:view` - View bookings
- `bookings:create` - Create bookings
- `bookings:update` - Update bookings
- `bookings:delete` - Delete bookings
- `bookings:cancel` - Cancel bookings
- `bookings:manage-settings` - Manage booking settings, blocked dates, and custom schedules

---

### 19.1 Check Availability

Check available time slots for a specific date and party size.

**Endpoint**: `GET /bookings/availability`
**Auth**: None (Public)

**Query Parameters**:
- `date` (required, string): Booking date in ISO format (YYYY-MM-DD)
- `partySize` (required, number): Number of people (1-50)

**Example Request**:
```http
GET /bookings/availability?date=2025-11-25&partySize=4
```

**Success Response** (200):
```json
{
  "date": "2025-11-25",
  "slots": [
    {
      "time": "11:00",
      "capacity": 50,
      "booked": 24,
      "available": 26,
      "isAvailable": true
    },
    {
      "time": "13:00",
      "capacity": 50,
      "booked": 45,
      "available": 5,
      "isAvailable": true
    },
    {
      "time": "19:00",
      "capacity": 50,
      "booked": 50,
      "available": 0,
      "isAvailable": false
    }
  ],
  "totalSlots": 6,
  "availableSlots": 5,
  "isFullyBooked": false
}
```

---

### 19.2 Get Public Settings

Get public booking settings.

**Endpoint**: `GET /bookings/settings/public`
**Auth**: None (Public)

**Success Response** (200):
```json
{
  "minPartySize": 1,
  "maxPartySize": 20,
  "advanceBookingDays": 30,
  "isBookingEnabled": true,
  "requireDeposit": true,
  "depositAmount": 50.00,
  "depositType": "fixed",
  "cancellationHours": 24
}
```

---

### 19.3 Create Booking

Create a new table reservation.

**Endpoint**: `POST /bookings`
**Auth**: None (Guest or Bearer Token)

**Request Body**:
```json
{
  "bookingDate": "2025-11-25",
  "bookingTime": "19:00",
  "partySize": 4,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "specialRequests": "Window seat please"
}
```

**Success Response** (201):
```json
{
  "id": 123,
  "userId": null,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "bookingDate": "2025-11-25",
  "bookingTime": "19:00",
  "partySize": 4,
  "status": "pending_payment",
  "paymentStatus": "pending",
  "depositRequired": true,
  "depositAmount": 50.00,
  "confirmationCode": "BK-2025-ABC123",
  "expiresAt": "2025-11-20T12:15:00Z",
  "specialRequests": "Window seat please",
  "createdAt": "2025-11-20T12:00:00Z",
  "updatedAt": "2025-11-20T12:00:00Z"
}
```

**Notes**:
- If `depositRequired` is `true`, booking status will be `pending_payment` and will expire after `paymentHoldMinutes` (default: 15 minutes)
- If `depositRequired` is `false`, booking status will be `confirmed` immediately
- Authentication is optional - if provided, `userId` will be set

---

### 19.4 Get Booking by Confirmation Code

Retrieve booking details using confirmation code.

**Endpoint**: `GET /bookings/confirmation/:code`
**Auth**: None (Public)

**Example Request**:
```http
GET /bookings/confirmation/BK-2025-ABC123
```

**Success Response** (200):
```json
{
  "id": 123,
  "confirmationCode": "BK-2025-ABC123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "bookingDate": "2025-11-25",
  "bookingTime": "19:00",
  "partySize": 4,
  "status": "confirmed",
  "paymentStatus": "completed",
  "depositAmount": 50.00,
  "paidAt": "2025-11-20T12:05:00Z",
  "specialRequests": "Window seat please",
  "createdAt": "2025-11-20T12:00:00Z",
  "bookingStatusHistories": [
    {
      "id": 1,
      "status": "pending_payment",
      "note": "Booking created",
      "changedBy": "guest",
      "createdAt": "2025-11-20T12:00:00Z"
    },
    {
      "id": 2,
      "status": "confirmed",
      "note": "Payment completed",
      "changedBy": "system",
      "createdAt": "2025-11-20T12:05:00Z"
    }
  ]
}
```

---

### 19.5 Get My Bookings

Get all bookings for the authenticated user.

**Endpoint**: `GET /bookings/my-bookings`
**Auth**: Bearer Token (Required)
**Permissions**: None (Own data)

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 123,
      "confirmationCode": "BK-2025-ABC123",
      "bookingDate": "2025-11-25",
      "bookingTime": "19:00",
      "partySize": 4,
      "status": "confirmed",
      "paymentStatus": "completed",
      "createdAt": "2025-11-20T12:00:00Z"
    }
  ]
}
```

---

### 19.6 Cancel Own Booking

Cancel your own booking.

**Endpoint**: `PATCH /bookings/:id/cancel`
**Auth**: Bearer Token (Required)
**Permissions**: None (Own booking)

**Request Body**:
```json
{
  "reason": "Change of plans"
}
```

**Success Response** (200):
```json
{
  "id": 123,
  "status": "cancelled",
  "cancelledAt": "2025-11-20T13:00:00Z",
  "cancelledBy": "user_1",
  "cancellationReason": "Change of plans"
}
```

**Error Response** (400):
```json
{
  "statusCode": 400,
  "message": "Cancellation must be made at least 24 hours before the booking time",
  "error": "Bad Request"
}
```

---

## Admin Endpoints

### 19.7 Get All Bookings (Admin)

Get all bookings with filters.

**Endpoint**: `GET /bookings/admin/all`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:view`

**Query Parameters**:
- `status` (optional): Filter by status (pending_payment, pending, confirmed, cancelled, completed, no_show)
- `bookingDate` (optional): Filter by booking date (YYYY-MM-DD)
- `customerEmail` (optional): Filter by customer email
- `confirmationCode` (optional): Filter by confirmation code
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `sortBy` (optional): Sort field
- `sortOrder` (optional, default: desc): Sort order (asc/desc)

**Example Request**:
```http
GET /bookings/admin/all?status=confirmed&bookingDate=2025-11-25&page=1&limit=20
```

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 123,
      "userId": 5,
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+1234567890",
      "bookingDate": "2025-11-25",
      "bookingTime": "19:00",
      "partySize": 4,
      "status": "confirmed",
      "paymentStatus": "completed",
      "confirmationCode": "BK-2025-ABC123",
      "createdAt": "2025-11-20T12:00:00Z",
      "user": {
        "id": 5,
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 19.8 Get Booking Details (Admin)

Get detailed booking information.

**Endpoint**: `GET /bookings/admin/:id`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:view`

**Success Response** (200):
```json
{
  "id": 123,
  "userId": 5,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "bookingDate": "2025-11-25",
  "bookingTime": "19:00",
  "partySize": 4,
  "status": "confirmed",
  "paymentStatus": "completed",
  "depositAmount": 50.00,
  "paidAt": "2025-11-20T12:05:00Z",
  "confirmationCode": "BK-2025-ABC123",
  "specialRequests": "Window seat please",
  "createdAt": "2025-11-20T12:00:00Z",
  "user": {
    "id": 5,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "bookingStatusHistories": [
    {
      "id": 1,
      "status": "pending_payment",
      "note": "Booking created",
      "changedBy": "user_5",
      "createdAt": "2025-11-20T12:00:00Z"
    },
    {
      "id": 2,
      "status": "confirmed",
      "note": "Payment completed",
      "changedBy": "system",
      "createdAt": "2025-11-20T12:05:00Z"
    }
  ],
  "bookingPayments": [
    {
      "id": 1,
      "amount": 50.00,
      "currency": "USD",
      "paymentGateway": "stripe",
      "transactionId": "pi_xxx",
      "status": "completed",
      "createdAt": "2025-11-20T12:05:00Z"
    }
  ]
}
```

---

### 19.9 Update Booking (Admin)

Update booking details.

**Endpoint**: `PUT /bookings/admin/:id`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:update`

**Request Body**:
```json
{
  "bookingDate": "2025-11-26",
  "bookingTime": "20:00",
  "partySize": 6,
  "customerName": "John Smith",
  "customerPhone": "+1234567891",
  "specialRequests": "Anniversary celebration",
  "status": "confirmed"
}
```

**Success Response** (200):
```json
{
  "id": 123,
  "bookingDate": "2025-11-26",
  "bookingTime": "20:00",
  "partySize": 6,
  "status": "confirmed",
  "updatedAt": "2025-11-20T13:30:00Z"
}
```

---

### 19.10 Cancel Booking (Admin)

Cancel a booking.

**Endpoint**: `PATCH /bookings/admin/:id/cancel`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:update`

**Request Body**:
```json
{
  "reason": "Customer requested cancellation"
}
```

**Success Response** (200):
```json
{
  "id": 123,
  "status": "cancelled",
  "cancelledAt": "2025-11-20T14:00:00Z",
  "cancelledBy": "admin_1",
  "cancellationReason": "Customer requested cancellation"
}
```

---

### 19.11 Mark as No-Show (Admin)

Mark a booking as no-show.

**Endpoint**: `PATCH /bookings/admin/:id/no-show`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:update`

**Success Response** (200):
```json
{
  "id": 123,
  "status": "no_show",
  "updatedAt": "2025-11-25T19:30:00Z"
}
```

---

### 19.12 Mark as Completed (Admin)

Mark a booking as completed.

**Endpoint**: `PATCH /bookings/admin/:id/completed`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:update`

**Success Response** (200):
```json
{
  "id": 123,
  "status": "completed",
  "updatedAt": "2025-11-25T21:00:00Z"
}
```

---

### 19.13 Delete Booking (Admin)

Permanently delete a booking.

**Endpoint**: `DELETE /bookings/admin/:id`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:delete`

**Success Response** (200):
```json
{
  "message": "Booking deleted successfully"
}
```

---

## Booking Settings Management

### 19.14 Get Full Settings (Admin)

Get complete booking settings.

**Endpoint**: `GET /bookings/admin/settings/details`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Success Response** (200):
```json
{
  "id": 1,
  "maxCapacityPerSlot": 50,
  "slotDurationMinutes": 120,
  "openingTime": "11:00",
  "closingTime": "22:00",
  "advanceBookingDays": 30,
  "minPartySize": 1,
  "maxPartySize": 20,
  "requireDeposit": true,
  "depositAmount": 50.00,
  "depositType": "fixed",
  "paymentHoldMinutes": 15,
  "cancellationHours": 24,
  "isBookingEnabled": true,
  "createdAt": "2025-11-01T10:00:00Z",
  "updatedAt": "2025-11-15T14:30:00Z"
}
```

---

### 19.15 Update Settings (Admin)

Update booking settings.

**Endpoint**: `PUT /bookings/admin/settings`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Request Body**:
```json
{
  "maxCapacityPerSlot": 60,
  "slotDurationMinutes": 90,
  "openingTime": "10:00",
  "closingTime": "23:00",
  "advanceBookingDays": 45,
  "requireDeposit": true,
  "depositAmount": 75.00,
  "depositType": "per_person",
  "paymentHoldMinutes": 20,
  "cancellationHours": 48,
  "isBookingEnabled": true
}
```

**Success Response** (200):
```json
{
  "id": 1,
  "maxCapacityPerSlot": 60,
  "slotDurationMinutes": 90,
  "openingTime": "10:00",
  "closingTime": "23:00",
  "updatedAt": "2025-11-20T15:00:00Z"
}
```

---

## Blocked Dates Management

### 19.16 Get All Blocked Dates (Admin)

Get list of blocked dates.

**Endpoint**: `GET /bookings/admin/blocked-dates`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-12-25",
      "reason": "Christmas Day",
      "isAllDay": true,
      "startTime": null,
      "endTime": null,
      "createdAt": "2025-11-01T10:00:00Z"
    },
    {
      "id": 2,
      "date": "2025-11-28",
      "reason": "Staff meeting",
      "isAllDay": false,
      "startTime": "14:00",
      "endTime": "16:00",
      "createdAt": "2025-11-15T09:00:00Z"
    }
  ]
}
```

---

### 19.17 Create Blocked Date (Admin)

Block a specific date or time range.

**Endpoint**: `POST /bookings/admin/blocked-dates`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Request Body**:
```json
{
  "date": "2025-12-31",
  "reason": "New Year's Eve - Private Event",
  "isAllDay": true
}
```

Or for partial day block:
```json
{
  "date": "2025-11-28",
  "reason": "Staff training",
  "isAllDay": false,
  "startTime": "14:00",
  "endTime": "17:00"
}
```

**Success Response** (201):
```json
{
  "id": 3,
  "date": "2025-12-31",
  "reason": "New Year's Eve - Private Event",
  "isAllDay": true,
  "createdAt": "2025-11-20T10:00:00Z"
}
```

---

### 19.18 Delete Blocked Date (Admin)

Remove a blocked date.

**Endpoint**: `DELETE /bookings/admin/blocked-dates/:id`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Success Response** (200):
```json
{
  "message": "Blocked date deleted successfully"
}
```

---

## Custom Schedules Management

### 19.19 Get All Custom Schedules (Admin)

Get list of custom schedules for special days.

**Endpoint**: `GET /bookings/admin/custom-schedules`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Success Response** (200):
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-12-31",
      "openingTime": "18:00",
      "closingTime": "02:00",
      "maxCapacity": 100,
      "slotDuration": 180,
      "requireDeposit": true,
      "depositAmount": 150.00,
      "reason": "New Year's Eve Special",
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

### 19.20 Create Custom Schedule (Admin)

Create a custom schedule for a special day.

**Endpoint**: `POST /bookings/admin/custom-schedules`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Request Body**:
```json
{
  "date": "2025-12-31",
  "openingTime": "18:00",
  "closingTime": "02:00",
  "maxCapacity": 100,
  "slotDuration": 180,
  "requireDeposit": true,
  "depositAmount": 150.00,
  "reason": "New Year's Eve Special"
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "date": "2025-12-31",
  "openingTime": "18:00",
  "closingTime": "02:00",
  "maxCapacity": 100,
  "slotDuration": 180,
  "requireDeposit": true,
  "depositAmount": 150.00,
  "reason": "New Year's Eve Special",
  "createdAt": "2025-11-20T10:00:00Z"
}
```

---

### 19.21 Delete Custom Schedule (Admin)

Remove a custom schedule.

**Endpoint**: `DELETE /bookings/admin/custom-schedules/:id`
**Auth**: Bearer Token (Required)
**Permissions**: `bookings:manage-settings`

**Success Response** (200):
```json
{
  "message": "Custom schedule deleted successfully"
}
```

---

## Booking Status Flow

```
┌────────────────┐
│ pending_payment│  (If deposit required)
└───────┬────────┘
        │ Payment completed
        ▼
┌────────────────┐
│   confirmed    │  (Booking confirmed)
└───────┬────────┘
        │
        ├──► completed (Customer showed up)
        ├──► cancelled (Booking cancelled)
        └──► no_show   (Customer didn't show up)
```

## Payment Status Flow

```
┌──────────────┐
│ not_required │  (No deposit needed)
└──────────────┘

OR

┌──────────────┐
│   pending    │  (Deposit required, not paid)
└──────┬───────┘
       │
       ├──► completed (Payment successful)
       ├──► failed    (Payment failed)
       └──► refunded  (Refund processed)
```

---

## Caching

Booking availability is cached for **5 minutes** per date and party size combination. Cache is automatically invalidated when:
- A new booking is created
- A booking is cancelled or updated
- Booking settings are changed
- Blocked dates or custom schedules are modified

---

## Webhooks (Future Feature)

Webhook events for booking notifications:
- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `booking.reminder` (24 hours before)
- `booking.no_show`
- `booking.completed`

---

## Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | `INVALID_DATE` | Date is in the past or beyond booking window |
| 400 | `INVALID_PARTY_SIZE` | Party size outside allowed range |
| 400 | `SLOT_NOT_AVAILABLE` | Selected time slot is not available |
| 400 | `BOOKING_SYSTEM_DISABLED` | Booking system is currently disabled |
| 400 | `DATE_BLOCKED` | Selected date is blocked |
| 400 | `CANCELLATION_TOO_LATE` | Cannot cancel within minimum cancellation period |
| 404 | `BOOKING_NOT_FOUND` | Booking does not exist |
| 409 | `DUPLICATE_BLOCKED_DATE` | Blocked date already exists |
| 409 | `DUPLICATE_CUSTOM_SCHEDULE` | Custom schedule already exists for this date |

---

**Last Updated**: 2025-11-21
**Total Booking Endpoints**: 21
