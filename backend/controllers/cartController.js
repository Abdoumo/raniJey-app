import userModel from "../models/userModel.js";

// add items to user cart
const addToCart = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      return res.json({ success: false, message: "User ID is required" });
    }

    let userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};
    const itemId = req.body.itemId;
    const notes = req.body.notes || "";

    if (!cartData[itemId]) {
      // New item - create with new structure
      cartData[itemId] = { quantity: 1, notes: notes };
    } else {
      // Item exists - handle both old and new formats
      if (typeof cartData[itemId] === "number") {
        // Old format: convert to new format
        cartData[itemId] = { quantity: cartData[itemId] + 1, notes: notes };
      } else {
        // New format: increment quantity, update notes
        cartData[itemId].quantity += 1;
        cartData[itemId].notes = notes;
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Added to Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      return res.json({ success: false, message: "User ID is required" });
    }

    let userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};
    const itemId = req.body.itemId;

    if (cartData[itemId]) {
      let currentQuantity = 1;

      // Handle both old and new formats
      if (typeof cartData[itemId] === "number") {
        currentQuantity = cartData[itemId];
      } else if (typeof cartData[itemId] === "object" && cartData[itemId].quantity) {
        currentQuantity = cartData[itemId].quantity;
      }

      if (currentQuantity > 1) {
        // Decrement quantity while preserving notes
        if (typeof cartData[itemId] === "object") {
          cartData[itemId].quantity -= 1;
        } else {
          cartData[itemId] -= 1;
        }
      } else {
        // Remove item completely
        delete cartData[itemId];
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Removed from Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// fetch user cart data
const getCart = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      return res.json({ success: false, message: "User ID is required" });
    }

    let userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};

    // Normalize cart data to ensure new format
    const normalizedCartData = {};
    for (const itemId in cartData) {
      if (typeof cartData[itemId] === "number") {
        // Old format: convert to new format
        normalizedCartData[itemId] = { quantity: cartData[itemId], notes: "" };
      } else {
        // Already in new format
        normalizedCartData[itemId] = cartData[itemId];
      }
    }

    res.json({ success: true, cartData: normalizedCartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addToCart, removeFromCart, getCart };
