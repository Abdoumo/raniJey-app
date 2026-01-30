import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      enum: ["order", "promotion", "delivery", "system"],
      default: "order",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      // Can be orderId, couponId, offerId, etc.
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedType: {
      // order, coupon, offer, etc.
      type: String,
      default: null,
    },
    action: {
      // order_status_change, order_cancelled, coupon_available, etc.
      type: String,
      required: true,
    },
    actionData: {
      // Additional context (e.g., previous status, new status, reason)
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const notificationModel =
  mongoose.models.notification ||
  mongoose.model("notification", notificationSchema);

export default notificationModel;
