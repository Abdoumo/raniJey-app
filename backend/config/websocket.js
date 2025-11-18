import { Server } from "socket.io";
import locationModel from "../models/locationModel.js";
import locationHistoryModel from "../models/locationHistoryModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const setupWebSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store active user locations in memory for fast access
  const activeLocations = new Map();
  // Track delivery person to order mappings
  const activeDeliveries = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins location tracking
    socket.on("join-tracking", async (userId) => {
      socket.join(`user-${userId}`);
      socket.userId = userId;
      console.log(`User ${userId} joined location tracking`);

      try {
        const location = await locationModel.findOne({ userId });
        if (location) {
          socket.emit("current-location", location);
        }
      } catch (error) {
        console.log("Error fetching current location:", error);
      }
    });

    // Join order tracking room
    socket.on("join-order-tracking", (orderId) => {
      socket.join(`order-${orderId}`);
      console.log(`User joined order ${orderId} tracking`);
    });

    // Handle LOCATION_UPDATE message
    socket.on("LOCATION_UPDATE", async (data) => {
      try {
        const { userId, latitude, longitude, accuracy } = data;

        if (!latitude || !longitude) {
          socket.emit("error", { message: "Latitude and longitude required" });
          return;
        }

        // Update current location in database
        const location = await locationModel.findOneAndUpdate(
          { userId },
          { latitude, longitude, accuracy, lastUpdated: new Date() },
          { new: true, upsert: true }
        );

        // Update lastKnownLocation in user model
        await userModel.findByIdAndUpdate(userId, {
          lastKnownLocation: {
            latitude,
            longitude,
            lastUpdated: new Date(),
          },
        });

        // Save to history
        await locationHistoryModel.create({
          userId,
          latitude,
          longitude,
          accuracy,
        });

        // Store in memory for fast access
        activeLocations.set(userId, {
          userId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
        });

        // Broadcast to all users tracking this user
        io.to(`user-${userId}`).emit("location-updated", location);

        // If user has active order, broadcast to order room
        const activeOrder = await orderModel.findOne({
          assignedDeliveryPerson: userId,
          status: { $nin: ["Delivered", "Cancelled"] },
        });

        if (activeOrder) {
          await locationHistoryModel.create({
            userId,
            orderId: activeOrder._id,
            latitude,
            longitude,
            accuracy,
          });

          io.to(`order-${activeOrder._id}`).emit("delivery-location-updated", {
            location,
            orderId: activeOrder._id,
            deliveryPerson: userId,
          });
        }

        console.log(`Location updated for user ${userId}`);
      } catch (error) {
        console.log("Error updating location:", error);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    // Handle SUBSCRIBE_ORDER message - subscribe to order updates
    socket.on("SUBSCRIBE_ORDER", async (data) => {
      try {
        const { orderId, userId } = data;

        // Verify user has access to this order
        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        const user = await userModel.findById(userId);
        if (order.userId !== userId && user.role !== "admin") {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        socket.join(`order-${orderId}`);
        console.log(`User ${userId} subscribed to order ${orderId}`);

        // Send current order details
        socket.emit("order-details", {
          orderId,
          status: order.status,
          assignedDeliveryPerson: order.assignedDeliveryPerson,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
        });
      } catch (error) {
        console.log("Error subscribing to order:", error);
        socket.emit("error", { message: "Failed to subscribe to order" });
      }
    });

    // Handle ACCEPT_ORDER message - delivery person accepts order
    socket.on("ACCEPT_ORDER", async (data) => {
      try {
        const { orderId, userId } = data;

        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        if (order.assignedDeliveryPerson.toString() !== userId) {
          socket.emit("error", { message: "Order not assigned to you" });
          return;
        }

        // Update order status
        order.acceptedAt = new Date();
        await order.save();

        // Broadcast to all subscribers of this order
        io.to(`order-${orderId}`).emit("order-accepted", {
          orderId,
          acceptedAt: order.acceptedAt,
          deliveryPerson: userId,
        });

        console.log(`Order ${orderId} accepted by ${userId}`);
      } catch (error) {
        console.log("Error accepting order:", error);
        socket.emit("error", { message: "Failed to accept order" });
      }
    });

    // Handle START_DELIVERY message - delivery person starts delivering
    socket.on("START_DELIVERY", async (data) => {
      try {
        const { orderId, userId } = data;

        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        if (order.assignedDeliveryPerson.toString() !== userId) {
          socket.emit("error", { message: "Order not assigned to you" });
          return;
        }

        // Update order status
        order.startedAt = new Date();
        order.status = "Out for Delivery";
        await order.save();

        // Track active delivery
        activeDeliveries.set(orderId, {
          orderId,
          deliveryPerson: userId,
          startedAt: order.startedAt,
        });

        // Broadcast to all subscribers of this order
        io.to(`order-${orderId}`).emit("delivery-started", {
          orderId,
          startedAt: order.startedAt,
          deliveryPerson: userId,
        });

        console.log(`Delivery started for order ${orderId} by ${userId}`);
      } catch (error) {
        console.log("Error starting delivery:", error);
        socket.emit("error", { message: "Failed to start delivery" });
      }
    });

    // Handle COMPLETE_DELIVERY message - delivery person completes delivery
    socket.on("COMPLETE_DELIVERY", async (data) => {
      try {
        const { orderId, userId } = data;

        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        if (order.assignedDeliveryPerson.toString() !== userId) {
          socket.emit("error", { message: "Order not assigned to you" });
          return;
        }

        // Update order status
        order.deliveredAt = new Date();
        order.status = "Delivered";
        await order.save();

        // Remove from active deliveries
        activeDeliveries.delete(orderId);

        // Broadcast to all subscribers of this order
        io.to(`order-${orderId}`).emit("delivery-completed", {
          orderId,
          deliveredAt: order.deliveredAt,
          deliveryPerson: userId,
        });

        console.log(`Delivery completed for order ${orderId} by ${userId}`);
      } catch (error) {
        console.log("Error completing delivery:", error);
        socket.emit("error", { message: "Failed to complete delivery" });
      }
    });

    // Legacy support: update-location event
    socket.on("update-location", async (data) => {
      socket.emit("LOCATION_UPDATE", data);
    });

    // Get active delivery locations
    socket.on("get-active-deliveries", (callback) => {
      try {
        const deliveries = Array.from(activeLocations.values());
        callback({ success: true, deliveries });
      } catch (error) {
        callback({ success: false, message: "Error" });
      }
    });

    // User disconnects
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (socket.userId) {
        activeLocations.delete(socket.userId);
      }
    });

    // Error handling
    socket.on("error", (error) => {
      console.log("Socket error:", error);
    });
  });

  return io;
};

export default setupWebSocket;
