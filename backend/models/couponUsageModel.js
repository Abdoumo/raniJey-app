import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
      required: true,
    },
    couponCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    userId: {
      type: String,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      default: null,
    },
    discountApplied: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "redeemed", "failed", "cancelled"],
      default: "applied",
    },
    failureReason: {
      type: String,
      default: "",
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const couponUsageModel = mongoose.models.couponUsage || mongoose.model("couponUsage", couponUsageSchema);

export default couponUsageModel;
