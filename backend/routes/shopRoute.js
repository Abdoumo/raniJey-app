import express from "express";
import multer from "multer";
import { createShop, listShops, getShop, updateShop, deleteShop, toggleShopStatus, updateShopDiscount, toggleShopDiscountStatus, getShopDiscount } from "../controllers/shopController.js";
import authMiddleware from "../middleware/auth.js";

const shopRouter = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Admin only routes
shopRouter.post("/create", authMiddleware, upload.single("image"), createShop);
shopRouter.put("/:id", authMiddleware, upload.single("image"), updateShop);
shopRouter.delete("/:id", authMiddleware, deleteShop);
shopRouter.patch("/toggle-status/:id", authMiddleware, toggleShopStatus);
shopRouter.put("/:id/discount", authMiddleware, updateShopDiscount);
shopRouter.patch("/:id/discount/toggle", authMiddleware, toggleShopDiscountStatus);

// Public routes
shopRouter.get("/list", listShops);
shopRouter.get("/:id/discount", getShopDiscount);
shopRouter.get("/:id", getShop);

export default shopRouter;
