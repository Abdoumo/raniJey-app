import shopModel from "../models/shopModel.js";
import userModel from "../models/userModel.js";
import fs from "fs";

// Create shop (Admin only)
const createShop = async (req, res) => {
  const { name, type, description, address, phone, latitude, longitude } = req.body;

  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);

    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    // Validate type
    if (!["restaurant", "butchers"].includes(type)) {
      return res.json({ success: false, message: "Type must be 'restaurant' or 'butchers'" });
    }

    let image_filename = "";
    if (req.file) {
      image_filename = req.file.filename;
    }

    const shopData = {
      name,
      type,
      description,
      address,
      phone,
      image: image_filename,
    };

    if (latitude && longitude) {
      shopData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
    }

    const shop = new shopModel(shopData);
    await shop.save();
    res.json({ success: true, message: "Shop created successfully", shop });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get all shops (Public)
const listShops = async (req, res) => {
  try {
    const { type, search } = req.query;
    let filter = { isActive: true };

    if (type) {
      if (!["restaurant", "butchers"].includes(type)) {
        return res.json({ success: false, message: "Invalid shop type" });
      }
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const shops = await shopModel.find(filter);
    res.json({ success: true, totalShops: shops.length, shops });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get shop by ID (Public)
const getShop = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await shopModel.findById(id);

    if (!shop) {
      return res.json({ success: false, message: "Shop not found" });
    }

    res.json({ success: true, shop });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update shop (Admin only)
const updateShop = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;
    const { name, type, description, address, phone, latitude, longitude } = req.body;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const shop = await shopModel.findById(id);
    if (!shop) {
      return res.json({ success: false, message: "Shop not found" });
    }

    // Validate type if provided
    if (type && !["restaurant", "butchers"].includes(type)) {
      return res.json({ success: false, message: "Type must be 'restaurant' or 'butchers'" });
    }

    // Update fields
    if (name) shop.name = name;
    if (type) shop.type = type;
    if (description) shop.description = description;
    if (address) shop.address = address;
    if (phone) shop.phone = phone;

    // Update location if provided
    if (latitude && longitude) {
      shop.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
    }

    // Update image if provided
    if (req.file) {
      if (shop.image) {
        fs.unlink(`uploads/${shop.image}`, () => {});
      }
      shop.image = req.file.filename;
    }

    await shop.save();
    const updatedShop = await shopModel.findById(id);
    res.json({ success: true, message: "Shop updated successfully", shop: updatedShop });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Delete shop (Admin only)
const deleteShop = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const shop = await shopModel.findById(id);
    if (!shop) {
      return res.json({ success: false, message: "Shop not found" });
    }

    // Delete image if exists
    if (shop.image) {
      fs.unlink(`uploads/${shop.image}`, () => {});
    }

    await shopModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Shop deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Toggle shop status (Admin only)
const toggleShopStatus = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const shop = await shopModel.findById(id);
    if (!shop) {
      return res.json({ success: false, message: "Shop not found" });
    }

    shop.isActive = !shop.isActive;
    await shop.save();

    const action = shop.isActive ? "activated" : "deactivated";
    res.json({ success: true, message: `Shop ${action} successfully`, shop });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { createShop, listShops, getShop, updateShop, deleteShop, toggleShopStatus };
