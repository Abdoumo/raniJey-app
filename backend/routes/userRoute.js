import express from "express";
import { loginUser, registerUser, getUserProfile, getUserById, updateUser, deleteUser, getAllUsers, toggleUserStatus, addAddress, updateAddress, deleteAddress } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

// Authentication routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Protected routes
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.put("/profile", authMiddleware, updateUser);
userRouter.delete("/profile", authMiddleware, deleteUser);

// Address management routes (protected)
userRouter.post("/address/add", authMiddleware, addAddress);
userRouter.put("/address/:addressId", authMiddleware, updateAddress);
userRouter.delete("/address/:addressId", authMiddleware, deleteAddress);

// Admin only routes
userRouter.get("/list/all", authMiddleware, getAllUsers);
userRouter.patch("/toggle-status/:userId", authMiddleware, toggleUserStatus);

// Public routes
userRouter.get("/:id", getUserById);

export default userRouter;
