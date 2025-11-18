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

// Custom icons for different locations
const createCustomIcon = (color) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-${color}.png`,
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
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});
  
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [deliveryPerson, setDeliveryPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distances, setDistances] = useState({
    shopToDelivery: null,
    shopToCustomer: null,
    deliveryToCustomer: null,
  });

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Fetch order and related data
  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order details
      const orderResponse = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      if (!orderResponse.data.success) {
        setError('Failed to fetch order details');
        return;
      }

      const currentOrder = orderResponse.data.data.find(
        (o) => o._id === orderId
      );

      if (!currentOrder) {
        setError('Order not found');
        return;
      }

      setOrder(currentOrder);

      // Calculate distances if we have locations
      // Use shop location for distance calculation (will be fetched later), fallback to pickupLocation
      const shopLat = currentOrder.pickupLocation?.latitude;
      const shopLng = currentOrder.pickupLocation?.longitude;
      const customerLat = currentOrder.deliveryLocation?.latitude;
      const customerLng = currentOrder.deliveryLocation?.longitude;

      if (shopLat && customerLat) {
        const distanceToDelivery = calculateDistance(
          shopLat,
          shopLng,
          customerLat,
          customerLng
        );

        const newDistances = {
          shopToCustomer: distanceToDelivery,
          shopToDelivery: null,
          deliveryToCustomer: null,
        };

        // Fetch delivery person location if assigned
        if (currentOrder.assignedDeliveryPerson) {
          try {
            const deliveryResponse = await axios.get(
              `${url}/api/user/${currentOrder.assignedDeliveryPerson}`,
              { headers: { token } }
            );

            if (
              deliveryResponse.data.success &&
              deliveryResponse.data.user.lastKnownLocation?.latitude
            ) {
              setDeliveryPerson(deliveryResponse.data.user);

              const distanceShopToDelivery = calculateDistance(
                currentOrder.pickupLocation.latitude,
                currentOrder.pickupLocation.longitude,
                deliveryResponse.data.user.lastKnownLocation.latitude,
                deliveryResponse.data.user.lastKnownLocation.longitude
              );

              const distanceDeliveryToCustomer = calculateDistance(
                deliveryResponse.data.user.lastKnownLocation.latitude,
                deliveryResponse.data.user.lastKnownLocation.longitude,
                currentOrder.deliveryLocation.latitude,
                currentOrder.deliveryLocation.longitude
              );

              newDistances.shopToDelivery = distanceShopToDelivery;
              newDistances.deliveryToCustomer = distanceDeliveryToCustomer;
            }
          } catch (err) {
            console.error('Error fetching delivery person:', err);
          }
        }

        setDistances(newDistances);
      }

      // Fetch shop data using shopId from order items
      if (currentOrder.items && currentOrder.items.length > 0 && currentOrder.items[0].shopId) {
        try {
          const shopResponse = await axios.get(
            `${url}/api/shop/${currentOrder.items[0].shopId}`
          );
          if (shopResponse.data.success) {
            setShop(shopResponse.data.shop);
          }
        } catch (err) {
          console.error('Error fetching shop:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError(
        err.response?.data?.message || 'Failed to load order tracking data'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initialize and update map
  useEffect(() => {
    if (!order || !mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([0, 0], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Clear existing markers and polylines
    Object.values(markersRef.current).forEach((marker) =>
      mapInstance.current.removeLayer(marker)
    );
    Object.values(polylinesRef.current).forEach((polyline) =>
      mapInstance.current.removeLayer(polyline)
    );
    markersRef.current = {};
    polylinesRef.current = {};

    const bounds = [];

    // Add shop marker (use shop location if available, fallback to order pickupLocation)
    const shopLocation = shop?.location || order.pickupLocation;
    if (shopLocation?.latitude) {
      const shopMarker = L.marker(
        [shopLocation.latitude, shopLocation.longitude],
        { icon: shopIcon }
      )
        .bindPopup(`<div class="marker-popup"><strong>Shop</strong><br/>${shop?.name || 'Shop'}</div>`)
        .addTo(mapInstance.current);

      markersRef.current.shop = shopMarker;
      bounds.push([shopLocation.latitude, shopLocation.longitude]);
    }

    // Add delivery person marker if available
    if (
      deliveryPerson &&
      deliveryPerson.lastKnownLocation?.latitude
    ) {
      const deliveryMarker = L.marker(
        [
          deliveryPerson.lastKnownLocation.latitude,
          deliveryPerson.lastKnownLocation.longitude,
        ],
        { icon: deliveryIcon }
      )
        .bindPopup(`<div class="marker-popup"><strong>Delivery Person</strong><br/>${deliveryPerson.name || 'Driver'}</div>`)
        .addTo(mapInstance.current);

      markersRef.current.delivery = deliveryMarker;
      bounds.push([
        deliveryPerson.lastKnownLocation.latitude,
        deliveryPerson.lastKnownLocation.longitude,
      ]);
    }

    // Add customer marker (delivery location)
    if (order.deliveryLocation?.latitude) {
      const customerMarker = L.marker(
        [order.deliveryLocation.latitude, order.deliveryLocation.longitude],
        { icon: customerIcon }
      )
        .bindPopup(`<div class="marker-popup"><strong>Delivery Location</strong></div>`)
        .addTo(mapInstance.current);

      markersRef.current.customer = customerMarker;
      bounds.push([order.deliveryLocation.latitude, order.deliveryLocation.longitude]);
    }

    // Draw polyline from shop to customer
    if (shopLocation?.latitude && order.deliveryLocation?.latitude) {
      const route = L.polyline(
        [
          [shopLocation.latitude, shopLocation.longitude],
          [order.deliveryLocation.latitude, order.deliveryLocation.longitude],
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

    // Draw polyline from shop to delivery person to customer (if delivery assigned)
    if (
      deliveryPerson &&
      deliveryPerson.lastKnownLocation?.latitude &&
      shopLocation?.latitude &&
      order.deliveryLocation?.latitude
    ) {
      const deliveryRoute = L.polyline(
        [
          [shopLocation.latitude, shopLocation.longitude],
          [
            deliveryPerson.lastKnownLocation.latitude,
            deliveryPerson.lastKnownLocation.longitude,
          ],
          [order.deliveryLocation.latitude, order.deliveryLocation.longitude],
        ],
        {
          color: '#4ECDC4',
          weight: 3,
          opacity: 0.8,
        }
      ).addTo(mapInstance.current);

      polylinesRef.current.deliveryRoute = deliveryRoute;
    }

    // Fit map to bounds
    if (bounds.length > 0) {
      const bounds_obj = L.latLngBounds(bounds);
      mapInstance.current.fitBounds(bounds_obj, { padding: [50, 50] });
    }
  }, [order, deliveryPerson, shop]);

  // Fetch data on mount
  useEffect(() => {
    if (token && orderId) {
      fetchOrderData();
    }
  }, [token, orderId, url]);

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
        <button onClick={() => navigate('/myorders')} className="back-btn">
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-map-error">
        <h2>Order Not Found</h2>
        <p>The requested order could not be found.</p>
        <button onClick={() => navigate('/myorders')} className="back-btn">
          Back to Orders
        </button>
      </div>
    );
  }

  const isAccepted = order.acceptedAt ? true : false;

  return (
    <div className="order-tracking-map">
      <div className="tracking-map-header">
        <button onClick={() => navigate('/myorders')} className="back-button">
          ← Back
        </button>
        <h1>Track Order #{order._id?.substring(0, 8)}...</h1>
        <div className="order-status">
          {isAccepted ? (
            <span className="status-badge accepted">✓ Accepted</span>
          ) : (
            <span className="status-badge pending">⏳ Pending</span>
          )}
        </div>
      </div>

      <div className="tracking-map-container">
        <div className="map-wrapper" ref={mapRef}></div>

        <div className="tracking-info-panel">
          <div className="info-section">
            <h2>Order Information</h2>
            <div className="info-item">
              <label>Order Status</label>
              <span className={`status-text ${isAccepted ? 'accepted' : 'pending'}`}>
                {isAccepted ? 'Accepted' : 'Pending'}
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
            <h2>Distance Information</h2>
            {distances.shopToCustomer ? (
              <div className="info-item">
                <label>Shop to Delivery Location</label>
                <span className="distance-value">
                  {distances.shopToCustomer.toFixed(2)} km
                </span>
              </div>
            ) : null}

            {isAccepted && deliveryPerson ? (
              <>
                <div className="info-item">
                  <label>Delivery Person</label>
                  <span>{deliveryPerson.name || 'Driver'}</span>
                </div>
                {distances.shopToDelivery !== null && (
                  <div className="info-item">
                    <label>Shop to Delivery Person</label>
                    <span className="distance-value">
                      {distances.shopToDelivery.toFixed(2)} km
                    </span>
                  </div>
                )}
                {distances.deliveryToCustomer !== null && (
                  <div className="info-item">
                    <label>Delivery Person to Customer</label>
                    <span className="distance-value">
                      {distances.deliveryToCustomer.toFixed(2)} km
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="info-item pending-info">
                <span>⏳ Waiting for delivery person assignment...</span>
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
              <span>Delivery Person</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker red">●</span>
              <span>Delivery Location</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/myorders')}
            className="action-btn"
          >
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingMap;
