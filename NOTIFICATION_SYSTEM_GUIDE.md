# 📱 Notification System - Complete Guide

## 🎯 Overview

Your notification system supports **multiple channels** with a focus on **real-time app notifications** for the frontend. Here's what's implemented:

### **Supported Channels:**
| Channel | Status | Description |
|---------|--------|-------------|
| **REALTIME** | ✅ **Fully Implemented** | WebSocket-based real-time notifications (for app) |
| **EMAIL** | ✅ **Fully Implemented** | SMTP email notifications |
| **SMS** | ⏳ **Not Implemented** | Placeholder for future |
| **PUSH** | ⏳ **Not Implemented** | Placeholder for future |

---

## 🚀 App Notifications (REALTIME Channel)

### **How It Works:**

1. **WebSocket Gateway** - Uses Socket.IO for real-time communication
2. **User Rooms** - Each user joins a room `user-{userId}` when connected
3. **Database Storage** - All notifications are stored in the database
4. **Real-time Delivery** - Notifications are pushed to connected clients instantly

---

## 📡 WebSocket Connection (Frontend)

### **Connection Details:**

- **URL:** `ws://your-backend-url/notifications`
- **Namespace:** `/notifications`
- **Authentication:** Pass `userId` in query params

### **Frontend Connection Example (Socket.IO Client):**

```javascript
import { io } from 'socket.io-client';

// Connect to notification gateway
const socket = io('http://localhost:3000/notifications', {
  query: {
    userId: 123  // ✅ Pass the logged-in user's ID
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to notification server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from notification server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// ✅ Listen for notifications
socket.on('notification', (notification) => {
  console.log('📬 New notification received:', notification);
  
  // notification structure:
  // {
  //   id: 1,
  //   userId: 123,
  //   event: 'ORDER_PLACED',
  //   channel: 'realtime',
  //   title: 'Order Confirmed',
  //   message: 'Your order #12345 has been confirmed',
  //   data: { orderId: 12345, amount: 99.99 },
  //   createdAt: '2025-11-26T10:30:00Z'
  // }
  
  // Show notification in UI
  showNotificationToast(notification);
  
  // Update notification badge count
  updateNotificationBadge();
});

// Health check (optional)
socket.on('pong', (data) => {
  console.log('Pong received:', data.timestamp);
});

// Send ping to check connection
setInterval(() => {
  socket.emit('ping');
}, 30000); // Every 30 seconds
```

---

## 🔔 Notification Endpoints for Frontend

### **1. Get User Notifications (Paginated)**

