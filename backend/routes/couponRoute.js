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

// Admin only routes
couponRouter.post("/create", authMiddleware, createCoupon);
couponRouter.get("/list", authMiddleware, listCoupons);
couponRouter.put("/:id", authMiddleware, updateCoupon);
couponRouter.delete("/:id", authMiddleware, deleteCoupon);
couponRouter.patch("/toggle-status/:id", authMiddleware, toggleCouponStatus);

// User routes
couponRouter.post("/apply", authMiddleware, applyCoupon);
couponRouter.get("/usage-history", authMiddleware, getCouponUsageHistory);

// Public routes (no auth required)
couponRouter.get("/active", listActiveCoupons);
couponRouter.post("/validate/:code", validateCoupon);
couponRouter.get("/:id", getCoupon);

export default couponRouter;
