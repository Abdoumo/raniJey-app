import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

// Haversine formula to calculate distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// placing user order for frontend
const placeOrder = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.json({ success: false, message: "User ID not found. Please login again." });
    }

    if (!req.body.items || req.body.items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    if (!req.body.address) {
      return res.json({ success: false, message: "Address is required" });
    }

    const newOrder = new orderModel({
      userId: req.body.userId,
      shopId: req.body.shopId || null,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
      payment: true,
      status: "Pending",
      deliveryLocation: req.body.deliveryLocation || null,
      deliveryType: req.body.deliveryType || "standard",
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    res.json({ success: true, message: "Order placed successfully. Please pay on delivery.", orderId: newOrder._id });
  } catch (error) {
    console.error("Order placement error:", error);
    const errorMessage = error.message || "Failed to create order";
    res.json({ success: false, message: errorMessage });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success == "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.body.userId })
      .populate('assignedDeliveryPerson', 'name phone email lastKnownLocation');
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin pannel
const listOrders = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const orders = await orderModel.find({});
      res.json({ success: true, data: orders });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// api for updating status
const updateStatus = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      await orderModel.findByIdAndUpdate(req.body.orderId, {
        status: req.body.status,
      });
      res.json({ success: true, message: "Status Updated Successfully" });
    }else{
      res.json({ success: false, message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get nearest orders based on delivery person location
const getNearestOrders = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const deliveryPersonId = req.body.userId;

    if (!latitude || !longitude) {
      return res.json({ success: false, message: "Latitude and longitude required" });
    }

    // Verify delivery person role (optional - can work without auth, but better with it)
    if (deliveryPersonId) {
      const user = await userModel.findById(deliveryPersonId);
      if (!user) {
        return res.json({ success: false, message: "User not found" });
      }
      if (user.role !== "delivery" && user.role !== "livreur") {
        console.log(`[getNearestOrders] User ${deliveryPersonId} has role '${user.role}', not delivery personnel`);
        return res.json({ success: false, message: "Only delivery personnel can view orders" });
      }
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    console.log(`[getNearestOrders] Delivery person ${deliveryPersonId} at: ${lat}, ${lon}`);

    // Debug: Check total orders in database
    const totalOrdersInDB = await orderModel.countDocuments();
    console.log(`[getNearestOrders] Total orders in database: ${totalOrdersInDB}`);

    // Get all available orders (not assigned, paid, not delivered/cancelled)
    // Include orders with or without delivery location
    const orders = await orderModel.find({
      assignedDeliveryPerson: null,
      payment: true,
      status: { $nin: ["Delivered", "Cancelled"] },
    }).sort({ date: -1 }).limit(50);

    console.log(`[getNearestOrders] Found ${orders.length} available orders matching filters`);

    // Debug: Log first order for inspection if any exist
    if (orders.length > 0) {
      console.log(`[getNearestOrders] First order sample:`, JSON.stringify(orders[0], null, 2));
    }

    // Separate and process orders with and without delivery location
    const ordersWithLocation = orders.filter(o => o.deliveryLocation && o.deliveryLocation.latitude && o.deliveryLocation.longitude);
    const ordersWithoutLocation = orders.filter(o => !o.deliveryLocation || !o.deliveryLocation.latitude || !o.deliveryLocation.longitude);

    console.log(`[getNearestOrders] Orders with location: ${ordersWithLocation.length}, without location: ${ordersWithoutLocation.length}`);

    // Calculate distances for orders with location and sort by distance
    const ordersWithDistance = ordersWithLocation
      .map((order) => ({
        ...order.toObject(),
        distance: calculateDistance(
          lat,
          lon,
          order.deliveryLocation.latitude,
          order.deliveryLocation.longitude
        ),
      }))
      .filter((order) => order.distance <= 500) // Filter to 500km radius
      .sort((a, b) => a.distance - b.distance);

    console.log(`[getNearestOrders] Orders within 50km radius: ${ordersWithDistance.length}`);

    // Orders without location (address only) - shown after distance-sorted orders
    const ordersWithoutDistanceInfo = ordersWithoutLocation.map((order) => ({
      ...order.toObject(),
      distance: null,
    }));

    // Combine: distance-based orders first, then address-only orders
    const allOrders = [...ordersWithDistance, ...ordersWithoutDistanceInfo].slice(0, 20);

    console.log(`[getNearestOrders] Returning ${allOrders.length} orders to delivery person`);

    res.json({
      success: true,
      totalOrders: allOrders.length,
      orders: allOrders,
    });
  } catch (error) {
    console.error('[getNearestOrders] Error:', error);
    res.json({ success: false, message: "Error fetching orders" });
  }
};

// Get all available orders (not yet assigned)
const getAvailableOrders = async (req, res) => {
  try {
    const deliveryPersonId = req.body.userId;

    console.log(`[getAvailableOrders] Request from delivery person: ${deliveryPersonId}`);

    // Verify delivery person role
    if (deliveryPersonId) {
      const user = await userModel.findById(deliveryPersonId);
      if (!user) {
        console.log(`[getAvailableOrders] User ${deliveryPersonId} not found`);
        return res.json({ success: false, message: "User not found" });
      }
      if (user.role !== "delivery" && user.role !== "livreur") {
        console.log(`[getAvailableOrders] User ${deliveryPersonId} has role '${user.role}', not delivery personnel`);
        return res.json({ success: false, message: "Only delivery personnel can view orders" });
      }
    }

    const totalOrdersInDB = await orderModel.countDocuments();
    console.log(`[getAvailableOrders] Total orders in database: ${totalOrdersInDB}`);

    const orders = await orderModel.find({
      assignedDeliveryPerson: null,
      payment: true,
      status: { $nin: ["Delivered", "Cancelled"] },
    })
      .sort({ date: -1 })
      .limit(50);

    console.log(`[getAvailableOrders] Found ${orders.length} available orders`);

    res.json({
      success: true,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error('[getAvailableOrders] Error:', error);
    res.json({ success: false, message: "Error fetching orders" });
  }
};

// Get all pending orders (not yet delivered)
const getPendingOrders = async (req, res) => {
  try {
    const deliveryPersonId = req.body.userId;

    // Verify delivery person role
    if (deliveryPersonId) {
      const user = await userModel.findById(deliveryPersonId);
      if (!user || (user.role !== "delivery" && user.role !== "livreur")) {
        return res.json({ success: false, message: "Only delivery personnel can view orders" });
      }
    }

    const orders = await orderModel.find({
      status: { $nin: ["Delivered", "Cancelled"] },
      payment: true,
    })
      .sort({ date: -1 })
      .limit(100);

    res.json({
      success: true,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Accept order by delivery person
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deliveryPersonId = req.body.userId;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    if (!deliveryPersonId) {
      return res.json({ success: false, message: "Delivery person not identified" });
    }

    // Get the delivery person's user record
    const deliveryPerson = await userModel.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.json({ success: false, message: "Delivery person not found" });
    }

    // Check if user is a delivery person
    if (deliveryPerson.role !== "delivery" && deliveryPerson.role !== "livreur") {
      return res.json({ success: false, message: "Only delivery personnel can accept orders" });
    }

    // Get the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if order is available
    if (order.assignedDeliveryPerson) {
      return res.json({ success: false, message: "Order has already been assigned to another delivery person" });
    }

    // Check if order has been paid
    if (!order.payment) {
      return res.json({ success: false, message: "Order payment not confirmed" });
    }

    // Check if order is not already delivered or cancelled
    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.json({ success: false, message: `Order has already been ${order.status.toLowerCase()}` });
    }

    // Update the order with delivery person assignment
    order.assignedDeliveryPerson = deliveryPersonId;
    order.assignedAt = new Date();
    order.status = "Accepted";

    await order.save();

    res.json({
      success: true,
      message: "Order accepted successfully",
      order: order,
    });
  } catch (error) {
    console.error("Accept order error:", error);
    res.json({ success: false, message: "Error accepting order" });
  }
};

// Get specific order details
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;

    // Validate orderId is a valid MongoDB ObjectId
    if (!orderId || typeof orderId !== 'string' || orderId.length !== 24) {
      return res.json({ success: false, message: "Invalid order ID" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check authorization: customer, assigned delivery person, or admin
    const user = await userModel.findById(userId);
    const isCustomer = order.userId === userId;
    const isDeliveryPerson = order.assignedDeliveryPerson?.toString() === userId;
    const isAdmin = user && user.role === "admin";

    if (!isCustomer && !isDeliveryPerson && !isAdmin) {
      return res.json({ success: false, message: "Unauthorized access to order" });
    }

    // Include customer details in response
    const orderData = order.toObject();
    const customerUser = await userModel.findById(order.userId);
    if (customerUser) {
      orderData.customerName = customerUser.name;
      orderData.customerEmail = customerUser.email;
    }

    // Include shop details if shopId exists
    console.log('[getOrder] Order shopId:', order.shopId);
    if (order.shopId) {
      try {
        const shopModel = (await import('../models/shopModel.js')).default;
        const shop = await shopModel.findById(order.shopId);
        console.log('[getOrder] Shop fetched:', shop ? 'success' : 'not found');
        if (shop) {
          orderData.shop = shop;
        }
      } catch (err) {
        console.warn('[getOrder] Could not fetch shop details:', err);
      }
    } else {
      console.log('[getOrder] No shopId in order, order data keys:', Object.keys(order.toObject()));
    }

    res.json({
      success: true,
      order: orderData,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.json({ success: false, message: "Error fetching order" });
  }
};

// Mark order as delivered
const markDelivered = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deliveryPersonId = req.body.userId;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if delivery person is assigned
    if (order.assignedDeliveryPerson?.toString() !== deliveryPersonId) {
      return res.json({ success: false, message: "You are not assigned to this order" });
    }

    // Check if order is not already delivered
    if (order.status === "Delivered") {
      return res.json({ success: false, message: "Order already delivered" });
    }

    // Update order status
    order.status = "Delivered";
    order.deliveredAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Order marked as delivered",
      order: order,
    });
  } catch (error) {
    console.error("Mark delivered error:", error);
    res.json({ success: false, message: "Error marking order as delivered" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus, getNearestOrders, getAvailableOrders, getPendingOrders, acceptOrder, getOrder, markDelivered };
