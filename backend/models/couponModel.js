import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    scope: {
      type: String,
      enum: ["delivery", "shop", "product", "order"],
      default: "order",
      required: true,
    },
    scopeId: {
      type: String, // Can be shopId or productId depending on scope
      default: null,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // null = no limit
    },
    maxUsagePerUser: {
      type: Number,
      default: 1, // 1 = single use per user, > 1 = multiple uses
    },
    maxTotalUsage: {
      type: Number,
      default: null, // null = unlimited
    },
    currentUsageCount: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableUserRoles: {
      type: [String],
      default: ["user", "customer"], // Can be restricted to specific roles
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const couponModel = mongoose.models.coupon || mongoose.model("coupon", couponSchema);

export default couponModel;