```http
GET /api/v1/notifications/user/:userId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "userId": 123,
      "event": "ORDER_PLACED",
      "channel": "realtime",
      "title": "Order Confirmed",
      "message": "Your order #12345 has been confirmed",
      "data": {
        "orderId": 12345,
        "amount": 99.99
      },
      "status": "sent",
      "isRead": false,
      "readAt": null,
      "createdAt": "2025-11-26T10:30:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### **2. Get Unread Notifications**

```http
GET /api/v1/notifications/user/:userId/unread
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 123,
    "event": "ORDER_PLACED",
    "title": "Order Confirmed",
    "message": "Your order #12345 has been confirmed",
    "createdAt": "2025-11-26T10:30:00Z"
  },
  {
    "id": 2,
    "userId": 123,
    "event": "ORDER_SHIPPED",
    "title": "Order Shipped",
    "message": "Your order is on the way!",
    "createdAt": "2025-11-26T11:00:00Z"
  }
]
```

---

### **3. Get Unread Count (For Badge)**

```http
GET /api/v1/notifications/user/:userId/unread/count
Authorization: Bearer {token}
```

**Response:**
```json
{
  "count": 5
}
```

**Frontend Usage:**
```javascript
async function getUnreadCount(userId) {
  const response = await fetch(`/api/v1/notifications/user/${userId}/unread/count`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  
  // Update badge
  document.getElementById('notification-badge').textContent = data.count;
}
```

---

### **4. Mark Notifications as Read**

```http
PUT /api/v1/notifications/mark-as-read
Authorization: Bearer {token}
Content-Type: application/json

{
  "notificationIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "updated": 3
}
```

---

### **5. Mark All as Read**

```http
PUT /api/v1/notifications/user/:userId/mark-all-read
Authorization: Bearer {token}
```

**Response:**
```json
{
  "updated": 10
}
```

---

### **6. Delete Notification**

```http
DELETE /api/v1/notifications/:id
Authorization: Bearer {token}
```

**Response:** `204 No Content`

---

## 🎨 Frontend Implementation Example

### **React/Vue/Angular Notification Component:**

```typescript
// NotificationService.ts
import { io, Socket } from 'socket.io-client';

class NotificationService {
  private socket: Socket | null = null;
  private userId: number | null = null;
  
  connect(userId: number) {
    this.userId = userId;
    
    this.socket = io('http://localhost:3000/notifications', {
      query: { userId },
      transports: ['websocket']
    });
    
    this.socket.on('connect', () => {
      console.log('✅ Connected to notifications');
    });
    
    this.socket.on('notification', (notification) => {
      this.handleNotification(notification);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  private handleNotification(notification: any) {
    // Show toast notification
    this.showToast(notification);
    
    // Update notification list
    this.updateNotificationList(notification);
    
    // Update badge count
    this.incrementBadgeCount();
    
    // Play sound (optional)
    this.playNotificationSound();
  }
  
  private showToast(notification: any) {
    // Use your toast library (e.g., react-toastify, vue-toastification)
    toast.info(notification.message, {
      title: notification.title,
      duration: 5000
    });
  }
  
  async getUnreadCount(): Promise<number> {
    const response = await fetch(`/api/v1/notifications/user/${this.userId}/unread/count`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    return data.count;
  }
  
  async markAsRead(notificationIds: number[]) {
    await fetch('/api/v1/notifications/mark-as-read', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ notificationIds })
    });
  }
  
  async markAllAsRead() {
    await fetch(`/api/v1/notifications/user/${this.userId}/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
}

export const notificationService = new NotificationService();
```

---

### **React Component Example:**

```tsx
import React, { useEffect, useState } from 'react';
import { notificationService } from './NotificationService';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const userId = getCurrentUserId(); // Your auth logic
    
    // Connect to WebSocket
    notificationService.connect(userId);
    
    // Load initial unread count
    loadUnreadCount();
    
    // Cleanup on unmount
    return () => {
      notificationService.disconnect();
    };
  }, []);
  
  async function loadUnreadCount() {
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  }
  
  async function loadNotifications() {
    const userId = getCurrentUserId();
    const response = await fetch(`/api/v1/notifications/user/${userId}/unread`);
    const data = await response.json();
    setNotifications(data);
  }
  
  async function handleMarkAllRead() {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications([]);
  }
  
  return (
    <div className="notification-bell">
      <button onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="header">
            <h3>Notifications</h3>
            <button onClick={handleMarkAllRead}>Mark all as read</button>
          </div>
          
          <div className="notification-list">
            {notifications.map(notif => (
              <div key={notif.id} className="notification-item">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <span>{new Date(notif.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📤 Sending Notifications (Backend)

### **Method 1: Direct API Call**

```http
POST /api/v1/notifications/send
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "userId": 123,
  "event": "ORDER_PLACED",
  "channels": ["realtime"],
  "title": "Order Confirmed",
  "message": "Your order #12345 has been confirmed",
  "data": {
    "orderId": 12345,
    "amount": 99.99
  }
}
```

---

### **Method 2: From Your Code (Recommended)**

```typescript
// In your order service
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/enums';

@Injectable()
export class OrderService {
  constructor(
    private readonly notificationsService: NotificationsService
  ) {}
  
  async createOrder(userId: number, orderData: any) {
    // Create order logic...
    const order = await this.orderRepo.create(orderData);
    
    // ✅ Send notification
    await this.notificationsService.send({
      userId: userId,
      event: 'ORDER_PLACED',
      channels: [NotificationChannel.REALTIME, NotificationChannel.EMAIL],
      title: 'Order Confirmed',
      message: `Your order #${order.id} has been confirmed`,
      data: {
        orderId: order.id,
        amount: order.total,
        items: order.items.length
      }
    });
    
    return order;
  }
}
```

---

## 🎯 Common Notification Events

Here are typical events you might use:

| Event | When to Send | Channels |
|-------|--------------|----------|
| `ORDER_PLACED` | Order created | REALTIME + EMAIL |
| `ORDER_CONFIRMED` | Payment confirmed | REALTIME + EMAIL |
| `ORDER_SHIPPED` | Order shipped | REALTIME + EMAIL + SMS |
| `ORDER_DELIVERED` | Order delivered | REALTIME + EMAIL |
| `ORDER_CANCELLED` | Order cancelled | REALTIME + EMAIL |
| `PAYMENT_SUCCESS` | Payment successful | REALTIME + EMAIL |
| `PAYMENT_FAILED` | Payment failed | REALTIME + EMAIL |
| `LOW_STOCK_ALERT` | Stock below threshold | REALTIME (admin) |
| `NEW_REVIEW` | Product reviewed | REALTIME (admin) |
| `ACCOUNT_VERIFIED` | Email verified | REALTIME + EMAIL |
| `PASSWORD_RESET` | Password reset requested | EMAIL |

---

## ⚙️ Notification Preferences

Users can control which notifications they receive:

### **Update User Preferences:**

```http
PUT /api/v1/notifications/preferences
Content-Type: application/json

{
  "userId": 123,
  "event": "ORDER_PLACED",
  "channel": "email",
  "enabled": false
}
```

### **Get User Preferences:**

```http
GET /api/v1/notifications/preferences/user/123
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 123,
    "event": "ORDER_PLACED",
    "channel": "email",
    "enabled": true
  },
  {
    "id": 2,
    "userId": 123,
    "event": "ORDER_PLACED",
    "channel": "realtime",
    "enabled": true
  }
]
```

---

## 🔒 Security Considerations

### **1. WebSocket Authentication**

Currently using `userId` in query params. For production, implement JWT validation:

```typescript
// In notification.gateway.ts
private extractUserId(client: Socket): number | null {
  try {
    const token = client.handshake.auth.token;
    const decoded = this.jwtService.verify(token);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}
```

### **2. Authorization**

Make sure users can only:
- ✅ View their own notifications
- ✅ Mark their own notifications as read
- ❌ Cannot view other users' notifications

---

## 📊 Database Schema

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  event     String   @db.VarChar(100)
  channel   NotificationChannel
  title     String?  @db.VarChar(255)
  message   String
  data      Json?
  status    String   @default("pending")
  sentAt    DateTime?
  isRead    Boolean  @default(false)
  readAt    DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now())
}
```

---

## ✅ Testing

### **Test Endpoint (No Auth Required):**

```http
POST /api/v1/notifications/test
Content-Type: application/json

{
  "userId": 123
}
```

This sends a test notification to user 123 via REALTIME channel.

---

## 🎉 Summary

### **For Frontend Developers:**

1. ✅ **Connect to WebSocket** using Socket.IO client with `userId`
2. ✅ **Listen for `notification` events** to receive real-time notifications
3. ✅ **Use REST endpoints** to fetch notification history, unread count, mark as read
4. ✅ **Show notifications** using toast/snackbar components
5. ✅ **Update badge count** when new notifications arrive

### **Key Features:**

- ✅ Real-time delivery via WebSocket
- ✅ Persistent storage in database
- ✅ Read/unread tracking
- ✅ Notification preferences
- ✅ Multi-channel support (email + realtime)
- ✅ Event-driven architecture
- ✅ User-specific rooms for targeted delivery

---

**Your notification system is fully functional for app notifications!** 🚀

