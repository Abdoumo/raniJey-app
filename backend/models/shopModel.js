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
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const shopModel = mongoose.models.shop || mongoose.model("shop", shopSchema);

export default shopModel;
