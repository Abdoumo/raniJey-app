# Rani-Jay Real-Time Tracking API Documentation

## Overview
This document describes the API requirements for real-time order tracking with live location updates between users and delivery personnel.

## Architecture
- **Protocol**: WebSocket (primary), HTTP (fallback)
- **Base URL**: `ws://localhost:4000` (WebSocket)
- **HTTP Base URL**: `http://localhost:4000` (Fallback)

---

## WebSocket Connection

### Connection Endpoint
```
ws://localhost:4000/ws?token={JWT_TOKEN}&userId={USER_ID}&role={USER_ROLE}
```

### Parameters
- `token`: JWT authentication token
- `userId`: Unique user identifier (can be stored in localStorage)
- `role`: User role (`user` for customers, `Livreur` for delivery personnel)

### Connection Example
```javascript
const socket = new WebSocket(
  `ws://localhost:4000/ws?token=${token}&userId=${userId}&role=${userRole}`
);

socket.onopen = () => {
  console.log('Connected to tracking service');
};
```

---

## WebSocket Message Format

All WebSocket messages follow this format:

### Sent from Frontend (Client → Server)
```json
{
  "type": "MESSAGE_TYPE",
  "payload": {
    "data": "fields..."
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Received from Backend (Server → Client)
```json
{
  "type": "MESSAGE_TYPE",
  "payload": {
    "data": "fields..."
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## WebSocket Messages

### 1. LOCATION_UPDATE (Client → Server)

**Purpose**: Send user's current GPS location to backend

**Sent by**: Both customers and delivery personnel

**Frequency**: Every 3 seconds during active tracking

**Payload**:
```json
{
  "type": "LOCATION_UPDATE",
  "payload": {
    "latitude": 36.7538,
    "longitude": 3.0588,
    "accuracy": 10,
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

**Fields**:
- `latitude` (number): GPS latitude coordinate
- `longitude` (number): GPS longitude coordinate
- `accuracy` (number): GPS accuracy in meters
- `timestamp` (string): ISO 8601 timestamp

**Backend Action**:
- Store location in database with timestamp
- Broadcast to all subscribers of related orders
- Update order status to reflect current delivery person location

---

### 2. SUBSCRIBE_ORDER (Client → Server)

**Purpose**: Subscribe to real-time updates for a specific order

**Sent by**: Customers tracking their order, delivery personnel after accepting

**Payload**:
```json
{
  "type": "SUBSCRIBE_ORDER",
  "payload": {
    "orderId": "507f1f77bcf86cd799439011"
  }
}
```

**Fields**:
- `orderId` (string): MongoDB order ID

**Backend Action**:
- Add user to order subscribers list
- Send initial order status
- Begin broadcasting location updates for this order

---

### 3. UNSUBSCRIBE_ORDER (Client → Server)

**Purpose**: Stop receiving updates for an order

**Sent by**: Users who completed tracking

**Payload**:
```json
{
  "type": "UNSUBSCRIBE_ORDER",
  "payload": {
    "orderId": "507f1f77bcf86cd799439011"
  }
}
```

**Backend Action**:
- Remove user from subscribers list
- Stop sending updates for this order

---

### 4. ACCEPT_ORDER (Client → Server)

**Purpose**: Delivery person accepts an order

**Sent by**: Delivery personnel (Livreur role)

**Payload**:
```json
{
  "type": "ACCEPT_ORDER",
  "payload": {
    "orderId": "507f1f77bcf86cd799439011"
  }
}
```

**Backend Action**:
- Update order status to "accepted"
- Assign delivery person to order
- Notify customer via WebSocket

---

### 5. START_DELIVERY (Client → Server)

**Purpose**: Delivery person starts heading to customer

**Sent by**: Delivery personnel (Livreur role)

**Payload**:
```json
{
  "type": "START_DELIVERY",
  "payload": {
    "orderId": "507f1f77bcf86cd799439011"
  }
}
```

**Backend Action**:
- Update order status to "on-the-way"
- Broadcast update to customer
- Begin tracking delivery person's live location

---

### 6. COMPLETE_DELIVERY (Client → Server)

**Purpose**: Mark order as delivered

**Sent by**: Delivery personnel (Livreur role)

**Payload**:
```json
{
  "type": "COMPLETE_DELIVERY",
  "payload": {
    "orderId": "507f1f77bcf86cd799439011",
    "notes": "Delivered at main gate"
  }
}
```

**Fields**:
- `orderId` (string): Order ID
- `notes` (string): Delivery notes (optional)

**Backend Action**:
- Update order status to "delivered"
- Record completion timestamp
- Notify customer
- Clean up delivery assignment

---

### 7. ORDER_UPDATE (Server → Client - Broadcast)

**Purpose**: Broadcast order status changes to all subscribers

**Sent by**: Backend to all order subscribers

**Payload**:
```json
{
  "type": "ORDER_UPDATE",
  "payload": {
    "orderId": "507f1f77bcf86cd799439011",
    "status": "on-the-way",
    "deliveryPersonId": "user123",
    "deliveryPersonName": "Ahmed Hassan",
    "deliveryPersonLocation": {
      "latitude": 36.7538,
      "longitude": 3.0588,
      "accuracy": 10,
      "timestamp": "2024-01-20T10:30:00.000Z"
    },
    "distance": 0.5,
    "eta": 5
  }
}
```

**Fields**:
- `orderId` (string): Order ID
- `status` (string): One of: `pending`, `confirmed`, `on-the-way`, `delivered`
- `deliveryPersonId` (string): ID of delivery person
- `deliveryPersonName` (string): Name of delivery person
- `deliveryPersonLocation` (object): Current GPS location
- `distance` (number): Distance to customer in km
- `eta` (number): Estimated time to arrival in minutes

---

### 8. LOCATION_UPDATE (Server → Client - Broadcast)

**Purpose**: Broadcast delivery person's location to order subscribers

**Sent by**: Backend when receiving LOCATION_UPDATE from delivery person

**Payload**:
```json
{
  "type": "LOCATION_UPDATE",
  "payload": {
    "userId": "delivery123",
    "deliveryPersonId": "delivery123",
    "latitude": 36.7538,
    "longitude": 3.0588,
    "accuracy": 10,
    "timestamp": "2024-01-20T10:30:00.000Z",
    "orderId": "507f1f77bcf86cd799439011"
  }
}
```

---

### 9. STATUS_CHANGE (Server → Client - Broadcast)

**Purpose**: Notify about order status changes

**Sent by**: Backend to order subscribers

**Payload**:
```json
{
  "type": "STATUS_CHANGE",
  "payload": {
    "orderId": "507f1f77bcf86cd799439011",
    "status": "on-the-way",
    "message": "Delivery person is on the way"
  }
}
```

---

### 10. PING/PONG (Keep-Alive)

**Purpose**: Keep connection alive and detect disconnections

**Sent**: Client sends every 30 seconds, backend responds with PONG

**Payload**:
```json
{
  "type": "PING",
  "payload": {}
}
```

**Backend Response**:
```json
{
  "type": "PONG",
  "payload": {}
}
```

---

## HTTP Fallback Endpoints

When WebSocket is unavailable, these HTTP endpoints are used:

### 1. POST /api/location/update
Update user location via HTTP

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "latitude": 36.7538,
  "longitude": 3.0588,
  "accuracy": 10
}
```

**Response**:
```json
{
  "success": true,
  "message": "Location updated"
}
```

---

### 2. GET /api/order/nearest
Get nearest orders for delivery person

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `latitude` (number): User's latitude
- `longitude` (number): User's longitude

**Response**:
```json
{
  "success": true,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "customerName": "Ahmed Taha",
      "amount": 2500,
      "items": 5,
      "status": "pending",
      "deliveryLocation": {
        "latitude": 36.7538,
        "longitude": 3.0588
      },
      "distance": 0.24,
      "address": "123 Main Street, Algiers"
    }
  ]
}
```

---

### 3. GET /api/order/available
Get all available orders (fallback if nearest not implemented)

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "orders": [...]
}
```

---

### 4. POST /api/order/accept
Accept an order

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order accepted"
}
```

---

### 5. GET /api/order/{orderId}
Get order details

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "customerName": "Ahmed Taha",
    "amount": 2500,
    "items": [
      {
        "_id": "item1",
        "name": "Biryani",
        "quantity": 2,
        "price": 1000,
        "notes": "Extra spicy"
      }
    ],
    "status": "pending",
    "deliveryLocation": {
      "latitude": 36.7538,
      "longitude": 3.0588
    },
    "address": "123 Main Street, Algiers",
    "phone": "+213 5xx xxx xxx"
  }
}
```

