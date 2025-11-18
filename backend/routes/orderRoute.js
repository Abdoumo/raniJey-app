import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, getNearestOrders, getAvailableOrders, getPendingOrders } from "../controllers/orderController.js";

const orderRouter = express.Router();

// Order placement and verification
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/status", authMiddleware, updateStatus);

// User order management
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", authMiddleware, listOrders);

// Delivery person order discovery
orderRouter.get("/nearest", getNearestOrders);
orderRouter.get("/available", getAvailableOrders);
orderRouter.get("/pending", getPendingOrders);

export default orderRouter;
