# Quick Test: Delivery Orders

This guide helps you quickly test the delivery orders feature.

## Prerequisites

- Backend running: `npm run server` (from `/backend`)
- Frontend running: `npm run dev` (from `/frontend`)
- MongoDB running and connected

## Quick Test Steps

### 1. Create Test Orders (1 minute)

```bash
cd backend
npm run seed-orders
```

You should see:
```
✅ Successfully added 4 test orders to MongoDB
Test orders created with:
  Order 1: [ID]
    - Customer: John Doe
    - Location: 36.753769, 3.058756
    - Amount: 38
    - Status: Pending
    - Payment: true
```

### 2. Create a Delivery Account (if needed)

1. **Option A: Use admin to create delivery user**
   - Create admin user: `npm run create-admin` (in backend)
   - Login to admin dashboard
   - Create a delivery user with role "delivery"

2. **Option B: Update existing user**
   ```bash
   # In MongoDB shell or Compass
   db.user.updateOne(
     { email: "deliverytest@test.com" },
     { $set: { role: "delivery" } }
   )
   ```

### 3. Login as Delivery Person

1. Go to `http://localhost:5173/delivery/account` (or appropriate URL)
2. Login with delivery account credentials
3. Allow location permission when prompted

### 4. Verify Orders Appear

**Expected Result:**
- Location tracking shows as "Active"
- Shows your coordinates
- "Available Orders" tab shows count > 0
- Map displays order pins
- Order cards show with customer info and distance

**If not working:**
- Check browser console (F12) for error messages
- Check backend console for log messages
- Review DELIVERY_ORDERS_TROUBLESHOOTING.md

### 5. Test Order Actions

1. **Accept Order**
   - Click "Accept Order" button on any order
   - Should see success toast
   - Should navigate to tracking page

2. **View My Orders**
   - Click "My Orders" tab
   - Should show accepted orders

3. **Track Delivery**
   - From accepted order, click "Track Order"
   - Should show delivery map with routes

---

## Verification Checklist

### Backend Console Should Show:
```
[getNearestOrders] Delivery person at: 36.753769, 3.058756
[getNearestOrders] Total orders in database: 4
[getNearestOrders] Found 4 available orders matching filters
[getNearestOrders] Orders within 50km radius: 4
[getNearestOrders] Returning 4 orders to delivery person
```

### Browser Console Should Show:
```
[NearestOrders] Fetching orders for location: {latitude: 36.753769, ...}
[NearestOrders] Successfully fetched from http://localhost:5000/api/order/nearest
[NearestOrders] Received 4 orders from backend
[NearestOrders] Filtered to 4 nearby orders within 50km
```

### Expected Results:

| Feature | Expected | Status |
|---------|----------|--------|
| Location permission granted | Browser location available | ✓/✗ |
| Location display | Shows coordinates | ✓/✗ |
| Orders fetched | Available Orders > 0 | ✓/✗ |
| Orders displayed | Cards visible with details | ✓/✗ |
| Map markers | Blue pins on map | ✓/✗ |
| Distance shown | Kilometers displayed | ✓/✗ |
| Accept button works | Can accept order | ✓/✗ |
| My Orders shows | Accepted orders appear | ✓/✗ |

---

## Test Data Info

### Seeded Orders Include:
1. **Order 1** - John Doe (2x Greek Salad, 1x Lasagna) - €38
2. **Order 2** - Jane Smith (1x Fruit Ice Cream, 1x Chicken Sandwich) - €34  
3. **Order 3** - Ahmed Mohamed (2x Cheese Pasta, 1x Ripple Ice Cream) - €38
4. **Order 4** - Fatima Ali (1x Veg Salad, 1x Butter Noodles) - €32

All seeded orders:
- Location: Algiers, Algeria area (36.7-36.8°N, 3.05-3.09°E)
- Payment: ✓ Paid (payment: true)
- Status: Pending
- Assigned: ✗ Not assigned (available for pickup)

---

## Troubleshooting During Test

### "No nearby orders found"
1. Check backend console for error logs
2. Verify orders exist: `db.order.countDocuments()` should be > 0
3. Verify payment: `db.order.countDocuments({ payment: true })` should be > 0
4. Verify not assigned: `db.order.countDocuments({ assignedDeliveryPerson: null })` should be > 0
5. Check delivery person has "delivery" role

### "Only delivery personnel can view orders"
1. Check user role in database: `db.user.findOne({ email: "..." }).role`
2. Should be "delivery" or "livreur"
3. Re-login after fixing role

### "Latitude and longitude required"
1. Check browser location permission is granted
2. Reload page and accept location permission prompt
3. Check browser console for geolocation errors

### Map doesn't load
1. Check leaflet library is loaded (look in Network tab)
2. Check for JavaScript errors in console
3. Verify mapRef is properly initialized

---

## Resetting Test Data

To start fresh:

```bash
# Delete all orders
db.order.deleteMany({})

# Reseed test orders
npm run seed-orders -- --force

# Check result
db.order.countDocuments()  # Should be 4
```

---

## Next Steps

Once verified working:
1. Test accepting multiple orders
2. Test completing deliveries (mark as delivered)
3. Test real customer orders (without seed data)
4. Monitor performance with large order volumes
5. Test location updates during active delivery

---

## Performance Expectations

- Order list loads: < 1 second
- Map renders: < 2 seconds
- Accept order: < 2 seconds
- Accept then navigate: < 3 seconds
- Location updates: < 5 seconds (every 30 seconds)

---

## Cleanup After Testing

```bash
# Remove test orders
db.order.deleteMany({})

# Keep or remove test delivery user (your choice)
```
