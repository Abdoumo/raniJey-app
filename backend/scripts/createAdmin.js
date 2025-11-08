import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    cartData: { type: Object, default: {} },
  },
  { minimize: false }
);

const userModel = mongoose.model.user || mongoose.model("user", userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const adminEmail = "admin@RaniJay.com";
    const adminPassword = "RaniJay12345687";
    const adminName = "Admin User";

    const exists = await userModel.findOne({ email: adminEmail });
    if (exists) {
      console.log("Admin user already exists");
      const userCount = await userModel.countDocuments();
      console.log(`Total users in database: ${userCount}`);
      await mongoose.connection.close();
      return;
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = new userModel({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    const user = await adminUser.save();
    console.log("✅ Admin account created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`User ID: ${user._id}`);

    const userCount = await userModel.countDocuments();
    console.log(`\nTotal users in database: ${userCount}`);

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error creating admin account:", error.message);
    process.exit(1);
  }
};

createAdmin();
