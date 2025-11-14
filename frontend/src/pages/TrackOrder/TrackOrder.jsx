import React, { useContext, useEffect, useRef, useState } from 'react';
import './TrackOrder.css';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix Leaflet marker icons issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TrackOrder = () => {
  const { orderId } = useParams();
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const customMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const routePointsRef = useRef([]);

  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDelivered, setIsDelivered] = useState(false);

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
    const averageSpeed = 30; // km/h
    const hours = distanceKm / averageSpeed;
    const minutes = Math.round(hours * 60);
    return minutes;
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
        
        // Set customer location
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

    // Default center (Algiers)
    const defaultCenter = [36.737, 3.0588];
    const center = customerLocation
      ? [customerLocation.latitude, customerLocation.longitude]
      : defaultCenter;

    mapInstance.current = L.map(mapRef.current).setView(center, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Add customer marker
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

  // Connect to WebSocket for real-time location updates
  const connectWebSocket = () => {
    try {
      const socket = new WebSocket(`ws://localhost:4000`);

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.emit = (event, data) => {
          socket.send(JSON.stringify({ event, data }));
        };
        socket.emit('join-order-tracking', orderId);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.event === 'delivery-location-updated' || message.type === 'location') {
            const location = message.data || message.location;
            
            if (location && location.latitude && location.longitude) {
              setDeliveryLocation(location);

              // Update delivery person marker
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

              // Add route point
              routePointsRef.current.push([location.latitude, location.longitude]);

              // Update polyline
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

              // Fit map to bounds
              if (customMarkerRef.current && deliveryMarkerRef.current) {
                const group = new L.featureGroup([customMarkerRef.current, deliveryMarkerRef.current]);
                mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });
              }
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        // Fallback to polling if WebSocket fails
        pollDeliveryLocation();
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return socket;
    } catch (err) {
      console.error('Error connecting WebSocket:', err);
      // Fallback to HTTP polling
      pollDeliveryLocation();
    }
  };

  // Fallback: Poll for delivery location updates every 3 seconds
  const pollDeliveryLocation = () => {
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`${url}/api/location/order/${orderId}`, {
          headers: { token },
        });

        if (response.data.success && response.data.location) {
          const location = response.data.location;
          setDeliveryLocation(location);

          // Update marker
          if (deliveryMarkerRef.current) {
            mapInstance.current.removeLayer(deliveryMarkerRef.current);
          }

          deliveryMarkerRef.current = L.marker([location.latitude, location.longitude])
            .addTo(mapInstance.current)
            .bindPopup('<strong>🛵 Delivery Person</strong><br/>Current Location');

          // Add to route points
          routePointsRef.current.push([location.latitude, location.longitude]);

          // Update polyline
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

  // Update distance and ETA when delivery location changes
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

  // Initialize map and WebSocket when order details are loaded
  useEffect(() => {
    if (order && customerLocation && !isDelivered) {
      initializeMap();
      connectWebSocket();
    }
  }, [order, customerLocation]);

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
                <strong>Address:</strong> {order?.address || 'Not provided'}
              </p>
            </div>
          </div>

          {!isDelivered && deliveryLocation && distance !== null && distance <= 0.5 && (
            <button className="delivered-btn" onClick={markDelivered}>
              ✅ Mark as Delivered
            </button>
          )}

          {!isDelivered && distance > 0.5 && (
            <div className="delivery-notice">
              📍 Get closer to customer location to mark as delivered
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
