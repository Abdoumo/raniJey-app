# Real-Time Tracking Implementation Guide

## Overview
This guide documents the backend implementation for real-time delivery tracking using WebSocket (Socket.io) and HTTP endpoints.

## Architecture

### Components
1. **WebSocket Server** - Real-time location and order tracking (`config/websocket.js`)
2. **Location Controller** - HTTP endpoints for location management (`controllers/locationController.js`)
3. **Order Model** - Enhanced with tracking fields (`models/orderModel.js`)
4. **User Model** - Enhanced with lastKnownLocation (`models/userModel.js`)
5. **Location Model** - Current location storage (`models/locationModel.js`)
6. **Location History Model** - Historical location data (`models/locationHistoryModel.js`)

## Database Schema Updates

### User Model Addition
```javascript
{
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date
  }
}
```

### Order Model Additions
```javascript
{
  acceptedAt: Date,
  startedAt: Date,
  deliveredAt: Date,
  estimatedDeliveryTime: Number // in minutes
}
```

## WebSocket Events

### Client → Server Events

#### 1. LOCATION_UPDATE
Sent every 3 seconds by delivery person with GPS coordinates

**Payload:**
```javascript
{
  userId: "507f1f77bcf86cd799439020",
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10  // GPS accuracy in meters
}
```

**Server Actions:**
- Updates location in database
- Saves to location history
- Updates user's lastKnownLocation
- Broadcasts to subscribers
- If delivery person has active order, broadcasts to order room

#### 2. SUBSCRIBE_ORDER
Customer or admin subscribes to real-time order delivery updates

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  userId: "507f1f77bcf86cd799439011"
}
```

**Server Validation:**
- Verify order exists
- Verify user is order customer or admin
- Send current order details back

#### 3. ACCEPT_ORDER
Delivery person accepts an assigned order

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  userId: "507f1f77bcf86cd799439020"
}
```

**Server Actions:**
- Verify order is assigned to this delivery person
- Update order.acceptedAt timestamp
- Broadcast 'order-accepted' to all order subscribers
- Order moves to "Accepted" status

#### 4. START_DELIVERY
Delivery person starts traveling to customer location

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  userId: "507f1f77bcf86cd799439020"
}
```

**Server Actions:**
- Verify order is assigned to this delivery person
- Update order.startedAt timestamp
- Update order.status to "Out for Delivery"
- Add to active deliveries tracking
- Broadcast 'delivery-started' to all order subscribers

#### 5. COMPLETE_DELIVERY
Delivery person completes delivery at customer location

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  userId: "507f1f77bcf86cd799439020"
}
```

**Server Actions:**
- Verify order is assigned to this delivery person
- Update order.deliveredAt timestamp
- Update order.status to "Delivered"
- Remove from active deliveries tracking
- Broadcast 'delivery-completed' to all order subscribers

### Server → Client Events

#### 1. current-location
Sent when user joins tracking, contains current location

**Payload:**
```javascript
{
  _id: "507f1f77bcf86cd799439041",
  userId: "507f1f77bcf86cd799439020",
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  isActive: true,
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

#### 2. location-updated
Sent to all tracking subscribers when location changes

**Payload:** Same as current-location

#### 3. delivery-location-updated
Sent to order room subscribers when delivery person location changes

**Payload:**
```javascript
{
  location: {...},
  orderId: "507f1f77bcf86cd799439050",
  deliveryPerson: "507f1f77bcf86cd799439020"
}
```

#### 4. order-details
Sent when customer subscribes to order

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  status: "Food Processing",
  assignedDeliveryPerson: "507f1f77bcf86cd799439020",
  estimatedDeliveryTime: 30
}
```

#### 5. order-accepted
Sent to all order subscribers when delivery person accepts

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  acceptedAt: "2024-01-15T10:35:00Z",
  deliveryPerson: "507f1f77bcf86cd799439020"
}
```

#### 6. delivery-started
Sent to all order subscribers when delivery starts

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  startedAt: "2024-01-15T10:40:00Z",
  deliveryPerson: "507f1f77bcf86cd799439020"
}
```

#### 7. delivery-completed
Sent to all order subscribers when delivery completes

**Payload:**
```javascript
{
  orderId: "507f1f77bcf86cd799439050",
  deliveredAt: "2024-01-15T10:50:00Z",
  deliveryPerson: "507f1f77bcf86cd799439020"
}
```

#### 8. error
Sent when an error occurs

**Payload:**
```javascript
{
  message: "Order not found"
}
```

## HTTP Endpoints

All HTTP endpoints are implemented and documented in API_DOCUMENTATION.md. Key endpoints:

### Location Management
- `POST /api/location/update` - Update user location (HTTP fallback)
- `GET /api/location/user/:targetUserId` - Get user location
- `GET /api/location/delivery/active/list` - Get all active delivery locations (Admin)
- `PATCH /api/location/sharing/toggle` - Toggle location sharing

### Order Matching
- `POST /api/location/match/:orderId` - Auto-match closest delivery person to order

### Order Tracking
- `GET /api/location/order/:orderId` - Get delivery person location for order
- `GET /api/location/order-history/:orderId` - Get location history for order

### History
- `GET /api/location/history/:targetUserId?days=30` - Get location history (Admin)

## Implementation Workflow

### Complete Delivery Flow

