import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import fs from "fs";

// Create category (Admin only)
const createCategory = async (req, res) => {
  const { name, description } = req.body;

  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);

    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    // Check if category already exists
    const existingCategory = await categoryModel.findOne({ name });
    if (existingCategory) {
      return res.json({ success: false, message: "Category already exists" });
    }

    let image_filename = "";
    if (req.file) {
      image_filename = req.file.filename;
    }

    const category = new categoryModel({
      name,
      description,
      image: image_filename,
    });

    await category.save();
    res.json({ success: true, message: "Category created successfully", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// List all categories (Public)
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({ isActive: true });
    res.json({ success: true, totalCategories: categories.length, categories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get category by ID (Public)
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findById(id);

    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update category (Admin only)
const updateCategory = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;
    const { name, description } = req.body;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    // Check if new name is unique (if name is being changed)
    if (name && name !== category.name) {
      const existingCategory = await categoryModel.findOne({ name });
      if (existingCategory) {
        return res.json({ success: false, message: "Category name already exists" });
      }
      category.name = name;
    }

    // Update fields
    if (description) category.description = description;

    // Update image if provided
    if (req.file) {
      if (category.image) {
        fs.unlink(`uploads/${category.image}`, () => {});
      }
      category.image = req.file.filename;
    }

    await category.save();
    const updatedCategory = await categoryModel.findById(id);
    res.json({ success: true, message: "Category updated successfully", category: updatedCategory });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Delete category (Admin only)
const deleteCategory = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    // Delete image if exists
    if (category.image) {
      fs.unlink(`uploads/${category.image}`, () => {});
    }

    await categoryModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Toggle category status (Admin only)
const toggleCategoryStatus = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { id } = req.params;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    category.isActive = !category.isActive;
    await category.save();

    const action = category.isActive ? "activated" : "deactivated";
    res.json({ success: true, message: `Category ${action} successfully`, category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { createCategory, listCategories, getCategory, updateCategory, deleteCategory, toggleCategoryStatus };
