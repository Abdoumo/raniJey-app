import userModel from "../models/userModel.js";

// Get all addresses for a user
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.body.userId;

    const user = await userModel.findById(userId).select("addresses");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      addresses: user.addresses || [],
      defaultAddress: user.addresses?.find((addr) => addr.isDefault) || null,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching addresses" });
  }
};

// Get single address
const getAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const address = user.addresses?.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      return res.json({ success: false, message: "Address not found" });
    }

    res.json({ success: true, address });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching address" });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { label, street, city, zipCode, phone } = req.body;

    // Validation
    if (!label || !street || !city || !zipCode || !phone) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // Create new address
    const newAddress = {
      label,
      street,
      city,
      zipCode,
      phone,
      isDefault: user.addresses.length === 0, // First address is default
      createdAt: new Date(),
    };

    user.addresses.push(newAddress);
    await user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      address: user.addresses[user.addresses.length - 1],
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding address" });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { addressId } = req.params;
    const { label, street, city, zipCode, phone } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const address = user.addresses?.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      return res.json({ success: false, message: "Address not found" });
    }

    // Update fields
    if (label) address.label = label;
    if (street) address.street = street;
    if (city) address.city = city;
    if (zipCode) address.zipCode = zipCode;
    if (phone) address.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating address" });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses?.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === undefined || addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    const deletedAddress = user.addresses[addressIndex];

    // If deleted address was default, set the first address as default
    if (deletedAddress.isDefault && user.addresses.length > 1) {
      user.addresses[0].isDefault = true;
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting address" });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { addressId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Find and unset all other default addresses
    user.addresses?.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    res.json({
      success: true,
      message: "Default address set successfully",
      defaultAddress: user.addresses.find((addr) => addr._id.toString() === addressId),
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error setting default address" });
  }
};

export {
  getUserAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
