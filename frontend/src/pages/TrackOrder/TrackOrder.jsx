import React, { useContext, useEffect, useRef, useState } from 'react';
import './TrackOrder.css';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { useTracking } from '../../hooks/useTracking';
import { useAutoTracking } from '../../hooks/useAutoTracking';
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

const TrackOrder = () => {
  const { orderId } = useParams();
  const { url, token, userRole } = useContext(StoreContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const customMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const routePointsRef = useRef([]);
  const pollingIntervalRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDelivered, setIsDelivered] = useState(false);

  // Auto-tracking (for customer to send location if needed)
  const { location: autoLocation } = useAutoTracking();

  // WebSocket tracking - only initialize if user is logged in with valid ID
  const userId = token ? localStorage.getItem('userId') : null;
  const { isConnected, locationUpdates, subscribeToOrder, sendLocation } = useTracking(
    url,
    token,
    userId,
    userRole || 'user'
  );

  // Haversine formula to calculate distance
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

  // Format distance (km if > 1, otherwise m)
  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${(distanceKm * 1000).toFixed(0)}m`;
    }
    return `${distanceKm.toFixed(2)}km`;
  };

  // Calculate ETA (assuming average speed of 30 km/h in city)
  const calculateETA = (distanceKm) => {
    const averageSpeed = 30;
    const hours = distanceKm / averageSpeed;
    const minutes = Math.round(hours * 60);
    return Math.max(minutes, 1);
  };

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/order/${orderId}`, {
        headers: { token },
      });

      if (response.data.success) {
        setOrder(response.data.order);

        if (response.data.order.deliveryLocation) {
          setCustomerLocation(response.data.order.deliveryLocation);
        }
      } else {
        setError(response.data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.response?.data?.message || 'Error fetching order details');
    } finally {
      setLoading(false);
    }
  };

  // Initialize map
  const initializeMap = () => {
    if (mapInstance.current || !mapRef.current) return;

    const defaultCenter = [36.737, 3.0588];
    const center = customerLocation
      ? [customerLocation.latitude, customerLocation.longitude]
      : defaultCenter;

    mapInstance.current = L.map(mapRef.current).setView(center, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    if (customerLocation) {
      customMarkerRef.current = L.marker([customerLocation.latitude, customerLocation.longitude], {
        title: 'Customer Delivery Address',
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconSize: [32, 41],
          iconAnchor: [16, 41],
          popupAnchor: [0, -41],
        }),
      })
        .addTo(mapInstance.current)
        .bindPopup(`<div class="popup-content"><strong>📍 Delivery Address</strong><br/>${order?.address || 'Customer Location'}</div>`);
    }
  };

  // Update delivery marker and polyline
  const updateDeliveryMarker = (location) => {
    if (!location || !location.latitude || !location.longitude || !mapInstance.current) return;

    if (deliveryMarkerRef.current) {
      mapInstance.current.removeLayer(deliveryMarkerRef.current);
    }

    deliveryMarkerRef.current = L.marker(
      [location.latitude, location.longitude],
      {
        title: 'Delivery Person',
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconSize: [32, 41],
          iconAnchor: [16, 41],
          popupAnchor: [0, -41],
        }),
      }
    )
      .addTo(mapInstance.current)
      .bindPopup('<div class="popup-content"><strong>🛵 Delivery Person</strong><br/>Current Location</div>');

    routePointsRef.current.push([location.latitude, location.longitude]);

    if (routePointsRef.current.length > 1) {
      if (polylineRef.current) {
        mapInstance.current.removeLayer(polylineRef.current);
      }
      polylineRef.current = L.polyline(routePointsRef.current, {
        color: '#ff6b35',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 5',
      }).addTo(mapInstance.current);
    }

    if (customMarkerRef.current && deliveryMarkerRef.current) {
      const group = new L.featureGroup([customMarkerRef.current, deliveryMarkerRef.current]);
      mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  };

  // Fallback: Poll for delivery location
  const pollDeliveryLocation = () => {
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`${url}/api/location/order/${orderId}`, {
          headers: { token },
        });

        if (response.data.success && response.data.location) {
          const location = response.data.location;
          setDeliveryLocation(location);

          if (mapInstance.current) {
            updateDeliveryMarker(location);
          }
        }
      } catch (err) {
        console.error('Error polling location:', err);
      }
    }, 3000);

    return intervalId;
  };

  // Mark order as delivered
  const markDelivered = async () => {
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      const response = await axios.post(
        `${url}/api/order/delivered`,
        { orderId },
        { headers: { token } }
      );

      if (response.data.success) {
        setIsDelivered(true);
        toast.success('Order marked as delivered!');
        setTimeout(() => {
          navigate('/nearest-orders');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to mark as delivered');
      }
    } catch (err) {
      console.error('Error marking delivered:', err);
      setError(err.response?.data?.message || 'Error marking order as delivered');
    }
  };

  // Send customer location if available
  useEffect(() => {
    if (autoLocation && isConnected) {
      sendLocation(autoLocation.latitude, autoLocation.longitude, autoLocation.accuracy);
    }
  }, [autoLocation, isConnected, sendLocation]);

  // Update distance and ETA
  useEffect(() => {
    if (customerLocation && deliveryLocation) {
      const distKm = calculateDistance(
        deliveryLocation.latitude,
        deliveryLocation.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      );
      setDistance(distKm);
      setEta(calculateETA(distKm));
    }
  }, [deliveryLocation, customerLocation]);

  // Fetch order on mount
  useEffect(() => {
    if (!token) {
      setError('Please login first');
      return;
    }
    fetchOrderDetails();
  }, [orderId, token]);

  // Initialize map and subscribe to order
  useEffect(() => {
    if (order && customerLocation && !isDelivered) {
      initializeMap();

      if (isConnected) {
        subscribeToOrder(orderId);
      } else {
        pollingIntervalRef.current = pollDeliveryLocation();
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [order, customerLocation, isConnected, orderId, subscribeToOrder]);

  // Handle location updates from WebSocket
  useEffect(() => {
    if (locationUpdates[orderId]) {
      const location = locationUpdates[orderId];
      setDeliveryLocation(location);
      if (mapInstance.current) {
        updateDeliveryMarker(location);
      }
    }
  }, [locationUpdates, orderId]);

  if (loading) {
    return (
      <div className="track-order-loading">
        <div className="loader"></div>
        <p>Loading order tracking...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="track-order-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/nearest-orders')}>Back to Orders</button>
      </div>
    );
  }

  return (
    <div className="track-order">
      <div className="track-order-header">
        <button className="back-btn" onClick={() => navigate('/nearest-orders')}>← Back</button>
        <h1>Track Order</h1>
        <div className="order-id">Order #{order?._id?.substring(0, 8)}...</div>
      </div>

      {isDelivered && (
        <div className="delivered-banner">
          ✅ Order delivered successfully!
        </div>
      )}

      <div className="track-order-container">
        <div className="map-section">
          <div ref={mapRef} className="map-container"></div>
        </div>

        <div className="track-info-panel">
          <div className="info-section">
            <h3>Delivery Status</h3>
            <div className="status-item">
              <span className="label">Status:</span>
              <span className="value">{order?.status || 'In Progress'}</span>
            </div>
            {distance !== null && (
              <div className="status-item">
                <span className="label">Distance:</span>
                <span className="value">{formatDistance(distance)}</span>
              </div>
            )}
            {eta !== null && (
              <div className="status-item">
                <span className="label">ETA:</span>
                <span className="value">{eta} mins</span>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Order Details</h3>
            <div className="order-details">
              <p>
                <strong>Items:</strong> {order?.items?.length || 0}
              </p>
              <p>
                <strong>Total:</strong> Da{order?.amount || 0}
              </p>
              <p>
                <strong>Address:</strong> {order?.address ? `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipcode}` : 'Not provided'}
              </p>
            </div>
          </div>

          {!isDelivered && deliveryLocation && distance !== null && distance <= 0.5 && (
            <button className="delivered-btn" onClick={markDelivered}>
              ✅ Mark as Delivered
            </button>
          )}

          {!isDelivered && distance !== null && distance > 0.5 && (
            <div className="delivery-notice">
              📍 Get closer to customer location to mark as delivered
            </div>
          )}

          {!deliveryLocation && (
            <div className="delivery-notice">
              ⏳ Waiting for delivery person location...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
