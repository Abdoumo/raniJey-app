# Delivery Orders Troubleshooting Guide

This guide helps diagnose why delivery orders are not showing up in the delivery dashboard.

## Symptoms

- Delivery dashboard shows "No nearby orders found"
- Available Orders count shows 0
- Location tracking is active and working
- But orders should exist in the system

## Root Causes & Solutions

### 1. No Orders in Database

**Check:**
1. Open MongoDB or your database admin panel
2. Query the `order` collection
3. Count total documents: `db.order.countDocuments()`

**If no orders exist:**
- Create test orders using the seed script:
  ```bash
  cd backend
  npm run seed-orders
  ```
- Or manually place orders through the customer UI
- Orders must have `payment: true` to be visible to delivery persons

---

### 2. Orders Not Marked as Paid

**Check:**
```bash
# In MongoDB shell
db.order.find({ payment: false }).count()  # Should be 0 for visible orders
```

**Expected Order Structure:**
```json
{
  "_id": ObjectId("..."),
  "userId": "user123",
  "items": [...],
  "amount": 50,
  "address": {...},
  "status": "Pending",           // Must NOT be "Delivered" or "Cancelled"
  "payment": true,                // REQUIRED for visibility
  "assignedDeliveryPerson": null, // Must be null or undefined
  "deliveryLocation": {
    "latitude": 36.753769,
    "longitude": 3.058756
  },
  "date": ISODate("2024-01-20T10:30:00Z")
}
```

---

### 3. Delivery Person Missing "delivery" Role

**Check:**
1. Login to delivery account
2. Check browser console for errors (F12 → Console)
3. Look for message: "Only delivery personnel can view orders"

**Fix:**
```bash
# Update user role in MongoDB
db.user.updateOne(
  { email: "delivery@example.com" },
  { $set: { role: "delivery" } }
)
```

**Valid Roles:**
- `"delivery"` - Standard delivery person
- `"livreur"` - Alternative delivery role name (French)

---

### 4. Orders Outside Delivery Radius

**Check:**
- Delivery person location: shown on dashboard
- Order delivery location: in database as `deliveryLocation.latitude` and `deliveryLocation.longitude`

**Radius:** Default is 50km. If order is farther away:
- It will still appear but after "nearby" orders
- Check distance calculation in browser console logs

---

### 5. No DeliveryLocation Coordinates

**Check:**
```bash
# In MongoDB
db.order.find({ 
  $or: [
    { deliveryLocation: null },
    { "deliveryLocation.latitude": null },
    { "deliveryLocation.longitude": null }
  ]
}).count()
```

**Fix:**
- Orders with no coordinates fall back to address-based matching
- Ensure orders are created with valid delivery location coordinates
- See seed script for example orders with coordinates

---

## Debugging Steps

### Step 1: Check Backend Logs

Run the backend server and watch console output:
```bash
cd backend
npm run server
```

Look for log messages:
```
[getNearestOrders] Delivery person at: 36.753769, 3.058756
[getNearestOrders] Total orders in database: 5
[getNearestOrders] Found 3 available orders matching filters
[getNearestOrders] Orders with location: 2, without location: 1
[getNearestOrders] Orders within 50km radius: 2
[getNearestOrders] Returning 2 orders to delivery person
```

### Step 2: Check Browser Console

Open browser DevTools (F12) → Console tab

Look for logs from the frontend:
```
[NearestOrders] Fetching orders for location: {latitude: 36.753769, longitude: 3.058756, ...}
[NearestOrders] Trying endpoint: http://localhost:5000/api/order/nearest
[NearestOrders] Successfully fetched from http://localhost:5000/api/order/nearest: {success: true, orders: [...]}
[NearestOrders] Received 2 orders from backend
[NearestOrders] Filtered to 2 nearby orders within 50km
```

### Step 3: Test API Directly

Use Postman or curl to test the API:

```bash
# Get nearby orders
curl -X GET "http://localhost:5000/api/order/nearest?latitude=36.753769&longitude=3.058756" \
  -H "token: YOUR_DELIVERY_TOKEN"

# Response should include orders array with payment: true
```

### Step 4: Verify Authentication

Ensure you're logged in as a delivery person:

```bash
# Check localStorage in browser console
localStorage.getItem('token')        # Should exist
localStorage.getItem('userId')       # Should exist
localStorage.getItem('userRole')     # Should be 'delivery'
```

---

## Creating Test Orders

### Using Seed Script (Recommended)

```bash
cd backend
npm run seed-orders           # Creates 4 test orders
npm run seed-orders -- --force # Replace existing orders
```

### Manual Creation

1. Go to Customer frontend
2. Add items to cart
3. Complete checkout
4. Payment should auto-confirm (payment: true)
5. Orders appear in database

---

## Testing Checklist

- [ ] MongoDB is running and connected
- [ ] Backend server is running (npm run server)
- [ ] Frontend dev server is running (npm run dev)
- [ ] Logged in as delivery person (role = "delivery" or "livreur")
- [ ] Browser location permission is granted
- [ ] Orders exist in database (payment: true, assignedDeliveryPerson: null)
- [ ] Orders have valid deliveryLocation coordinates
- [ ] Backend logs show orders being found and returned
- [ ] Frontend console shows successful API calls

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Not Authorized Login Again" | Missing auth token | Login again |
| "Only delivery personnel can view orders" | Wrong user role | Update user role to "delivery" |
| "Latitude and longitude required" | Missing location params | Grant location permission |
| "Unable to fetch nearby orders" | Network error or all endpoints failed | Check backend is running, check logs |
| "No nearby orders found" | No valid orders in database | Use seed script or create test orders |

---

## Advanced: Database Inspection

```bash
# Check all orders and their payment status
db.order.aggregate([
  {
    $group: {
      _id: "$payment",
      count: { $sum: 1 }
    }
  }
])

# Result should show:
# { _id: true, count: 2 }  # Visible to delivery
# { _id: false, count: 0 } # Hidden from delivery

# Check order status distribution
db.order.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
])

# Check assignments
db.order.aggregate([
  {
    $group: {
      _id: "$assignedDeliveryPerson",
      count: { $sum: 1 }
    }
  }
])
# Should show { _id: null, count: X } for available orders
```

---

## Performance Notes

- Maximum 50 orders fetched at once
- Results limited to top 20 (by distance or date)
- Minimum distance filter: 50km radius
- Orders refreshed every 30 seconds on dashboard

---

## Support

If issues persist:
1. Check all logs (backend console and browser console)
2. Verify database has valid test data
3. Test API endpoint directly with Postman
4. Clear browser cache and localStorage
5. Restart backend and frontend servers
