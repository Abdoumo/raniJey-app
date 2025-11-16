import React, { useContext, useEffect, useState, useRef } from 'react';
import './NearestOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const NearestOrders = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [nearestOrders, setNearestOrders] = useState([]);
  const [error, setError] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);

  const initializeMap = (lat, lng) => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    addUserMarker(lat, lng);
  };

  const addUserMarker = (lat, lng) => {
    if (!mapInstance.current) return;

    const userIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.4); border: 3px solid white;">📍</div>`,
      className: 'user-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    L.marker([lat, lng], { icon: userIcon })
      .addTo(mapInstance.current)
      .bindPopup('Your Location');
  };

  const addOrderMarkers = (orders) => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    orders.forEach((order, index) => {
      const orderLat = order.deliveryLocation?.latitude || order.latitude;
      const orderLon = order.deliveryLocation?.longitude || order.longitude;

      if (!orderLat || !orderLon) return;

      const orderIcon = L.divIcon({
        html: `<div style="background: #2196f3; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.4); border: 3px solid white; font-size: 14px;">${index + 1}</div>`,
        className: 'order-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([orderLat, orderLon], { icon: orderIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="min-width: 200px;">
            <strong>${order.customerName || 'Unknown'}</strong><br/>
            Items: ${order.items?.length || 0}<br/>
            Amount: Da${order.amount || 0}<br/>
            Distance: ${order.distance?.toFixed(2) || 'N/A'} km
          </div>
        `);

      markersRef.current.push(marker);
    });

    if (orders.length > 0 && location) {
      const bounds = L.latLngBounds([[location.latitude, location.longitude]]);
      orders.forEach((order) => {
        const lat = order.deliveryLocation?.latitude || order.latitude;
        const lng = order.deliveryLocation?.longitude || order.longitude;
        if (lat && lng) bounds.extend([lat, lng]);
      });
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const updateUserMarkerLocation = (lat, lng) => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== mapInstance.current._userMarker) {
        mapInstance.current.removeLayer(layer);
      }
    });
    mapInstance.current._userMarker = null;

    addUserMarker(lat, lng);
    mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
  };

  const activateGPS = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        };
        setLocation(newLocation);

        if (!mapInstance.current) {
          setTimeout(() => {
            if (mapRef.current) {
              initializeMap(latitude, longitude);
            }
          }, 0);
        }

        sendLocationToBackend(latitude, longitude, accuracy);
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError(`Error: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const sendLocationToBackend = async (latitude, longitude, accuracy) => {
    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      const response = await axios.post(
        `${url}/api/location/update`,
        {
          latitude,
          longitude,
          accuracy,
        },
        {
          headers: { token },
        }
      );

      if (response.data.success) {
        toast.success('Location updated successfully');
      } else {
        setError(response.data.message || 'Failed to update location');
      }
    } catch (err) {
      console.error('Error sending location:', err);
      setError(err.response?.data?.message || 'Error sending location to backend');
    }
  };

  const startContinuousTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setTracking(true);
    toast.info('Location tracking started. Updates every 3 seconds...');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        };
        setLocation(newLocation);

        if (mapInstance.current) {
          updateUserMarkerLocation(latitude, longitude);
        }

        sendLocationToBackend(latitude, longitude, accuracy);
      },
      (error) => {
        console.error('Watch position error:', error);
        setError(`Tracking error: ${error.message}`);
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    window.gpsWatchId = watchId;
  };

  const stopTracking = () => {
    if (window.gpsWatchId !== undefined) {
      navigator.geolocation.clearWatch(window.gpsWatchId);
      setTracking(false);
      toast.info('Location tracking stopped');
    }
  };

  const fetchNearestOrders = async () => {
    if (!location) {
      setError('Please activate GPS first');
      return;
    }

    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      let response;
      let endpointUsed = '';
      let usedMockData = false;

      // Try endpoints in order
      const endpoints = [
        { url: `${url}/api/order/nearest`, params: { latitude: location.latitude, longitude: location.longitude } },
        { url: `${url}/api/order/available`, params: {} },
        { url: `${url}/api/order/pending`, params: {} },
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint.url}`);
          response = await axios.get(endpoint.url, {
            params: endpoint.params,
            headers: { token },
          });
          endpointUsed = endpoint.url;
          break;
        } catch (err) {
          if (err.response?.status === 404) {
            console.log(`Endpoint ${endpoint.url} not found, trying next...`);
            continue;
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            console.log(`Endpoint ${endpoint.url} requires different auth, trying next...`);
            continue;
          } else {
            throw err;
          }
        }
      }

      // Fallback: Use mock data for testing
      if (!response) {
        console.warn('No backend endpoints available, using mock data for demonstration');
        usedMockData = true;
        response = {
          data: {
            success: true,
            orders: [
              {
                _id: '1',
                customerName: 'Ahmed Taha',
                deliveryLocation: { latitude: location.latitude + 0.002, longitude: location.longitude + 0.001 },
                amount: 2500,
                items: 5,
                status: 'Pending',
              },
              {
                _id: '2',
                customerName: 'Fatima Hassan',
                deliveryLocation: { latitude: location.latitude - 0.001, longitude: location.longitude + 0.003 },
                amount: 1800,
                items: 3,
                status: 'Pending',
              },
              {
                _id: '3',
                customerName: 'Mohammed Ali',
                deliveryLocation: { latitude: location.latitude + 0.003, longitude: location.longitude - 0.002 },
                amount: 3200,
                items: 7,
                status: 'Pending',
              },
              {
                _id: '4',
                customerName: 'Layla Sami',
                deliveryLocation: { latitude: location.latitude - 0.002, longitude: location.longitude - 0.001 },
                amount: 1500,
                items: 2,
                status: 'Pending',
              },
            ],
          },
        };
      }

      if (response.data.success) {
        const orders = response.data.orders || response.data.data || [];

        // Filter by distance client-side if needed
        if (!endpointUsed.includes('nearest') || usedMockData) {
          const nearbyOrders = filterOrdersByDistance(orders, location);
          setNearestOrders(nearbyOrders);
          addOrderMarkers(nearbyOrders);

          if (nearbyOrders.length === 0) {
            setError('No nearby orders found. Try moving to a different location or activating more precise GPS.');
          } else {
            setError(null);
            if (usedMockData) {
              toast.warning('Showing demo orders (backend not ready yet)');
            } else {
              toast.success(`Found ${nearbyOrders.length} nearby orders!`);
            }
          }
        } else {
          setNearestOrders(orders);
          addOrderMarkers(orders);

          if (orders.length === 0) {
            setError('No nearby orders found');
          } else {
            setError(null);
            toast.success(`Found ${orders.length} nearby orders!`);
          }
        }
      } else {
        setError(response.data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching nearest orders:', err);

      if (err.response?.status === 403) {
        setError('You do not have permission to view orders. Make sure you are logged in with a delivery account.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Error fetching orders');
      }
    }
  };

  const filterOrdersByDistance = (orders, userLocation) => {
    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Add distance to each order and sort
    const ordersWithDistance = orders
      .map((order) => {
        const orderLat = order.deliveryLocation?.latitude || order.latitude;
        const orderLon = order.deliveryLocation?.longitude || order.longitude;

        if (!orderLat || !orderLon) {
          return null;
        }

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          orderLat,
          orderLon
        );

        return {
          ...order,
          distance,
        };
      })
      .filter((order) => order !== null && order.distance <= 50) // Filter to 50km radius
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Show top 20 nearest

    return ordersWithDistance;
  };

  const acceptOrder = async (orderId) => {
    if (!token) {
      setError('Please login first');
      return;
    }

    setAcceptingOrderId(orderId);
    try {
      const response = await axios.post(
        `${url}/api/order/accept`,
        { orderId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Order accepted! Starting delivery tracking...');
        setTimeout(() => {
          navigate(`/track-order/${orderId}`);
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to accept order');
        toast.error(response.data.message || 'Failed to accept order');
      }
    } catch (err) {
      console.error('Error accepting order:', err);
      const errorMsg = err.response?.data?.message || 'Error accepting order';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setAcceptingOrderId(null);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Please login to use location services');
    }

    return () => {
      if (window.gpsWatchId !== undefined) {
        navigator.geolocation.clearWatch(window.gpsWatchId);
      }
    };
  }, [token]);

  return (
    <div className="nearest-orders">
      <div className="nearest-orders-container">
        <h1>Find Closest Orders</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="location-controls">
          <button
            className="gps-btn"
            onClick={activateGPS}
            disabled={loading || tracking}
          >
            {loading ? 'Activating GPS...' : '📍 Activate GPS'}
          </button>

          {location && (
            <button
              className={`tracking-btn ${tracking ? 'active' : ''}`}
              onClick={tracking ? stopTracking : startContinuousTracking}
            >
              {tracking ? '⏹️ Stop Tracking' : '▶️ Start Continuous Tracking'}
            </button>
          )}
        </div>

        {location && (
          <div className="location-info">
            <h3>Current Location</h3>
            <div className="location-details">
              <p>
                <strong>Latitude:</strong> {location.latitude.toFixed(6)}
              </p>
              <p>
                <strong>Longitude:</strong> {location.longitude.toFixed(6)}
              </p>
              <p>
                <strong>Accuracy:</strong> ±{location.accuracy.toFixed(0)} meters
              </p>
              <p>
                <strong>Updated:</strong> {new Date(location.timestamp).toLocaleTimeString()}
              </p>
            </div>

            <button className="fetch-orders-btn" onClick={fetchNearestOrders}>
              🔍 Find Closest Orders
            </button>
          </div>
        )}

        {location && (
          <div className="map-container">
            <div
              ref={mapRef}
              style={{
                height: '400px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>
        )}

        {nearestOrders.length > 0 && (
          <div className="orders-list">
            <h3>Nearby Orders ({nearestOrders.length})</h3>
            <div className="orders-grid">
              {nearestOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <h4>Order {order._id.substring(0, 8)}...</h4>
                    <span className="distance">
                      {order.distance ? `${order.distance.toFixed(2)} km` : 'N/A'}
                    </span>
                  </div>
                  <div className="order-details">
                    <p>
                      <strong>Customer:</strong> {order.customerName || 'Unknown'}
                    </p>
                    <p>
                      <strong>Items:</strong> {order.items?.length || 0}
                    </p>
                    <p>
                      <strong>Total:</strong> Da{order.amount || 0}
                    </p>
                    <p>
                      <strong>Status:</strong> {order.status || 'Pending'}
                    </p>
                  </div>
                  <button
                    className="accept-order-btn"
                    onClick={() => acceptOrder(order._id)}
                    disabled={acceptingOrderId === order._id}
                  >
                    {acceptingOrderId === order._id ? 'Accepting...' : 'Accept Order'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!location && !error && (
          <div className="placeholder">
            <p>Click "Activate GPS" to start finding nearby orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearestOrders;
