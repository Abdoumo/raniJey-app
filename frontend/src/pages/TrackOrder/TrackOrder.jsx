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
  const initMapRef = useRef(false);

  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDelivered, setIsDelivered] = useState(false);
  const [deliveryPerson, setDeliveryPerson] = useState(null);

  const { location: autoLocation } = useAutoTracking();
  const userId = token ? localStorage.getItem('userId') : null;
  const { isConnected, locationUpdates, subscribeToOrder, sendLocation } = useTracking(
    url,
    token,
    userId,
    userRole || 'user'
  );

  useEffect(() => {
    if (userRole === 'user') {
      setError('This page is only for delivery persons');
    }
  }, [userRole]);

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

  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${(distanceKm * 1000).toFixed(0)}m`;
    }
    return `${distanceKm.toFixed(2)}km`;
  };

  const calculateETA = (distanceKm) => {
    const averageSpeed = 30;
    const hours = distanceKm / averageSpeed;
    const minutes = Math.round(hours * 60);
    return Math.max(minutes, 1);
  };

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

        if (response.data.order.assignedDeliveryPerson) {
          try {
            const deliveryResponse = await axios.get(
              `${url}/api/user/${response.data.order.assignedDeliveryPerson}`,
              { headers: { token } }
            );
            if (deliveryResponse.data.success) {
              setDeliveryPerson(deliveryResponse.data.user);
            }
          } catch (err) {
            console.error('Error fetching delivery person:', err);
          }
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

  const initializeMap = () => {
    if (initMapRef.current || !mapRef.current) return;
    if (!customerLocation || !customerLocation.latitude || !customerLocation.longitude) return;

    try {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const center = [customerLocation.latitude, customerLocation.longitude];

      const map = L.map(mapRef.current, {
        center: center,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        preferCanvas: true,
        attributionControl: true,
      });

      const tileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          minZoom: 0,
          attribution: 'Tiles © Esri',
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        }
      );

      tileLayer.addTo(map);
      map.invalidateSize();

      const customerIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [32, 41],
        iconAnchor: [16, 41],
        popupAnchor: [0, -41],
        shadowSize: [41, 41],
      });

      customMarkerRef.current = L.marker([customerLocation.latitude, customerLocation.longitude], {
        title: 'Customer Delivery Address',
        icon: customerIcon,
      }).addTo(map).bindPopup('Delivery Location');

      mapInstance.current = map;
      initMapRef.current = true;
      console.log('Map initialized successfully at', center);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  };

  const updateDeliveryMarker = (location) => {
    if (!location || !location.latitude || !location.longitude || !mapInstance.current) return;

    try {
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
      ).addTo(mapInstance.current);

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
    } catch (err) {
      console.error('Error updating delivery marker:', err);
    }
  };

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

  useEffect(() => {
    if (autoLocation && isConnected) {
      sendLocation(autoLocation.latitude, autoLocation.longitude, autoLocation.accuracy);
    }
  }, [autoLocation, isConnected, sendLocation]);

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

  useEffect(() => {
    if (!token) {
      setError('Please login first');
      return;
    }
    fetchOrderDetails();
  }, [orderId, token]);

  useEffect(() => {
    if (order && !isDelivered) {
      if (customerLocation) {
        initializeMap();
      } else if (order.deliveryLocation) {
        setCustomerLocation(order.deliveryLocation);
      }

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
  }, [order, customerLocation, isConnected, orderId]);

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
            {order?.assignedAt && (
              <div className="status-item">
                <span className="label">Accepted:</span>
                <span className="value">✓ Yes</span>
              </div>
            )}
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

          <div className="info-section">
            <h3>Customer Information</h3>
            <div className="customer-details">
              <p>
                <strong>Name:</strong> {order?.customerName || 'Not provided'}
              </p>
              <p>
                <strong>Phone:</strong> {order?.address?.phone || 'Not provided'}
              </p>
              <p>
                <strong>Email:</strong> {order?.customerEmail || 'Not provided'}
              </p>
              {order?.deliveryLocation && (
                <p>
                  <strong>Delivery Location:</strong> ({order.deliveryLocation.latitude?.toFixed(4)}, {order.deliveryLocation.longitude?.toFixed(4)})
                </p>
              )}
            </div>
          </div>

          {order?.assignedDeliveryPerson && deliveryPerson && (
            <div className="info-section">
              <h3>Delivery Person</h3>
              <div className="delivery-person-details">
                <p>
                  <strong>Name:</strong> {deliveryPerson?.name || 'Not provided'}
                </p>
                <p>
                  <strong>Phone:</strong> {deliveryPerson?.phone || 'Not provided'}
                </p>
              </div>
            </div>
          )}

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
