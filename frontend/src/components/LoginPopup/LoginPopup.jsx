import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const {url, setToken, setUserId } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState("Login");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user",
  });

  const validatePhoneNumber = (phone) => {
    const algerian = /^(\+213|00213|0)[5-7][0-9]{8}$/;
    return algerian.test(phone.replace(/\s/g, ""));
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();

    if (currentState === "Sign Up") {
      if (data.phone && !validatePhoneNumber(data.phone)) {
        toast.error("Please enter a valid Algerian phone number");
        return;
      }
      if (data.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    let newUrl = url;
    if (currentState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
      console.log('Registering with data:', data);
    }
    const response = await axios.post(newUrl, data);
    if (response.data.success) {
      const loginToken = response.data.token;
      setToken(loginToken);
      localStorage.setItem("token", loginToken);

      try {
        const profileResponse = await axios.get(url + "/api/user/profile", {
          headers: { token: loginToken },
        });
        if (profileResponse.data.success && profileResponse.data.user._id) {
          setUserId(profileResponse.data.user._id);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }

      toast.success(currentState === "Login" ? "Login Successfully" : "Account Created Successfully");
      setShowLogin(false);
    }else{
      toast.error(response.data.message);
    }
  };
  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currentState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>
        {currentState === "Sign Up" && (
          <div className="account-type-selector">
            <label>Account Type</label>
            <div className="role-options">
              <button
                type="button"
                className={`role-btn ${data.role === "user" ? "active" : ""}`}
                onClick={() => setData((prev) => ({ ...prev, role: "user" }))}
              >
                <span className="role-icon">👤</span>
                <span className="role-text">Client</span>
              </button>
              <button
                type="button"
                className={`role-btn ${data.role === "Livreur" ? "active" : ""}`}
                onClick={() => setData((prev) => ({ ...prev, role: "Livreur" }))}
              >
                <span className="role-icon">🛵</span>
                <span className="role-text">Livreur</span>
              </button>
            </div>
          </div>
        )}
        <div className="login-popup-inputs">
          {currentState === "Sign Up" && (
            <>
              <input
                name="name"
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                placeholder="Your full name"
                required
              />
              <input
                name="phone"
                onChange={onChangeHandler}
                value={data.phone}
                type="tel"
                placeholder="Phone (e.g., +213 5xx xxx xxx) - Optional"
              />
            </>
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Your password"
            required
          />
        </div>
        <button type="submit">
          {currentState === "Sign Up" ? "Create Account" : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, i agree to the terms of use & privacy policy.</p>
        </div>
        {currentState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrentState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrentState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
