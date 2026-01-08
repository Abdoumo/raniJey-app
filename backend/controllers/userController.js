import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// login user

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Doesn't exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const role = normalizeRole(user.role);
    const token = createToken(user._id);
    res.json({ success: true, token, role });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Create token

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Normalize role - map livreur to delivery
const normalizeRole = (role) => {
  if (!role) return "user";
  const lowerRole = role.toLowerCase();
  if (lowerRole === "livreur") return "delivery";
  return lowerRole;
};

// Validate role
const isValidRole = (role) => {
  const validRoles = ["user", "delivery", "admin"];
  return validRoles.includes(role.toLowerCase());
};

// register user

const registerUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  console.log('Register request received:', { name, email, phone, role });
  try {
    // checking user is already exist
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter valid email" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter strong password",
      });
    }

    // Normalize and validate role
    let normalizedRole = "user";
    if (role) {
      const normalized = normalizeRole(role);
      if (!isValidRole(normalized)) {
        return res.json({ success: false, message: "Invalid role provided" });
      }
      normalizedRole = normalized;
    }

    // hashing user password
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
      phone: phone || null,
      role: normalizedRole,
    });

    const user = await newUser.save();
    console.log('User saved with phone:', user.phone);
    const token = createToken(user._id);
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { name, email } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await userModel.findOne({ email });
      if (emailExists) {
        return res.json({ success: false, message: "Email already in use" });
      }
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: "Please enter valid email" });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    const updatedUser = await userModel.findById(userId).select("-password");
    res.json({ success: true, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findByIdAndDelete(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const adminId = req.body.userId;
    const admin = await userModel.findById(adminId);

    if (!admin || admin.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const users = await userModel.find().select("-password");
    res.json({ success: true, totalUsers: users.length, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Toggle user account status (Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const adminId = req.body.userId;
    const { userId } = req.params;

    // Check if requester is admin
    const admin = await userModel.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    // Find the user to toggle
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Cannot deactivate admin account
    if (user.role === "admin") {
      return res.json({ success: false, message: "Cannot deactivate admin accounts" });
    }

    // Toggle isActive status
    user.isActive = !user.isActive;
    await user.save();

    const updatedUser = await userModel.findById(userId).select("-password");
    const action = updatedUser.isActive ? "activated" : "deactivated";
    res.json({
      success: true,
      message: `User account ${action} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Add delivery address
const addAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { label, street, city, zipCode, phone } = req.body;

    // Validate required fields
    if (!label || !street || !city || !zipCode || !phone) {
      return res.json({ success: false, message: "All address fields are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is the first address, set it as default
    const isFirstAddress = user.addresses.length === 0;

    const newAddress = {
      label,
      street,
      city,
      zipCode,
      phone,
      isDefault: isFirstAddress,
      createdAt: new Date(),
    };

    user.addresses.push(newAddress);
    await user.save();

    const updatedUser = await userModel.findById(userId).select("-password");
    res.json({ success: true, message: "Address added successfully", user: updatedUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update delivery address
const updateAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { addressId } = req.params;
    const { label, street, city, zipCode, phone, isDefault } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const address = user.addresses.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      return res.json({ success: false, message: "Address not found" });
    }

    // Update fields
    if (label) address.label = label;
    if (street) address.street = street;
    if (city) address.city = city;
    if (zipCode) address.zipCode = zipCode;
    if (phone) address.phone = phone;

    // Handle default address logic
    if (isDefault !== undefined && isDefault !== address.isDefault) {
      if (isDefault) {
        // Set all other addresses to not default
        user.addresses.forEach((addr) => {
          addr.isDefault = false;
        });
        address.isDefault = true;
      } else {
        // Cannot unset default if it's the only address
        if (user.addresses.filter((addr) => addr.isDefault).length === 1) {
          return res.json({ success: false, message: "Cannot unset the only default address" });
        }
        address.isDefault = false;
      }
    }

    await user.save();

    const updatedUser = await userModel.findById(userId).select("-password");
    res.json({ success: true, message: "Address updated successfully", user: updatedUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Delete delivery address
const deleteAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, set first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    const updatedUser = await userModel.findById(userId).select("-password");
    res.json({ success: true, message: "Address deleted successfully", user: updatedUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { loginUser, registerUser, getUserProfile, getUserById, updateUser, deleteUser, getAllUsers, toggleUserStatus, addAddress, updateAddress, deleteAddress };
