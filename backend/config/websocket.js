import { Server } from "socket.io";
import locationModel from "../models/locationModel.js";
import locationHistoryModel from "../models/locationHistoryModel.js";

const setupWebSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store active user locations in memory for fast access
  const activeLocations = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins location tracking
    socket.on("join-tracking", async (userId) => {
      socket.join(`user-${userId}`);
      socket.userId = userId;
      console.log(`User ${userId} joined location tracking`);

      // Emit current location if exists
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

    // Receive location update every 3 seconds
    socket.on("update-location", async (data) => {
      try {
        const { userId, latitude, longitude, accuracy } = data;

        // Update current location
        const location = await locationModel.findOneAndUpdate(
          { userId },
          { latitude, longitude, accuracy, lastUpdated: new Date() },
          { new: true, upsert: true }
        );

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
        const orderModel = require("../models/orderModel.js").default;
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
