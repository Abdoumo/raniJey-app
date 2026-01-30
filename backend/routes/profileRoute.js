import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import { getProfile, updateProfile, uploadProfileImage, getPublicProfile } from "../controllers/profileController.js";

const profileRouter = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Protected routes (require authentication)
profileRouter.get("/", authMiddleware, getProfile);
profileRouter.put("/", authMiddleware, upload.single("profileImage"), updateProfile);
profileRouter.post("/upload-image", authMiddleware, upload.single("profileImage"), uploadProfileImage);

// Public route
profileRouter.get("/:userId", getPublicProfile);

export default profileRouter;
