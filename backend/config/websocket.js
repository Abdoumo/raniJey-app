import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
  // Store user subscriptions to orders
  const orderSubscriptions = new Map();

  // Middleware for authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
      const role = socket.handshake.auth?.role || socket.handshake.query?.role || "user";

      if (!token || !userId) {
        return next(new Error("Authentication required"));
      }

      // Validate userId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid user ID format"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        socket.userId = userId;
        socket.userRole = role;
        socket.token = token;
        socket.decoded = decoded;
        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected (${socket.userRole})`);

    // Handle LOCATION_UPDATE message
    socket.on("LOCATION_UPDATE", async (data) => {
      try {
        const { latitude, longitude, accuracy } = data;
        const userId = socket.userId;

        if (!latitude || !longitude) {
          socket.emit("error", { message: "Latitude and longitude required" });
          return;
        }

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          console.error(`Invalid userId format in LOCATION_UPDATE: ${userId}`);
          socket.emit("error", { message: "Invalid user ID" });
          return;
        }

        // Update current location in database
        const location = await locationModel.findOneAndUpdate(
          { userId },
          {
            latitude,
            longitude,
            accuracy,
            lastUpdated: new Date()
          },
          { new: true, upsert: true }
        );

        // Update lastKnownLocation in user model
        await userModel.findByIdAndUpdate(userId, {
          lastKnownLocation: {
            latitude,
            longitude,
            accuracy,
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
          timestamp: new Date().toISOString(),
        });

        // Broadcast location to all users tracking this user's location
        io.to(`user-${userId}`).emit("LOCATION_UPDATE", {
          userId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        });

        // If user has active order, broadcast to order subscribers
        const activeOrder = await orderModel.findOne({
          assignedDeliveryPerson: new mongoose.Types.ObjectId(userId),
          status: { $nin: ["Delivered", "Cancelled"] },
        });

        if (activeOrder) {
          // Save location history for this order
          await locationHistoryModel.create({
            userId,
            orderId: activeOrder._id,
            latitude,
            longitude,
            accuracy,
          });

          // Broadcast to order subscribers
          io.to(`order-${activeOrder._id}`).emit("LOCATION_UPDATE", {
            orderId: activeOrder._id,
            userId,
            deliveryPersonId: userId,
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString(),
          });

          // Also send ORDER_UPDATE with delivery person location
          io.to(`order-${activeOrder._id}`).emit("ORDER_UPDATE", {
            orderId: activeOrder._id,
            status: activeOrder.status,
            deliveryPersonId: userId,
            deliveryPersonLocation: {
              latitude,
              longitude,
              accuracy,
              timestamp: new Date().toISOString(),
            },
          });
        }

        console.log(`Location updated for user ${userId}`);
      } catch (error) {
        console.error("Error updating location:", error.message || error);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    // Handle SUBSCRIBE_ORDER message
    socket.on("SUBSCRIBE_ORDER", async (data) => {
      try {
        const { orderId } = data;
        const userId = socket.userId;

        // Verify user has access to this order
        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        // Check authorization: customer, assigned delivery person, or admin
        const isCustomer = order.userId === userId;
        const isDeliveryPerson = order.assignedDeliveryPerson?.toString() === userId;
        const isAdmin = socket.userRole === "admin";

        if (!isCustomer && !isDeliveryPerson && !isAdmin) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        // Add socket to order room
        socket.join(`order-${orderId}`);
        console.log(`User ${userId} subscribed to order ${orderId}`);

        // Track subscriptions
        if (!orderSubscriptions.has(orderId)) {
          orderSubscriptions.set(orderId, new Set());
        }
        orderSubscriptions.get(orderId).add(socket.id);

        // Send current order details
        const deliveryLocation = activeLocations.get(order.assignedDeliveryPerson?.toString());
        socket.emit("ORDER_UPDATE", {
          orderId,
          status: order.status,
          assignedDeliveryPerson: order.assignedDeliveryPerson,
          deliveryPersonLocation: deliveryLocation || null,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
        });
      } catch (error) {
        console.error("Error subscribing to order:", error);
        socket.emit("error", { message: "Failed to subscribe to order" });
      }
    });

    // Handle UNSUBSCRIBE_ORDER message
    socket.on("UNSUBSCRIBE_ORDER", async (data) => {
      try {
        const { orderId } = data;
        const userId = socket.userId;

        socket.leave(`order-${orderId}`);
        console.log(`User ${userId} unsubscribed from order ${orderId}`);

        // Remove from subscriptions tracking
        if (orderSubscriptions.has(orderId)) {
          orderSubscriptions.get(orderId).delete(socket.id);
        }
      } catch (error) {
        console.error("Error unsubscribing from order:", error);
        socket.emit("error", { message: "Failed to unsubscribe from order" });
      }
    });

    // Handle ACCEPT_ORDER message
    socket.on("ACCEPT_ORDER", async (data) => {
      try {
        const { orderId } = data;
        const userId = socket.userId;

        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        // Update order
        order.assignedDeliveryPerson = userId;
        order.acceptedAt = new Date();
        order.status = "Confirmed";
        await order.save();

        // Track active delivery
        activeDeliveries.set(orderId, {
          orderId,
          deliveryPerson: userId,
          acceptedAt: order.acceptedAt,
        });

        // Broadcast to all subscribers
        io.to(`order-${orderId}`).emit("ORDER_UPDATE", {
          orderId,
          status: "Confirmed",
          deliveryPersonId: userId,
          acceptedAt: order.acceptedAt,
        });

        socket.emit("success", { message: "Order accepted successfully" });
        console.log(`Order ${orderId} accepted by ${userId}`);
      } catch (error) {
        console.error("Error accepting order:", error);
        socket.emit("error", { message: "Failed to accept order" });
      }
    });

    // Handle START_DELIVERY message
    socket.on("START_DELIVERY", async (data) => {
      try {
        const { orderId } = data;
        const userId = socket.userId;

        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        if (order.assignedDeliveryPerson?.toString() !== userId) {
          socket.emit("error", { message: "Order not assigned to you" });
          return;
        }

        // Update order
        order.startedAt = new Date();
        order.status = "Out for Delivery";
        await order.save();

        // Track active delivery
        activeDeliveries.set(orderId, {
          orderId,
          deliveryPerson: userId,
          startedAt: order.startedAt,
        });

        // Broadcast to all subscribers
        io.to(`order-${orderId}`).emit("ORDER_UPDATE", {
          orderId,
          status: "Out for Delivery",
          deliveryPersonId: userId,
          startedAt: order.startedAt,
        });

        socket.emit("success", { message: "Delivery started" });
        console.log(`Delivery started for order ${orderId}`);
      } catch (error) {
        console.error("Error starting delivery:", error);
        socket.emit("error", { message: "Failed to start delivery" });
      }
    });

    // Handle COMPLETE_DELIVERY message
    socket.on("COMPLETE_DELIVERY", async (data) => {
      try {
        const { orderId, notes } = data;
        const userId = socket.userId;

        const order = await orderModel.findById(orderId);
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        if (order.assignedDeliveryPerson?.toString() !== userId) {
          socket.emit("error", { message: "Order not assigned to you" });
          return;
        }

        // Update order
        order.deliveredAt = new Date();
        order.status = "Delivered";
        if (notes) {
          order.notes = notes;
        }
        await order.save();

        // Remove from active deliveries
        activeDeliveries.delete(orderId);

        // Broadcast to all subscribers
        io.to(`order-${orderId}`).emit("ORDER_UPDATE", {
          orderId,
          status: "Delivered",
          deliveryPersonId: userId,
          deliveredAt: order.deliveredAt,
        });

        socket.emit("success", { message: "Order delivered" });
        console.log(`Delivery completed for order ${orderId}`);
      } catch (error) {
        console.error("Error completing delivery:", error);
        socket.emit("error", { message: "Failed to complete delivery" });
      }
    });

    // Handle PING/PONG keep-alive
    socket.on("PING", () => {
      socket.emit("PONG", { timestamp: new Date().toISOString() });
    });

    // Legacy support: join-tracking event
    socket.on("join-tracking", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User joined tracking room: user-${userId}`);
    });

    // Legacy support: join-order-tracking event
    socket.on("join-order-tracking", (orderId) => {
      socket.join(`order-${orderId}`);
      console.log(`User joined order tracking room: order-${orderId}`);
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
        callback({ success: false, message: "Error fetching deliveries" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
      if (socket.userId) {
        activeLocations.delete(socket.userId);
      }
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  return io;
};

export default setupWebSocket;
