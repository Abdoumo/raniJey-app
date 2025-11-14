import React from "react";
import "./Orders.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { assets } from "../../assets/assets";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import LocationService from "../../services/LocationService";

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [deliveryLocations, setDeliveryLocations] = useState({});
  const [locationService, setLocationService] = useState(null);
  const [autoAssigningId, setAutoAssigningId] = useState(null);

  const fetchAllOrder = async () => {
    const response = await axios.get(url + "/api/order/list", {
      headers: { token },
    });
    if (response.data.success) {
      setOrders(response.data.data);
    }
  };

  const statusHandler = async (event, orderId) => {
    const response = await axios.post(
      url + "/api/order/status",
      {
        orderId,
        status: event.target.value,
      },
      { headers: { token } }
    );
    if (response.data.success) {
      toast.success(response.data.message);
      await fetchAllOrder();
    } else {
      toast.error(response.data.message);
    }
  };
  const fetchDeliveryLocation = async (orderId) => {
    try {
      const response = await axios.get(`${url}/api/location/order/${orderId}`, {
        headers: { token },
      });
      if (response.data.success) {
        setDeliveryLocations((prev) => ({
          ...prev,
          [orderId]: response.data.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching delivery location:", error);
    }
  };

  const handleAutoAssignDelivery = async (orderId) => {
    try {
      setAutoAssigningId(orderId);
      const response = await axios.post(
        `${url}/api/location/match/${orderId}`,
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Delivery person assigned successfully");
        await fetchAllOrder();
        await fetchDeliveryLocation(orderId);
      } else {
        toast.error(response.data.message || "Failed to assign delivery person");
      }
    } catch (error) {
      console.error("Error assigning delivery:", error);
      toast.error(
        error.response?.data?.message || "Failed to assign delivery person"
      );
    } finally {
      setAutoAssigningId(null);
    }
  };

  const toggleOrderExpanded = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      fetchDeliveryLocation(orderId);
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
    service.joinTracking();
    setLocationService(service);

    service.on("delivery-location-updated", (data) => {
      setDeliveryLocations((prev) => ({
        ...prev,
        [data.orderId]: data.location,
      }));
    });

    fetchAllOrder();

    return () => {
      service.disconnectSocket();
    };
  }, []);

  return (
    <div className="order add">
      <h1 className="page-title">Orders</h1>
      <div className="order-list">
        {orders.map((order, index) => (
          <div key={index} className={`order-item ${expandedOrderId === order._id ? "expanded" : ""}`}>
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.items.map((item, index) => {
                  if (index === order.items.length - 1) {
                    return item.name + " x " + item.quantity;
                  } else {
                    return item.name + " x " + item.quantity + ", ";
                  }
                })}
              </p>
              <p className="order-item-name">
                {order.address.firstName + " " + order.address.lastName}
              </p>
              <div className="order-item-address">
                <p>{order.address.street + ","}</p>
                <p>
                  {order.address.city +
                    ", " +
                    order.address.state +
                    ", " +
                    order.address.country +
                    ", " +
                    order.address.zipcode}
                </p>
              </div>
              <p className="order-item-phone">{order.address.phone}</p>
            </div>
            <p>Items: {order.items.length}</p>
            <p>₨{order.amount}</p>
            <div className="order-actions">
              <select
                onChange={(event) => statusHandler(event, order._id)}
                value={order.status}
              >
                <option value="Food Processing">Food Processing</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
              <button
                className="location-toggle-btn"
                onClick={() => toggleOrderExpanded(order._id)}
                title="View delivery location"
              >
                📍
              </button>
            </div>

            {expandedOrderId === order._id && (
              <div className="order-location-panel">
                {order.assignedDeliveryPerson ? (
                  deliveryLocations[order._id] ? (
                    <div className="location-details">
                      <h4>Delivery Location</h4>
                      <p className="delivery-person-info">
                        👤 {deliveryLocations[order._id].name || "Delivery Person"}
                      </p>
                      <p className="location-stat">
                        <span>Latitude:</span>
                        <span>
                          {deliveryLocations[order._id].latitude?.toFixed(6) || "N/A"}
                        </span>
                      </p>
                      <p className="location-stat">
                        <span>Longitude:</span>
                        <span>
                          {deliveryLocations[order._id].longitude?.toFixed(6) || "N/A"}
                        </span>
                      </p>
                      <p className="location-stat">
                        <span>Accuracy:</span>
                        <span>
                          {deliveryLocations[order._id].accuracy
                            ? `${deliveryLocations[order._id].accuracy.toFixed(2)}m`
                            : "N/A"}
                        </span>
                      </p>
                      <p className="location-stat">
                        <span>Last Update:</span>
                        <span>
                          {deliveryLocations[order._id].updatedAt
                            ? new Date(
                                deliveryLocations[order._id].updatedAt
                              ).toLocaleTimeString()
                            : "Never"}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="loading-location">Loading location...</div>
                  )
                ) : (
                  <div className="no-delivery-assigned">
                    <p>No delivery person assigned yet</p>
                    <button
                      className="assign-delivery-btn"
                      onClick={() => handleAutoAssignDelivery(order._id)}
                      disabled={autoAssigningId === order._id}
                    >
                      {autoAssigningId === order._id
                        ? "Assigning..."
                        : "Auto Assign Delivery"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