---

### 6. GET /api/location/order/{orderId}
Get delivery person's current location for an order

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "location": {
    "latitude": 36.7538,
    "longitude": 3.0588,
    "accuracy": 10,
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 7. POST /api/order/delivered
Mark order as delivered

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order marked as delivered"
}
```

---

## Order Status Flow

```
pending → confirmed → on-the-way → delivered
```

**Status Definitions**:
- `pending`: Order placed, waiting for delivery person to accept
- `confirmed`: Delivery person accepted the order
- `on-the-way`: Delivery person is heading to customer
- `delivered`: Order delivered to customer

---

## Database Schema Requirements

### Orders Collection
```javascript
{
  _id: ObjectId,
  customerId: ObjectId,
  customerName: String,
  status: String, // pending, confirmed, on-the-way, delivered
  amount: Number,
  items: [
    {
      _id: ObjectId,
      name: String,
      quantity: Number,
      price: Number,
      notes: String // Special instructions
    }
  ],
  deliveryLocation: {
    latitude: Number,
    longitude: Number
  },
  address: String,
  phone: String,
  deliveryPersonId: ObjectId, // null until accepted
  deliveryPersonName: String, // null until accepted
  createdAt: Date,
  acceptedAt: Date, // null until accepted
  startedAt: Date, // null until delivery starts
  deliveredAt: Date, // null until delivered
  notes: String // Delivery notes
}
```

### Users Collection (Additional Fields)
```javascript
{
  // ... existing fields
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  role: String, // user, Livreur, admin
  currentOrder: ObjectId // null if not on delivery
}
```

---

## Security Considerations

1. **Authentication**: All WebSocket and HTTP connections require valid JWT token
2. **Authorization**: 
   - Users can only track their own orders
   - Delivery personnel can only see orders assigned to them
   - Only delivery personnel can update locations while delivering
3. **Rate Limiting**: Implement rate limiting on location updates (max 1 per second)
4. **Validation**: Validate GPS coordinates are within reasonable bounds
5. **Encryption**: Use WSS (WebSocket Secure) in production, HTTPS for HTTP

---

## Implementation Checklist

### WebSocket Server Setup
- [ ] Implement WebSocket server (Socket.io, ws library, etc.)
- [ ] Handle connection with JWT authentication
- [ ] Parse userId and role from query parameters
- [ ] Implement message routing and broadcasting
- [ ] Handle disconnect and cleanup

### Message Handlers
- [ ] LOCATION_UPDATE: Store and broadcast
- [ ] SUBSCRIBE_ORDER: Add to subscribers
- [ ] UNSUBSCRIBE_ORDER: Remove from subscribers
- [ ] ACCEPT_ORDER: Update order, notify customer
- [ ] START_DELIVERY: Update status, start tracking
- [ ] COMPLETE_DELIVERY: Mark delivered, cleanup
- [ ] PING/PONG: Keep-alive mechanism

### Broadcasting Logic
- [ ] When delivery person sends location, broadcast to all order subscribers
- [ ] When status changes, notify all stakeholders
- [ ] Calculate distance and ETA on backend

### HTTP Fallback Endpoints
- [ ] /api/location/update
- [ ] /api/order/nearest
- [ ] /api/order/available
- [ ] /api/order/accept
- [ ] /api/order/{orderId}
- [ ] /api/location/order/{orderId}
- [ ] /api/order/delivered

### Database
- [ ] Add lastKnownLocation to users
- [ ] Add tracking fields to orders (acceptedAt, startedAt, deliveredAt, deliveryPersonId)
- [ ] Create indexes for location queries
- [ ] Add notes field to order items

### Testing
- [ ] Test WebSocket connection and disconnection
- [ ] Test location updates broadcast
- [ ] Test fallback to HTTP
- [ ] Test order acceptance flow
- [ ] Test delivery completion
- [ ] Load test with multiple concurrent users

---

## Notes

- Keep-alive mechanism is important for production stability
- Implement exponential backoff for reconnection attempts
- Consider caching nearby orders to reduce database queries
- Implement proper cleanup when users disconnect
- Log all location updates for debugging and analytics

---

## Questions or Issues?

Contact the frontend team if clarification is needed on any endpoint or message format.
