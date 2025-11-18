import React, { useContext, useEffect, useState } from "react";
import "./DeliveryTracking.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import LocationService from "../../services/LocationService";

const DeliveryTracking = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [deliveryPeople, setDeliveryPeople] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active-deliveries");
  const [locationService, setLocationService] = useState(null);
  const [assigningOrderId, setAssigningOrderId] = useState(null);

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

    service.on("location-updated", (data) => {
      fetchActiveDeliveryPeople();
    });

    fetchActiveDeliveryPeople();
    fetchOrders();

    return () => {
      service.disconnectSocket();
    };
  }, []);

  const fetchActiveDeliveryPeople = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${url}/api/location/delivery/active/list`,
        { headers: { token } }
      );
      if (response.data.success) {
        setDeliveryPeople(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching active delivery people:", error);
      toast.error("Failed to fetch active delivery people");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    }
  };

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    try {
      setLoading(true);
      const response = await axios.get(
        `${url}/api/location/order/${order._id}`,
        { headers: { token } }
      );
      if (response.data.success) {
        setDeliveryLocation(response.data.data);
      }

      const historyResponse = await axios.get(
        `${url}/api/location/order-history/${order._id}`,
        { headers: { token } }
      );
      if (historyResponse.data.success) {
        setLocationHistory(historyResponse.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching order tracking:", error);
      toast.error("Failed to fetch order tracking");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async (orderId) => {
    try {
      setAssigningOrderId(orderId);
      const response = await axios.post(
        `${url}/api/location/match/${orderId}`,
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Delivery person assigned successfully");
        await fetchOrders();
        await fetchActiveDeliveryPeople();
      } else {
        toast.error(response.data.message || "Failed to assign delivery person");
      }
    } catch (error) {
      console.error("Error assigning delivery:", error);
      toast.error(
        error.response?.data?.message || "Failed to assign delivery person"
      );
    } finally {
      setAssigningOrderId(null);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const unassignedOrders = orders.filter(
    (order) => !order.assignedDeliveryPerson && order.status !== "Delivered"
  );

  return (
    <div className="delivery-tracking add">
      <h1 className="page-title">Delivery Tracking</h1>

      <div className="tracking-tabs">
        <button
          className={`tab-button ${activeTab === "active-deliveries" ? "active" : ""}`}
          onClick={() => setActiveTab("active-deliveries")}
        >
          Active Deliveries ({deliveryPeople.length})
        </button>
        <button
          className={`tab-button ${activeTab === "order-tracking" ? "active" : ""}`}
          onClick={() => setActiveTab("order-tracking")}
        >
          Order Tracking
        </button>
        <button
          className={`tab-button ${activeTab === "assign-delivery" ? "active" : ""}`}
          onClick={() => setActiveTab("assign-delivery")}
        >
          Assign Deliveries ({unassignedOrders.length})
        </button>
      </div>

      {activeTab === "active-deliveries" && (
        <div className="active-deliveries-section">
          {loading ? (
            <div className="loading-state">Loading active delivery people...</div>
          ) : deliveryPeople.length === 0 ? (
            <div className="empty-state">No active delivery people at the moment</div>
          ) : (
            <div className="deliveries-grid">
              {deliveryPeople.map((person) => (
                <div key={person._id} className="delivery-card">
                  <div className="card-header">
                    <h3 className="delivery-name">{person.name}</h3>
                    <span className="status-badge online">● Online</span>
                  </div>
                  <div className="card-content">
                    <p className="delivery-info">
                      <span className="label">Email:</span>
                      <span>{person.email}</span>
                    </p>
                    <p className="delivery-info">
                      <span className="label">Location:</span>
                      <span>
                        {person.currentLocation
                          ? `${person.currentLocation.latitude.toFixed(4)}, ${person.currentLocation.longitude.toFixed(4)}`
                          : "N/A"}
                      </span>
                    </p>
                    <p className="delivery-info">
                      <span className="label">Accuracy:</span>
                      <span>
                        {person.currentLocation?.accuracy
                          ? `${person.currentLocation.accuracy.toFixed(2)}m`
                          : "N/A"}
                      </span>
                    </p>
                    <p className="delivery-info">
                      <span className="label">Last Update:</span>
                      <span>
                        {person.currentLocation?.updatedAt
                          ? new Date(person.currentLocation.updatedAt).toLocaleTimeString()
                          : "Never"}
                      </span>
                    </p>
                    <p className="delivery-info">
                      <span className="label">Active Orders:</span>
                      <span className="orders-count">
                        {orders.filter(
                          (o) =>
                            o.assignedDeliveryPerson === person._id &&
                            o.status !== "Delivered"
                        ).length}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "order-tracking" && (
        <div className="order-tracking-section">
          <div className="orders-list">
            <h2 className="section-title">Select Order to Track</h2>
            {orders.length === 0 ? (
              <div className="empty-state">No orders available</div>
            ) : (
              <div className="orders-container">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className={`order-item-select ${
                      selectedOrder?._id === order._id ? "selected" : ""
                    }`}
                    onClick={() => handleOrderSelect(order)}
                  >
                    <div className="order-header">
                      <p className="order-id">Order #{order._id.substring(0, 8)}</p>
                      <p className="order-status">{order.status}</p>
                    </div>
                    <p className="order-customer">
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    {order.assignedDeliveryPerson && (
                      <p className="assigned-person">
                        👤 Assigned to delivery person
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedOrder && (
            <div className="tracking-details">
              <h2 className="section-title">Tracking Details</h2>
              {loading ? (
                <div className="loading-state">Loading tracking data...</div>
              ) : deliveryLocation ? (
                <div className="location-panel">
                  <div className="location-info">
                    <h3 className="delivery-person-name">
                      {deliveryLocation.name || "Delivery Person"}
                    </h3>
                    <p className="tracking-stat">
                      <span className="label">Latitude:</span>
                      <span>{deliveryLocation.latitude?.toFixed(6) || "N/A"}</span>
                    </p>
                    <p className="tracking-stat">
                      <span className="label">Longitude:</span>
                      <span>{deliveryLocation.longitude?.toFixed(6) || "N/A"}</span>
                    </p>
                    <p className="tracking-stat">
                      <span className="label">Accuracy:</span>
                      <span>
                        {deliveryLocation.accuracy
                          ? `${deliveryLocation.accuracy.toFixed(2)}m`
                          : "N/A"}
                      </span>
                    </p>
                    <p className="tracking-stat">
                      <span className="label">Last Update:</span>
                      <span>
                        {deliveryLocation.updatedAt
                          ? new Date(deliveryLocation.updatedAt).toLocaleString()
                          : "Never"}
                      </span>
                    </p>
                  </div>

                  {locationHistory.length > 0 && (
                    <div className="history-panel">
                      <h4 className="history-title">Location History</h4>
                      <div className="history-list">
                        {locationHistory.slice(0, 10).map((entry, idx) => (
                          <div key={idx} className="history-entry">
                            <p className="history-time">
                              {new Date(entry.timestamp || entry.createdAt).toLocaleTimeString()}
                            </p>
                            <p className="history-coords">
                              {entry.latitude?.toFixed(4)}, {entry.longitude?.toFixed(4)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  No delivery person assigned to this order yet
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "assign-delivery" && (
        <div className="assign-delivery-section">
          <h2 className="section-title">Unassigned Orders</h2>
          {unassignedOrders.length === 0 ? (
            <div className="empty-state">All orders have been assigned!</div>
          ) : (
            <div className="unassigned-orders">
              {unassignedOrders.map((order) => (
                <div key={order._id} className="unassigned-order-card">
                  <div className="order-info">
                    <p className="order-label">
                      Order #{order._id.substring(0, 8)}
                    </p>
                    <p className="customer-name">
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    <p className="order-address">
                      {order.address.street}, {order.address.city}
                    </p>
                    <p className="order-items">
                      Items: {order.items.length} • Amount: ₨{order.amount}
                    </p>
                  </div>
                  <button
                    className="assign-button"
                    onClick={() => handleAssignDelivery(order._id)}
                    disabled={assigningOrderId === order._id}
                  >
                    {assigningOrderId === order._id ? "Assigning..." : "Auto Assign"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;
