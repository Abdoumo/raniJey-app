import React, { useContext, useEffect, useState, useRef } from 'react';
import './NearestOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { useTracking } from '../../hooks/useTracking';
import { useAutoTracking } from '../../hooks/useAutoTracking';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const NearestOrders = () => {
  const { url, token, userRole } = useContext(StoreContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const fetchIntervalRef = useRef(null);

  // Only delivery persons can access this page
  useEffect(() => {
    if (userRole === 'user') {
      navigate('/myorders');
    }
  }, [userRole, navigate]);

  // Auto-tracking location
  const { location: autoLocation, error: locationError } = useAutoTracking();

  // Manual state for display
  const [displayLocation, setDisplayLocation] = useState(null);
  const [nearestOrders, setNearestOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [error, setError] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  // WebSocket tracking - only initialize if user is logged in with valid ID
  const userId = token ? localStorage.getItem('userId') : null;
  const { isConnected, sendLocation, subscribeToOrder } = useTracking(url, token, userId, userRole || 'user');

  // Update display location when auto-location changes
  useEffect(() => {
    if (autoLocation) {
      setDisplayLocation(autoLocation);
    }
  }, [autoLocation]);

  const initializeMap = (lat, lng) => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current).setView([lat, lng], 13);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxZoom: 18,
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

    if (orders.length > 0 && displayLocation) {
      const bounds = L.latLngBounds([[displayLocation.latitude, displayLocation.longitude]]);
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

  const filterOrdersByDistance = (orders, userLocation) => {
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
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

    const ordersWithLocation = [];
    const ordersWithoutLocation = [];

    orders.forEach((order) => {
      const orderLat = order.deliveryLocation?.latitude || order.latitude;
      const orderLon = order.deliveryLocation?.longitude || order.longitude;

      if (orderLat && orderLon) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          orderLat,
          orderLon
        );

        if (distance <= 50) {
          ordersWithLocation.push({
            ...order,
            distance,
          });
        }
      } else {
        ordersWithoutLocation.push({
          ...order,
          distance: null,
        });
      }
    });

    ordersWithLocation.sort((a, b) => a.distance - b.distance);
    const combined = [...ordersWithLocation, ...ordersWithoutLocation].slice(0, 20);

    return combined;
  };

  const fetchNearestOrders = async (location) => {
    if (!location) {
      setError('Waiting for location...');
      return;
    }

    if (!token) {
      setError('Please login first');
      return;
    }

    try {
      setLoading(true);
      let response;
      let endpointUsed = '';

      const endpoints = [
        { url: `${url}/api/order/nearest`, params: { latitude: location.latitude, longitude: location.longitude } },
        { url: `${url}/api/order/available`, params: {} },
        { url: `${url}/api/order/pending`, params: {} },
      ];

      for (const endpoint of endpoints) {
        try {
          response = await axios.get(endpoint.url, {
            params: endpoint.params,
            headers: { token },
          });
          endpointUsed = endpoint.url;
          break;
        } catch (err) {
          if (err.response?.status === 404) {
            continue;
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            continue;
          } else {
            throw err;
          }
        }
      }

      if (!response) {
        setError('Unable to fetch nearby orders. Please try again.');
        return;
      }

      if (response.data.success) {
        const orders = response.data.orders || response.data.data || [];

        if (!endpointUsed.includes('nearest')) {
          const nearbyOrders = filterOrdersByDistance(orders, location);
          setNearestOrders(nearbyOrders);
          addOrderMarkers(nearbyOrders);

          if (nearbyOrders.length === 0) {
            setError('No nearby orders found.');
          } else {
            setError(null);
          }
        } else {
          setNearestOrders(orders);
          addOrderMarkers(orders);

          if (orders.length === 0) {
            setError('No nearby orders found.');
          } else {
            setError(null);
          }
        }
      } else {
        setError(response.data.message || 'Failed to fetch orders');
      }

      // Fetch accepted orders
      fetchAcceptedOrders();
    } catch (err) {
      console.error('Error fetching nearest orders:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view orders.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Error fetching orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedOrders = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        const allOrders = response.data.data || [];
        const accepted = allOrders.filter(
          (order) => order.assignedDeliveryPerson === userId && order.acceptedAt
        );
        setAcceptedOrders(accepted);
      }
    } catch (err) {
      console.error('Error fetching accepted orders:', err);
    }
  };

  const acceptOrder = async (orderId) => {
    if (!token) {
      setError('Please login first');
      return;
    }

    setAcceptingOrderId(orderId);
    try {
      if (isConnected) {
        subscribeToOrder(orderId);
      }

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

  // Initialize map and fetch orders when location is available
  useEffect(() => {
    if (displayLocation && mapRef.current && !mapInstance.current) {
      initializeMap(displayLocation.latitude, displayLocation.longitude);
    }

    if (displayLocation && mapInstance.current) {
      updateUserMarkerLocation(displayLocation.latitude, displayLocation.longitude);
    }
  }, [displayLocation]);

  // Auto-fetch orders every 30 seconds
  useEffect(() => {
    if (!token || !displayLocation) return;

    // Fetch immediately
    fetchNearestOrders(displayLocation);

    // Set up interval for periodic updates
    fetchIntervalRef.current = setInterval(() => {
      fetchNearestOrders(displayLocation);
    }, 30000);

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [displayLocation, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  const displayOrders = activeTab === 'available' ? nearestOrders : acceptedOrders;

  return (
    <div className="nearest-orders">
      <div className="nearest-orders-container">
        <div className="orders-header">
          <h1>Delivery Orders</h1>
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Available Orders ({nearestOrders.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
              onClick={() => setActiveTab('accepted')}
            >
              My Accepted Orders ({acceptedOrders.length})
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {locationError && <div className="error-message">{locationError}</div>}

        {displayLocation ? (
          <>
            {activeTab === 'available' && (
              <div className="location-info">
                <h3>📍 Location Tracking Active</h3>
                <div className="location-details">
                  <p>
                    <strong>Latitude:</strong> {displayLocation.latitude.toFixed(6)}
                  </p>
                  <p>
                    <strong>Longitude:</strong> {displayLocation.longitude.toFixed(6)}
                  </p>
                  <p>
                    <strong>Accuracy:</strong> ±{displayLocation.accuracy.toFixed(0)} meters
                  </p>
                  <p>
                    <strong>Updated:</strong> {new Date(displayLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {loading && activeTab === 'available' && (
              <div className="loading-message">
                <p>⏳ Fetching nearby orders...</p>
              </div>
            )}

            {activeTab === 'available' && (
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

            {displayOrders.length > 0 && (
              <div className="orders-list">
                <h3>
                  {activeTab === 'available'
                    ? `Nearby Orders (${nearestOrders.length})`
                    : `My Accepted Orders (${acceptedOrders.length})`}
                </h3>
                <div className="orders-grid">
                  {displayOrders.map((order) => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <h4>Order {order._id.substring(0, 8)}...</h4>
                        <span className="distance">
                          {order.distance !== null && order.distance !== undefined
                            ? `${order.distance.toFixed(2)} km`
                            : 'Address-based'}
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
                      {activeTab === 'available' && (
                        <button
                          className="accept-order-btn"
                          onClick={() => acceptOrder(order._id)}
                          disabled={acceptingOrderId === order._id}
                        >
                          {acceptingOrderId === order._id ? 'Accepting...' : 'Accept Order'}
                        </button>
                      )}
                      {activeTab === 'accepted' && (
                        <button
                          className="view-details-btn"
                          onClick={() => navigate(`/delivery-order/${order._id}`)}
                        >
                          View Details & Location
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayOrders.length === 0 && !loading && !error && (
              <div className="placeholder">
                <p>
                  {activeTab === 'available'
                    ? 'No orders available at the moment. Checking periodically...'
                    : 'No accepted orders yet. Accept orders from the Available tab.'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="placeholder">
            <p>🔍 Checking location permission...</p>
            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
              {locationError ? locationError : 'If prompted, please allow access to your location.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearestOrders;
