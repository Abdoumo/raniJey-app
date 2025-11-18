import mongoose from "mongoose";

const locationHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", default: null },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index for fast queries by userId and orderId
locationHistorySchema.index({ userId: 1, timestamp: -1 });
locationHistorySchema.index({ orderId: 1, timestamp: -1 });
locationHistorySchema.index({ timestamp: -1 });

const locationHistoryModel = mongoose.models.locationHistory || mongoose.model("locationHistory", locationHistorySchema);

export default locationHistoryModel;
