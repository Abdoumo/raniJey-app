import React, { useContext, useEffect, useRef, useState } from 'react';
import './DeliveryPersonOrderDetails.css';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const deliveryIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DeliveryPersonOrderDetails = () => {
  const { orderId } = useParams();
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [deliveryPersonLocation, setDeliveryPersonLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return R * c;
  };

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem('userId');

      if (!userId) {
        setError('User not logged in');
        return;
      }

      const orderResponse = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      if (!orderResponse.data.success) {
        setError('Failed to fetch order details');
        return;
      }

      const currentOrder = orderResponse.data.data.find((o) => o._id === orderId);

      if (!currentOrder) {
        setError('Order not found');
        return;
      }

      if (currentOrder.assignedDeliveryPerson?.toString() !== userId) {
        setError('This order is not assigned to you');
        return;
      }

      setOrder(currentOrder);

      // Fetch customer details using userId from order
      if (currentOrder.userId) {
        try {
          const customerResponse = await axios.get(`${url}/api/user/${currentOrder.userId}`, {
            headers: { token },
          });

          if (customerResponse.data.success) {
            setCustomer(customerResponse.data.user);
          }
        } catch (err) {
          console.error('Error fetching customer:', err);
        }
      }

      // Fetch delivery person location (you) - use current order's assigned delivery person
      if (userId && currentOrder.assignedDeliveryPerson) {
        try {
          const deliveryResponse = await axios.get(`${url}/api/user/${userId}`, {
            headers: { token },
          });

          if (deliveryResponse.data.success && deliveryResponse.data.user.lastKnownLocation) {
            setDeliveryPersonLocation(deliveryResponse.data.user.lastKnownLocation);
          } else if (deliveryResponse.data.success) {
            // If no lastKnownLocation yet, set a default or empty location
            console.log('Delivery person location not yet available');
          }
        } catch (err) {
          console.error('Error fetching delivery person location:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && orderId) {
      fetchOrderData();
    }
  }, [token, orderId, url]);

  // Calculate distance when both locations are available
  useEffect(() => {
    if (
      order &&
      deliveryPersonLocation?.latitude &&
      order.deliveryLocation?.latitude
    ) {
      const dist = calculateDistance(
        deliveryPersonLocation.latitude,
        deliveryPersonLocation.longitude,
        order.deliveryLocation.latitude,
        order.deliveryLocation.longitude
      );
      setDistance(dist);
    }
  }, [order, deliveryPersonLocation]);

  useEffect(() => {
    if (!order || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([0, 0], 13);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 18,
      }).addTo(mapInstance.current);
    }

    Object.values(markersRef.current).forEach((marker) =>
      mapInstance.current.removeLayer(marker)
    );
    Object.values(polylinesRef.current).forEach((polyline) =>
      mapInstance.current.removeLayer(polyline)
    );
    markersRef.current = {};
    polylinesRef.current = {};

    const bounds = [];

    // Add delivery person marker (you)
    if (deliveryPersonLocation?.latitude) {
      const myMarker = L.marker(
        [deliveryPersonLocation.latitude, deliveryPersonLocation.longitude],
        { icon: deliveryIcon }
      )
        .bindPopup('<div class="marker-popup"><strong>Your Location</strong></div>')
        .addTo(mapInstance.current);

      markersRef.current.delivery = myMarker;
      bounds.push([deliveryPersonLocation.latitude, deliveryPersonLocation.longitude]);
    }

    // Add customer marker
    if (order.deliveryLocation?.latitude) {
      const customerMarker = L.marker(
        [order.deliveryLocation.latitude, order.deliveryLocation.longitude],
        { icon: customerIcon }
      )
        .bindPopup(
          `<div class="marker-popup"><strong>Customer Location</strong><br/>${customer?.name || 'Customer'}</div>`
        )
        .addTo(mapInstance.current);

      markersRef.current.customer = customerMarker;
      bounds.push([order.deliveryLocation.latitude, order.deliveryLocation.longitude]);
    }

    // Draw route
    if (
      deliveryPersonLocation?.latitude &&
      order.deliveryLocation?.latitude
    ) {
      const route = L.polyline(
        [
          [deliveryPersonLocation.latitude, deliveryPersonLocation.longitude],
          [order.deliveryLocation.latitude, order.deliveryLocation.longitude],
        ],
        {
          color: '#4ECDC4',
          weight: 3,
          opacity: 0.8,
        }
      ).addTo(mapInstance.current);

      polylinesRef.current.route = route;
    }

    if (bounds.length > 0) {
      const bounds_obj = L.latLngBounds(bounds);
      mapInstance.current.fitBounds(bounds_obj, { padding: [50, 50] });
    }
  }, [order, deliveryPersonLocation, customer]);

  if (loading) {
    return (
      <div className="delivery-order-details-loading">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="delivery-order-details-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/nearest-orders')} className="back-btn">
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="delivery-order-details-error">
        <h2>Order Not Found</h2>
        <p>The requested order could not be found.</p>
        <button onClick={() => navigate('/nearest-orders')} className="back-btn">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="delivery-order-details">
      <div className="details-header">
        <button onClick={() => navigate('/nearest-orders')} className="back-button">
          ← Back
        </button>
        <h1>Order #{order._id?.substring(0, 8)}...</h1>
      </div>

      <div className="details-container">
        <div className="map-section">
          <div className="map-wrapper" ref={mapRef}></div>
        </div>

        <div className="info-section">
          <div className="info-card customer-info">
            <h2>Customer Information</h2>
            <div className="info-group">
              <label>Name</label>
              <p className="info-value">{customer?.name || 'Unknown'}</p>
            </div>
            <div className="info-group">
              <label>Phone</label>
              <p className="info-value phone-value">
                <a href={`tel:${customer?.phone || ''}`}>
                  {customer?.phone || 'Not available'}
                </a>
              </p>
            </div>
            <div className="info-group">
              <label>Address</label>
              <p className="info-value">{order.address?.street || 'Not available'}</p>
            </div>
            <div className="info-group">
              <label>Delivery Location</label>
              <p className="info-value coordinates">
                {order.deliveryLocation?.latitude && order.deliveryLocation?.longitude
                  ? `${order.deliveryLocation.latitude.toFixed(6)}, ${order.deliveryLocation.longitude.toFixed(6)}`
                  : 'Not available'}
              </p>
            </div>
          </div>

          <div className="info-card distance-info">
            <h2>Distance & Route</h2>
            <div className="distance-display">
              <p className="distance-value">
                {distance ? `${distance.toFixed(2)} km` : 'Calculating...'}
              </p>
              <p className="distance-label">to customer location</p>
            </div>
          </div>

          <div className="info-card order-info">
            <h2>Order Details</h2>
            <div className="info-group">
              <label>Items</label>
              <p className="info-value">{order.items?.length || 0} items</p>
            </div>
            {order.amount && (
              <div className="info-group">
                <label>Total Amount</label>
                <p className="info-value">Da{order.amount.toFixed(2)}</p>
              </div>
            )}
            <div className="info-group">
              <label>Status</label>
              <p className="info-value status">{order.status || 'Pending'}</p>
            </div>
          </div>

          <button onClick={() => navigate('/nearest-orders')} className="action-btn">
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPersonOrderDetails;
