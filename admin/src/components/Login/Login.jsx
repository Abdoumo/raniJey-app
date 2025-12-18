import React, { useContext, useEffect, useState } from "react";
import "./Login.css";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Login = ({ url }) => {
  const navigate = useNavigate();
  const { admin, setAdmin, token, setToken, setUserRole, setUserName, setUserId } = useContext(StoreContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(url + "/api/user/login", data);
      if (response.data.success) {
        const userRole = response.data.role;
        const isAdmin = userRole === "admin";
        const isDelivery = userRole === "delivery" || userRole === "livreur";

        if (isAdmin || isDelivery) {
          const loginToken = response.data.token;
          setToken(loginToken);
          setAdmin(isAdmin);
          setUserRole(userRole);
          setUserName(response.data.name || userRole);
          localStorage.setItem("token", loginToken);
          localStorage.setItem("admin", JSON.stringify(isAdmin));
          localStorage.setItem("userRole", userRole);
          localStorage.setItem("userName", response.data.name || userRole);

          try {
            const profileResponse = await axios.get(url + "/api/user/profile", {
              headers: { token: loginToken },
            });
            if (profileResponse.data.success && profileResponse.data.user._id) {
              setUserId(profileResponse.data.user._id);
              localStorage.setItem("userId", profileResponse.data.user._id);
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
          }

          toast.success("Login Successfully");
          navigate(isAdmin ? "/add" : "/order-tracking");
        } else {
          toast.error("Only admin and delivery personnel can access this app");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin && token) {
      navigate("/add");
    }
  }, []);

  return (
    <div className="login-wrapper">
      <div className="login-background"></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-section">
              <h1 className="login-logo">RaniJay Admin</h1>
              <p className="login-subtitle">Management System</p>
            </div>
          </div>

          <form onSubmit={onLogin} className="login-form">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-description">Sign in to your admin account</p>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                name="email"
                onChange={onChangeHandler}
                value={data.email}
                type="email"
                placeholder="admin@example.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type="password"
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p className="demo-text">Demo: admin@clinic.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
