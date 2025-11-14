import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for fast queries
locationSchema.index({ userId: 1 });
locationSchema.index({ isActive: 1 });

const locationModel = mongoose.models.location || mongoose.model("location", locationSchema);

export default locationModel;
