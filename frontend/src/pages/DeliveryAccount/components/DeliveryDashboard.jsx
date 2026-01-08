import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../../context/StoreContext';
import { useTracking } from '../../../hooks/useTracking';
import { useAutoTracking } from '../../../hooks/useAutoTracking';
import { toast } from 'react-toastify';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/DeliveryDashboard.css';

const DeliveryDashboard = () => {
  const { url, token, userRole } = useContext(StoreContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const fetchIntervalRef = useRef(null);

  const { location: autoLocation, error: locationError } = useAutoTracking();
  const [displayLocation, setDisplayLocation] = useState(null);
  const [nearestOrders, setNearestOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [error, setError] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  const userId = token ? localStorage.getItem('userId') : null;
  const { isConnected, sendLocation, subscribeToOrder } = useTracking(url, token, userId, userRole || 'delivery');

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

  const filterOrdersByDistance = (orders, userLocation) => {
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
    return [...ordersWithLocation, ...ordersWithoutLocation].slice(0, 20);
  };

  const fetchNearestOrders = async (location) => {
    if (!location || !token) {
      console.log('[DeliveryDashboard] Missing location or token:', { hasLocation: !!location, hasToken: !!token });
      return;
    }

    try {
      setLoading(true);
      console.log('[DeliveryDashboard] Fetching orders for location:', location);
      let response;
      let endpointUsed = '';

      const endpoints = [
        { url: `${url}/api/order/nearest`, params: { latitude: location.latitude, longitude: location.longitude } },
        { url: `${url}/api/order/available`, params: {} },
        { url: `${url}/api/order/pending`, params: {} },
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`[DeliveryDashboard] Trying endpoint: ${endpoint.url}`);
          response = await axios.get(endpoint.url, {
            params: endpoint.params,
            headers: { token },
          });
          endpointUsed = endpoint.url;
          console.log(`[DeliveryDashboard] Successfully fetched from ${endpoint.url}:`, response.data);
          break;
        } catch (err) {
          console.log(`[DeliveryDashboard] Endpoint ${endpoint.url} failed:`, err.response?.status, err.response?.data?.message);
          if (err.response?.status === 404 || err.response?.status === 401 || err.response?.status === 403) {
            continue;
          } else {
            throw err;
          }
        }
      }

      if (!response) {
        console.error('[DeliveryDashboard] No endpoint succeeded');
        setError('Unable to fetch nearby orders. Please check your connection and try again.');
        return;
      }

      if (response.data.success) {
        const orders = response.data.orders || response.data.data || [];
        console.log(`[DeliveryDashboard] Received ${orders.length} orders from backend`);

        if (!endpointUsed.includes('nearest')) {
          const nearbyOrders = filterOrdersByDistance(orders, location);
          console.log(`[DeliveryDashboard] Filtered to ${nearbyOrders.length} nearby orders`);
          setNearestOrders(nearbyOrders);
          addOrderMarkers(nearbyOrders);
          setError(nearbyOrders.length === 0 ? 'No nearby orders found. Deliveries will appear here when they become available.' : null);
        } else {
          console.log(`[DeliveryDashboard] Using ${orders.length} orders from nearest endpoint`);
          setNearestOrders(orders);
          addOrderMarkers(orders);
          setError(orders.length === 0 ? 'No nearby orders found. Deliveries will appear here when they become available.' : null);
        }
      } else {
        console.error('[DeliveryDashboard] API returned failure:', response.data.message);
        setError(response.data.message || 'Failed to fetch orders');
      }

      fetchAcceptedOrders();
    } catch (err) {
      console.error('[DeliveryDashboard] Error fetching orders:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error fetching orders';
      console.error('[DeliveryDashboard] Error details:', { status: err.response?.status, message: errorMsg });
      setError(errorMsg);
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
          navigate(`/delivery/account/track-order/${orderId}`);
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
    if (displayLocation && mapRef.current && !mapInstance.current) {
      initializeMap(displayLocation.latitude, displayLocation.longitude);
    }

    if (displayLocation && mapInstance.current) {
      updateUserMarkerLocation(displayLocation.latitude, displayLocation.longitude);
    }
  }, [displayLocation]);

  useEffect(() => {
    if (!token || !displayLocation) return;

    fetchNearestOrders(displayLocation);

    fetchIntervalRef.current = setInterval(() => {
      fetchNearestOrders(displayLocation);
    }, 30000);

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [displayLocation, token]);

  useEffect(() => {
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  const displayOrders = activeTab === 'available' ? nearestOrders : acceptedOrders;

  return (
    <div className="delivery-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Delivery Dashboard</h1>
          <div className="header-tabs">
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
              My Orders ({acceptedOrders.length})
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {locationError && <div className="error-banner">{locationError}</div>}

        {displayLocation ? (
          <>
            {activeTab === 'available' && (
              <div className="location-status">
                <h3>📍 Location Tracking Active</h3>
                <div className="location-coords">
                  <p><strong>Latitude:</strong> {displayLocation.latitude.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {displayLocation.longitude.toFixed(6)}</p>
                  <p><strong>Accuracy:</strong> ±{displayLocation.accuracy.toFixed(0)}m</p>
                  <p><strong>Updated:</strong> {new Date(displayLocation.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            )}

            {loading && activeTab === 'available' && (
              <div className="loading-indicator">
                <p>⏳ Fetching nearby orders...</p>
              </div>
            )}

            {activeTab === 'available' && (
              <div className="map-wrapper">
                <div ref={mapRef} className="map-display" />
              </div>
            )}

            {displayOrders.length > 0 && (
              <div className="orders-section">
                <h3>
                  {activeTab === 'available'
                    ? `Nearby Orders (${nearestOrders.length})`
                    : `My Accepted Orders (${acceptedOrders.length})`}
                </h3>
                <div className="orders-list-grid">
                  {displayOrders.map((order) => (
                    <div key={order._id} className="order-card-item">
                      <div className="card-header">
                        <h4>Order #{order._id.substring(0, 8)}...</h4>
                        <span className="order-distance">
                          {order.distance !== null && order.distance !== undefined
                            ? `${order.distance.toFixed(2)} km`
                            : 'Address-based'}
                        </span>
                      </div>
                      <div className="card-content">
                        <p><strong>Customer:</strong> {order.customerName || 'Unknown'}</p>
                        <p><strong>Items:</strong> {order.items?.length || 0}</p>
                        <p><strong>Total:</strong> Da{order.amount || 0}</p>
                        <p><strong>Status:</strong> {order.status || 'Pending'}</p>
                      </div>
                      {activeTab === 'available' && (
                        <button
                          className="accept-btn"
                          onClick={() => acceptOrder(order._id)}
                          disabled={acceptingOrderId === order._id}
                        >
                          {acceptingOrderId === order._id ? 'Accepting...' : 'Accept Order'}
                        </button>
                      )}
                      {activeTab === 'accepted' && (
                        <button
                          className="track-btn"
                          onClick={() => navigate(`/delivery/account/track-order/${order._id}`)}
                        >
                          Track Order
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayOrders.length === 0 && !loading && !error && (
              <div className="empty-state">
                <p>
                  {activeTab === 'available'
                    ? 'No orders available at the moment. Checking periodically...'
                    : 'No accepted orders yet. Accept orders from the Available tab.'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
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

export default DeliveryDashboard;