```
1. Customer Places Order
   POST /api/order/place
   ├─ Creates order with deliveryLocation
   ├─ Sets status: "Food Processing"
   └─ Clears user cartData

2. Admin Assigns Delivery Person
   POST /api/location/match/:orderId
   ├─ Finds closest active delivery person
   ├─ Updates order.assignedDeliveryPerson
   ├─ Sets order.assignedAt
   └─ Returns assigned delivery person

3. Delivery Person Connects (WebSocket)
   socket.io connection
   ├─ Connect to WebSocket server
   └─ Emit 'join-tracking' with userId

4. System Accepts Order (Optional)
   If auto-accept is enabled:
   └─ Emit 'ACCEPT_ORDER' event

5. Delivery Person Accepts Order
   Emit 'ACCEPT_ORDER' event
   ├─ Server sets order.acceptedAt
   ├─ Broadcasts 'order-accepted' to order room
   └─ Order status: "Accepted"

6. Delivery Person Starts Delivery
   Emit 'START_DELIVERY' event
   ├─ Server sets order.startedAt
   ├─ Updates order.status to "Out for Delivery"
   ├─ Broadcasts 'delivery-started' to order room
   └─ Starts sending location every 3 seconds

7. Delivery Person Sends Location (Every 3 seconds)
   Emit 'LOCATION_UPDATE' event
   ├─ Server updates location in database
   ├─ Broadcasts to order room
   ├─ Updates user.lastKnownLocation
   └─ Saves to location history

8. Customer Receives Location Updates (Real-time)
   Listen to 'delivery-location-updated' event
   ├─ Get updated GPS coordinates
   ├─ Update map display
   └─ Calculate ETA

9. Delivery Person Completes Delivery
   Emit 'COMPLETE_DELIVERY' event
   ├─ Server sets order.deliveredAt
   ├─ Updates order.status to "Delivered"
   ├─ Broadcasts 'delivery-completed' to order room
   └─ Removes from active deliveries

10. Order Complete
    Customer receives 'delivery-completed' event
    ├─ Show delivery confirmation
    ├─ Display delivery person info
    └─ Option to rate delivery
```

## Database Indexing

Ensure these indexes exist for performance:

```javascript
// locationModel
locationSchema.index({ userId: 1 });
locationSchema.index({ isActive: 1 });
locationSchema.index({ lastUpdated: -1 });

// locationHistoryModel (ensure index exists)
locationHistoryModel.index({ userId: 1 });
locationHistoryModel.index({ orderId: 1 });
locationHistoryModel.index({ timestamp: -1 });

// orderModel (ensure index exists)
orderModel.index({ status: 1 });
orderModel.index({ assignedDeliveryPerson: 1 });
```

## Fallback Strategy

If WebSocket connection fails or is unavailable, frontend will fall back to HTTP polling:

1. **Get Location (HTTP):** `GET /api/location/order/:orderId`
2. **Send Location (HTTP):** `POST /api/location/update`
3. **Polling Interval:** Every 5-10 seconds

The HTTP endpoints are fully functional and return the same data format as WebSocket events.

## Security Considerations

1. **Token Validation** - All endpoints require JWT token in header
2. **Role-based Access** - Admin-only endpoints verified server-side
3. **User Isolation** - Users can only access their own data
4. **Order Ownership** - Only order customer or admin can subscribe to tracking
5. **Delivery Assignment** - Only assigned delivery person can send location updates

## Performance Optimization

1. **In-Memory Caching** - Active locations stored in Map for fast access
2. **Database Indexing** - Proper indexes on frequently queried fields
3. **Location History Limits** - Query limited to last 1000 records
4. **Broadcast Rooms** - Only relevant users receive updates

## Monitoring & Debugging

### Check Active Connections
```javascript
io.engine.clientsCount  // Total connected clients
```

### View Active Locations (Memory)
```javascript
// Accessible in WebSocket handler
activeLocations.entries()
```

### View Active Deliveries
```javascript
// Accessible in WebSocket handler
activeDeliveries.entries()
```

### Database Checks
```javascript
// Check locations collection
db.locations.find({ isActive: true }).count()

// Check recent location history
db.locationhistories.find().sort({ timestamp: -1 }).limit(10)

// Check active orders
db.orders.find({ status: "Out for Delivery" })
```

## Frontend Integration Example

Frontend has already implemented:
- `src/services/trackingService.js` - Singleton WebSocket service
- `src/hooks/useTracking.js` - React hook for tracking
- Components using tracking: `NearestOrders`, `TrackOrder`

The backend implementation is now complete and matches the frontend expectations.

## Testing Checklist

- [ ] WebSocket connection establishes successfully
- [ ] LOCATION_UPDATE events are received and processed
- [ ] SUBSCRIBE_ORDER creates proper room subscriptions
- [ ] ACCEPT_ORDER updates order timestamp
- [ ] START_DELIVERY updates order status
- [ ] COMPLETE_DELIVERY finalizes delivery
- [ ] Customers receive location updates in real-time
- [ ] HTTP fallback endpoints work correctly
- [ ] Location history is properly saved
- [ ] Admin can view all delivery locations
- [ ] Auto-match finds closest delivery person
- [ ] Role-based access control works

## Contact & Support

For questions about the tracking implementation, refer to:
- API_DOCUMENTATION.md - Full API reference
- config/websocket.js - WebSocket implementation
- controllers/locationController.js - HTTP endpoint handlers
