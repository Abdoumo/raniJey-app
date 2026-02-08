# Co-Dev Questions & Answers
## API Endpoints & Workflow Documentation

**Date:** January 2026  
**Backend Status:** Complete API Analysis

---

## 📋 Table of Contents

1. [Hero Section Search](#hero-section-search)
2. [Best Choices / Offers / Free Delivery](#best-choices--offers--free-delivery)
3. [Offers & Coupons Endpoint](#offers--coupons-endpoint)
4. [Offers Carousel (Advertisements)](#offers-carousel-advertisements)
5. [Order Cancellation](#order-cancellation)
6. [Location Tracking Workflow](#location-tracking-workflow)

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

## 4. Offers Carousel (Advertisements)

### Question
> Offres publicitaires (Carousel): How to manage and display promotional offers in a carousel format on the frontend?

### Answer ✅

**Status:** FULLY IMPLEMENTED

### Overview

A complete advertising/offers system with:
- Backend CRUD management
- Image upload support
- Admin control (activate/deactivate offers)
- Public API for frontend carousel display
- Display order customization

### Backend API Endpoints

#### Admin Endpoints (Protected - Authentication Required)

##### 1. Create Offer
```bash
POST /api/offer/create
Content-Type: multipart/form-data
Authorization: token=JWT_TOKEN

Form Data:
- title: string (required) - e.g., "Summer Sale 50% OFF"
- description: string (required) - e.g., "All items on sale this summer"
- image: file (required) - image file (.jpg, .png, etc)
- displayOrder: number (optional) - Order in carousel (0 by default)
```

**Request Example:**
```bash
curl -X POST http://localhost:4000/api/offer/create \
  -H "token: YOUR_JWT_TOKEN" \
  -F "title=Summer Sale" \
  -F "description=50% off all items" \
  -F "image=@/path/to/image.jpg" \
  -F "displayOrder=1"
```

**Response Success:**
```json
{
  "success": true,
  "message": "Offer created successfully",
  "offer": {
    "_id": "507f1f77bcf86cd799439090",
    "title": "Summer Sale",
    "description": "50% off all items",
    "image": "1705316400000summer.jpg",
    "isActive": true,
    "displayOrder": 1,
    "createdAt": "2024-01-15T10:20:00Z",
    "updatedAt": "2024-01-15T10:20:00Z"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Unauthorized: Admin access required"
}
```

---

##### 2. List All Offers (Admin View)
```bash
GET /api/offer/list
Authorization: token=JWT_TOKEN
```

Includes both active and inactive offers.

**Response:**
```json
{
  "success": true,
  "totalOffers": 3,
  "offers": [
    {
      "_id": "507f1f77bcf86cd799439090",
      "title": "Summer Sale",
      "description": "50% off all items",
      "image": "1705316400000summer.jpg",
      "isActive": true,
      "displayOrder": 1,
      "createdAt": "2024-01-15T10:20:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439091",
      "title": "Free Delivery",
      "description": "Free delivery on orders above $50",
      "image": "1705316500000delivery.jpg",
      "isActive": false,
      "displayOrder": 2,
      "createdAt": "2024-01-15T10:25:00Z"
    }
  ]
}
```

---

##### 3. Update Offer
```bash
PUT /api/offer/:id
Content-Type: multipart/form-data
Authorization: token=JWT_TOKEN

Form Data (all optional):
- title: string
- description: string
- image: file
- displayOrder: number
```

**Request Example:**
```bash
curl -X PUT http://localhost:4000/api/offer/507f1f77bcf86cd799439090 \
  -H "token: YOUR_JWT_TOKEN" \
  -F "title=Updated Summer Sale" \
  -F "displayOrder=2"
```

**Response:**
```json
{
  "success": true,
  "message": "Offer updated successfully",
  "offer": {
    "_id": "507f1f77bcf86cd799439090",
    "title": "Updated Summer Sale",
    "description": "50% off all items",
    "image": "1705316400000summer.jpg",
    "isActive": true,
    "displayOrder": 2,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

##### 4. Toggle Offer Status (Activate/Deactivate)
```bash
PATCH /api/offer/toggle-status/:id
Authorization: token=JWT_TOKEN
```

Toggles `isActive` between true and false.

**Response:**
```json
{
  "success": true,
  "message": "Offer deactivated successfully",
  "offer": {
    "_id": "507f1f77bcf86cd799439090",
    "isActive": false,
    "title": "Summer Sale"
  }
}
```

---

##### 5. Delete Offer
```bash
DELETE /api/offer/:id
Authorization: token=JWT_TOKEN
```

Deletes the offer and its associated image file.

**Response:**
```json
{
  "success": true,
  "message": "Offer deleted successfully"
}
```

---

#### Public Endpoints (No Authentication)

##### 6. Get Active Offers (For Carousel)
```bash
GET /api/offer/active
```

Returns only active offers, sorted by displayOrder.

**Response:**
```json
{
  "success": true,
  "totalOffers": 2,
  "offers": [
    {
      "_id": "507f1f77bcf86cd799439090",
      "title": "Summer Sale",
      "description": "50% off all items",
      "image": "1705316400000summer.jpg",
      "isActive": true,
      "displayOrder": 1,
      "createdAt": "2024-01-15T10:20:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439091",
      "title": "Free Delivery",
      "description": "Free delivery on orders above $50",
      "image": "1705316500000delivery.jpg",
      "isActive": true,
      "displayOrder": 2,
      "createdAt": "2024-01-15T10:25:00Z"
    }
  ]
}
```

---

##### 7. Get Single Offer
```bash
GET /api/offer/:id
```

**Response:**
```json
{
  "success": true,
  "offer": {
    "_id": "507f1f77bcf86cd799439090",
    "title": "Summer Sale",
    "description": "50% off all items",
    "image": "1705316400000summer.jpg",
    "isActive": true,
    "displayOrder": 1
  }
}
```

---

### Image Access

Images uploaded via offer creation are accessible at:

```
http://localhost:4000/images/{filename}

Example:
http://localhost:4000/images/1705316400000summer.jpg
```

---

### Frontend Implementation

#### Display Offer Image

```jsx
const imageUrl = `${url}/images/${offer.image}`;
<img src={imageUrl} alt={offer.title} />
```

#### Fetch Active Offers

```jsx
const fetchActiveOffers = async () => {
  try {
    const response = await axios.get(url + "/api/offer/active");
    if (response.data.success) {
      setOffers(response.data.offers);
    }
  } catch (error) {
    console.error("Error fetching offers:", error);
  }
};
```

#### Display in Carousel (Swiper example)

```jsx
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

<Swiper
  modules={[Navigation, Pagination, Autoplay]}
  spaceBetween={10}
  slidesPerView={1}
  navigation
  pagination={{ clickable: true }}
  autoplay={{ delay: 5000 }}
  responsive={{
    768: { slidesPerView: 2 },
    1024: { slidesPerView: 3 }
  }}
>
  {offers.map((offer) => (
    <SwiperSlide key={offer._id}>
      <img src={`${url}/images/${offer.image}`} alt={offer.title} />
      <h3>{offer.title}</h3>
      <p>{offer.description}</p>
    </SwiperSlide>
  ))}
</Swiper>
```

---

### Data Model

**File:** `backend/models/offerModel.js`

```javascript
{
  title: String (required) - Offer title
  description: String (required) - Offer description
  image: String - Filename of uploaded image
  isActive: Boolean - Whether offer is displayed (default: true)
  displayOrder: Number - Order in carousel (sorted ascending)
  createdAt: Date - Creation timestamp
  updatedAt: Date - Last update timestamp
}
```

---

### Admin Page

The admin interface provides a form and list for managing offers:

**File:** `admin/src/pages/Offers/Offers.jsx`

Features:
- Form to create/edit offers
- Image upload with preview
- List view of all offers (active + inactive)
- Activate/deactivate toggle
- Edit and delete buttons
- Display order customization

---

### Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/offer/create` | POST | ✅ Admin | Create new offer |
| `/api/offer/list` | GET | ✅ Admin | List all offers |
| `/api/offer/:id` | PUT | ✅ Admin | Update offer |
| `/api/offer/toggle-status/:id` | PATCH | ✅ Admin | Activate/deactivate |
| `/api/offer/:id` | DELETE | ✅ Admin | Delete offer |
| `/api/offer/active` | GET | ❌ Public | Get active offers |
| `/api/offer/:id` | GET | ❌ Public | Get single offer |

---

## 5. Order Cancellation

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

## 6. Location Tracking Workflow

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

---

# NEW IMPLEMENTATION - Sections 2.1 to 3.5

---

## 2.1 Annulation de Commande (Order Cancellation)

### Endpoints

#### Cancel Order (Protected - User must be order owner)

```bash
POST /api/order/{orderId}/cancel
Authorization: token=JWT_TOKEN

Request Body:
{
  "reason": "Changed my mind"  // Required for users, optional for admin
}
```

**Response Success (Pending → Cancelled):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "status": "Cancelled",
    "previousStatus": "Pending",
    "cancelledAt": "2024-01-15T14:30:00Z",
    "cancelReason": "Changed my mind",
    "statusHistory": [
      {
        "status": "Pending",
        "timestamp": "2024-01-15T10:20:00Z",
        "updatedBy": null,
        "notes": null
      },
      {
        "status": "Cancelled",
        "timestamp": "2024-01-15T14:30:00Z",
        "updatedBy": "507f1f77bcf86cd799439011",
        "notes": "Cancelled - Reason: Changed my mind"
      }
    ]
  }
}
```

**Response Error (Too late to cancel):**
```json
{
  "success": false,
  "message": "Can only cancel orders that are pending or accepted. This order has already started delivery.",
  "currentStatus": "Out for Delivery"
}
```

### Business Rules

| Who | Can Cancel | Allowed Statuses | Reason Required |
|-----|-----------|------------------|-----------------|
| User/Customer | Yes | Pending, Accepted | Yes (mandatory) |
| Admin | Yes | Any status | No (optional) |
| Delivery Person | No | N/A | N/A |

### Statuses

- `Pending` - Order just placed, not yet assigned
- `Accepted` - Assigned to delivery person, not yet in transit
- `En route` / `Out for Delivery` - Delivery person picked up, on the way (❌ Cannot cancel)
- `Delivered` / `Livrée` - Already delivered (❌ Cannot cancel)
- `Cancelled` - Order cancelled

### Notifications Triggered

When an order is cancelled:
1. **Customer Notification** - "Your order has been cancelled"
2. **Delivery Person Notification** (if assigned) - "Order cancelled, find another one"

---

## 2.2 Offres Publicitaires (Advertising Carousel)

**(See Section 4 above for complete implementation)**

### Quick Reference

```bash
# Create Offer (Admin)
POST /api/offer/create
Content-Type: multipart/form-data
- title: string
- description: string
- image: file
- displayOrder: number (optional)

# List All Offers (Admin)
GET /api/offer/list

# Get Active Offers (Public - for Carousel)
GET /api/offer/active

# Update Offer (Admin)
PUT /api/offer/{id}
- title, description, image, displayOrder (all optional)

# Toggle Status (Admin)
PATCH /api/offer/toggle-status/{id}

# Delete Offer (Admin)
DELETE /api/offer/{id}
```

### Frontend Integration

The carousel displays active offers in order:

```jsx
const OffersCarousel = () => {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    const fetchActiveOffers = async () => {
      const response = await axios.get(url + "/api/offer/active");
      if (response.data.success) {
        setOffers(response.data.offers);
      }
    };
    fetchActiveOffers();
  }, [url]);

  return (
    <Swiper modules={[Navigation, Pagination, Autoplay]} autoplay={{ delay: 5000 }}>
      {offers.map((offer) => (
        <SwiperSlide key={offer._id}>
          <img src={`${url}/images/${offer.image}`} alt={offer.title} />
          <h3>{offer.title}</h3>
          <p>{offer.description}</p>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
```

---

## 2.3 Système de Coupons (Coupon/Promo System)

### Endpoints

#### List Active Coupons (Public)
```bash
GET /api/coupon/list
```

**Response:**
```json
{
  "success": true,
  "coupons": [
    {
      "_id": "507f1f77bcf86cd799439080",
      "code": "SUMMER50",
      "discountType": "percentage",
      "discountValue": 50,
      "minOrderAmount": 50,
      "validFrom": "2024-01-01T00:00:00Z",
      "validUntil": "2024-12-31T23:59:59Z",
      "isActive": true,
      "applicableShops": [],
      "usageCount": 125
    }
  ]
}
```

#### Validate Coupon (Public)
```bash
POST /api/coupon/validate/{code}

Request Body:
{
  "orderAmount": 100,
  "shopId": "507f1f77bcf86cd799439001" // optional
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Coupon is valid",
  "coupon": {
    "code": "SUMMER50",
    "discountType": "percentage",
    "discountValue": 50,
    "discountAmount": 50,
    "finalAmount": 50
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Coupon has expired",
  "reason": "EXPIRED"
}
```

#### Apply Coupon to Order (Protected)
```bash
POST /api/coupon/apply

Request Body:
{
  "code": "SUMMER50",
  "orderId": "507f1f77bcf86cd799439050"
}
```

#### Create Coupon (Admin)
```bash
POST /api/coupon/create
Authorization: token=JWT_ADMIN_TOKEN

Request Body:
{
  "code": "SUMMER50",
  "discountType": "percentage",
  "discountValue": 50,
  "minOrderAmount": 50,
  "maxUsageCount": 1000,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z",
  "applicableShops": [],
  "applicableCategories": []
}
```

#### Update Coupon (Admin)
```bash
PUT /api/coupon/{id}
Authorization: token=JWT_ADMIN_TOKEN
```

#### Delete Coupon (Admin)
```bash
DELETE /api/coupon/{id}
Authorization: token=JWT_ADMIN_TOKEN
```

### Coupon Rules

- **Type:** Percentage or Fixed Amount
- **Min Order Amount:** Minimum order value to use
- **Max Usage Count:** Total uses allowed (null = unlimited)
- **Validity:** Date-based expiration
- **Scope:** Can be shop-specific or category-specific
- **Status:** Active/Inactive toggle

---

## 3.1 Compte & Profil (Account & Profile)

### User Profile Endpoints

#### Get User Profile (Protected)
```bash
GET /api/user/profile
Authorization: token=JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "image": "user_profile_123.jpg",
    "role": "user",
    "addresses": [
      {
        "_id": "addr_001",
        "label": "Home",
        "street": "123 Main St",
        "city": "New York",
        "zipCode": "10001",
        "phone": "+1-555-123-4567",
        "isDefault": true,
        "createdAt": "2024-01-10T10:00:00Z"
      }
    ],
    "lastKnownLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Profile (Protected)
```bash
PUT /api/user/profile
Authorization: token=JWT_TOKEN
Content-Type: application/json

Request Body:
{
  "name": "John Doe Updated",
  "phone": "+1-555-987-6543"
}
```

#### Upload Profile Image (Protected)
```bash
POST /api/user/profile/image
Authorization: token=JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- image: file (.jpg, .png, etc)
```

**Response:**
```json
{
  "success": true,
  "message": "Profile image updated",
  "image": "user_profile_1705316400000.jpg"
}
```

---

## 3.2 Offres & Promotions (Shop Discounts)

### Get Shop Discount (Applied Automatically)

Discounts are **automatically calculated** during order placement if:
- Shop has active discount
- Discount is within valid date range
- Order meets minimum amount requirement

#### Check Shop Discount (Public)
```bash
GET /api/shop/{shopId}/discount
```

**Response:**
```json
{
  "success": true,
  "shop": {
    "_id": "507f1f77bcf86cd799439001",
    "name": "Pizza Palace"
  },
  "discount": {
    "isActive": true,
    "discountType": "percentage",
    "discountValue": 20,
    "minOrderAmount": 50,
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": "2024-12-31T23:59:59Z",
    "description": "Winter Sale - 20% off"
  }
}
```

### Order with Discount

When placing an order, the discount is **automatically applied**:

```bash
POST /api/order/place
Authorization: token=JWT_TOKEN

Request Body:
{
  "userId": "507f1f77bcf86cd799439011",
  "shopId": "507f1f77bcf86cd799439001",
  "items": [...],
  "amount": 100,
  "address": {...},
  "deliveryLocation": {...}
}
```

**Response (with automatic discount):**
```json
{
  "success": true,
  "orderId": "507f1f77bcf86cd799439050",
  "message": "Order placed successfully with 20% discount applied!",
  "finalAmount": 80,
  "discountDetails": {
    "discountType": "percentage",
    "discountValue": 20,
    "discountApplied": 20,
    "originalAmount": 100,
    "description": "Winter Sale - 20% off"
  }
}
```

---

## 3.3 Livraison & Adresses (Delivery & Addresses)

### Address Management Endpoints

#### Get All User Addresses (Protected)
```bash
GET /api/address/
Authorization: token=JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "addresses": [
    {
      "_id": "addr_001",
      "label": "Home",
      "street": "123 Main St",
      "city": "New York",
      "zipCode": "10001",
      "phone": "+1-555-123-4567",
      "isDefault": true,
      "createdAt": "2024-01-10T10:00:00Z"
    },
    {
      "_id": "addr_002",
      "label": "Office",
      "street": "456 Work Ave",
      "city": "New York",
      "zipCode": "10002",
      "phone": "+1-555-987-6543",
      "isDefault": false,
      "createdAt": "2024-01-12T10:00:00Z"
    }
  ],
  "defaultAddress": "addr_001"
}
```

#### Add Address (Protected)
```bash
POST /api/address/add
Authorization: token=JWT_TOKEN

Request Body:
{
  "label": "Home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "phone": "+1-555-123-4567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address added successfully",
  "address": {
    "_id": "addr_003",
    "label": "Home",
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001",
    "isDefault": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Update Address (Protected)
```bash
PUT /api/address/{addressId}
Authorization: token=JWT_TOKEN

Request Body:
{
  "label": "Home Updated",
  "phone": "+1-555-999-8888"
}
```

#### Delete Address (Protected)
```bash
DELETE /api/address/{addressId}
Authorization: token=JWT_TOKEN
```

#### Set Default Address (Protected)
```bash
POST /api/address/{addressId}/set-default
Authorization: token=JWT_TOKEN
```

---

### Estimated Delivery Time

#### Calculate ETA Before Order (Public)
```bash
POST /api/estimated-delivery/estimate

Request Body:
{
  "shopLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "deliveryLocation": {
    "latitude": 40.7145,
    "longitude": -74.0062
  }
}
```

**Response:**
```json
{
  "success": true,
  "distance": 1.89,
  "estimatedMinutes": 28,
  "estimatedDeliveryTime": "2024-01-15T10:58:00Z",
  "breakdown": {
    "preparationTime": 10,
    "travelTime": 4,
    "buffer": 14
  }
}
```

#### Get ETA for Placed Order (Protected)
```bash
GET /api/estimated-delivery/{orderId}
Authorization: token=JWT_TOKEN
```

---

## 3.4 Commandes (Orders)

### Order Status Flow

```
┌─────────────┐
│   Pending   │ (Order placed, waiting assignment)
└──────┬──────┘
       │
       ▼
┌──────────────┐
│   Accepted   │ (Delivery person assigned & accepted)
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ En route        │ (Delivery person on the way)
│ (Out for       │
│  Delivery)      │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Delivered        │ (Order completed)
│ (Livrée)         │
└──────────────────┘

        OR

┌──────────────────┐
│    Cancelled     │ (Order cancelled with reason)
└──────────────────┘
```

### Place Order (Protected)
```bash
POST /api/order/place
Authorization: token=JWT_TOKEN

Request Body:
{
  "userId": "507f1f77bcf86cd799439011",
  "shopId": "507f1f77bcf86cd799439001",
  "items": [
    {
      "_id": "item_001",
      "name": "Margherita Pizza",
      "price": 15,
      "quantity": 2,
      "notes": "Extra cheese"
    }
  ],
  "amount": 30,
  "address": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001",
    "phone": "+1-555-123-4567"
  },
  "deliveryLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "deliveryType": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "orderId": "507f1f77bcf86cd799439050",
  "finalAmount": 24
}
```

### Get User Orders (Protected)
```bash
POST /api/order/userorders
Authorization: token=JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "status": "Delivered",
      "items": [...],
      "amount": 24,
      "date": "2024-01-15T10:00:00Z",
      "deliveredAt": "2024-01-15T10:45:00Z"
    }
  ]
}
```

### Cancel Order (Protected - User/Admin)
```bash
POST /api/order/{orderId}/cancel
Authorization: token=JWT_TOKEN

Request Body:
{
  "reason": "Changed my mind"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439050",
    "status": "Cancelled",
    "cancelReason": "Changed my mind",
    "cancelledAt": "2024-01-15T14:30:00Z",
    "statusHistory": [
      {
        "status": "Pending",
        "timestamp": "2024-01-15T10:00:00Z"
      },
      {
        "status": "Cancelled",
        "timestamp": "2024-01-15T14:30:00Z",
        "notes": "Cancelled - Reason: Changed my mind"
      }
    ]
  }
}
```

### Order Status History

Every order tracks all status changes:

```json
{
  "_id": "507f1f77bcf86cd799439050",
  "status": "Delivered",
  "statusHistory": [
    {
      "status": "Pending",
      "timestamp": "2024-01-15T10:00:00Z",
      "updatedBy": null,
      "notes": null
    },
    {
      "status": "Accepted",
      "timestamp": "2024-01-15T10:05:00Z",
      "updatedBy": "507f1f77bcf86cd799439020",
      "notes": "Order accepted by delivery person"
    },
    {
      "status": "Out for Delivery",
      "timestamp": "2024-01-15T10:15:00Z",
      "updatedBy": "507f1f77bcf86cd799439020",
      "notes": "Delivery started"
    },
    {
      "status": "Delivered",
      "timestamp": "2024-01-15T10:45:00Z",
      "updatedBy": "507f1f77bcf86cd799439020",
      "notes": "Order delivered by delivery person"
    }
  ]
}
```

---

## 3.5 Notifications

### Notification System Architecture

The notification system has **2 sides**:

#### **New Notifications (Real-time via WebSocket)**
- Instant delivery when status changes
- Live badge updates (unread count)
- Socket.io event: `NOTIFICATION`

#### **Old Notifications (Database History)**
- Complete history with timestamps
- Searchable and filterable
- Mark as read/unread

### Notification Types

| Type | Trigger | Example |
|------|---------|---------|
| **order_accepted** | Delivery person accepts | "Your order has been accepted" |
| **order_delivered** | Order delivered | "Your order has been delivered" |
| **order_cancelled** | Order cancelled | "Your order was cancelled" |
| **promotion** | New offers/coupons | "50% off pizza today!" |
| **system** | System messages | "Maintenance alert" |

### API Endpoints

#### Get All Notifications (Protected)
```bash
GET /api/notification?page=1&limit=20
Authorization: token=JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "notif_001",
      "userId": "507f1f77bcf86cd799439011",
      "type": "order",
      "title": "Order Delivered",
      "message": "Your order #a1b2c3d4 has been successfully delivered!",
      "relatedId": "507f1f77bcf86cd799439050",
      "relatedType": "order",
      "action": "order_delivered",
      "isRead": false,
      "createdAt": "2024-01-15T10:45:00Z",
      "readAt": null
    },
    {
      "_id": "notif_002",
      "userId": "507f1f77bcf86cd799439011",
      "type": "promotion",
      "title": "Special Offer",
      "message": "Use code SUMMER50 for 50% off!",
      "relatedId": "coup_001",
      "relatedType": "coupon",
      "action": "promotion",
      "isRead": true,
      "createdAt": "2024-01-14T10:00:00Z",
      "readAt": "2024-01-14T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 145,
    "unread": 23,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

#### Get Unread Count (Protected)
```bash
GET /api/notification/unread/count
Authorization: token=JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "unreadCount": 23
}
```

#### Get Unread Notifications Only (Protected)
```bash
GET /api/notification/unread
Authorization: token=JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "notif_001",
      "title": "Order Delivered",
      "message": "Your order #a1b2c3d4 has been successfully delivered!",
      "isRead": false,
      "createdAt": "2024-01-15T10:45:00Z"
    }
  ],
  "count": 1
}
```

#### Mark Notification as Read (Protected)
```bash
POST /api/notification/mark-read
Authorization: token=JWT_TOKEN

Request Body:
{
  "notificationId": "notif_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "notification": {
    "_id": "notif_001",
    "isRead": true,
    "readAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Mark All as Read (Protected)
```bash
POST /api/notification/mark-all-read
Authorization: token=JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 23
}
```

#### Delete Notification (Protected)
```bash
POST /api/notification/delete
Authorization: token=JWT_TOKEN

Request Body:
{
  "notificationId": "notif_001"
}
```

#### Delete All Notifications (Protected)
```bash
POST /api/notification/delete-all
Authorization: token=JWT_TOKEN
```

### WebSocket Real-Time Notifications

#### Subscribe to Notifications
```javascript
socket.emit('SUBSCRIBE_NOTIFICATIONS');
```

#### Receive Notifications in Real-Time
```javascript
socket.on('NOTIFICATION', (data) => {
  console.log("New notification:", data.notification);
  console.log("Unread count:", data.unreadCount);

  // Update UI
  updateNotificationBadge(data.unreadCount);
  showNotificationPopup(data.notification);
});
```

**Real-time data:**
```json
{
  "success": true,
  "notification": {
    "_id": "notif_001",
    "type": "order",
    "title": "Order Delivered",
    "message": "Your order has been delivered!",
    "relatedId": "507f1f77bcf86cd799439050",
    "relatedType": "order",
    "action": "order_delivered",
    "actionData": {
      "orderId": "507f1f77bcf86cd799439050",
      "previousStatus": "Out for Delivery",
      "newStatus": "Delivered"
    },
    "isRead": false,
    "createdAt": "2024-01-15T10:45:00Z"
  },
  "unreadCount": 22
}
```

### Frontend Integration - Notifications Page with 2 Sides

#### Component Structure

```jsx
function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("new"); // "new" or "history"
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time new notifications
  useEffect(() => {
    socket.on("NOTIFICATION", (data) => {
      setNotifications((prev) => [data.notification, ...prev]);
      setUnreadCount(data.unreadCount);
      showNewNotificationAlert(data.notification);
    });
  }, []);

  // Old notifications (history)
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="notifications-page">
      {/* Tabs: New vs History */}
      <div className="tabs">
        <button
          className={activeTab === "new" ? "active" : ""}
          onClick={() => setActiveTab("new")}
        >
          🔔 New ({unreadCount})
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          📜 History
        </button>
      </div>

      {/* New Notifications - Live Updates */}
      {activeTab === "new" && (
        <div className="new-notifications">
          {notifications
            .filter((n) => !n.isRead)
            .map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkRead={() => markAsRead(notification._id)}
                isNew={true}
              />
            ))}
        </div>
      )}

      {/* History - All Notifications */}
      {activeTab === "history" && (
        <div className="notification-history">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkRead={() => markAsRead(notification._id)}
              isNew={!notification.isRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Notification Triggers (Automated)

#### 1. Order Accepted
```json
{
  "type": "order",
  "title": "Order Accepted",
  "message": "Your order #a1b2c3d4 has been accepted by our delivery person",
  "action": "order_accepted",
  "actionData": {
    "orderId": "507f1f77bcf86cd799439050",
    "previousStatus": "Pending",
    "newStatus": "Accepted",
    "deliveryPersonName": "Ahmed"
  }
}
```

#### 2. Order Out for Delivery
```json
{
  "type": "order",
  "title": "Order On The Way",
  "message": "Your order #a1b2c3d4 is on the way!",
  "action": "order_started",
  "actionData": {
    "orderId": "507f1f77bcf86cd799439050",
    "previousStatus": "Accepted",
    "newStatus": "Out for Delivery"
  }
}
```

#### 3. Order Delivered
```json
{
  "type": "order",
  "title": "Order Delivered",
  "message": "Your order #a1b2c3d4 has been successfully delivered!",
  "action": "order_delivered",
  "actionData": {
    "orderId": "507f1f77bcf86cd799439050",
    "previousStatus": "Out for Delivery",
    "newStatus": "Delivered"
  }
}
```

#### 4. Order Cancelled
```json
{
  "type": "order",
  "title": "Order Cancelled",
  "message": "Your order #a1b2c3d4 has been cancelled. Reason: Changed my mind",
  "action": "order_cancelled",
  "actionData": {
    "orderId": "507f1f77bcf86cd799439050",
    "previousStatus": "Pending",
    "newStatus": "Cancelled",
    "reason": "Changed my mind"
  }
}
```

#### 5. Promotion Alert
```json
{
  "type": "promotion",
  "title": "Special Offer",
  "message": "50% off at Pizza Palace! Use code SUMMER50",
  "action": "promotion",
  "actionData": {
    "couponCode": "SUMMER50",
    "discount": "50%"
  }
}
```

---

## Complete Endpoint Reference Table

| Category | Endpoint | Method | Auth | Purpose |
|----------|----------|--------|------|---------|
| **Orders** | `/api/order/place` | POST | ✅ | Place new order |
| | `/api/order/userorders` | POST | ✅ | Get user orders |
| | `/api/order/{id}/cancel` | POST | ✅ | Cancel order |
| | `/api/order/{id}` | GET | ✅ | Get order details |
| **Addresses** | `/api/address/` | GET | ✅ | List addresses |
| | `/api/address/add` | POST | ✅ | Add address |
| | `/api/address/{id}` | PUT | ✅ | Update address |
| | `/api/address/{id}` | DELETE | ✅ | Delete address |
| | `/api/address/{id}/set-default` | POST | ✅ | Set default |
| **Delivery** | `/api/estimated-delivery/estimate` | POST | ❌ | Calculate ETA |
| | `/api/estimated-delivery/{orderId}` | GET | ✅ | Get order ETA |
| **Coupons** | `/api/coupon/list` | GET | ❌ | List coupons |
| | `/api/coupon/validate/{code}` | POST | ❌ | Validate coupon |
| | `/api/coupon/apply` | POST | ✅ | Apply coupon |
| | `/api/coupon/create` | POST | ✅ Admin | Create coupon |
| **Offers** | `/api/offer/active` | GET | ❌ | Get active offers |
| | `/api/offer/create` | POST | ✅ Admin | Create offer |
| | `/api/offer/list` | GET | ✅ Admin | List all offers |
| | `/api/offer/{id}` | PUT | ✅ Admin | Update offer |
| | `/api/offer/toggle-status/{id}` | PATCH | ✅ Admin | Toggle status |
| | `/api/offer/{id}` | DELETE | ✅ Admin | Delete offer |
| **Notifications** | `/api/notification` | GET | ✅ | Get notifications |
| | `/api/notification/unread/count` | GET | ✅ | Unread count |
| | `/api/notification/unread` | GET | ✅ | Get unread |
| | `/api/notification/mark-read` | POST | ✅ | Mark as read |
| | `/api/notification/mark-all-read` | POST | ✅ | Mark all read |
| | `/api/notification/delete` | POST | ✅ | Delete notif |
| | `/api/notification/delete-all` | POST | ✅ | Delete all |
| **Profile** | `/api/user/profile` | GET | ✅ | Get profile |
| | `/api/user/profile` | PUT | ✅ | Update profile |
| | `/api/user/profile/image` | POST | ✅ | Upload image |

---

**Last Updated:** January 2026
**Reviewed By:** Backend Team
**Status:** All Features Implemented ✅
