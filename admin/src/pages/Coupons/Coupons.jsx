import React, { useContext, useEffect, useState } from "react";
import "./Coupons.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const Coupons = () => {
  const { url, token } = useContext(StoreContext);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    scope: "order",
    scopeId: "",
    minOrderAmount: 0,
    maxDiscountAmount: "",
    maxUsagePerUser: 1,
    maxTotalUsage: "",
    validFrom: "",
    validUntil: "",
  });

  // Fetch all coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(url + "/api/coupon/list", {
        headers: { token },
      });

      if (response.data.success) {
        setCoupons(response.data.coupons);
      } else {
        toast.error(response.data.message || "Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Error fetching coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCoupons();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (!formData.validFrom || !formData.validUntil) {
      toast.error("Valid from and until dates are required");
      return;
    }

    if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      toast.error("Valid from date must be before valid until date");
      return;
    }

    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        maxUsagePerUser: parseInt(formData.maxUsagePerUser),
        maxTotalUsage: formData.maxTotalUsage ? parseInt(formData.maxTotalUsage) : null,
      };

      let response;
      if (editingId) {
        response = await axios.put(url + `/api/coupon/${editingId}`, payload, {
          headers: { token },
        });
      } else {
        response = await axios.post(url + "/api/coupon/create", payload, {
          headers: { token },
        });
      }

      if (response.data.success) {
        toast.success(editingId ? "Coupon updated successfully" : "Coupon created successfully");
        resetForm();
        fetchCoupons();
      } else {
        toast.error(response.data.message || "Error saving coupon");
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error(error.response?.data?.message || "Error saving coupon");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const response = await axios.delete(url + `/api/coupon/${id}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error(response.data.message || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Error deleting coupon");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.patch(
        url + `/api/coupon/toggle-status/${id}`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(`Coupon ${response.data.coupon.isActive ? "activated" : "deactivated"}`);
        fetchCoupons();
      } else {
        toast.error(response.data.message || "Failed to toggle status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Error toggling status");
    }
  };

  const handleEditCoupon = (coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      scope: coupon.scope,
      scopeId: coupon.scopeId || "",
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      maxUsagePerUser: coupon.maxUsagePerUser || 1,
      maxTotalUsage: coupon.maxTotalUsage || "",
      validFrom: coupon.validFrom.split("T")[0],
      validUntil: coupon.validUntil.split("T")[0],
    });
    setEditingId(coupon._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      scope: "order",
      scopeId: "",
      minOrderAmount: 0,
      maxDiscountAmount: "",
      maxUsagePerUser: 1,
      maxTotalUsage: "",
      validFrom: "",
      validUntil: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="coupons-container">
      <div className="coupons-header">
        <h1>Manage Coupons</h1>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Coupon"}
        </button>
      </div>

      {showForm && (
        <div className="coupon-form-container">
          <h2>{editingId ? "Edit Coupon" : "Create New Coupon"}</h2>
          <form onSubmit={handleCreateCoupon} className="coupon-form">
            <div className="form-row">
              <div className="form-group">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SUMMER50"
                  disabled={!!editingId}
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount Type *</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (DA)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Discount Value *</label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer sale 50% off"
                />
              </div>

              <div className="form-group">
                <label>Scope</label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                >
                  <option value="order">Order</option>
                  <option value="shop">Shop</option>
                  <option value="delivery">Delivery</option>
                  <option value="product">Product</option>
                </select>
              </div>

              {formData.scope !== "order" && (
                <div className="form-group">
                  <label>Scope ID</label>
                  <input
                    type="text"
                    name="scopeId"
                    value={formData.scopeId}
                    onChange={handleInputChange}
                    placeholder="e.g., shop or product ID"
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Min Order Amount (DA)</label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Max Discount Amount (DA)</label>
                <input
                  type="number"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="form-group">
                <label>Max Usage Per User</label>
                <input
                  type="number"
                  name="maxUsagePerUser"
                  value={formData.maxUsagePerUser}
                  onChange={handleInputChange}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max Total Usage</label>
                <input
                  type="number"
                  name="maxTotalUsage"
                  value={formData.maxTotalUsage}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="form-group">
                <label>Valid From *</label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Valid Until *</label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? "Update Coupon" : "Create Coupon"}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="coupons-list">
        {loading ? (
          <p>Loading coupons...</p>
        ) : coupons.length > 0 ? (
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Valid From</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id} className={!coupon.isActive ? "inactive" : ""}>
                  <td className="code-cell">{coupon.code}</td>
                  <td>{coupon.description || "-"}</td>
                  <td>
                    {coupon.discountValue}
                    {coupon.discountType === "percentage" ? "%" : " DA"}
                  </td>
                  <td>DA {coupon.minOrderAmount || 0}</td>
                  <td>
                    {coupon.currentUsageCount}
                    {coupon.maxTotalUsage ? `/${coupon.maxTotalUsage}` : "/∞"}
                  </td>
                  <td>{formatDate(coupon.validFrom)}</td>
                  <td>{formatDate(coupon.validUntil)}</td>
                  <td>
                    <span className={`status-badge ${coupon.isActive ? "active" : "inactive"}`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-toggle"
                      onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                      title={coupon.isActive ? "Deactivate" : "Activate"}
                    >
                      {coupon.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEditCoupon(coupon)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteCoupon(coupon._id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-coupons">
            <p>No coupons found. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
