import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

// Get all notifications (protected)
notificationRouter.get("/", authMiddleware, getNotifications);

// Get unread count (protected)
notificationRouter.get("/unread/count", authMiddleware, getUnreadCount);

// Get unread notifications only (protected)
notificationRouter.get("/unread", authMiddleware, getUnreadNotifications);

// Mark notification as read (protected)
notificationRouter.post("/mark-read", authMiddleware, markAsRead);

// Mark all notifications as read (protected)
notificationRouter.post("/mark-all-read", authMiddleware, markAllAsRead);

// Delete notification (protected)
notificationRouter.post("/delete", authMiddleware, deleteNotification);

// Delete all notifications (protected)
notificationRouter.post("/delete-all", authMiddleware, deleteAllNotifications);

export default notificationRouter;
