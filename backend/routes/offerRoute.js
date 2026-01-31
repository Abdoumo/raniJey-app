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
offerRouter.post("/create", (req, res, next) => {
  console.log("🔥 POST /api/offer/create received");
  console.log("Headers:", req.headers);
  next();
}, authMiddleware, upload.single("image"), (req, res, next) => {
  console.log("📤 After auth & multer middleware");
  console.log("File:", req.file ? `${req.file.filename}` : "No file");
  console.log("Body:", req.body);
  next();
}, createOffer);
offerRouter.get("/list", authMiddleware, listOffers);
offerRouter.patch("/toggle-status/:id", authMiddleware, toggleOfferStatus);
offerRouter.put("/:id", (req, res, next) => {
  console.log("🔥 PUT /api/offer/:id received");
  next();
}, authMiddleware, upload.single("image"), (req, res, next) => {
  console.log("📤 After auth & multer middleware for update");
  console.log("File:", req.file ? `${req.file.filename}` : "No file");
  next();
}, updateOffer);
offerRouter.delete("/:id", authMiddleware, deleteOffer);

// Public route - must come last
offerRouter.get("/:id", getOffer);

export default offerRouter;
