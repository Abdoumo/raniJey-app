import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, getNearestOrders, getAvailableOrders, getPendingOrders, acceptOrder, getOrder, markDelivered } from "../controllers/orderController.js";
import orderModel from "../models/orderModel.js";

const orderRouter = express.Router();

// Debug endpoint - shows all orders in database
orderRouter.get("/debug/all-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await orderModel.find({}).limit(100);
    const stats = {
      totalOrders: await orderModel.countDocuments(),
      paidOrders: await orderModel.countDocuments({ payment: true }),
      unpaidOrders: await orderModel.countDocuments({ payment: false }),
      unassignedOrders: await orderModel.countDocuments({ assignedDeliveryPerson: null }),
      statusBreakdown: {}
    };

    const allOrders = await orderModel.find({});
    allOrders.forEach(order => {
      const status = order.status || 'undefined';
      stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
    });

    res.json({
      success: true,
      stats,
      orders: orders.map(o => ({
        _id: o._id,
        status: o.status,
        payment: o.payment,
        assignedDeliveryPerson: o.assignedDeliveryPerson,
        deliveryLocation: o.deliveryLocation,
        amount: o.amount,
        date: o.date
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.json({ success: false, message: error.message });
  }
});

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
