import React, { useState, useEffect, useContext } from "react";
import "./Offers.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Offers = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [offers, setOffers] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    displayOrder: 0,
  });

  const fetchOffers = async () => {
    try {
      const response = await axios.get(url + "/api/offer/list", {
        headers: { token },
      });
      if (response.data.success) {
        setOffers(response.data.offers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Error fetching offers");
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }
    fetchOffers();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "displayOrder" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 Form submitted with data:", formData);
    console.log("📸 Image:", image ? `Selected (${image.name})` : "No image selected");

    if (!formData.title.trim() || !formData.description.trim()) {
      console.log("❌ Title or description is empty");
      toast.error("Title and description are required");
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description);
      submitFormData.append("displayOrder", formData.displayOrder);
      if (image) {
        submitFormData.append("image", image);
      }

      console.log("🚀 Sending request to:", url);
      console.log("🔑 Token:", token ? "✓ Present" : "❌ Missing");
      console.log("📤 Payload:", { title: formData.title, description: formData.description, displayOrder: formData.displayOrder, hasImage: !!image });

      if (editingId) {
        console.log("✏️  Updating offer:", editingId);
        const response = await axios.put(
          url + `/api/offer/${editingId}`,
          submitFormData,
          { headers: { token } }
        );
        console.log("✅ Update response:", response.data);
        if (response.data.success) {
          toast.success("Offer updated successfully");
          resetForm();
          fetchOffers();
        } else {
          toast.error(response.data.message);
        }
      } else {
        if (!image) {
          console.log("❌ No image selected");
          toast.error("Image is required for new offers");
          return;
        }
        console.log("➕ Creating new offer");
        const response = await axios.post(
          url + "/api/offer/create",
          submitFormData,
          { headers: { token } }
        );
        console.log("✅ Create response:", response.data);
        if (response.data.success) {
          toast.success("Offer created successfully");
          resetForm();
          fetchOffers();
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error("❌ Error details:", error);
      console.error("Status:", error.response?.status);
      console.error("Message:", error.response?.data?.message);
      toast.error("Error saving offer: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (offer) => {
    setEditingId(offer._id);
    setFormData({
      title: offer.title,
      description: offer.description,
      displayOrder: offer.displayOrder,
    });
    setImagePreview(`${url}/images/${offer.image}`);
    setImage(null);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) {
      return;
    }

    try {
      const response = await axios.delete(url + `/api/offer/${id}`, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Offer deleted successfully");
        fetchOffers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error deleting offer");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.patch(
        url + `/api/offer/toggle-status/${id}`,
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchOffers();
      }
    } catch (error) {
      toast.error("Error updating offer status");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      displayOrder: 0,
    });
    setImage(null);
    setImagePreview("");
  };

  return (
    <div className="offers-container">
      <h1 className="page-title">Manage Offers</h1>

      {/* Form Section */}
      <div className="offers-form-section">
        <h2>{editingId ? "Edit Offer" : "Create New Offer"}</h2>
        <form onSubmit={handleSubmit} className="offers-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Summer Sale 50% OFF"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Get 50% off on all items this summer"
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayOrder">Display Order</label>
            <input
              type="number"
              id="displayOrder"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleInputChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">
              Image {!editingId && "*"}
            </label>
            <div className="image-upload-wrapper">
              <input
                type="file"
                id="image"
                onChange={handleImageChange}
                accept="image/*"
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {editingId ? "Update Offer" : "Create Offer"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-cancel"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Offers List Section */}
      <div className="offers-list-section">
        <h2>All Offers ({offers.length})</h2>
        {offers.length > 0 ? (
          <div className="offers-grid">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className={`offer-card ${offer.isActive ? "active" : "inactive"}`}
              >
                <div className="offer-image-container">
                  {offer.image ? (
                    <img
                      src={`${url}/images/${offer.image}`}
                      alt={offer.title}
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>

                <div className="offer-content">
                  <h3>{offer.title}</h3>
                  <p className="description">{offer.description}</p>
                  <div className="offer-meta">
                    <span className="order-badge">Order: {offer.displayOrder}</span>
                    <span
                      className={`status-badge ${
                        offer.isActive ? "active-badge" : "inactive-badge"
                      }`}
                    >
                      {offer.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="offer-actions">
                  <button
                    className="btn-toggle"
                    onClick={() => handleToggleStatus(offer._id)}
                    title={offer.isActive ? "Deactivate" : "Activate"}
                  >
                    {offer.isActive ? "🔴 Deactivate" : "🟢 Activate"}
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(offer)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(offer._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-offers">
            <p>No offers yet. Create your first offer!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
