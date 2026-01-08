import locationModel from "../models/locationModel.js";
import locationHistoryModel from "../models/locationHistoryModel.js";
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

// Update user location
const updateLocation = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { latitude, longitude, accuracy } = req.body;

    console.log('[updateLocation] Updating location for userId:', userId, { latitude, longitude, accuracy });

    if (!latitude || !longitude) {
      return res.json({ success: false, message: "Latitude and longitude required" });
    }

    // Update current location
    let location = await locationModel.findOneAndUpdate(
      { userId },
      { latitude, longitude, accuracy, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    console.log('[updateLocation] Location saved:', location);

    // Save to history
    await locationHistoryModel.create({
      userId,
      latitude,
      longitude,
      accuracy,
    });

    // If user is assigned to an order, also save with orderId
    const activeOrder = await orderModel.findOne({
      assignedDeliveryPerson: userId,
      status: { $nin: ["Delivered", "Cancelled"] },
    });

    console.log('[updateLocation] Active order for delivery person:', activeOrder ? activeOrder._id : 'none');

    if (activeOrder) {
      await locationHistoryModel.create({
        userId,
        orderId: activeOrder._id,
        latitude,
        longitude,
        accuracy,
      });
    }

    res.json({ success: true, message: "Location updated", location });
  } catch (error) {
    console.error('[updateLocation] Error:', error);
    res.json({ success: false, message: "Error" });
  }
};

// Get current location of a specific user (admin can see all, user can see own)
const getUserLocation = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { targetUserId } = req.params;

    const currentUser = await userModel.findById(userId);

    // Check permissions
    if (currentUser.role !== "admin" && userId !== targetUserId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const location = await locationModel.findOne({ userId: targetUserId });

    if (!location) {
      return res.json({ success: false, message: "Location not found" });
    }

    res.json({ success: true, location });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get all active delivery people locations (Admin only)
const getActiveDeliveryLocations = async (req, res) => {
  try {
    const userId = req.body.userId;
    const currentUser = await userModel.findById(userId);

    if (currentUser.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    // Get all delivery people (users with specific role)
    const deliveryPeople = await userModel.find({ role: "delivery" });
    const deliveryIds = deliveryPeople.map((d) => d._id);

    // Get their current locations
    const locations = await locationModel.find({ userId: { $in: deliveryIds }, isActive: true });

    res.json({ success: true, totalDelivery: locations.length, locations });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Auto-match closest delivery person to order
const autoMatchDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;

    const currentUser = await userModel.findById(userId);
    if (currentUser.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.assignedDeliveryPerson) {
      return res.json({ success: false, message: "Order already assigned" });
    }

    // Get order delivery location
    const { latitude: destLat, longitude: destLon } = order.deliveryLocation;

    // Get all active delivery people
    const deliveryPeople = await userModel.find({ role: "delivery" });
    const deliveryIds = deliveryPeople.map((d) => d._id);

    // Get their current locations
    const locations = await locationModel.find({ userId: { $in: deliveryIds }, isActive: true });

    if (locations.length === 0) {
      return res.json({ success: false, message: "No available delivery people" });
    }

    // Calculate distances and find closest
    let closestDelivery = null;
    let minDistance = Infinity;

    locations.forEach((loc) => {
      const distance = calculateDistance(loc.latitude, loc.longitude, destLat, destLon);
      if (distance < minDistance) {
        minDistance = distance;
        closestDelivery = loc;
      }
    });

    // Assign order to closest delivery person
    order.assignedDeliveryPerson = closestDelivery.userId;
    order.assignedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Order assigned to closest delivery person",
      order,
      distance: minDistance.toFixed(2) + " km",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get assigned delivery person location (for customer)
const getOrderDeliveryLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;

    console.log('[getOrderDeliveryLocation] Request for orderId:', orderId, 'userId:', userId);

    const order = await orderModel.findById(orderId);

    if (!order) {
      console.log('[getOrderDeliveryLocation] Order not found');
      return res.json({ success: false, message: "Order not found" });
    }

    console.log('[getOrderDeliveryLocation] Order found, assignedDeliveryPerson:', order.assignedDeliveryPerson);

    // Check if user is the customer or admin
    const currentUser = await userModel.findById(userId);
    const isCustomer = order.userId === userId;
    const isAdmin = currentUser && currentUser.role === "admin";
    const isDeliveryPerson = order.assignedDeliveryPerson?.toString() === userId;

    console.log('[getOrderDeliveryLocation] Permissions - isCustomer:', isCustomer, 'isAdmin:', isAdmin, 'isDeliveryPerson:', isDeliveryPerson);

    if (!isCustomer && !isAdmin && !isDeliveryPerson) {
      console.log('[getOrderDeliveryLocation] Unauthorized access');
      return res.json({ success: false, message: "Unauthorized" });
    }

    if (!order.assignedDeliveryPerson) {
      console.log('[getOrderDeliveryLocation] No delivery person assigned yet');
      return res.json({ success: false, message: "No delivery person assigned yet" });
    }

    const location = await locationModel.findOne({ userId: order.assignedDeliveryPerson });

    console.log('[getOrderDeliveryLocation] Location found:', location ? 'yes' : 'no', location);

    if (!location) {
      console.log('[getOrderDeliveryLocation] Delivery location not available');
      return res.json({ success: false, message: "Delivery location not available" });
    }

    res.json({ success: true, location, deliveryPerson: order.assignedDeliveryPerson });
  } catch (error) {
    console.error('[getOrderDeliveryLocation] Error:', error);
    res.json({ success: false, message: "Error" });
  }
};

// Get location history for a user (admin only)
const getLocationHistory = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { targetUserId } = req.params;
    const { days = 30 } = req.query;

    const currentUser = await userModel.findById(userId);

    if (currentUser.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await locationHistoryModel
      .find({
        userId: targetUserId,
        timestamp: { $gte: startDate },
      })
      .sort({ timestamp: -1 })
      .limit(1000);

    res.json({ success: true, totalRecords: history.length, days, history });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get location history for an order
const getOrderLocationHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if user is authorized
    if (order.userId !== userId && (await userModel.findById(userId)).role !== "admin") {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const history = await locationHistoryModel
      .find({ orderId })
      .sort({ timestamp: -1 })
      .limit(1000);

    res.json({ success: true, totalRecords: history.length, history });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Toggle location sharing status
const toggleLocationSharing = async (req, res) => {
  try {
    const userId = req.body.userId;

    let location = await locationModel.findOne({ userId });

    if (!location) {
      return res.json({ success: false, message: "Location not found" });
    }

    location.isActive = !location.isActive;
    await location.save();

    const status = location.isActive ? "enabled" : "disabled";
    res.json({ success: true, message: `Location sharing ${status}`, location });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export {
  updateLocation,
  getUserLocation,
  getActiveDeliveryLocations,
  autoMatchDelivery,
  getOrderDeliveryLocation,
  getLocationHistory,
  getOrderLocationHistory,
  toggleLocationSharing,
};
