import React, { useEffect, useState } from "react";
import "./Category.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Category = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [image, setImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [togglingId, setTogglingId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/category/list`);
      if (response.data.success) {
        setCategories(response.data.data || response.data.categories || []);
      } else {
        setError(response.data.message || "Failed to fetch categories");
        toast.error(response.data.message || "Error fetching categories");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error fetching categories";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setImage(false);
    setEditingCategoryId(null);
    setShowAddForm(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!token) {
      toast.error("Token missing - please login again");
      return;
    }

    try {
      let imageData = null;
      if (image) {
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(image);
        });
      }

      const requestData = {
        name: formData.name,
        description: formData.description,
        image: imageData
      };

      const response = await axios.post(
        `${url}/api/category/create`,
        requestData,
        { headers: { token, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Category added successfully");
        resetForm();
        await fetchCategories();
      } else {
        toast.error(response.data.message || "Error adding category");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error adding category";
      console.error("Category creation error:", err);
      toast.error(errorMsg);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setImage(false);
    setShowAddForm(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!token) {
      toast.error("Token missing - please login again");
      return;
    }

    try {
      let imageData = null;
      if (image) {
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(image);
        });
      }

      const requestData = {
        name: formData.name,
        description: formData.description,
        image: imageData
      };

      const response = await axios.put(
        `${url}/api/category/${editingCategoryId}`,
        requestData,
        { headers: { token, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Category updated successfully");
        resetForm();
        await fetchCategories();
      } else {
        toast.error(response.data.message || "Error updating category");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error updating category";
      console.error("Category update error:", err);
      toast.error(errorMsg);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }
    try {
      const response = await axios.delete(`${url}/api/category/${categoryId}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Category deleted successfully");
        await fetchCategories();
      } else {
        toast.error(response.data.message || "Error deleting category");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error deleting category";
      toast.error(errorMsg);
    }
  };

  const handleToggleStatus = async (categoryId) => {
    setTogglingId(categoryId);
    try {
      const response = await axios.patch(
        `${url}/api/category/toggle-status/${categoryId}`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Category status updated successfully");
        await fetchCategories();
      } else {
        toast.error(response.data.message || "Error updating category status");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error updating category status";
      toast.error(errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }
    fetchCategories();
  }, []);

  return (
    <div className="category add flex-col">
      <div className="category-header">
        <h1 className="page-title">Category Management</h1>
        <button
          className="add-category-btn"
          onClick={() => {
            if (showAddForm && !editingCategoryId) {
              setShowAddForm(false);
            } else {
              resetForm();
              setShowAddForm(true);
            }
          }}
        >
          {showAddForm && !editingCategoryId ? "Cancel" : "+ Add New Category"}
        </button>
      </div>

      {showAddForm && (
        <div className="add-category-form-container">
          <h2 className="form-title">
            {editingCategoryId ? "Edit Category" : "Add New Category"}
          </h2>
          <form
            onSubmit={editingCategoryId ? handleUpdateCategory : handleAddCategory}
            className="add-category-form"
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="image">Category Image</label>
                <div className="image-upload">
                  <label htmlFor="category-image" className="image-label">
                    <img
                      src={image ? URL.createObjectURL(image) : "🏷️"}
                      alt="Category"
                      className="image-preview"
                    />
                  </label>
                  <input
                    onChange={(e) => setImage(e.target.files[0])}
                    type="file"
                    id="category-image"
                    hidden
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Category Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter category description"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingCategoryId ? "Update Category" : "Add Category"}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="list-loading">
          <p>Loading categories...</p>
        </div>
      ) : error ? (
        <div className="list-error">
          <p>❌ Error: {error}</p>
          <button onClick={fetchCategories} className="retry-button">
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="list-empty">
          <p>📂 No categories found</p>
          <p className="empty-subtext">Add your first category to get started</p>
        </div>
      ) : (
        <div className="list-table">
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Description</b>
            <b>Status</b>
            <b>Actions</b>
          </div>
          {categories.map((category) => (
            <div key={category._id} className="list-table-format category-row">
              <div className="category-image-cell">
                <img
                  src={category.image ? `${url}/images/${category.image}` : "📂"}
                  alt={category.name}
                  className="category-image"
                />
              </div>
              <p className="category-name">{category.name}</p>
              <p className="category-description">{category.description}</p>
              <div className="status-cell">
                <button
                  className={`status-toggle ${category.isActive ? "active" : "inactive"}`}
                  onClick={() => handleToggleStatus(category._id)}
                  disabled={togglingId === category._id}
                  title="Click to toggle status"
                >
                  {togglingId === category._id ? (
                    <span className="status-spinner">⏳</span>
                  ) : category.isActive ? (
                    <>
                      <span className="status-indicator active-indicator">●</span>
                      Active
                    </>
                  ) : (
                    <>
                      <span className="status-indicator inactive-indicator">●</span>
                      Inactive
                    </>
                  )}
                </button>
              </div>
              <div className="action-buttons">
                <button
                  className="edit-btn"
                  onClick={() => handleEditCategory(category)}
                  title="Edit category"
                >
                  ✏️
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteCategory(category._id)}
                  title="Delete category"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Category;
