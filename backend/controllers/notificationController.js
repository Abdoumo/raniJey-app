import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const notifications = await notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await notificationModel.countDocuments({ userId });
    const unreadCount = await notificationModel.countDocuments({
      userId,
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching notifications" });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.body.userId;

    const unreadCount = await notificationModel.countDocuments({
      userId,
      isRead: false,
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get unread notifications only
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { limit = 20 } = req.query;

    const notifications = await notificationModel
      .find({ userId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, notifications, count: notifications.length });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching unread notifications" });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.body.userId;

    if (!notificationId) {
      return res.json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const notification = await notificationModel.findById(notificationId);

    if (!notification) {
      return res.json({ success: false, message: "Notification not found" });
    }

    // Verify ownership
    if (notification.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized to update this notification",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: "Notification marked as read", notification });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error marking notification as read" });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.body.userId;

    const result = await notificationModel.updateMany(
      { userId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error marking notifications as read" });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.body.userId;

    if (!notificationId) {
      return res.json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const notification = await notificationModel.findById(notificationId);

    if (!notification) {
      return res.json({ success: false, message: "Notification not found" });
    }

    // Verify ownership
    if (notification.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized to delete this notification",
      });
    }

    await notificationModel.findByIdAndDelete(notificationId);

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting notification" });
  }
};

// Delete all notifications
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.body.userId;

    const result = await notificationModel.deleteMany({ userId });

    res.json({
      success: true,
      message: "All notifications deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting notifications" });
  }
};

// Helper function to create a notification (called from other controllers)
const createNotification = async (userId, notificationData, io = null) => {
  try {
    const notification = new notificationModel({
      userId,
      ...notificationData,
    });
    await notification.save();

    // Emit real-time notification via socket.io if io instance is provided
    if (io) {
      io.to(`user-${userId}`).emit("NOTIFICATION", {
        success: true,
        notification: notification.toObject(),
        unreadCount: await notificationModel.countDocuments({
          userId,
          isRead: false,
        }),
      });
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

export {
  getNotifications,
  getUnreadCount,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
};
