import offerModel from "../models/offerModel.js";
import userModel from "../models/userModel.js";
import fs from "fs";

// Create offer (Admin only)
const createOffer = async (req, res) => {
  const { title, description, displayOrder } = req.body;

  try {
    const userId = req.userId || req.body.userId;
    console.log("🔍 Creating offer - userId:", userId);
    const user = await userModel.findById(userId);
    console.log("👤 User data:", user ? { id: user._id, name: user.name, role: user.role, email: user.email } : "Not found");

    if (!user) {
      console.log("❌ User not found in database");
      return res.json({ success: false, message: "User not found" });
    }

    if (user.role !== "admin") {
      console.log(`❌ User role is '${user.role}', not 'admin'`);
      return res.json({ success: false, message: `Unauthorized: Admin access required (your role: ${user.role})` });
    }

    let image_filename = "";
    if (req.file) {
      image_filename = req.file.filename;
    }

    const offer = new offerModel({
      title,
      description,
      image: image_filename,
      displayOrder: displayOrder || 0,
    });

    await offer.save();
    res.json({ success: true, message: "Offer created successfully", offer });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error creating offer" });
  }
};

// List all offers (Admin - includes inactive)
const listOffers = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    console.log("📋 Fetching offers for userId:", userId);
    const user = await userModel.findById(userId);
    console.log("👤 User found:", user ? `${user.name} (role: ${user.role})` : "❌ User not found");

    if (!user || user.role !== "admin") {
      console.log("❌ Authorization failed - User is not admin");
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const offers = await offerModel.find().sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, totalOffers: offers.length, offers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// List active offers (Public)
const getActiveOffers = async (req, res) => {
  try {
    const offers = await offerModel.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ success: true, totalOffers: offers.length, offers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get offer by ID (Public)
const getOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await offerModel.findById(id);

    if (!offer) {
      return res.json({ success: false, message: "Offer not found" });
    }

    res.json({ success: true, offer });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update offer (Admin only)
const updateOffer = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { id } = req.params;
    const { title, description, displayOrder } = req.body;

    console.log("📝 Update offer - userId:", userId, "offerId:", id);

    const user = await userModel.findById(userId);
    console.log("👤 User found:", user ? `${user.name} (role: ${user.role})` : "❌ Not found");

    if (!user || user.role !== "admin") {
      console.log("❌ Unauthorized - not an admin");
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const offer = await offerModel.findById(id);
    console.log("📋 Offer found:", offer ? offer.title : "❌ Not found");

    if (!offer) {
      console.log("❌ Offer not found in database");
      return res.json({ success: false, message: "Offer not found" });
    }

    // Update fields
    if (title) offer.title = title;
    if (description) offer.description = description;
    if (displayOrder !== undefined) offer.displayOrder = displayOrder;

    // Update image if provided
    if (req.file) {
      console.log("📸 New image provided:", req.file.filename);
      if (offer.image) {
        fs.unlink(`uploads/${offer.image}`, () => {
          console.log("🗑️  Old image deleted");
        });
      }
      offer.image = req.file.filename;
    }

    await offer.save();
    console.log("✅ Offer saved successfully");

    const updatedOffer = await offerModel.findById(id);
    res.json({ success: true, message: "Offer updated successfully", offer: updatedOffer });
  } catch (error) {
    console.log("❌ Update error:", error.message);
    res.json({ success: false, message: "Error: " + error.message });
  }
};

// Delete offer (Admin only)
const deleteOffer = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const offer = await offerModel.findById(id);
    if (!offer) {
      return res.json({ success: false, message: "Offer not found" });
    }

    // Delete image if exists
    if (offer.image) {
      fs.unlink(`uploads/${offer.image}`, () => {});
    }

    await offerModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Toggle offer status (Admin only)
const toggleOfferStatus = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const offer = await offerModel.findById(id);
    if (!offer) {
      return res.json({ success: false, message: "Offer not found" });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    const action = offer.isActive ? "activated" : "deactivated";
    res.json({ success: true, message: `Offer ${action} successfully`, offer });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { createOffer, listOffers, getActiveOffers, getOffer, updateOffer, deleteOffer, toggleOfferStatus };
