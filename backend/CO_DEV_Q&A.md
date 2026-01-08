# Co-Dev Questions & Answers
## API Endpoints & Workflow Documentation

**Date:** January 2024  
**Backend Status:** Complete API Analysis

---

## 📋 Table of Contents

1. [Hero Section Search](#hero-section-search)
2. [Best Choices / Offers / Free Delivery](#best-choices--offers--free-delivery)
3. [Offers & Coupons Endpoint](#offers--coupons-endpoint)
4. [Order Cancellation](#order-cancellation)
5. [Location Tracking Workflow](#location-tracking-workflow)

---

## 1. Hero Section Search

### Question
> Concernant la Hero Section: Est-ce qu'il existe un endpoint dédié pour la recherche avec filtres, spécifiquement utilisé au niveau de la Hero Section ?

### Answer ✅

**There is NO dedicated endpoint for the Hero Section.** Use the existing endpoint:

```
GET /api/shop/list?type=restaurant&search=pizza
```

### Endpoint Details

**Base URL:** `https://backend.rani-jay.com/api/shop/list`

**Method:** `GET`

**Query Parameters:**
- `type` (optional): "restaurant" or "butchers"
- `search` (optional): Text search - filters by name, description, or address (case-insensitive)

### Example Requests

```bash
# Get all shops
GET /api/shop/list

# Get only restaurants
GET /api/shop/list?type=restaurant

# Get only butchers shops
GET /api/shop/list?type=butchers

# Search for "pizza" in all shops
GET /api/shop/list?search=pizza

# Search for "pizza" restaurants only
GET /api/shop/list?type=restaurant&search=pizza
```

### Response Example

```json
{
  "success": true,
  "totalShops": 2,
  "shops": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John's Restaurant",
      "type": "restaurant",
      "description": "Delicious Italian food",
      "address": "123 Main St, City",
      "phone": "+1-555-123-4567",
      "image": "1234567890filename.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Implementation Code

**File:** `backend/controllers/shopController.js`  
**Function:** `listShops`

```javascript
const listShops = async (req, res) => {
  try {
    const { type, search } = req.query;
    let filter = { isActive: true };

    if (type) {
      if (!["restaurant", "butchers"].includes(type)) {
        return res.json({ success: false, message: "Invalid shop type" });
      }
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const shops = await shopModel.find(filter);
    res.json({ success: true, totalShops: shops.length, shops });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};
```

---

## 2. Best Choices / Offers / Free Delivery

### Question
> À propos des endpoints "meilleurs choix / offres / livraison gratuite": Actuellement, nous utilisons l'endpoint /shop/list. Si des endpoints spécifiques sont en cours d'implémentation pour ces sections, pourrais-tu nous faire un point d'avancement ou nous donner une mise à jour à ce sujet ?

### Answer ⚠️

**Status:** NO SPECIFIC ENDPOINTS IMPLEMENTED

Currently, you must continue using `/api/shop/list` for all three sections:
- Best Choices
- Special Offers
- Free Delivery

### Current Limitations

**Shop Model does NOT have:**
- `isFeatured` or `isBestChoice` field
- `discount` or `offerPercentage` field
- `hasFreeDelivery` field
- Any offer/promotion logic

### Recommended Implementation

To support these sections, you need to:

#### 1. Extend Shop Model

**File:** `backend/models/shopModel.js`

Add these fields:

```javascript
shopSchema.add({
  isFeatured: { type: Boolean, default: false },        // Best Choices
  isBestChoice: { type: Boolean, default: false },      // Best Choices
  discountPercentage: { type: Number, default: 0 },     // Offers
  hasFreeDelivery: { type: Boolean, default: false },   // Free Delivery
  offerDescription: { type: String, default: "" },      // Offer details
  offerValidUntil: { type: Date, default: null },       // Offer expiry
});
```

#### 2. Extend List Endpoint

**File:** `backend/controllers/shopController.js`

Add support for filter query params:

```javascript
const listShops = async (req, res) => {
  try {
    const { type, search, featured, bestChoice, freeDelivery } = req.query;
    let filter = { isActive: true };

    if (type) {
      if (!["restaurant", "butchers"].includes(type)) {
        return res.json({ success: false, message: "Invalid shop type" });
      }
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    // New filters
    if (featured === "true") filter.isFeatured = true;
    if (bestChoice === "true") filter.isBestChoice = true;
    if (freeDelivery === "true") filter.hasFreeDelivery = true;

    const shops = await shopModel.find(filter);
    res.json({ success: true, totalShops: shops.length, shops });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};
```

#### 3. New API Endpoints

```bash
# Get Best Choices
GET /api/shop/list?bestChoice=true

# Get Offers (with discount)
GET /api/shop/list?featured=true

# Get Free Delivery
GET /api/shop/list?freeDelivery=true

# Combine filters
GET /api/shop/list?type=restaurant&bestChoice=true&freeDelivery=true
```

---

## 3. Offers & Coupons Endpoint

### Question
> Endpoint des offres: De notre côté, nous supposons qu'il s'agit du même endpoint utilisé pour récupérer les coupons affichés sur cet écran (non documenté dans l'API). Peux-tu nous confirmer cela ou nous indiquer l'endpoint exact à utiliser ?

### Answer ❌

**Status:** NO ENDPOINT IMPLEMENTED FOR COUPONS/OFFERS

### Current State

**There is NO:**
- Coupon model in database
- Offer/Discount model in database
- Coupon routes/endpoints
- Coupon controller logic
- Integration with orders

### To Be Implemented

You need to create the following:

#### 1. Coupon Model

**File:** `backend/models/couponModel.js`

```javascript
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "percentage",
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  maxUsageCount: {
    type: Number,
    default: null, // null = unlimited
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  applicableShops: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [], // empty = all shops
  },
  applicableCategories: {
    type: [String],
    default: [], // empty = all categories
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const couponModel =
  mongoose.models.coupon || mongoose.model("coupon", couponSchema);

export default couponModel;
```

#### 2. Coupon Routes

**File:** `backend/routes/couponRoute.js`

```javascript
import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createCoupon,
  listCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
} from "../controllers/couponController.js";

const couponRouter = express.Router();

// Admin only routes
couponRouter.post("/create", authMiddleware, createCoupon);
couponRouter.put("/:id", authMiddleware, updateCoupon);
couponRouter.delete("/:id", authMiddleware, deleteCoupon);

// Public routes
couponRouter.get("/list", listCoupons);
couponRouter.get("/:id", getCoupon);
couponRouter.post("/validate/:code", validateCoupon);
couponRouter.post("/apply", authMiddleware, applyCoupon);

export default couponRouter;
```

#### 3. API Endpoints

```bash
# List all active coupons (Public)
GET /api/coupon/list

# Get coupon details
GET /api/coupon/:id

# Validate coupon code (Public)
POST /api/coupon/validate/:code
{
  "orderAmount": 100
}

# Apply coupon to order (Protected)
POST /api/coupon/apply
{
  "code": "SUMMER50",
  "orderId": "507f1f77bcf86cd799439050"
}

# Create coupon (Admin)
POST /api/coupon/create
{
  "code": "SUMMER50",
  "discountType": "percentage",
  "discountValue": 50,
  "minOrderAmount": 50,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}

# Update coupon (Admin)
PUT /api/coupon/507f1f77bcf86cd799439060

# Delete coupon (Admin)
DELETE /api/coupon/507f1f77bcf86cd799439060
```

#### 4. Integration in Server

**File:** `backend/server.js`

Add coupon router:

```javascript
import couponRouter from "./routes/couponRoute.js";

// ... other imports

app.use("/api/coupon", couponRouter);
```

---

## 4. Order Cancellation

### Question
> Annulation des commandes côté client: Existe-t-il un endpoint permettant aux clients d'annuler leurs commandes ? Si oui, pourrais-tu nous partager les détails (méthode, contraintes, statuts autorisés, etc.) ?

### Answer ❌

**Status:** NO ENDPOINT FOR ORDER CANCELLATION

### Current Limitations

**What exists:**
- Order status can be "Cancelled" (defined in code)
- No route to change it
- No business logic to handle cancellation

**What's missing:**
- `POST /api/order/:orderId/cancel` endpoint
- Validation logic
- Notification system for delivery persons

### To Be Implemented

#### 1. Add Cancel Logic to Order Controller

**File:** `backend/controllers/orderController.js`

```javascript
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;

    // Validate order exists
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify user is order owner
    if (order.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized: Not order owner" });
    }

    // Check if order can be cancelled
    // ✅ Cancellable: Pending, Accepted
    // ❌ NOT cancellable: Out for Delivery, Delivered, Already Cancelled
    const cancellableStatuses = ["Pending", "Accepted"];

    if (!cancellableStatuses.includes(order.status)) {
      return res.json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`,
        currentStatus: order.status,
        cancellableStatuses,
      });
    }

    // Update order status
    const previousStatus = order.status;
    order.status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || "Cancelled by customer";
    await order.save();

    // Notify delivery person if assigned
    if (order.assignedDeliveryPerson) {
      console.log(`[Order Cancelled] Delivery person ${order.assignedDeliveryPerson} notified`);
      // TODO: Send WebSocket notification to delivery person
      // TODO: Send email/SMS notification
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        status: order.status,
        previousStatus,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.json({ success: false, message: "Error cancelling order" });
  }
};
```

#### 2. Update Order Model

**File:** `backend/models/orderModel.js`

Add cancellation fields:

```javascript
const orderSchema = new mongoose.Schema({
  // ... existing fields
  cancelledAt: { type: Date, default: null },
  cancelReason: { type: String, default: "" },
});
```

#### 3. Add Route

**File:** `backend/routes/orderRoute.js`

Add cancellation route:

```javascript
import { cancelOrder } from "../controllers/orderController.js";

// Add to orderRouter:
orderRouter.post("/:orderId/cancel", authMiddleware, cancelOrder);
```

#### 4. API Endpoint

```bash
# Cancel an order (Protected)
POST /api/order/:orderId/cancel
{
  "reason": "Changed my mind"  // optional
}
```

### Response Examples

**Success (Pending):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "status": "Cancelled",
    "previousStatus": "Pending",
    "cancelledAt": "2024-01-15T14:30:00Z",
    "cancelReason": "Changed my mind"
  }
}
```

**Error (Already delivered):**
```json
{
  "success": false,
  "message": "Cannot cancel order with status: Delivered",
  "currentStatus": "Delivered",
  "cancellableStatuses": ["Pending", "Accepted"]
}
```

### Cancellation Rules

| Status | Can Cancel? | Reason |
|--------|------------|--------|
| Pending | ✅ Yes | Order not yet assigned |
| Accepted | ✅ Yes | Delivery person can be notified |
| Out for Delivery | ❌ No | Too late, already on the way |
| Delivered | ❌ No | Order completed |
| Cancelled | ❌ No | Already cancelled |

---

## 5. Location Tracking Workflow

### Question
> Workflow de la localisation: Si possible, pourrais-tu nous expliquer le workflow global des endpoints liés à la localisation ? Notamment: Est-ce qu'il y a l'utilisation de WebSockets ? Quel est l'ordre des appels API dans le cycle de commande (order flow) ?

### Answer ✅

**Status:** FULLY IMPLEMENTED

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│     Client (Delivery Person)                         │
│  - Sends GPS location every 3 seconds               │
│  - WebSocket connection                             │
└──────────────┬──────────────────────────────────────┘
               │ WebSocket (Real-time)
               ├─ LOCATION_UPDATE (every 3s)
               ├─ ACCEPT_ORDER
               ├─ START_DELIVERY
               └─ COMPLETE_DELIVERY
               │
               ▼
┌─────────────────────────────────────────────────────┐
│     Server WebSocket (config/websocket.js)          │
│  - Receives location updates                        │
│  - Stores in memory + database                      │
│  - Broadcasts to subscribers                        │
└──────────────┬──────────────────────────────────────┘
               │ HTTP Fallback
               ├─ GET /api/location/order/:orderId
               ├─ POST /api/location/update
               └─ GET /api/location/history/:userId
               │
               ▼
┌─────────────────────────────────────────────────────┐
│     Client (Customer)                                │
│  - Receives location in real-time                   │
│  - Shows delivery person on map                     │
└─────────────────────────────────────────────────────┘
```

### WebSocket Events

#### Client → Server

```javascript
// 1. LOCATION_UPDATE (sent every 3 seconds)
socket.emit("LOCATION_UPDATE", {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10  // GPS accuracy in meters
});

// 2. SUBSCRIBE_ORDER (customer subscribes to order)
socket.emit("SUBSCRIBE_ORDER", {
  orderId: "507f1f77bcf86cd799439050"
});

// 3. UNSUBSCRIBE_ORDER
socket.emit("UNSUBSCRIBE_ORDER", {
  orderId: "507f1f77bcf86cd799439050"
});

// 4. ACCEPT_ORDER (delivery person accepts)
socket.emit("ACCEPT_ORDER", {
  orderId: "507f1f77bcf86cd799439050"
});

// 5. START_DELIVERY (starts traveling)
socket.emit("START_DELIVERY", {
  orderId: "507f1f77bcf86cd799439050"
});

// 6. COMPLETE_DELIVERY (delivered)
socket.emit("COMPLETE_DELIVERY", {
  orderId: "507f1f77bcf86cd799439050",
  notes: "Left at door"  // optional
});

// 7. PING (keep-alive)
socket.emit("PING");
```

#### Server → Client

```javascript
// Delivery person location updates
socket.on("LOCATION_UPDATE", (data) => {
  console.log(data);
  // {
  //   userId: "507f1f77bcf86cd799439020",
  //   latitude: 40.7128,
  //   longitude: -74.0060,
  //   accuracy: 10,
  //   timestamp: "2024-01-15T10:30:00Z"
  // }
});

// Order status updates
socket.on("ORDER_UPDATE", (data) => {
  console.log(data);
  // {
  //   orderId: "507f1f77bcf86cd799439050",
  //   status: "Out for Delivery",
  //   deliveryPersonId: "507f1f77bcf86cd799439020",
  //   deliveryPersonLocation: { latitude, longitude, accuracy },
  //   timestamp: "2024-01-15T10:30:00Z"
  // }
});

// Server ping response
socket.on("PONG", (data) => {
  console.log("Server alive at:", data.timestamp);
});

// Errors
socket.on("error", (error) => {
  console.error("Socket error:", error.message);
});
```

### Complete Order Delivery Flow

#### Step 1️⃣: Customer Places Order

```bash
POST /api/order/place
{
  "userId": "507f1f77bcf86cd799439011",
  "items": [...],
  "amount": 100,
  "address": "123 Main St",
  "deliveryLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "507f1f77bcf86cd799439050",
  "message": "Order placed successfully"
}
```

**Order Status:** `Pending`

---

#### Step 2️⃣: Payment Verification

```bash
POST /api/order/verify
{
  "orderId": "507f1f77bcf86cd799439050",
  "success": "true"
}
```

**Order Status:** `Pending` (payment confirmed)

---

#### Step 3️⃣: Admin Assigns Delivery Person

**Option A: Manual Assignment (via WebSocket or future API)**

**Option B: Auto-matching (by distance)**

```bash
POST /api/location/match/507f1f77bcf86cd799439050
```

**Server Logic:**
- Finds all active delivery people
- Gets their current locations
- Calculates distance to delivery location (Haversine formula)
- Assigns closest delivery person
- Sets `order.assignedDeliveryPerson`
- Sets `order.assignedAt` timestamp

**Response:**
```json
{
  "success": true,
  "message": "Order assigned to closest delivery person",
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "assignedDeliveryPerson": "507f1f77bcf86cd799439020",
    "assignedAt": "2024-01-15T10:20:00Z"
  },
  "distance": "2.45 km"
}
```

**Order Status:** `Pending` (now assigned)

---

#### Step 4️⃣: Delivery Person Connects (WebSocket)

Delivery person app connects to WebSocket:

```javascript
const socket = io("wss://backend.rani-jay.com", {
  auth: {
    token: "JWT_TOKEN",
    userId: "507f1f77bcf86cd799439020",
    role: "delivery"
  }
});

socket.on("connect", () => {
  console.log("Connected to tracking server");
});
```

**Server Validation:**
- Verifies JWT token
- Validates user is delivery person (role === "delivery")
- Stores connection in memory

---

#### Step 5️⃣: Delivery Person Accepts Order

```javascript
socket.emit("ACCEPT_ORDER", {
  orderId: "507f1f77bcf86cd799439050"
});
```

**Server Actions:**
- Verifies order is assigned to this delivery person
- Sets `order.acceptedAt` = now
- Updates `order.status` = "Accepted"
- Broadcasts to order subscribers:

```javascript
io.to(`order-507f1f77bcf86cd799439050`).emit("ORDER_UPDATE", {
  orderId: "507f1f77bcf86cd799439050",
  status: "Accepted",
  deliveryPersonId: "507f1f77bcf86cd799439020",
  acceptedAt: "2024-01-15T10:25:00Z"
});
```

**Order Status:** `Accepted`

---

#### Step 6️⃣: Delivery Person Starts Delivery

```javascript
socket.emit("START_DELIVERY", {
  orderId: "507f1f77bcf86cd799439050"
});
```

**Server Actions:**
- Sets `order.startedAt` = now
- Updates `order.status` = "Out for Delivery"
- Adds to `activeDeliveries` Map

**Order Status:** `Out for Delivery`

---

#### Step 7️⃣: Delivery Person Sends Location (Every 3 Seconds)

```javascript
// Delivery person client sends location continuously
socket.emit("LOCATION_UPDATE", {
  latitude: 40.7145,
  longitude: -74.0062,
  accuracy: 8
});
```

**Server Actions:**
1. Updates in `locationModel`:
   ```javascript
   {
     userId: "507f1f77bcf86cd799439020",
     latitude: 40.7145,
     longitude: -74.0062,
     accuracy: 8,
     lastUpdated: "2024-01-15T10:30:00Z"
   }
   ```

2. Saves to `locationHistoryModel`:
   ```javascript
   {
     userId: "507f1f77bcf86cd799439020",
     orderId: "507f1f77bcf86cd799439050",
     latitude: 40.7145,
     longitude: -74.0062,
     accuracy: 8,
     timestamp: "2024-01-15T10:30:00Z"
   }
   ```

3. Updates user's `lastKnownLocation`

4. Broadcasts to order subscribers:
   ```javascript
   io.to(`order-507f1f77bcf86cd799439050`).emit("LOCATION_UPDATE", {
     orderId: "507f1f77bcf86cd799439050",
     userId: "507f1f77bcf86cd799439020",
     deliveryPersonId: "507f1f77bcf86cd799439020",
     latitude: 40.7145,
     longitude: -74.0062,
     accuracy: 8,
     timestamp: "2024-01-15T10:30:00Z"
   });
   ```

---

#### Step 8️⃣: Customer Receives Location Updates (Real-time)

Customer subscribes to order:

```javascript
socket.emit("SUBSCRIBE_ORDER", {
  orderId: "507f1f77bcf86cd799439050"
});
```

Customer receives updates:

```javascript
socket.on("LOCATION_UPDATE", (location) => {
  // Update map with delivery person location
  map.updateDeliveryPersonMarker(location.latitude, location.longitude);
});

socket.on("ORDER_UPDATE", (order) => {
  // Update order status display
  document.getElementById("status").textContent = order.status;
});
```

---

#### Step 9️⃣: Delivery Person Completes Delivery

```javascript
socket.emit("COMPLETE_DELIVERY", {
  orderId: "507f1f77bcf86cd799439050",
  notes: "Left at front door"
});
```

**Server Actions:**
- Sets `order.deliveredAt` = now
- Updates `order.status` = "Delivered"
- Removes from `activeDeliveries` Map
- Stops tracking this order

**Order Status:** `Delivered`

---

#### Step 🔟: Order Complete

Customer receives final notification:

```javascript
socket.on("ORDER_UPDATE", (order) => {
  console.log("Order delivered!");
  // Show delivery confirmation
  // Show delivery person details
  // Option to rate delivery
});
```

---

### HTTP Fallback Endpoints

If WebSocket fails, use these HTTP endpoints:

```bash
# Update location (fallback)
POST /api/location/update
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10
}

# Get delivery person location for order
GET /api/location/order/507f1f77bcf86cd799439050

# Get location history for order
GET /api/location/order-history/507f1f77bcf86cd799439050

# Get location history for user (Admin)
GET /api/location/history/507f1f77bcf86cd799439020?days=7

# Get all active delivery locations (Admin)
GET /api/location/delivery/active/list

# Get specific user location
GET /api/location/user/507f1f77bcf86cd799439020

# Toggle location sharing
PATCH /api/location/sharing/toggle
```

---

### Database Storage

**Current Locations:**
```javascript
// locationModel
{
  userId: "507f1f77bcf86cd799439020",
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  isActive: true,
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

**Location History:**
```javascript
// locationHistoryModel
{
  userId: "507f1f77bcf86cd799439020",
  orderId: "507f1f77bcf86cd799439050",
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  timestamp: "2024-01-15T10:30:00Z"
}
```

**Order Tracking Fields:**
```javascript
// orderModel
{
  assignedAt: "2024-01-15T10:20:00Z",
  acceptedAt: "2024-01-15T10:25:00Z",
  startedAt: "2024-01-15T10:28:00Z",
  deliveredAt: "2024-01-15T10:45:00Z",
  estimatedDeliveryTime: 20  // minutes
}
```

---

### Configuration

**WebSocket URL:**
```
wss://backend.rani-jay.com
```

**Authentication:**
```javascript
{
  auth: {
    token: "JWT_TOKEN",
    userId: "USER_ID",
    role: "delivery|user|admin"
  }
}
```

**CORS Origins:**
- https://rani-jay.com
- http://localhost:5173
- http://localhost:3000

---

### Summary Table

| Phase | Event | Status | Database Update |
|-------|-------|--------|-----------------|
| 1 | Order Placed | Pending | Order created |
| 2 | Payment Verified | Pending | payment = true |
| 3 | Assigned Delivery | Pending | assignedDeliveryPerson set |
| 4 | Driver Connected | Pending | - |
| 5 | Order Accepted | Accepted | acceptedAt timestamp |
| 6 | Delivery Started | Out for Delivery | startedAt timestamp |
| 7-8 | Location Updates | Out for Delivery | locationHistory saved |
| 9 | Delivery Complete | Delivered | deliveredAt timestamp |
| 10 | Order Finished | Delivered | Order complete |

---

## Summary of Implementation Status

| Feature | Status | Endpoint | Priority |
|---------|--------|----------|----------|
| Hero Section Search | ✅ Complete | `GET /api/shop/list?search=...` | N/A |
| Best Choices Section | ❌ To Implement | Extend /api/shop/list | High |
| Offers Section | ❌ To Implement | New coupon endpoints | High |
| Coupons/Promo | ❌ To Implement | New coupon endpoints | High |
| Order Cancellation | ❌ To Implement | `POST /api/order/:orderId/cancel` | High |
| Location Tracking | ✅ Complete | WebSocket + HTTP | N/A |
| Real-time Updates | ✅ Complete | WebSocket events | N/A |
| Auto-matching Driver | ✅ Complete | `POST /api/location/match/:orderId` | N/A |

---

**Last Updated:** January 2026
**Reviewed By:** Backend Team
