import mongoose from "mongoose";

const pricingTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    minDistance: { type: Number, required: true },
    maxDistance: { type: Number, default: null },
    unit: { type: String, enum: ["km", "m"], required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Add indexes for faster query performance
pricingTierSchema.index({ unit: 1, isActive: 1, minDistance: 1 });
pricingTierSchema.index({ unit: 1, isActive: 1, minDistance: 1, maxDistance: 1 });

const pricingModel = mongoose.models.pricing || mongoose.model("pricing", pricingTierSchema);

export default pricingModel;
