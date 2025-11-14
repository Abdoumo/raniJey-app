import React, { useContext, useEffect, useState } from "react";
import "./Login.css";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Login = ({ url }) => {
  const navigate = useNavigate();
  const { admin, setAdmin, token, setToken, setUserRole, setUserName } = useContext(StoreContext);
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
        if (response.data.role === "admin") {
          setToken(response.data.token);
          setAdmin(true);
          setUserRole(response.data.role);
          setUserName(response.data.name || "Admin");
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("admin", JSON.stringify(true));
          localStorage.setItem("userRole", response.data.role);
          localStorage.setItem("userName", response.data.name || "Admin");
          toast.success("Login Successfully");
          navigate("/add");
        } else {
          toast.error("You are not an admin");
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
