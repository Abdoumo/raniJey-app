import React, { useEffect, useState } from "react";
import "./Pricing.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Pricing = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin, isLoading } = useContext(StoreContext);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    minDistance: "",
    maxDistance: "",
    unit: "km",
    price: "",
  });
  const [togglingId, setTogglingId] = useState(null);

  const units = ["km", "m"];

  const fetchPricingTiers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/pricing/list`);
      if (response.data.success) {
        setPricingTiers(response.data.pricingTiers || []);
      } else {
        setError(response.data.message || "Failed to fetch pricing tiers");
        toast.error(response.data.message || "Error fetching pricing tiers");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error fetching pricing tiers";
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
      minDistance: "",
      maxDistance: "",
      unit: "km",
      price: "",
    });
    setEditingTierId(null);
    setShowAddForm(false);
  };

  const handleAddTier = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.minDistance === "" || formData.unit === "" || formData.price === "") {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!token) {
      toast.error("Token missing - please login again");
      return;
    }

    try {
      const requestData = {
        name: formData.name,
        minDistance: parseFloat(formData.minDistance),
        maxDistance: formData.maxDistance ? parseFloat(formData.maxDistance) : null,
        unit: formData.unit,
        price: parseFloat(formData.price),
      };

      const response = await axios.post(
        `${url}/api/pricing/create`,
        requestData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Pricing tier added successfully");
        resetForm();
        await fetchPricingTiers();
      } else {
        toast.error(response.data.message || "Error adding pricing tier");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error adding pricing tier";
      console.error("Pricing creation error:", err);
      toast.error(errorMsg);
    }
  };

  const handleEditTier = (tier) => {
    setEditingTierId(tier._id);
    setFormData({
      name: tier.name,
      minDistance: tier.minDistance,
      maxDistance: tier.maxDistance || "",
      unit: tier.unit,
      price: tier.price,
    });
    setShowAddForm(true);
  };

  const handleUpdateTier = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.minDistance === "" || formData.unit === "" || formData.price === "") {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!token) {
      toast.error("Token missing - please login again");
      return;
    }

    try {
      const requestData = {
        name: formData.name,
        minDistance: parseFloat(formData.minDistance),
        maxDistance: formData.maxDistance ? parseFloat(formData.maxDistance) : null,
        unit: formData.unit,
        price: parseFloat(formData.price),
      };

      const response = await axios.put(
        `${url}/api/pricing/${editingTierId}`,
        requestData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Pricing tier updated successfully");
        resetForm();
        await fetchPricingTiers();
      } else {
        toast.error(response.data.message || "Error updating pricing tier");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error updating pricing tier";
      console.error("Pricing update error:", err);
      toast.error(errorMsg);
    }
  };

  const handleDeleteTier = async (tierId) => {
    if (!window.confirm("Are you sure you want to delete this pricing tier?")) {
      return;
    }
    try {
      const response = await axios.delete(`${url}/api/pricing/${tierId}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Pricing tier deleted successfully");
        await fetchPricingTiers();
      } else {
        toast.error(response.data.message || "Error deleting pricing tier");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error deleting pricing tier";
      console.error("Pricing delete error:", err);
      toast.error(errorMsg);
    }
  };

  const handleToggleStatus = async (tierId) => {
    setTogglingId(tierId);
    try {
      const response = await axios.patch(
        `${url}/api/pricing/toggle-status/${tierId}`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Pricing tier status updated successfully");
        await fetchPricingTiers();
      } else {
        toast.error(response.data.message || "Error updating pricing tier status");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error updating pricing tier status";
      console.error("Pricing toggle error:", err);
      toast.error(errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }
    if (!admin) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }
    fetchPricingTiers();
  }, [admin, token, isLoading]);

  return (
    <div className="pricing add flex-col">
      <div className="pricing-header">
        <h1 className="page-title">Delivery Pricing</h1>
        <button
          className="add-tier-btn"
          onClick={() => {
            if (showAddForm && !editingTierId) {
              setShowAddForm(false);
            } else {
              resetForm();
              setShowAddForm(true);
            }
          }}
        >
          {showAddForm && !editingTierId ? "Cancel" : "+ Add Pricing Tier"}
        </button>
      </div>

      {showAddForm && (
        <div className="add-tier-form-container">
          <h2 className="form-title">
            {editingTierId ? "Edit Pricing Tier" : "Add New Pricing Tier"}
          </h2>
          <form
            onSubmit={editingTierId ? handleUpdateTier : handleAddTier}
            className="add-tier-form"
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Tier Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Short Distance, Medium Distance"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit">Unit *</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minDistance">Minimum Distance *</label>
                <input
                  type="number"
                  id="minDistance"
                  name="minDistance"
                  value={formData.minDistance}
                  onChange={handleInputChange}
                  placeholder="e.g., 0"
                  step="0.1"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxDistance">Maximum Distance (Optional)</label>
                <input
                  type="number"
                  id="maxDistance"
                  name="maxDistance"
                  value={formData.maxDistance}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  step="0.1"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (DA) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 200"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-info">
              <p>
                Set the minimum distance for this tier. If you set a maximum distance, this tier applies only to deliveries within that range.
                Leave maximum distance empty for unlimited/open-ended range.
              </p>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingTierId ? "Update Tier" : "Add Tier"}
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
          <p>Loading pricing tiers...</p>
        </div>
      ) : error ? (
        <div className="list-error">
          <p>❌ Error: {error}</p>
          <button onClick={fetchPricingTiers} className="retry-button">
            Retry
          </button>
        </div>
      ) : pricingTiers.length === 0 ? (
        <div className="list-empty">
          <p>📊 No pricing tiers found</p>
          <p className="empty-subtext">Add your first pricing tier to get started</p>
        </div>
      ) : (
        <div className="list-table">
          <div className="list-table-format title">
            <b>Tier Name</b>
            <b>Unit</b>
            <b>Distance Range</b>
            <b>Price</b>
            <b>Status</b>
            <b>Actions</b>
          </div>
          {pricingTiers.map((tier) => (
            <div key={tier._id} className="list-table-format tier-row">
              <p className="tier-name">{tier.name}</p>
              <p className="tier-unit">{tier.unit.toUpperCase()}</p>
              <p className="tier-range">
                {tier.minDistance} - {tier.maxDistance ? tier.maxDistance : "∞"}
              </p>
              <p className="tier-price">Da{tier.price.toFixed(2)}</p>
              <div className="status-cell">
                <button
                  className={`status-toggle ${tier.isActive ? "active" : "inactive"}`}
                  onClick={() => handleToggleStatus(tier._id)}
                  disabled={togglingId === tier._id}
                  title="Click to toggle status"
                >
                  {togglingId === tier._id ? (
                    <span className="status-spinner">⏳</span>
                  ) : tier.isActive ? (
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
                  onClick={() => handleEditTier(tier)}
                  title="Edit tier"
                >
                  ✏️
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteTier(tier._id)}
                  title="Delete tier"
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

export default Pricing;
