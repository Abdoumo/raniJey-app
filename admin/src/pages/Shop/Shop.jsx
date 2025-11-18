import React, { useEffect, useState } from "react";
import "./Shop.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import MapPicker from "../../components/MapPicker/MapPicker";

const Shop = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShopId, setEditingShopId] = useState(null);
  const [image, setImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "restaurant",
    description: "",
    address: "",
    phone: "",
    latitude: null,
    longitude: null,
  });
  const [togglingId, setTogglingId] = useState(null);

  const shopTypes = ["restaurant", "butchers"];

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/shop/list`);
      if (response.data.success) {
        setShops(response.data.data || response.data.shops || []);
      } else {
        setError(response.data.message || "Failed to fetch shops");
        toast.error(response.data.message || "Error fetching shops");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error fetching shops";
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
      type: "restaurant",
      description: "",
      address: "",
      phone: "",
      latitude: null,
      longitude: null,
    });
    setImage(false);
    setEditingShopId(null);
    setShowAddForm(false);
  };

  const handleAddShop = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.description || !formData.address || !formData.phone) {
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
        type: formData.type,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        image: imageData,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      const response = await axios.post(
        `${url}/api/shop/create`,
        requestData,
        { headers: { token, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Shop added successfully");
        resetForm();
        await fetchShops();
      } else {
        toast.error(response.data.message || "Error adding shop");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error adding shop";
      console.error("Shop creation error:", err);
      toast.error(errorMsg);
    }
  };

  const handleEditShop = (shop) => {
    setEditingShopId(shop._id);
    setFormData({
      name: shop.name,
      type: shop.type,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      latitude: shop.location?.latitude || null,
      longitude: shop.location?.longitude || null,
    });
    setImage(false);
    setShowAddForm(true);
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.description || !formData.address || !formData.phone) {
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
        type: formData.type,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        image: imageData,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      const response = await axios.put(
        `${url}/api/shop/${editingShopId}`,
        requestData,
        { headers: { token, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Shop updated successfully");
        resetForm();
        await fetchShops();
      } else {
        toast.error(response.data.message || "Error updating shop");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error updating shop";
      console.error("Shop update error:", err);
      toast.error(errorMsg);
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (!window.confirm("Are you sure you want to delete this shop?")) {
      return;
    }
    try {
      const response = await axios.delete(`${url}/api/shop/${shopId}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Shop deleted successfully");
        await fetchShops();
      } else {
        toast.error(response.data.message || "Error deleting shop");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error deleting shop";
      console.error("Shop delete error:", err.response?.data || err);
      toast.error(errorMsg);
    }
  };

  const handleToggleStatus = async (shopId) => {
    setTogglingId(shopId);
    try {
      const response = await axios.patch(
        `${url}/api/shop/toggle-status/${shopId}`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Shop status updated successfully");
        await fetchShops();
      } else {
        toast.error(response.data.message || "Error updating shop status");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error updating shop status";
      console.error("Shop toggle error:", err.response?.data || err);
      toast.error(errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }
    if (!admin) {
      toast.error("Admin access required to manage shops");
      navigate("/");
      return;
    }
    fetchShops();
  }, [admin, token]);

  return (
    <div className="shop add flex-col">
      <div className="shop-header">
        <h1 className="page-title">Shop Management</h1>
        <button
          className="add-shop-btn"
          onClick={() => {
            if (showAddForm && !editingShopId) {
              setShowAddForm(false);
            } else {
              resetForm();
              setShowAddForm(true);
            }
          }}
        >
          {showAddForm && !editingShopId ? "Cancel" : "+ Add New Shop"}
        </button>
      </div>

      {showAddForm && (
        <div className="add-shop-form-container">
          <h2 className="form-title">
            {editingShopId ? "Edit Shop" : "Add New Shop"}
          </h2>
          <form
            onSubmit={editingShopId ? handleUpdateShop : handleAddShop}
            className="add-shop-form"
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="image">Shop Image</label>
                <div className="image-upload">
                  <label htmlFor="shop-image" className="image-label">
                    <img
                      src={image ? URL.createObjectURL(image) : "📷"}
                      alt="Shop"
                      className="image-preview"
                    />
                  </label>
                  <input
                    onChange={(e) => setImage(e.target.files[0])}
                    type="file"
                    id="shop-image"
                    hidden
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Shop Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter shop name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="type">Shop Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                {shopTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter shop description"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter shop address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Shop Location</label>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationSelect={(lat, lng) => {
                  setFormData((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                  }));
                }}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingShopId ? "Update Shop" : "Add Shop"}
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
          <p>Loading shops...</p>
        </div>
      ) : error ? (
        <div className="list-error">
          <p>❌ Error: {error}</p>
          <button onClick={fetchShops} className="retry-button">
            Retry
          </button>
        </div>
      ) : shops.length === 0 ? (
        <div className="list-empty">
          <p>🏪 No shops found</p>
          <p className="empty-subtext">Add your first shop to get started</p>
        </div>
      ) : (
        <div className="list-table">
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Type</b>
            <b>Address</b>
            <b>Status</b>
            <b>Actions</b>
          </div>
          {shops.map((shop) => (
            <div key={shop._id} className="list-table-format shop-row">
              <div className="shop-image-cell">
                <img
                  src={shop.image ? `${url}/images/${shop.image}` : "🏪"}
                  alt={shop.name}
                  className="shop-image"
                />
              </div>
              <p className="shop-name">{shop.name}</p>
              <p className="shop-type">
                {shop.type.charAt(0).toUpperCase() + shop.type.slice(1)}
              </p>
              <p className="shop-address">{shop.address}</p>
              <div className="status-cell">
                <button
                  className={`status-toggle ${shop.isActive ? "active" : "inactive"}`}
                  onClick={() => handleToggleStatus(shop._id)}
                  disabled={togglingId === shop._id}
                  title="Click to toggle status"
                >
                  {togglingId === shop._id ? (
                    <span className="status-spinner">⏳</span>
                  ) : shop.isActive ? (
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
                  onClick={() => handleEditShop(shop)}
                  title="Edit shop"
                >
                  ✏️
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteShop(shop._id)}
                  title="Delete shop"
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

export default Shop;
