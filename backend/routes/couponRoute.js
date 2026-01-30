import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createCoupon,
  listCoupons,
  listActiveCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  applyCoupon,
  getCouponUsageHistory,
} from "../controllers/couponController.js";

const couponRouter = express.Router();

// Public routes - must come before /:id route to prevent shadowing
couponRouter.get("/active", listActiveCoupons);
couponRouter.post("/validate/:code", validateCoupon);

// Admin only routes
couponRouter.post("/create", authMiddleware, createCoupon);
couponRouter.get("/list", authMiddleware, listCoupons);
couponRouter.patch("/toggle-status/:id", authMiddleware, toggleCouponStatus);
couponRouter.put("/:id", authMiddleware, updateCoupon);
couponRouter.delete("/:id", authMiddleware, deleteCoupon);

// User routes
couponRouter.post("/apply", authMiddleware, applyCoupon);
couponRouter.get("/usage-history", authMiddleware, getCouponUsageHistory);

// Public route - must come last
couponRouter.get("/:id", getCoupon);

export default couponRouter;
