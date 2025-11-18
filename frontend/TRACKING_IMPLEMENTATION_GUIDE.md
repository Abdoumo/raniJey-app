# Real-Time Tracking Implementation Guide

## What's Been Implemented

### Frontend Infrastructure

#### 1. **WebSocket Tracking Service** (`src/services/trackingService.js`)
- Singleton service for WebSocket connection management
- Automatic reconnection with exponential backoff
- Event-based message handling
- Support for multiple listeners per event type
- Fallback mechanisms for connection failures

**Key Methods**:
```javascript
trackingService.connect(baseUrl, token, userId, userRole)
trackingService.sendLocation(latitude, longitude, accuracy)
trackingService.subscribeToOrder(orderId)
trackingService.acceptOrder(orderId)
trackingService.startDelivery(orderId)
trackingService.completeDelivery(orderId, notes)
trackingService.on(event, callback)
trackingService.off(event, callback)
```

#### 2. **React Tracking Hook** (`src/hooks/useTracking.js`)
- Easy-to-use React integration for WebSocket tracking
- Auto-connects on mount, disconnects on unmount
- Returns connection status, errors, and helper functions
- Manages listeners lifecycle

**Usage**:
```javascript
const {
  isConnected,
  error,
  orderUpdates,
  locationUpdates,
  sendLocation,
  subscribeToOrder,
  acceptOrder,
  startDelivery,
  completeDelivery
} = useTracking(url, token, userId, userRole);
```

#### 3. **Updated Components**

**NearestOrders.jsx** (`src/pages/NearestOrders/NearestOrders.jsx`):
- Integrated `useTracking` hook
- Uses WebSocket for location updates (with HTTP fallback)
- Subscribes to orders when accepted
- Improved error handling

**TrackOrder.jsx** (`src/pages/TrackOrder/TrackOrder.jsx`):
- Uses `useTracking` for real-time delivery tracking
- Subscribes to order on mount
- Updates map in real-time with delivery person location
- Falls back to HTTP polling if WebSocket unavailable
- Calculates distance and ETA dynamically

---

## How to Use the Tracking System

### For Customers (Tracking Their Order)

```javascript
import { useTracking } from '../../hooks/useTracking';

function TrackMyOrder({ orderId }) {
  const { url, token, userRole } = useContext(StoreContext);
  const userId = localStorage.getItem('userId');
  
  const { isConnected, locationUpdates, subscribeToOrder } = useTracking(
    url, 
    token, 
    userId, 
    userRole
  );

  useEffect(() => {
    if (isConnected) {
      subscribeToOrder(orderId); // Subscribe to real-time updates
    }
  }, [isConnected, orderId]);

  useEffect(() => {
    if (locationUpdates[orderId]) {
      // Update UI with new delivery person location
      const deliveryLocation = locationUpdates[orderId];
      console.log('Delivery person location:', deliveryLocation);
    }
  }, [locationUpdates, orderId]);

  return (
    <div>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Distance: {distance} km</p>
      <p>ETA: {eta} mins</p>
    </div>
  );
}
```

### For Delivery Personnel (Accepting & Delivering)

```javascript
import { useTracking } from '../../hooks/useTracking';

function DeliveryDashboard() {
  const { url, token, userRole } = useContext(StoreContext);
  const userId = localStorage.getItem('userId');
  
  const { 
    isConnected, 
    sendLocation, 
    acceptOrder,
    startDelivery,
    completeDelivery 
  } = useTracking(url, token, userId, userRole);

  // Send location every 3 seconds
  useEffect(() => {
    if (!isConnected) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        sendLocation(latitude, longitude, accuracy);
      },
      null,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isConnected, sendLocation]);

  const handleAcceptOrder = async (orderId) => {
    if (acceptOrder(orderId)) {
      toast.success('Order accepted!');
    }
  };

  const handleStartDelivery = async (orderId) => {
    if (startDelivery(orderId)) {
      toast.success('Started delivery!');
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    if (completeDelivery(orderId, 'Left at gate')) {
      toast.success('Order delivered!');
    }
  };

  return (
    <div>
      <p>Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      {/* Order cards with action buttons */}
    </div>
  );
}
```

