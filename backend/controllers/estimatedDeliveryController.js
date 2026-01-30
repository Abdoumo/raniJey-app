import orderModel from "../models/orderModel.js";

// Calculate haversine distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Estimate delivery time based on distance and other factors
const calculateEstimatedDeliveryTime = (distanceKm, orderCount = 1) => {
  // Base preparation time: 10 minutes
  let preparationTime = 10;

  // Travel time: assume average speed of 30 km/h in urban area
  const travelTime = Math.ceil((distanceKm / 30) * 60); // in minutes

  // Buffer for traffic and delays: 10-20 minutes
  const buffer = Math.ceil(Math.random() * 10 + 10);

  // Total estimated time
  const totalTime = preparationTime + travelTime + buffer;

  return {
    total: totalTime,
    preparation: preparationTime,
    travel: travelTime,
    buffer: buffer,
  };
};

// Get estimated delivery time for an order
const getEstimatedDeliveryTime = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if we have delivery location
    if (!order.deliveryLocation || !order.deliveryLocation.latitude) {
      return res.json({
        success: false,
        message: "Delivery location not available for this order",
      });
    }

    // Use a default shop location if not specified
    // In a real app, you'd get this from the shop associated with the order
    const shopLocation = {
      latitude: 36.737232, // Default Algiers coordinates
      longitude: 3.058756,
    };

    const distance = calculateDistance(
      shopLocation.latitude,
      shopLocation.longitude,
      order.deliveryLocation.latitude,
      order.deliveryLocation.longitude
    );

    const estimatedTime = calculateEstimatedDeliveryTime(distance, order.items?.length || 1);

    // Calculate estimated delivery time
    const currentTime = new Date();
    const estimatedDeliveryTime = new Date(currentTime.getTime() + estimatedTime.total * 60000);

    res.json({
      success: true,
      distance: Math.round(distance * 100) / 100, // km
      estimatedMinutes: estimatedTime.total,
      estimatedDeliveryTime,
      breakdown: {
        preparationTime: estimatedTime.preparation,
        travelTime: estimatedTime.travel,
        buffer: estimatedTime.buffer,
      },
    });
  } catch (error) {
    console.error("Error calculating estimated delivery time:", error);
    res.json({ success: false, message: "Error calculating delivery time" });
  }
};

// Calculate estimated delivery time before placing order
const estimateDeliveryBeforeOrder = async (req, res) => {
  try {
    const { deliveryLocation, shopLocation } = req.body;

    if (!deliveryLocation || !deliveryLocation.latitude || !deliveryLocation.longitude) {
      return res.json({
        success: false,
        message: "Delivery location is required (latitude and longitude)",
      });
    }

    if (!shopLocation || !shopLocation.latitude || !shopLocation.longitude) {
      return res.json({
        success: false,
        message: "Shop location is required (latitude and longitude)",
      });
    }

    const distance = calculateDistance(
      shopLocation.latitude,
      shopLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude
    );

    const estimatedTime = calculateEstimatedDeliveryTime(distance);

    // Calculate estimated delivery time
    const currentTime = new Date();
    const estimatedDeliveryTime = new Date(currentTime.getTime() + estimatedTime.total * 60000);

    res.json({
      success: true,
      distance: Math.round(distance * 100) / 100, // km
      estimatedMinutes: estimatedTime.total,
      estimatedDeliveryTime,
      breakdown: {
        preparationTime: estimatedTime.preparation,
        travelTime: estimatedTime.travel,
        buffer: estimatedTime.buffer,
      },
    });
  } catch (error) {
    console.error("Error estimating delivery time:", error);
    res.json({ success: false, message: "Error estimating delivery time" });
  }
};

export { getEstimatedDeliveryTime, estimateDeliveryBeforeOrder, calculateEstimatedDeliveryTime };
