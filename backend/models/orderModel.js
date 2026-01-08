import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "shop", default: null },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Pending" },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false },
  assignedDeliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  pickupLocation: { latitude: Number, longitude: Number },
  deliveryLocation: { latitude: Number, longitude: Number },
  assignedAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  estimatedDeliveryTime: { type: Number, default: null },
  deliveryType: { type: String, enum: ["standard", "door-to-door"], default: "standard" },
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