---

## Testing the Implementation

### 1. **Test WebSocket Connection**
```javascript
// In browser console
localStorage.setItem('userId', 'test-user-123');

// Navigate to /nearest-orders
// Open DevTools → Network → WS filter
// You should see WebSocket connection attempt
```

### 2. **Test Location Updates**
```javascript
// Simulate location update via WebSocket
trackingService.sendLocation(36.7538, 3.0588, 10);
// Should see message in WebSocket connection
```

### 3. **Test Fallback to HTTP**
```javascript
// Disable WebSocket in Network conditions
// Location updates should continue via HTTP /api/location/update
```

### 4. **Test Real-time Broadcasting**
- Open two browser windows: one as customer, one as delivery person
- Delivery person accepts order
- Customer should see delivery person's location in real-time
- Customer should see ETA updating as distance changes

---

## Backend Requirements

The backend team needs to implement:

1. **WebSocket Server**
   - Listen on `/ws` endpoint with query params: token, userId, role
   - Handle all message types from API_DOCUMENTATION.md
   - Broadcast location updates to order subscribers

2. **HTTP Endpoints**
   - All fallback endpoints listed in API_DOCUMENTATION.md
   - Proper authentication and authorization checks

3. **Database Updates**
   - Add `lastKnownLocation` to users
   - Add tracking fields to orders
   - Create proper indexes for location queries

See **API_DOCUMENTATION.md** for complete backend requirements.

---

## Event Flow Examples

### Order Acceptance Flow
```
User (Customer)                    Delivery Person
    |                                  |
    |                                  | GET /api/order/nearest
    |                                  | (Sees available orders)
    |                                  |
    |                                  | WebSocket: ACCEPT_ORDER
    |<------ ORDER_UPDATE broadcast ---|
    | (Order status: confirmed)
    |
    | WebSocket: SUBSCRIBE_ORDER
    |------- SUBSCRIBE_ORDER ---------->
```

### Delivery Tracking Flow
```
Backend                   Delivery Person              Customer
   |                            |                         |
   |<--- LOCATION_UPDATE -------|                         |
   | (Every 3 seconds)          |                         |
   |                            |                         |
   |--- LOCATION_UPDATE update --------> (Real-time location)
   |
   | Distance: 0.5 km, ETA: 5 mins
```

---

## Environment Variables

The following are already configured:
- `url`: Backend URL (from StoreContext) - auto-converts to WebSocket
- `token`: JWT token (from localStorage or context)
- `userId`: User identifier (from localStorage)
- `userRole`: User role (from StoreContext)

---

## Troubleshooting

### WebSocket Connection Fails
1. Check if backend WebSocket server is running
2. Check token validity
3. Check CORS/WebSocket security settings
4. Browser console should show connection error

### Location Updates Not Appearing
1. Check if user has granted geolocation permission
2. Check if `sendLocation()` is being called
3. Check browser DevTools Network → WS for messages
4. If WebSocket fails, check if HTTP endpoint is working

### Map Not Showing Delivery Person
1. Check if location updates contain valid lat/lng
2. Check if Leaflet markers are being created
3. Check if `updateDeliveryMarker()` is being called
4. Check browser console for errors

---

## Best Practices

1. **Always unsubscribe from orders** when user navigates away
2. **Handle connection errors gracefully** - show user-friendly messages
3. **Validate location data** - check for null/undefined lat/lng
4. **Rate limit location sends** - don't send more than 1 per second
5. **Clear intervals** - always cleanup watchPosition and polling intervals
6. **Test with both roles** - customer and delivery person flows
7. **Monitor WebSocket reconnections** - check browser console

---

## What's Next

The frontend is ready to work with the backend. The backend team should:

1. Implement WebSocket server based on API_DOCUMENTATION.md
2. Implement all HTTP fallback endpoints
3. Set up real-time location broadcasting
4. Test with frontend using the provided testing guidelines

Once backend is ready, both flows (customer tracking + delivery person tracking) will work seamlessly!
