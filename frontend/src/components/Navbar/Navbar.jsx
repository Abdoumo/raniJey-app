import React, { useContext, useState, useEffect } from "react";
import "./Navbar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import axios from "axios";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken, url } = useContext(StoreContext);
  const [userProfile, setUserProfile] = useState(null);
  const navigate=useNavigate();

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(url + "/api/profile", {
        headers: { token },
      });
      if (response.data.success) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const logout=()=>{
    localStorage.removeItem("token");
    setToken("");
    toast.success("Logout Successfully")
    navigate("/");
  }
  return (
    <div className="navbar">
      <Link to="/">
        <img src={assets.logo} alt="" className="logo" />
      </Link>
      <ul className="navbar-menu">
        <Link
          to="/"
          onClick={() => setMenu("home")}
          className={menu === "home" ? "active" : ""}
        >
          home
        </Link>
        <a
          href="#explore-menu"
          onClick={() => setMenu("menu")}
          className={menu === "menu" ? "active" : ""}
        >
          menu
        </a>
        <a
          href="#app-download"
          onClick={() => setMenu("mobile-app")}
          className={menu === "mobile-app" ? "active" : ""}
        >
          mobile-app
        </a>
        <a
          href="#footer"
          onClick={() => setMenu("contact-us")}
          className={menu === "contact-us" ? "active" : ""}
        >
          contact us
        </a>
        {token && (
          <Link
            to="/myorders"
            onClick={() => setMenu("myorders")}
            className={menu === "myorders" ? "active" : ""}
          >
            my orders
          </Link>
        )}
        {token && (
          <Link
            to="/nearest-orders"
            onClick={() => setMenu("nearest-orders")}
            className={menu === "nearest-orders" ? "active" : ""}
          >
            nearest orders
          </Link>
        )}
      </ul>
      <div className="navbar-right">
        <img src={assets.search_icon} alt="" />
        <div className="navbar-search-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="" />
          </Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? (
          <button onClick={() => setShowLogin(true)}>sign in</button>
        ) : (
          <div className="navbar-profile">
            {userProfile?.profileImage ? (
              <img
                src={`${url}/images/${userProfile.profileImage}`}
                alt="Profile"
                className="profile-avatar"
              />
            ) : (
              <img src={assets.profile_icon} alt="" />
            )}
            <ul className="nav-profile-dropdown">
              <li onClick={()=>navigate("/profile")}><img src={assets.profile_icon} alt="" /><p>My Profile</p></li>
              <li onClick={()=>navigate("/myorders")}><img src={assets.bag_icon} alt="" /><p>Orders</p></li>
              <li onClick={()=>navigate("/nearest-orders")}><img src={assets.parcel_icon} alt="" /><p>Nearest Orders</p></li>
              <hr />
              <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Logout</p></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
