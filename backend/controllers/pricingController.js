import pricingModel from "../models/pricingModel.js";
import userModel from "../models/userModel.js";

const createPricingTier = async (req, res) => {
  const { name, minDistance, maxDistance, unit, price } = req.body;

  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);

    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    if (!name || minDistance === undefined || !unit || price === undefined) {
      return res.json({ success: false, message: "Please provide all required fields" });
    }

    if (!["km", "m"].includes(unit)) {
      return res.json({ success: false, message: "Unit must be 'km' or 'm'" });
    }

    if (minDistance < 0 || price < 0) {
      return res.json({ success: false, message: "Distance and price must be positive numbers" });
    }

    if (maxDistance !== null && maxDistance !== undefined && maxDistance <= minDistance) {
      return res.json({ success: false, message: "Max distance must be greater than min distance" });
    }

    const pricingTier = new pricingModel({
      name,
      minDistance,
      maxDistance: maxDistance || null,
      unit,
      price,
    });

    await pricingTier.save();
    res.json({ success: true, message: "Pricing tier created successfully", pricingTier });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error creating pricing tier" });
  }
};

const listPricingTiers = async (req, res) => {
  try {
    const pricingTiers = await pricingModel.find().sort({ minDistance: 1 });
    res.json({ success: true, pricingTiers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching pricing tiers" });
  }
};

const getPricingTier = async (req, res) => {
  try {
    const { id } = req.params;
    const pricingTier = await pricingModel.findById(id);

    if (!pricingTier) {
      return res.json({ success: false, message: "Pricing tier not found" });
    }

    res.json({ success: true, pricingTier });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching pricing tier" });
  }
};

const updatePricingTier = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;
    const { name, minDistance, maxDistance, unit, price } = req.body;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const pricingTier = await pricingModel.findById(id);
    if (!pricingTier) {
      return res.json({ success: false, message: "Pricing tier not found" });
    }

    if (unit && !["km", "m"].includes(unit)) {
      return res.json({ success: false, message: "Unit must be 'km' or 'm'" });
    }

    if ((minDistance !== undefined && minDistance < 0) || (price !== undefined && price < 0)) {
      return res.json({ success: false, message: "Distance and price must be positive numbers" });
    }

    if (maxDistance !== null && maxDistance !== undefined && minDistance !== undefined && maxDistance <= minDistance) {
      return res.json({ success: false, message: "Max distance must be greater than min distance" });
    }

    if (name) pricingTier.name = name;
    if (minDistance !== undefined) pricingTier.minDistance = minDistance;
    if (maxDistance !== undefined) pricingTier.maxDistance = maxDistance;
    if (unit) pricingTier.unit = unit;
    if (price !== undefined) pricingTier.price = price;

    await pricingTier.save();
    const updatedTier = await pricingModel.findById(id);
    res.json({ success: true, message: "Pricing tier updated successfully", pricingTier: updatedTier });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating pricing tier" });
  }
};

const deletePricingTier = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const pricingTier = await pricingModel.findById(id);
    if (!pricingTier) {
      return res.json({ success: false, message: "Pricing tier not found" });
    }

    await pricingModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Pricing tier deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting pricing tier" });
  }
};

const togglePricingStatus = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const pricingTier = await pricingModel.findById(id);
    if (!pricingTier) {
      return res.json({ success: false, message: "Pricing tier not found" });
    }

    pricingTier.isActive = !pricingTier.isActive;
    await pricingTier.save();

    res.json({ success: true, message: "Pricing tier status updated successfully", pricingTier });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating pricing tier status" });
  }
};

const calculateDeliveryPrice = async (req, res) => {
  try {
    const { distance, unit } = req.body;

    if (distance === undefined || !unit) {
      return res.json({ success: false, message: "Distance and unit are required" });
    }

    if (!["km", "m"].includes(unit)) {
      return res.json({ success: false, message: "Unit must be 'km' or 'm'" });
    }

    const pricingTier = await pricingModel.findOne({
      unit,
      isActive: true,
      minDistance: { $lte: distance },
      $or: [
        { maxDistance: null },
        { maxDistance: { $gte: distance } }
      ]
    }).lean();

    if (!pricingTier) {
      return res.json({ success: false, message: "No applicable pricing found for this distance" });
    }

    res.json({ success: true, price: pricingTier.price, pricingTier });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error calculating delivery price" });
  }
};

export {
  createPricingTier,
  listPricingTiers,
  getPricingTier,
  updatePricingTier,
  deletePricingTier,
  togglePricingStatus,
  calculateDeliveryPrice,
};
