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
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchProfile();
  }, [token]);

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
    </div>
  );
};

export default Profile;
