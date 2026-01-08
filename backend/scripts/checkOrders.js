import mongoose from "mongoose";
import "dotenv/config";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Pending" },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false },
  assignedDeliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  deliveryLocation: { latitude: Number, longitude: Number },
  deliveryType: { type: String, enum: ["standard", "door-to-door"], default: "standard" },
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

const checkOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://admin:uYL1dFsEtRYYt5P1@127.0.0.1:27017/fooddelivery?authSource=admin");
    console.log("MongoDB Connected\n");

    // Get all statistics
    const totalOrders = await orderModel.countDocuments();
    const paidOrders = await orderModel.countDocuments({ payment: true });
    const unpaidOrders = await orderModel.countDocuments({ payment: false });
    const assignedOrders = await orderModel.countDocuments({ assignedDeliveryPerson: { $ne: null } });
    const unassignedOrders = await orderModel.countDocuments({ assignedDeliveryPerson: null });

    console.log("📊 ORDER STATISTICS:");
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Paid orders (payment: true): ${paidOrders}`);
    console.log(`Unpaid orders (payment: false): ${unpaidOrders}`);
    console.log(`Assigned to delivery: ${assignedOrders}`);
    console.log(`Unassigned orders: ${unassignedOrders}`);

    // Status breakdown
    const allOrders = await orderModel.find({});
    const statusBreakdown = {};
    allOrders.forEach(order => {
      const status = order.status || 'undefined';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    console.log("\n📋 STATUS BREAKDOWN:");
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Show what delivery people would see (applies backend filters)
    const deliveryVisible = await orderModel.countDocuments({
      assignedDeliveryPerson: null,
      payment: true,
      status: { $nin: ["Delivered", "Cancelled"] },
    });

    console.log(`\n👨‍💼 VISIBLE TO DELIVERY PEOPLE: ${deliveryVisible}`);
    console.log("(Orders with: payment=true, assignedDeliveryPerson=null, status != Delivered/Cancelled)");

    if (deliveryVisible === 0 && totalOrders > 0) {
      console.log("\n⚠️  ISSUE FOUND: Orders exist but none are visible to delivery people!");
      
      // Find out why
      console.log("\nBreakdown of missing orders:");
      
      const paidButAssigned = await orderModel.countDocuments({
        payment: true,
        assignedDeliveryPerson: { $ne: null },
        status: { $nin: ["Delivered", "Cancelled"] },
      });
      if (paidButAssigned > 0) {
        console.log(`  - ${paidButAssigned} orders are paid but ALREADY ASSIGNED`);
      }

      const unpaidUnassigned = await orderModel.countDocuments({
        payment: false,
        assignedDeliveryPerson: null,
        status: { $nin: ["Delivered", "Cancelled"] },
      });
      if (unpaidUnassigned > 0) {
        console.log(`  - ${unpaidUnassigned} orders are UNPAID (payment: false)`);
      }

      const deliveredOrCancelled = await orderModel.countDocuments({
        assignedDeliveryPerson: null,
        payment: true,
        status: { $in: ["Delivered", "Cancelled"] },
      });
      if (deliveredOrCancelled > 0) {
        console.log(`  - ${deliveredOrCancelled} orders are already DELIVERED or CANCELLED`);
      }
    }

    // Show first 5 visible orders
    if (deliveryVisible > 0) {
      console.log("\n📦 SAMPLE VISIBLE ORDERS:");
      const visibleOrders = await orderModel.find({
        assignedDeliveryPerson: null,
        payment: true,
        status: { $nin: ["Delivered", "Cancelled"] },
      }).limit(5);

      visibleOrders.forEach((order, index) => {
        console.log(`\nOrder ${index + 1}:`);
        console.log(`  ID: ${order._id}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Payment: ${order.payment}`);
        console.log(`  Amount: ${order.amount}`);
        console.log(`  Location: ${order.deliveryLocation ? `${order.deliveryLocation.latitude}, ${order.deliveryLocation.longitude}` : 'No coordinates'}`);
        console.log(`  Assigned: ${order.assignedDeliveryPerson || 'Not assigned'}`);
      });
    }

    // Show first unpaid order as example
    const unpaidExample = await orderModel.findOne({ payment: false });
    if (unpaidExample) {
      console.log("\n❌ EXAMPLE UNPAID ORDER:");
      console.log(`  ID: ${unpaidExample._id}`);
      console.log(`  Status: ${unpaidExample.status}`);
      console.log(`  Payment: ${unpaidExample.payment}`);
      console.log(`  Amount: ${unpaidExample.amount}`);
      console.log(`  → This order needs payment: true to be visible`);
    }

    console.log("\n✅ Diagnostic complete");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

checkOrders();
