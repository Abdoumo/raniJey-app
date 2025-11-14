import express from "express";
import {
  updateLocation,
  getUserLocation,
  getActiveDeliveryLocations,
  autoMatchDelivery,
  getOrderDeliveryLocation,
  getLocationHistory,
  getOrderLocationHistory,
  toggleLocationSharing,
} from "../controllers/locationController.js";
import authMiddleware from "../middleware/auth.js";

const locationRouter = express.Router();

// Update user location
locationRouter.post("/update", authMiddleware, updateLocation);

// Get user location
locationRouter.get("/user/:targetUserId", authMiddleware, getUserLocation);

// Get all active delivery locations (Admin only)
locationRouter.get("/delivery/active/list", authMiddleware, getActiveDeliveryLocations);

// Auto-match delivery person to order (Admin only)
locationRouter.post("/match/:orderId", authMiddleware, autoMatchDelivery);

// Get delivery location for an order (Customer)
locationRouter.get("/order/:orderId", authMiddleware, getOrderDeliveryLocation);

// Get location history (Admin only)
locationRouter.get("/history/:targetUserId", authMiddleware, getLocationHistory);

// Get location history for an order
locationRouter.get("/order-history/:orderId", authMiddleware, getOrderLocationHistory);

// Toggle location sharing
locationRouter.patch("/sharing/toggle", authMiddleware, toggleLocationSharing);

export default locationRouter;
