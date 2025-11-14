import express from "express";
import multer from "multer";
import { createCategory, listCategories, getCategory, updateCategory, deleteCategory, toggleCategoryStatus } from "../controllers/categoryController.js";
import authMiddleware from "../middleware/auth.js";

const categoryRouter = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Admin only routes
categoryRouter.post("/create", authMiddleware, upload.single("image"), createCategory);
categoryRouter.put("/:id", authMiddleware, upload.single("image"), updateCategory);
categoryRouter.delete("/:id", authMiddleware, deleteCategory);
categoryRouter.patch("/toggle-status/:id", authMiddleware, toggleCategoryStatus);

// Public routes
categoryRouter.get("/list", listCategories);
categoryRouter.get("/:id", getCategory);

export default categoryRouter;
