import userModel from "../models/userModel.js";
import fs from "fs";

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching profile" });
  }
};

// Update profile with image
const updateProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { name, email, phone, bio } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Update basic fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.json({ success: false, message: "Email already in use" });
      }
      user.email = email;
    }
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;

    // Update profile image if provided
    if (req.file) {
      // Delete old image if exists
      if (user.profileImage) {
        fs.unlink(`uploads/${user.profileImage}`, () => {});
      }
      user.profileImage = req.file.filename;
      user.profileUpdatedAt = new Date();
    }

    await user.save();
    const updatedUser = await userModel.findById(userId).select("-password");

    res.json({ success: true, message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating profile" });
  }
};

// Upload profile image only
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!req.file) {
      return res.json({ success: false, message: "No image provided" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Delete old image if exists
    if (user.profileImage) {
      fs.unlink(`uploads/${user.profileImage}`, () => {});
    }

    user.profileImage = req.file.filename;
    user.profileUpdatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Profile image updated successfully",
      imageUrl: `${process.env.API_URL || "http://localhost:4000"}/images/${req.file.filename}`,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error uploading image" });
  }
};

// Get public user profile (by userId)
const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId).select("name profileImage bio");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching profile" });
  }
};

export { getProfile, updateProfile, uploadProfileImage, getPublicProfile };
