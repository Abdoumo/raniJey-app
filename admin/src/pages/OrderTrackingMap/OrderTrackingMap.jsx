import React, { useContext, useEffect, useRef, useState } from 'react';
import './OrderTrackingMap.css';
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

const OrderTrackingMap = () => {
  const { orderId } = useParams();
  const { url, token, userId } = useContext(StoreContext);
  const navigate = useNavigate();
  const pollIntervalRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});

  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [deliveryPerson, setDeliveryPerson] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distances, setDistances] = useState({
    toShop: null,
    toCustomer: null,
    totalDistance: null,
  });

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

  const formatAddress = (addr) => {
    if (!addr) return 'Not provided';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      const parts = [];
      if (addr.street) parts.push(addr.street);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.zipcode) parts.push(addr.zipcode);
      if (addr.country) parts.push(addr.country);
      return parts.length > 0 ? parts.join(', ') : 'Not provided';
    }
    return 'Not provided';
  };

  const fetchOrderData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      if (showLoading) setError(null);

      const orderResponse = await axios.get(
        `${url}/api/order/${orderId}`,
        { headers: { token }, timeout: 10000 }
      );

      if (!orderResponse.data.success) {
        setError('Failed to fetch order details');
        return;
      }

      const currentOrder = orderResponse.data.order;
      setOrder(currentOrder);

      if (currentOrder.assignedDeliveryPerson) {
        if (typeof currentOrder.assignedDeliveryPerson === 'object') {
          setDeliveryPerson(currentOrder.assignedDeliveryPerson);
        } else if (typeof currentOrder.assignedDeliveryPerson === 'string') {
          try {
            const dpResponse = await axios.get(
              `${url}/api/user/${currentOrder.assignedDeliveryPerson}`,
              { headers: { token }, timeout: 5000 }
            );
            if (dpResponse.data.success && dpResponse.data.user) {
              setDeliveryPerson(dpResponse.data.user);
            }
          } catch (err) {
            console.error('Error fetching delivery person:', err.message);
          }
        }
      }

      const deliveryLat = currentOrder.deliveryLocation?.latitude;
      const deliveryLng = currentOrder.deliveryLocation?.longitude;

      if (currentOrder.items?.[0]?.shopId) {
        try {
          const shopResponse = await axios.get(
            `${url}/api/shop/${currentOrder.items[0].shopId}`,
            { timeout: 8000 }
          );

          if (shopResponse.data.success && shopResponse.data.shop) {
            const fetchedShop = shopResponse.data.shop;
            setShop(fetchedShop);

            const shopLat = fetchedShop.location?.latitude || 36.7372;
            const shopLng = fetchedShop.location?.longitude || 3.0869;

            if (deliveryLat && deliveryLng) {
              const shopToCustomerDist = calculateDistance(
                shopLat,
                shopLng,
                deliveryLat,
                deliveryLng
              );

              const newDistances = {
                totalDistance: shopToCustomerDist,
                toShop: null,
                toCustomer: null,
              };

              if (currentOrder.assignedDeliveryPerson && typeof currentOrder.assignedDeliveryPerson === 'object') {
                if (currentOrder.assignedDeliveryPerson.lastKnownLocation?.latitude) {
                  const dpLat = currentOrder.assignedDeliveryPerson.lastKnownLocation.latitude;
                  const dpLng = currentOrder.assignedDeliveryPerson.lastKnownLocation.longitude;

                  newDistances.toShop = calculateDistance(dpLat, dpLng, shopLat, shopLng);
                  newDistances.toCustomer = calculateDistance(dpLat, dpLng, deliveryLat, deliveryLng);

                  setCurrentLocation({
                    latitude: dpLat,
                    longitude: dpLng,
                  });
                }
              }

              setDistances(newDistances);
            }
          }
        } catch (err) {
          console.error('Error fetching shop:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError(err.response?.data?.message || 'Failed to load order tracking data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (token && orderId && userId) {
      fetchOrderData();
    }
  }, [token, orderId, userId, url]);

  useEffect(() => {
    if (!token || !orderId) return;

    pollIntervalRef.current = setInterval(() => {
      fetchOrderData(false);
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [token, orderId, url, userId]);

  useEffect(() => {
    if (!order || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([36.7372, 3.0869], 13);

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 18,
        }
      ).addTo(mapInstance.current);
    }

    Object.values(markersRef.current).forEach((marker) => {
      try {
        mapInstance.current.removeLayer(marker);
      } catch (e) {
        console.log('Marker already removed');
      }
    });
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

    const shopLat = shop?.location?.latitude || 36.7372;
    const shopLng = shop?.location?.longitude || 3.0869;
    const customerLat = order.deliveryLocation?.latitude;
    const customerLng = order.deliveryLocation?.longitude;
    const dpLat = currentLocation?.latitude;
    const dpLng = currentLocation?.longitude;

    if (shopLat && shopLng) {
      const shopMarker = L.marker([shopLat, shopLng], { icon: shopIcon })
        .bindPopup(
          `<div class="marker-popup"><strong>Shop</strong><br/>${shop?.name || 'Shop Location'}</div>`
        )
        .addTo(mapInstance.current);
      markersRef.current.shop = shopMarker;
      bounds.push([shopLat, shopLng]);
    }

    if (dpLat && dpLng) {
      const dpMarker = L.marker([dpLat, dpLng], { icon: deliveryIcon })
        .bindPopup(
          `<div class="marker-popup"><strong>You (Delivery Person)</strong><br/>${deliveryPerson?.name || 'Driver'}</div>`
        )
        .addTo(mapInstance.current);
      markersRef.current.delivery = dpMarker;
      bounds.push([dpLat, dpLng]);
    }

    if (customerLat && customerLng) {
      const customerMarker = L.marker([customerLat, customerLng], { icon: customerIcon })
        .bindPopup(`<div class="marker-popup"><strong>Customer Location</strong></div>`)
        .addTo(mapInstance.current);
      markersRef.current.customer = customerMarker;
      bounds.push([customerLat, customerLng]);
    }

    if (shopLat && shopLng && customerLat && customerLng && !dpLat) {
      const route = L.polyline(
        [
          [shopLat, shopLng],
          [customerLat, customerLng],
        ],
        {
          color: '#FF6B6B',
          weight: 2,
          opacity: 0.7,
          dashArray: '5, 5',
        }
      ).addTo(mapInstance.current);
      polylinesRef.current.shopToCustomer = route;
    }

    if (dpLat && dpLng && shopLat && shopLng && customerLat && customerLng) {
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
      polylinesRef.current.deliveryRoute = deliveryRoute;
    }

    if (bounds.length > 0) {
      const boundsObj = L.latLngBounds(bounds);
      mapInstance.current.fitBounds(boundsObj, { padding: [50, 50] });
    } else {
      mapInstance.current.setView([36.7372, 3.0869], 13);
    }
  }, [order, deliveryPerson, shop, currentLocation]);

  if (loading) {
    return (
      <div className="order-tracking-map-loading">
        <div className="spinner"></div>
        <p>Loading order tracking map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-map-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-map-error">
        <h2>Order Not Found</h2>
        <p>The requested order could not be found.</p>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="order-tracking-map">
      <div className="tracking-map-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Delivery Order #{order._id?.substring(0, 8)}...</h1>
        <div className="order-status">
          {order.status === 'Delivered' ? (
            <span className="status-badge delivered">✓ Delivered</span>
          ) : order.status === 'Accepted' ? (
            <span className="status-badge accepted">✓ Accepted</span>
          ) : (
            <span className="status-badge pending">⏳ {order.status || 'Pending'}</span>
          )}
        </div>
      </div>

      <div className="tracking-map-container">
        <div className="map-wrapper" ref={mapRef}></div>

        <div className="tracking-info-panel">
          <div className="info-section">
            <h2>Order Information</h2>
            <div className="info-item">
              <label>Customer</label>
              <span>{order.customerName || 'Customer'}</span>
            </div>
            <div className="info-item">
              <label>Delivery Address</label>
              <span>{formatAddress(order.address)}</span>
            </div>
            <div className="info-item">
              <label>Order Status</label>
              <span className={`status-text ${order.status?.toLowerCase()}`}>
                {order.status || 'Pending'}
              </span>
            </div>
            <div className="info-item">
              <label>Items</label>
              <span>{order.items?.length || 0} items</span>
            </div>
            {order.amount && (
              <div className="info-item">
                <label>Total Amount</label>
                <span>Da{order.amount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="info-section">
            <h2>Route Information</h2>
            {distances.toShop !== null && (
              <div className="info-item">
                <label>Distance to Shop</label>
                <span className="distance-value">{distances.toShop.toFixed(2)} km</span>
              </div>
            )}
            {distances.toCustomer !== null && (
              <div className="info-item">
                <label>Distance to Customer</label>
                <span className="distance-value">{distances.toCustomer.toFixed(2)} km</span>
              </div>
            )}
            {distances.totalDistance !== null && (
              <div className="info-item">
                <label>Total Route Distance</label>
                <span className="distance-value">{distances.totalDistance.toFixed(2)} km</span>
              </div>
            )}
          </div>

          <div className="info-section legend">
            <h3>Map Legend</h3>
            <div className="legend-item">
              <span className="legend-marker blue">●</span>
              <span>Shop Location</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker green">●</span>
              <span>Your Location</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker red">●</span>
              <span>Customer Location</span>
            </div>
          </div>

          <button onClick={() => navigate(-1)} className="action-btn">
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingMap;
