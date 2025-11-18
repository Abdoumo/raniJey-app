import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, getNearestOrders, getAvailableOrders, getPendingOrders, acceptOrder, getOrder, markDelivered } from "../controllers/orderController.js";

const orderRouter = express.Router();

// Order placement and verification
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/status", authMiddleware, updateStatus);

// User order management
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", authMiddleware, listOrders);

// Delivery person order discovery and management - MUST come before /:orderId route
orderRouter.get("/nearest", authMiddleware, getNearestOrders);
orderRouter.get("/available", authMiddleware, getAvailableOrders);
orderRouter.get("/pending", authMiddleware, getPendingOrders);

// Order details - generic route goes last
orderRouter.get("/:orderId", authMiddleware, getOrder);

// Order actions
orderRouter.post("/accept", authMiddleware, acceptOrder);
orderRouter.post("/delivered", authMiddleware, markDelivered);

export default orderRouter;
