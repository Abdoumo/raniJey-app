import React, { useState, useEffect, useContext } from "react";
import "./ShopDiscounts.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const ShopDiscounts = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingShopId, setEditingShopId] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    discountType: "percentage",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    description: "",
    validFrom: "",
    validUntil: "",
  });

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await axios.get(url + "/api/shop/list");
      if (response.data.success) {
        setShops(response.data.shops || []);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Error fetching shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }
    fetchShops();
  }, []);

  const handleEditDiscount = (shop) => {
    setEditingShopId(shop._id);
    setDiscountForm({
      discountType: shop.discount?.discountType || "percentage",
      discountValue: shop.discount?.discountValue || 0,
      minOrderAmount: shop.discount?.minOrderAmount || 0,
      maxDiscountAmount: shop.discount?.maxDiscountAmount || null,
      description: shop.discount?.description || "",
      validFrom: shop.discount?.validFrom ? shop.discount.validFrom.split("T")[0] : "",
      validUntil: shop.discount?.validUntil ? shop.discount.validUntil.split("T")[0] : "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDiscountForm((prev) => ({
      ...prev,
      [name]: name === "discountValue" || name === "minOrderAmount" || name === "maxDiscountAmount" 
        ? value === "" ? 0 : parseFloat(value) 
        : value,
    }));
  };

  const handleSaveDiscount = async (shopId) => {
    if (discountForm.discountValue < 0) {
      toast.error("Discount value cannot be negative");
      return;
    }

    if (discountForm.minOrderAmount < 0) {
      toast.error("Minimum order amount cannot be negative");
      return;
    }

    try {
      const response = await axios.put(
        url + `/api/shop/${shopId}/discount`,
        discountForm,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Discount updated successfully");
        setEditingShopId(null);
        fetchShops();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error updating discount");
      console.error(error);
    }
  };

  const handleToggleDiscount = async (shopId) => {
    try {
      const response = await axios.patch(
        url + `/api/shop/${shopId}/discount/toggle`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchShops();
      }
    } catch (error) {
      toast.error("Error toggling discount");
    }
  };

  const cancelEdit = () => {
    setEditingShopId(null);
    setDiscountForm({
      discountType: "percentage",
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      description: "",
      validFrom: "",
      validUntil: "",
    });
  };

  const calculateExampleDiscount = () => {
    const testAmount = 100;
    if (discountForm.discountType === "percentage") {
      const discount = (testAmount * discountForm.discountValue) / 100;
      return Math.min(discount, discountForm.maxDiscountAmount || discount);
    } else {
      return Math.min(discountForm.discountValue, discountForm.maxDiscountAmount || discountForm.discountValue);
    }
  };

  if (loading) {
    return <div className="shop-discounts-loading">Loading...</div>;
  }

  return (
    <div className="shop-discounts-container">
      <h1 className="page-title">Shop Discounts Management</h1>

      {shops.length === 0 ? (
        <div className="no-shops">
          <p>No shops available</p>
        </div>
      ) : (
        <div className="shops-grid">
          {shops.map((shop) => (
            <div key={shop._id} className="shop-discount-card">
              <div className="shop-header">
                <h3>{shop.name}</h3>
                <span className="shop-type-badge">{shop.type}</span>
              </div>

              {editingShopId === shop._id ? (
                <div className="discount-form">
                  <div className="form-group">
                    <label>Discount Type</label>
                    <select
                      name="discountType"
                      value={discountForm.discountType}
                      onChange={handleInputChange}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Discount Value {discountForm.discountType === "percentage" ? "(%)" : ""}
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      value={discountForm.discountValue}
                      onChange={handleInputChange}
                      min="0"
                      step={discountForm.discountType === "percentage" ? "1" : "0.01"}
                    />
                  </div>

                  <div className="form-group">
                    <label>Minimum Order Amount</label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      value={discountForm.minOrderAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Discount Amount (optional)</label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      value={discountForm.maxDiscountAmount || ""}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="Leave empty for no limit"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={discountForm.description}
                      onChange={handleInputChange}
                      placeholder="e.g., Summer discount on all items"
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Valid From</label>
                    <input
                      type="date"
                      name="validFrom"
                      value={discountForm.validFrom}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Valid Until</label>
                    <input
                      type="date"
                      name="validUntil"
                      value={discountForm.validUntil}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="example-discount">
                    <small>Example: On a $100 order → Discount: ${calculateExampleDiscount().toFixed(2)}</small>
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn-save"
                      onClick={() => handleSaveDiscount(shop._id)}
                    >
                      Save Discount
                    </button>
                    <button className="btn-cancel" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="discount-display">
                  {shop.discount?.isActive ? (
                    <div className="discount-active">
                      <div className="discount-badge">
                        {shop.discount.discountType === "percentage"
                          ? `${shop.discount.discountValue}%`
                          : `$${shop.discount.discountValue.toFixed(2)}`}
                      </div>
                      <div className="discount-details">
                        <p>
                          <strong>Type:</strong> {shop.discount.discountType === "percentage" ? "Percentage" : "Fixed Amount"}
                        </p>
                        {shop.discount.description && (
                          <p>
                            <strong>Description:</strong> {shop.discount.description}
                          </p>
                        )}
                        <p>
                          <strong>Min Order:</strong> ${shop.discount.minOrderAmount.toFixed(2)}
                        </p>
                        {shop.discount.maxDiscountAmount && (
                          <p>
                            <strong>Max Discount:</strong> ${shop.discount.maxDiscountAmount.toFixed(2)}
                          </p>
                        )}
                        {shop.discount.validFrom && shop.discount.validUntil && (
                          <p>
                            <strong>Valid:</strong>{" "}
                            {new Date(shop.discount.validFrom).toLocaleDateString()} -{" "}
                            {new Date(shop.discount.validUntil).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="status-badge active">Active</span>
                    </div>
                  ) : (
                    <div className="discount-inactive">
                      <p>No active discount</p>
                      <span className="status-badge inactive">Inactive</span>
                    </div>
                  )}

                  <div className="discount-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditDiscount(shop)}
                    >
                      ✎ Edit
                    </button>
                    <button
                      className={`btn-toggle ${shop.discount?.isActive ? "btn-toggle-active" : ""}`}
                      onClick={() => handleToggleDiscount(shop._id)}
                    >
                      {shop.discount?.isActive ? "🔴 Deactivate" : "🟢 Activate"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopDiscounts;
