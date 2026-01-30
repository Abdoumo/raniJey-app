import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getEstimatedDeliveryTime,
  estimateDeliveryBeforeOrder,
} from "../controllers/estimatedDeliveryController.js";

const estimatedDeliveryRouter = express.Router();

// Get estimated delivery time for an order (protected)
estimatedDeliveryRouter.get("/:orderId", authMiddleware, getEstimatedDeliveryTime);

// Estimate delivery time before placing order (public)
estimatedDeliveryRouter.post("/estimate", estimateDeliveryBeforeOrder);

export default estimatedDeliveryRouter;
