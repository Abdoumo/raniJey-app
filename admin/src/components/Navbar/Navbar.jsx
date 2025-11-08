import React, { useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, admin, setAdmin, setToken } = useContext(StoreContext);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setToken("");
    setAdmin(false);
    toast.success("Logout Successfully");
    navigate("/");
  };

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <img className="navbar-logo" src={assets.logo} alt="Logo" />
        <span className="navbar-title">RaniJay Admin</span>
      </div>

      <div className="navbar-actions">
        <div className="admin-profile">
          <img className="admin-avatar" src={assets.profile_image} alt="Profile" />
          <div className="admin-info">
            <p className="admin-label">RaniJay</p>
            <p className="admin-email">admin@RaniJay.com</p>
          </div>
        </div>

        <button className="logout-button" onClick={logout}>
          <span className="logout-icon">⎯→</span>
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
