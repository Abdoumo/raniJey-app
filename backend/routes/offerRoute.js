import express from "express";
import multer from "multer";
import { createOffer, listOffers, getActiveOffers, getOffer, updateOffer, deleteOffer, toggleOfferStatus } from "../controllers/offerController.js";
import authMiddleware from "../middleware/auth.js";

const offerRouter = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Admin only routes
offerRouter.post("/create", authMiddleware, upload.single("image"), createOffer);
offerRouter.get("/list", authMiddleware, listOffers);
offerRouter.put("/:id", authMiddleware, upload.single("image"), updateOffer);
offerRouter.delete("/:id", authMiddleware, deleteOffer);
offerRouter.patch("/toggle-status/:id", authMiddleware, toggleOfferStatus);

// Public route
offerRouter.get("/active", getActiveOffers);
offerRouter.get("/:id", getOffer);

export default offerRouter;
