import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["restaurant", "butchers"], required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    image: { type: String, default: "" },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    isActive: { type: Boolean, default: true },
    discount: {
      discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
      discountValue: { type: Number, default: 0, min: 0 },
      minOrderAmount: { type: Number, default: 0, min: 0 },
      maxDiscountAmount: { type: Number, default: null },
      isActive: { type: Boolean, default: false },
      description: { type: String, default: "" },
      validFrom: { type: Date, default: null },
      validUntil: { type: Date, default: null },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const shopModel = mongoose.models.shop || mongoose.model("shop", shopSchema);

export default shopModel;
