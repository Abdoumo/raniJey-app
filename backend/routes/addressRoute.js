import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getUserAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";

const addressRouter = express.Router();

// Get all addresses (protected)
addressRouter.get("/", authMiddleware, getUserAddresses);

// Get single address (protected)
addressRouter.get("/:addressId", authMiddleware, getAddress);

// Add new address (protected)
addressRouter.post("/add", authMiddleware, addAddress);

// Update address (protected)
addressRouter.put("/:addressId", authMiddleware, updateAddress);

// Delete address (protected)
addressRouter.delete("/:addressId", authMiddleware, deleteAddress);

// Set default address (protected)
addressRouter.post("/:addressId/set-default", authMiddleware, setDefaultAddress);

export default addressRouter;
