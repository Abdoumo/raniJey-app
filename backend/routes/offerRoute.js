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

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.log("❌ Multer error:", err.message);
    return res.json({ success: false, message: `Upload error: ${err.message}` });
  } else if (err) {
    console.log("❌ Upload error:", err.message);
    return res.json({ success: false, message: `Upload error: ${err.message}` });
  }
  next();
};

// Public routes - must come before /:id route to prevent shadowing
offerRouter.get("/active", getActiveOffers);

// Admin only routes
offerRouter.post("/create", authMiddleware, (req, res, next) => {
  console.log("📤 File upload started, field name: 'image'");
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.log("❌ Multer error:", err.message);
      return res.json({ success: false, message: `Upload error: ${err.message}` });
    }
    console.log("📸 File received:", req.file ? `${req.file.filename}` : "No file");
    next();
  });
}, createOffer);
offerRouter.get("/list", authMiddleware, listOffers);
offerRouter.patch("/toggle-status/:id", authMiddleware, toggleOfferStatus);
offerRouter.put("/:id", authMiddleware, (req, res, next) => {
  console.log("📤 File upload started for update, field name: 'image'");
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.log("❌ Multer error:", err.message);
      return res.json({ success: false, message: `Upload error: ${err.message}` });
    }
    console.log("📸 File received:", req.file ? `${req.file.filename}` : "No file (optional for updates)");
    next();
  });
}, updateOffer);
offerRouter.delete("/:id", authMiddleware, deleteOffer);

// Public route - must come last
offerRouter.get("/:id", getOffer);

export default offerRouter;
