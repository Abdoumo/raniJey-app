import React, { useEffect, useState } from "react";
import "./Users.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import LocationService from "../../services/LocationService";

const Users = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [sharingLocationId, setSharingLocationId] = useState(null);
  const [locationService, setLocationService] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/user/list/all`, {
        headers: { token },
      });
      if (response.data.success) {
        setUsers(response.data.users || response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch users");
        toast.error(response.data.message || "Error fetching users");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error fetching users";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, userRole) => {
    if (userRole === "admin") {
      toast.error("Cannot deactivate admin accounts");
      return;
    }

    setTogglingId(userId);
    try {
      const response = await axios.patch(
        `${url}/api/user/toggle-status/${userId}`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "User status updated successfully");
        await fetchUsers();
      } else {
        toast.error(response.data.message || "Error updating user status");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Error updating user status";
      toast.error(errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleLocationSharing = async (userId, currentStatus) => {
    setSharingLocationId(userId);
    try {
      const response = await axios.patch(
        `${url}/api/location/sharing/toggle`,
        { enabled: !currentStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(
          `Location sharing ${!currentStatus ? "enabled" : "disabled"}`
        );
        await fetchUsers();
      } else {
        toast.error(
          response.data.message || "Error updating location sharing status"
        );
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Error updating location sharing status";
      toast.error(errorMsg);
    } finally {
      setSharingLocationId(null);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
      return;
    }

    const service = new LocationService(url, token);
    service.initSocket();
    setLocationService(service);

    fetchUsers();

    return () => {
      service.disconnectSocket();
    };
  }, []);

  return (
    <div className="users add flex-col">
      <div className="users-header">
        <h1 className="page-title">Users Management</h1>
      </div>

      {loading ? (
        <div className="list-loading">
          <p>Loading users...</p>
        </div>
      ) : error ? (
        <div className="list-error">
          <p>❌ Error: {error}</p>
          <button onClick={fetchUsers} className="retry-button">
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="list-empty">
          <p>👥 No users found</p>
        </div>
      ) : (
        <div className="list-table">
          <div className="list-table-format title">
            <b>Name</b>
            <b>Email</b>
            <b>Role</b>
            <b>Status</b>
            <b>Location Sharing</b>
          </div>
          {users.map((user) => (
            <div key={user._id} className="list-table-format user-row">
              <p>{user.name}</p>
              <p>{user.email}</p>
              <p className="user-role">{user.role}</p>
              <div className="status-cell">
                <button
                  className={`status-toggle ${user.isActive ? "active" : "inactive"}`}
                  onClick={() => handleToggleStatus(user._id, user.role)}
                  disabled={togglingId === user._id || user.role === "admin"}
                  title={user.role === "admin" ? "Cannot deactivate admin accounts" : "Click to toggle status"}
                >
                  {togglingId === user._id ? (
                    <span className="status-spinner">⏳</span>
                  ) : user.isActive ? (
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
              <div className="status-cell">
                <button
                  className={`status-toggle ${user.sharingLocation ? "active" : "inactive"}`}
                  onClick={() => handleToggleLocationSharing(user._id, user.sharingLocation)}
                  disabled={sharingLocationId === user._id}
                  title="Toggle location sharing"
                >
                  {sharingLocationId === user._id ? (
                    <span className="status-spinner">⏳</span>
                  ) : user.sharingLocation ? (
                    <>
                      <span className="status-indicator active-indicator">●</span>
                      Sharing
                    </>
                  ) : (
                    <>
                      <span className="status-indicator inactive-indicator">●</span>
                      Not Sharing
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
