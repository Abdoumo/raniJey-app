import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createPricingTier,
  listPricingTiers,
  getPricingTier,
  updatePricingTier,
  deletePricingTier,
  togglePricingStatus,
  calculateDeliveryPrice,
} from "../controllers/pricingController.js";

const pricingRouter = express.Router();

pricingRouter.post("/create", authMiddleware, createPricingTier);
pricingRouter.get("/list", listPricingTiers);
pricingRouter.get("/:id", getPricingTier);
pricingRouter.put("/:id", authMiddleware, updatePricingTier);
pricingRouter.delete("/:id", authMiddleware, deletePricingTier);
pricingRouter.patch("/toggle-status/:id", authMiddleware, togglePricingStatus);
pricingRouter.post("/calculate", calculateDeliveryPrice);

export default pricingRouter;
