import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../../context/StoreContext';
import { useTracking } from '../../../hooks/useTracking';
import { useAutoTracking } from '../../../hooks/useAutoTracking';
import { toast } from 'react-toastify';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/TrackOrderPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
  return L.icon({
    iconUrl: `https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const shopIcon = createCustomIcon('blue');
const deliveryIcon = createCustomIcon('green');
const customerIcon = createCustomIcon('red');

const TrackOrderPage = () => {
  const { orderId } = useParams();
  const { url, token, userRole } = useContext(StoreContext);
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});
  const routePointsRef = useRef([]);
  const pollingIntervalRef = useRef(null);
  const mapInitRef = useRef(false);
  const customerMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [shopToCustomerDistance, setShopToCustomerDistance] = useState(null);
  const [deliveryToCustomerDistance, setDeliveryToCustomerDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDelivered, setIsDelivered] = useState(false);
  const [deliveryPerson, setDeliveryPerson] = useState(null);

  const { location: autoLocation, startContinuousTracking } = useAutoTracking();
  const userId = token ? localStorage.getItem('userId') : null;
  const { isConnected, locationUpdates, subscribeToOrder, sendLocation } = useTracking(
    url,
    token,
    userId,
    userRole || 'delivery'
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
        const orderData = response.data.order;
        setOrder(orderData);

        if (orderData.deliveryLocation) {
          setCustomerLocation(orderData.deliveryLocation);
        }

        // Use shop data if provided in order response
        if (orderData.shop) {
          setShop(orderData.shop);
        } else if (orderData.shopId) {
          try {
            const shopResponse = await axios.get(`${url}/api/shop/${orderData.shopId}`, {
              headers: { token },
            });
            if (shopResponse.data.success) {
              setShop(shopResponse.data.shop);
            }
          } catch (err) {
            console.error('Error fetching shop:', err);
          }
        }

        if (orderData.assignedDeliveryPerson) {
          try {
            const deliveryResponse = await axios.get(
              `${url}/api/user/${orderData.assignedDeliveryPerson}`,
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

  const initializeMap = (retries = 0) => {
    console.log('[TrackOrderPage] initializeMap called (retry', retries + ')', 'mapInitRef.current:', mapInitRef.current, 'mapRef.current:', mapRef.current);

    if (mapInitRef.current) {
      console.log('[TrackOrderPage] Map already initialized, returning');
      return;
    }

    if (!mapRef.current) {
      if (retries < 5) {
        console.warn('[TrackOrderPage] mapRef not attached yet (retry', retries + '), retrying in 200ms');
        setTimeout(() => initializeMap(retries + 1), 200);
      } else {
        console.error('[TrackOrderPage] mapRef still not available after 5 retries');
      }
      return;
    }

    const location = customerLocation || (order?.deliveryLocation);
    console.log('[TrackOrderPage] Location check - customerLocation:', customerLocation, 'order.deliveryLocation:', order?.deliveryLocation, 'resolved location:', location);

    if (!location || !location.latitude || !location.longitude) {
      console.warn('[TrackOrderPage] No valid location for map, location:', location);
      return;
    }

    try {
      console.log('[TrackOrderPage] Initializing map with location:', location);

      // Check if container has proper dimensions
      const containerHeight = mapRef.current.offsetHeight;
      const containerWidth = mapRef.current.offsetWidth;
      console.log('[TrackOrderPage] Container dimensions - height:', containerHeight, 'width:', containerWidth);

      if (!containerHeight || !containerWidth) {
        console.warn('[TrackOrderPage] Map container has no dimensions (', containerHeight, 'x', containerWidth, '), retrying in 200ms');
        setTimeout(() => initializeMap(0), 200);
        return;
      }

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        customerMarkerRef.current = null;
        deliveryMarkerRef.current = null;
        polylineRef.current = null;
        routePointsRef.current = [];
      }

      const center = [location.latitude, location.longitude];
      console.log('[TrackOrderPage] Creating map centered at:', center);

      const map = L.map(mapRef.current, {
        center: center,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      console.log('[TrackOrderPage] L.map created successfully:', map);

      const tileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          minZoom: 0,
          attribution: 'Tiles © Esri',
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          crossOrigin: 'anonymous',
        }
      );

      tileLayer.addTo(map);

      console.log('[TrackOrderPage] Tile layer added, calling invalidateSize');
      map.invalidateSize(true);

      mapInstance.current = map;
      mapInitRef.current = true;
      console.log('[TrackOrderPage] Map initialized successfully');

      // Update markers after map initialization
      setTimeout(() => {
        updateMapMarkers();
      }, 100);
    } catch (err) {
      console.error('[TrackOrderPage] Error initializing map:', err);
      setError('Failed to initialize map');
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstance.current) return;

    try {
      console.log('[TrackOrderPage] updateMapMarkers - shop:', shop, 'deliveryLocation:', deliveryLocation, 'customerLocation:', customerLocation);

      // Remove existing markers
      Object.values(markersRef.current).forEach((marker) => {
        try {
          mapInstance.current.removeLayer(marker);
        } catch (e) {
          console.log('Marker already removed');
        }
      });

      // Remove existing polylines
      Object.values(polylinesRef.current).forEach((polyline) => {
        try {
          mapInstance.current.removeLayer(polyline);
        } catch (e) {
          console.log('Polyline already removed');
        }
      });

      markersRef.current = {};
      polylinesRef.current = {};

      const bounds = [];

      // Add shop marker
      const shopLat = shop?.location?.latitude;
      const shopLng = shop?.location?.longitude;
      console.log('[TrackOrderPage] Shop location check - shopLat:', shopLat, 'shopLng:', shopLng);
      if (shopLat && shopLng) {
        const shopMarker = L.marker([shopLat, shopLng], { icon: shopIcon })
          .bindPopup(`<div class="marker-popup"><strong>Shop</strong><br/>${shop?.name || 'Shop Location'}</div>`)
          .addTo(mapInstance.current);
        markersRef.current.shop = shopMarker;
        bounds.push([shopLat, shopLng]);
      }

      // Add delivery person marker
      const dpLat = deliveryLocation?.latitude;
      const dpLng = deliveryLocation?.longitude;
      if (dpLat && dpLng) {
        const deliveryMarker = L.marker([dpLat, dpLng], { icon: deliveryIcon })
          .bindPopup(`<div class="marker-popup"><strong>Delivery Person</strong><br/>${deliveryPerson?.name || 'Driver'}</div>`)
          .addTo(mapInstance.current);
        markersRef.current.delivery = deliveryMarker;
        bounds.push([dpLat, dpLng]);
      }

      // Add customer marker
      const customerLat = customerLocation?.latitude;
      const customerLng = customerLocation?.longitude;
      if (customerLat && customerLng) {
        const customerMarker = L.marker([customerLat, customerLng], { icon: customerIcon })
          .bindPopup(`<div class="marker-popup"><strong>Delivery Location</strong></div>`)
          .addTo(mapInstance.current);
        markersRef.current.customer = customerMarker;
        bounds.push([customerLat, customerLng]);
      }

      // Draw routes with distance labels
      if (shopLat && shopLng && customerLat && customerLng && !dpLat) {
        const shopToCustomerDist = calculateDistance(shopLat, shopLng, customerLat, customerLng);
        const route = L.polyline(
          [
            [shopLat, shopLng],
            [customerLat, customerLng],
          ],
          {
            color: '#FF6B6B',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 5',
          }
        ).addTo(mapInstance.current);

        // Add distance label to route
        const midLat = (shopLat + customerLat) / 2;
        const midLng = (shopLng + customerLng) / 2;
        const distanceLabel = L.marker([midLat, midLng], {
          icon: L.divIcon({
            className: 'distance-label',
            html: `<div class="distance-label-text">${formatDistance(shopToCustomerDist)}</div>`,
            iconSize: [60, 30],
            iconAnchor: [30, 15],
          }),
        }).addTo(mapInstance.current);

        polylinesRef.current.shopToCustomer = route;
        polylinesRef.current.shopToCustomerLabel = distanceLabel;
      }

      if (shopLat && shopLng && dpLat && dpLng && customerLat && customerLng) {
        const shopToDeliveryDist = calculateDistance(shopLat, shopLng, dpLat, dpLng);
        const deliveryToCustomerDist = calculateDistance(dpLat, dpLng, customerLat, customerLng);

        const deliveryRoute = L.polyline(
          [
            [shopLat, shopLng],
            [dpLat, dpLng],
            [customerLat, customerLng],
          ],
          {
            color: '#4ECDC4',
            weight: 3,
            opacity: 0.8,
          }
        ).addTo(mapInstance.current);

        // Add distance label for shop to delivery
        const mid1Lat = (shopLat + dpLat) / 2;
        const mid1Lng = (shopLng + dpLng) / 2;
        const label1 = L.marker([mid1Lat, mid1Lng], {
          icon: L.divIcon({
            className: 'distance-label',
            html: `<div class="distance-label-text">${formatDistance(shopToDeliveryDist)}</div>`,
            iconSize: [60, 30],
            iconAnchor: [30, 15],
          }),
        }).addTo(mapInstance.current);

        // Add distance label for delivery to customer
        const mid2Lat = (dpLat + customerLat) / 2;
        const mid2Lng = (dpLng + customerLng) / 2;
        const label2 = L.marker([mid2Lat, mid2Lng], {
          icon: L.divIcon({
            className: 'distance-label',
            html: `<div class="distance-label-text">${formatDistance(deliveryToCustomerDist)}</div>`,
            iconSize: [60, 30],
            iconAnchor: [30, 15],
          }),
        }).addTo(mapInstance.current);

        polylinesRef.current.deliveryRoute = deliveryRoute;
        polylinesRef.current.shopToDeliveryLabel = label1;
        polylinesRef.current.deliveryToCustomerLabel = label2;
      }

      // Fit bounds
      if (bounds.length > 0) {
        const boundsObj = L.latLngBounds(bounds);
        mapInstance.current.fitBounds(boundsObj, { padding: [50, 50] });
      }
    } catch (err) {
      console.error('Error updating map markers:', err);
    }
  };

  const pollDeliveryLocation = () => {
    const intervalId = setInterval(async () => {
      try {
        console.log('[TrackOrderPage] Polling delivery location for orderId:', orderId);
        const response = await axios.get(`${url}/api/location/order/${orderId}`, {
          headers: { token },
        });

        console.log('[TrackOrderPage] Location poll response:', response.data);

        if (response.data.success && response.data.location) {
          const location = response.data.location;
          console.log('[TrackOrderPage] Delivery location retrieved:', location);
          setDeliveryLocation(location);
        } else {
          console.warn('[TrackOrderPage] Location poll failed or no location:', response.data.message);
        }
      } catch (err) {
        console.error('[TrackOrderPage] Error polling location:', err.response?.data || err.message);
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
          navigate('/delivery/account');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to mark as delivered');
      }
    } catch (err) {
      console.error('Error marking delivered:', err);
      setError(err.response?.data?.message || 'Error marking order as delivered');
    }
  };

  // Start continuous location tracking when page loads
  useEffect(() => {
    if (token && userRole === 'delivery') {
      console.log('[TrackOrderPage] Starting continuous location tracking');
      startContinuousTracking();
    }
  }, [token, userRole, startContinuousTracking]);

  // Send location updates to backend when available
  useEffect(() => {
    if (autoLocation) {
      console.log('[TrackOrderPage] Location update available, isConnected:', isConnected);
      if (isConnected) {
        console.log('[TrackOrderPage] Sending location via WebSocket');
        sendLocation(autoLocation.latitude, autoLocation.longitude, autoLocation.accuracy);
      } else {
        // Fallback: Send location via HTTP if WebSocket not connected
        console.log('[TrackOrderPage] WebSocket not connected, sending location via HTTP');
        axios.post(
          `${url}/api/location/update`,
          {
            latitude: autoLocation.latitude,
            longitude: autoLocation.longitude,
            accuracy: autoLocation.accuracy,
          },
          { headers: { token } }
        ).catch((err) => {
          console.error('[TrackOrderPage] Error sending location via HTTP:', err.message);
        });
      }
    }
  }, [autoLocation, isConnected, sendLocation, url, token]);

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

    // Calculate shop to customer distance
    if (shop?.location && customerLocation) {
      const shopToCustomer = calculateDistance(
        shop.location.latitude,
        shop.location.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      );
      setShopToCustomerDistance(shopToCustomer);
    }

    // Calculate delivery person to customer distance
    if (deliveryLocation && customerLocation) {
      const deliveryToCustomer = calculateDistance(
        deliveryLocation.latitude,
        deliveryLocation.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      );
      setDeliveryToCustomerDistance(deliveryToCustomer);
    }
  }, [deliveryLocation, customerLocation, shop]);

  useEffect(() => {
    if (!token) {
      setError('Please login first');
      return;
    }
    fetchOrderDetails();
  }, [orderId, token]);

  useEffect(() => {
    if (order && !isDelivered) {
      // Initialize map when location is available
      if (order.deliveryLocation || customerLocation) {
        console.log('[TrackOrderPage] useEffect: triggering initializeMap with delay');
        const timeoutId = setTimeout(() => {
          console.log('[TrackOrderPage] useEffect: calling initializeMap after delay');
          initializeMap(0);
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [order, customerLocation]);

  useEffect(() => {
    if (order && !isDelivered) {
      // Set up real-time subscription or polling for delivery location updates
      if (isConnected) {
        console.log('[TrackOrderPage] Subscribing to order updates for orderId:', orderId);
        subscribeToOrder(orderId);
      } else {
        console.log('[TrackOrderPage] WebSocket not connected, setting up polling');
        pollingIntervalRef.current = pollDeliveryLocation();
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, orderId, subscribeToOrder]);

  useEffect(() => {
    if (locationUpdates[orderId]) {
      const location = locationUpdates[orderId];
      setDeliveryLocation(location);
    }
  }, [locationUpdates, orderId]);

  // Update map markers and routes when locations or shop changes
  useEffect(() => {
    if (mapInstance.current && (customerLocation || shop || deliveryLocation)) {
      console.log('[TrackOrderPage] Updating map markers');
      updateMapMarkers();
    }
  }, [shop, customerLocation, deliveryLocation]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        console.log('[TrackOrderPage] Cleaning up map on unmount');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="track-page-loading">
        <div className="spinner"></div>
        <p>Loading order tracking...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="track-page-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="back-to-orders-btn" onClick={() => navigate('/delivery/account')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="track-order-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/delivery/account')}>
          ← Back
        </button>
        <h1>Track Order</h1>
        <div className="order-info-badge">Order #{order?._id?.substring(0, 8)}...</div>
      </div>

      {isDelivered && (
        <div className="success-banner">
          ✅ Order delivered successfully!
        </div>
      )}

      <div className="track-layout">
        <div className="map-panel">
          <div ref={mapRef} className="map-container" />
          <div className="map-legend">
            <div className="legend-title">Map Legend</div>
            <div className="legend-item">
              <span className="legend-marker shop-marker">●</span>
              <span className="legend-label">Shop</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker delivery-marker">●</span>
              <span className="legend-label">Delivery Person</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker customer-marker">●</span>
              <span className="legend-label">Delivery Location</span>
            </div>
          </div>
        </div>

        <div className="info-panel">
          <div className="panel-section">
            <h3>Delivery Status</h3>
            <div className="status-grid">
              <div className="status-row">
                <span className="status-label">Status:</span>
                <span className="status-value">{order?.status || 'In Progress'}</span>
              </div>
              {order?.assignedAt && (
                <div className="status-row">
                  <span className="status-label">Accepted:</span>
                  <span className="status-value">✓ Yes</span>
                </div>
              )}
              {shopToCustomerDistance !== null && (
                <div className="status-row">
                  <span className="status-label">Shop to Delivery:</span>
                  <span className="status-value">{formatDistance(shopToCustomerDistance)}</span>
                </div>
              )}
              {distance !== null && (
                <div className="status-row">
                  <span className="status-label">Distance to Customer:</span>
                  <span className="status-value">{formatDistance(distance)}</span>
                </div>
              )}
              {eta !== null && (
                <div className="status-row">
                  <span className="status-label">ETA:</span>
                  <span className="status-value">{eta} mins</span>
                </div>
              )}
            </div>
          </div>

          <div className="panel-section">
            <h3>Order Details</h3>
            <div className="details-content">
              <p>
                <strong>Items:</strong> {order?.items?.length || 0}
              </p>
              <p>
                <strong>Total:</strong> Da{order?.amount || 0}
              </p>
              <p>
                <strong>Address:</strong>{' '}
                {order?.address
                  ? `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipcode}`
                  : 'Not provided'}
              </p>
            </div>
          </div>

          <div className="panel-section">
            <h3>Customer Information</h3>
            <div className="details-content">
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
                  <strong>Location:</strong> ({order.deliveryLocation.latitude?.toFixed(4)},
                  {order.deliveryLocation.longitude?.toFixed(4)})
                </p>
              )}
            </div>
          </div>

          {order?.assignedDeliveryPerson && deliveryPerson && (
            <div className="panel-section">
              <h3>Delivery Person</h3>
              <div className="details-content">
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
            <button className="deliver-button" onClick={markDelivered}>
              ✅ Mark as Delivered
            </button>
          )}

          {!isDelivered && distance !== null && distance > 0.5 && (
            <div className="notice-box">
              📍 Get closer to customer location to mark as delivered
            </div>
          )}

          {!deliveryLocation && (
            <div className="notice-box">
              ⏳ Waiting for delivery person location...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
