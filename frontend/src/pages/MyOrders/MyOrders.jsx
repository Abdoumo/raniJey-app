import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");

  const fetchOrders = async () => {
    const response = await axios.post(
      url + "/api/order/userorders",
      {},
      { headers: { token } }
    );
    if (response.data.success) {
      setData(response.data.data);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("complete") || statusLower.includes("delivered")) {
      return "completed";
    } else if (statusLower.includes("pending") || statusLower.includes("on the way") || statusLower.includes("food being prepared")) {
      return "on-way";
    } else if (statusLower.includes("cancel") || statusLower.includes("refused")) {
      return "refused";
    }
    return "pending";
  };

  const filterOrders = () => {
    if (selectedStatus === "All") return data;

    return data.filter((order) => {
      const orderStatusColor = getStatusColor(order.status);
      return orderStatusColor === selectedStatus;
    });
  };

  const filteredOrders = filterOrders();

  const statusStats = {
    All: data.length,
    "On the Way": data.filter((o) => getStatusColor(o.status) === "on-way").length,
    Completed: data.filter((o) => getStatusColor(o.status) === "completed").length,
    Refused: data.filter((o) => getStatusColor(o.status) === "refused").length,
  };

  return (
    <div className="my-orders">
      <h1>Your Orders</h1>

      <div className="orders-filters">
        {["All", "On the Way", "Completed", "Refused"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${selectedStatus === status ? "active" : ""}`}
            onClick={() => setSelectedStatus(status)}
          >
            <span className="filter-label">{status}</span>
            <span className="filter-count">{statusStats[status]}</span>
          </button>
        ))}
      </div>

      <div className="container">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => {
            const statusColor = getStatusColor(order.status);
            return (
              <div key={index} className={`my-orders-order status-${statusColor}`}>
                <img src={assets.parcel_icon} alt="order icon" />
                <div className="order-items">
                  <p className="items-list">
                    {order.items.map((item, index) => {
                      if (index === order.items.length - 1) {
                        return item.name + " x" + item.quantity;
                      } else {
                        return item.name + " x" + item.quantity + ", ";
                      }
                    })}
                  </p>
                  <p className="item-count">Items: {order.items.length}</p>
                </div>
                <p className="order-amount">Da{order.amount}.00</p>
                <p className={`order-status status-badge ${statusColor}`}>
                  <span className="status-dot">●</span>
                  {order.status}
                </p>
                <button className="track-btn" onClick={fetchOrders}>
                  Track Order
                </button>
              </div>
            );
          })
        ) : (
          <div className="no-orders">
            <p>No orders found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
