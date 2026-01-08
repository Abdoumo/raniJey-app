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
  pickupLocation: { latitude: Number, longitude: Number },
  deliveryLocation: { latitude: Number, longitude: Number },
  assignedAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  estimatedDeliveryTime: { type: Number, default: null },
  deliveryType: { type: String, enum: ["standard", "door-to-door"], default: "standard" },
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

const seedOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://admin:uYL1dFsEtRYYt5P1@127.0.0.1:27017/fooddelivery?authSource=admin");
    console.log("MongoDB Connected");

    // Sample user ID (use a real user ID from your database)
    const sampleUserId = "user123"; // This will be overwritten with actual user

    // Find an actual user to use as the order creator
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
    });
    const userModel = mongoose.models.user || mongoose.model("user", userSchema);
    const actualUser = await userModel.findOne({ role: { $ne: "delivery" } });

    if (!actualUser) {
      console.error("❌ No regular user found in database. Please create a user first.");
      await mongoose.connection.close();
      return;
    }

    // Sample delivery orders with location data - at delivery person's actual location
    // User location: 36.907750, 7.730318 (Algiers)
    const testOrders = [
      {
        userId: actualUser._id.toString(),
        items: [
          { _id: "food1", name: "Greek Salad", price: 12, quantity: 2, image: "food_1.png" },
          { _id: "food5", name: "Lasagna Rolls", price: 14, quantity: 1, image: "food_5.png" }
        ],
        amount: 2630,
        address: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          street: "123 Main St",
          city: "Algiers",
          state: "Algiers",
          zipcode: "16000",
          country: "Algeria",
          phone: "+213123456789"
        },
        status: "Pending",
        payment: true,
        deliveryLocation: { latitude: 36.905, longitude: 7.728 },
        deliveryType: "standard",
        date: new Date()
      },
      {
        userId: actualUser._id.toString(),
        items: [
          { _id: "food10", name: "Fruit Ice Cream", price: 22, quantity: 1, image: "food_10.png" },
          { _id: "food13", name: "Chicken Sandwich", price: 12, quantity: 1, image: "food_13.png" }
        ],
        amount: 2630,
        address: {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          street: "456 Oak Ave",
          city: "Algiers",
          state: "Algiers",
          zipcode: "16000",
          country: "Algeria",
          phone: "+213987654321"
        },
        status: "Pending",
        payment: true,
        deliveryLocation: { latitude: 36.908, longitude: 7.732 },
        deliveryType: "standard",
        date: new Date(Date.now() - 3600000)
      },
      {
        userId: actualUser._id.toString(),
        items: [
          { _id: "food25", name: "Cheese Pasta", price: 12, quantity: 2, image: "food_25.png" },
          { _id: "food9", name: "Ripple Ice Cream", price: 14, quantity: 1, image: "food_9.png" }
        ],
        amount: 2630,
        address: {
          firstName: "Ahmed",
          lastName: "Mohamed",
          email: "ahmed@example.com",
          street: "789 Elm St",
          city: "Algiers",
          state: "Algiers",
          zipcode: "16000",
          country: "Algeria",
          phone: "+213556789012"
        },
        status: "Pending",
        payment: true,
        deliveryLocation: { latitude: 36.910, longitude: 7.729 },
        deliveryType: "door-to-door",
        date: new Date(Date.now() - 7200000)
      },
      {
        userId: actualUser._id.toString(),
        items: [
          { _id: "food2", name: "Veg Salad", price: 18, quantity: 1, image: "food_2.png" },
          { _id: "food29", name: "Butter Noodles", price: 14, quantity: 1, image: "food_29.png" }
        ],
        amount: 2630,
        address: {
          firstName: "Fatima",
          lastName: "Ali",
          email: "fatima@example.com",
          street: "321 Pine Rd",
          city: "Algiers",
          state: "Algiers",
          zipcode: "16000",
          country: "Algeria",
          phone: "+213666123456"
        },
        status: "Pending",
        payment: true,
        deliveryLocation: { latitude: 36.906, longitude: 7.731 },
        deliveryType: "standard",
        date: new Date(Date.now() - 10800000)
      }
    ];

    const existingOrders = await orderModel.countDocuments();
    if (existingOrders > 0) {
      console.log(`⚠️  Database already contains ${existingOrders} orders`);
      const confirm = process.argv[2];
      if (confirm !== "--force") {
        console.log("Use 'npm run seed-orders -- --force' to replace all orders");
        await mongoose.connection.close();
        return;
      }
      await orderModel.deleteMany({});
      console.log("Cleared existing orders");
    }

    const result = await orderModel.insertMany(testOrders);
    console.log(`✅ Successfully added ${result.length} test orders to MongoDB`);
    console.log("Test orders created with:");
    result.forEach((order, index) => {
      console.log(`  Order ${index + 1}: ${order._id}`);
      console.log(`    - Customer: ${order.address.firstName} ${order.address.lastName}`);
      console.log(`    - Location: ${order.deliveryLocation.latitude}, ${order.deliveryLocation.longitude}`);
      console.log(`    - Amount: ${order.amount}`);
      console.log(`    - Status: ${order.status}`);
      console.log(`    - Payment: ${order.payment}`);
    });

    const totalOrders = await orderModel.countDocuments();
    console.log(`\n📊 Total orders in database: ${totalOrders}`);

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding orders:", error.message);
    process.exit(1);
  }
};

seedOrders();
