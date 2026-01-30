import React, { useContext, useEffect, useState } from "react";
import "./Profile.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const { url, token, userId } = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    label: "",
    street: "",
    city: "",
    zipCode: "",
    phone: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    profileImage: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(url + "/api/profile", {
        headers: { token },
      });

      if (response.data.success) {
        const user = response.data.user;
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
          profileImage: user.profileImage || "",
        });
        if (user.profileImage) {
          setImagePreview(`${url}/images/${user.profileImage}`);
        }
      } else {
        toast.error(response.data.message || "Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(url + "/api/address", {
        headers: { token },
      });

      if (response.data.success) {
        setAddresses(response.data.addresses);
        if (response.data.defaultAddress) {
          setDefaultAddressId(response.data.defaultAddress._id);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchProfile();
    fetchAddresses();
  }, [token]);

  const handleAddAddress = async (e) => {
    e.preventDefault();

    if (!addressFormData.label || !addressFormData.street || !addressFormData.city ||
        !addressFormData.zipCode || !addressFormData.phone) {
      toast.error("All address fields are required");
      return;
    }

    try {
      const response = await axios.post(url + "/api/address/add", addressFormData, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Address added successfully");
        setAddressFormData({
          label: "",
          street: "",
          city: "",
          zipCode: "",
          phone: "",
        });
        setShowAddressForm(false);
        fetchAddresses();
      } else {
        toast.error(response.data.message || "Failed to add address");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error adding address");
    }
  };

  const handleEditAddress = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        url + `/api/address/${editingAddressId}`,
        addressFormData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Address updated successfully");
        setAddressFormData({
          label: "",
          street: "",
          city: "",
          zipCode: "",
          phone: "",
        });
        setEditingAddressId(null);
        setShowAddressForm(false);
        fetchAddresses();
      } else {
        toast.error(response.data.message || "Failed to update address");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error updating address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const response = await axios.delete(url + `/api/address/${addressId}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Address deleted successfully");
        fetchAddresses();
      } else {
        toast.error(response.data.message || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error deleting address");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await axios.post(
        url + `/api/address/${addressId}/set-default`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Default address set successfully");
        setDefaultAddressId(addressId);
        fetchAddresses();
      } else {
        toast.error(response.data.message || "Failed to set default address");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error setting default address");
    }
  };

  const openAddAddressForm = () => {
    setEditingAddressId(null);
    setAddressFormData({
      label: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
    });
    setShowAddressForm(true);
  };

  const openEditAddressForm = (address) => {
    setEditingAddressId(address._id);
    setAddressFormData({
      label: address.label,
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      phone: address.phone,
    });
    setShowAddressForm(true);
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressFormData({
      label: "",
      street: "",
      city: "",
      zipCode: "",
      phone: "",
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
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
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("email", formData.email);
      submitFormData.append("phone", formData.phone);
      submitFormData.append("bio", formData.bio);
      if (profileImage) {
        submitFormData.append("profileImage", profileImage);
      }

      const response = await axios.put(url + "/api/profile", submitFormData, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Profile updated successfully");
        setFormData({
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone || "",
          bio: response.data.user.bio || "",
          profileImage: response.data.user.profileImage || "",
        });
        if (response.data.user.profileImage) {
          setImagePreview(`${url}/images/${response.data.user.profileImage}`);
        }
        setProfileImage(null);
        setIsEditing(false);
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error updating profile");
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!isEditing && (
          <button
            className="btn-edit-profile"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      <div className="profile-content">
        {/* Profile Image Section */}
        <div className="profile-image-section">
          <div className="profile-image-container">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="profile-image" />
            ) : (
              <div className="profile-image-placeholder">
                <span>📷</span>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="image-upload-section">
              <label htmlFor="profileImage" className="file-input-label">
                Choose Image
              </label>
              <input
                type="file"
                id="profileImage"
                onChange={handleImageChange}
                accept="image/*"
                className="file-input"
              />
              <small>Recommended size: 400x400px, Max: 5MB</small>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="profile-info-section">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself"
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileImage(null);
                    fetchProfile();
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              <div className="profile-item">
                <label>Name</label>
                <p>{formData.name}</p>
              </div>

              <div className="profile-item">
                <label>Email</label>
                <p>{formData.email}</p>
              </div>

              {formData.phone && (
                <div className="profile-item">
                  <label>Phone</label>
                  <p>{formData.phone}</p>
                </div>
              )}

              {formData.bio && (
                <div className="profile-item">
                  <label>Bio</label>
                  <p>{formData.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Addresses Section */}
      <div className="addresses-section">
        <div className="addresses-header">
          <h2>My Addresses</h2>
          <button className="btn-add-address" onClick={openAddAddressForm}>
            + Add New Address
          </button>
        </div>

        {showAddressForm && (
          <div className="address-form-container">
            <h3>{editingAddressId ? "Edit Address" : "Add New Address"}</h3>
            <form
              onSubmit={editingAddressId ? handleEditAddress : handleAddAddress}
              className="address-form"
            >
              <div className="form-group">
                <label htmlFor="label">Address Label *</label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={addressFormData.label}
                  onChange={(e) =>
                    setAddressFormData({ ...addressFormData, label: e.target.value })
                  }
                  placeholder="e.g., Home, Office, Parents House"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="street">Street *</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={addressFormData.street}
                  onChange={(e) =>
                    setAddressFormData({ ...addressFormData, street: e.target.value })
                  }
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={addressFormData.city}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, city: e.target.value })
                    }
                    placeholder="City"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">Zip Code *</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={addressFormData.zipCode}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, zipCode: e.target.value })
                    }
                    placeholder="Zip code"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={addressFormData.phone}
                  onChange={(e) =>
                    setAddressFormData({ ...addressFormData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save-address">
                  {editingAddressId ? "Update Address" : "Add Address"}
                </button>
                <button
                  type="button"
                  onClick={closeAddressForm}
                  className="btn-cancel-address"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="addresses-list">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <div key={address._id} className={`address-item ${address.isDefault ? "default" : ""}`}>
                {address.isDefault && <span className="default-badge">Default</span>}
                <div className="address-content">
                  <h4>{address.label}</h4>
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.zipCode}
                  </p>
                  <p className="phone">📞 {address.phone}</p>
                </div>
                <div className="address-actions">
                  <button
                    className="btn-action btn-edit-address"
                    onClick={() => openEditAddressForm(address)}
                  >
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      className="btn-action btn-set-default"
                      onClick={() => handleSetDefaultAddress(address._id)}
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    className="btn-action btn-delete-address"
                    onClick={() => handleDeleteAddress(address._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-addresses">
              <p>No addresses yet. Add one to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
