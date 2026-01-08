import React, { useEffect, useCallback, useRef, useState } from 'react';
import trackingService from '../services/trackingService';

export const useTracking = (url, token, userId, userRole) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [orderUpdates, setOrderUpdates] = useState({});
  const [locationUpdates, setLocationUpdates] = useState({});
  const listenerRefsRef = useRef({});

  useEffect(() => {
    // Skip if token or userId is missing
    if (!token || !userId) {
      setIsConnected(false);
      return;
    }

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleOrderUpdate = (data) => {
      setOrderUpdates((prev) => ({
        ...prev,
        [data.orderId]: data,
      }));
    };

    const handleLocationUpdate = (data) => {
      setLocationUpdates((prev) => ({
        ...prev,
        [data.userId || data.deliveryPersonId]: data,
      }));
    };

    const handleError = (errorData) => {
      // Only show error if it's critical
      if (errorData.critical) {
        setError(errorData.message);
      } else {
        // For non-critical errors, log but don't show to user
        console.debug('Tracking error (non-critical):', errorData.message);
        setError(null);
      }
    };

    // Register listeners
    trackingService.on('connect', handleConnect);
    trackingService.on('disconnect', handleDisconnect);
    trackingService.on('orderUpdate', handleOrderUpdate);
    trackingService.on('locationUpdate', handleLocationUpdate);
    trackingService.on('error', handleError);

    listenerRefsRef.current = {
      handleConnect,
      handleDisconnect,
      handleOrderUpdate,
      handleLocationUpdate,
      handleError,
    };

    // Connect if not already connected
    if (!trackingService.isReady()) {
      console.log('[useTracking] Attempting to connect to WebSocket:', { url, userId, userRole });
      trackingService.connect(url, token, userId, userRole).catch((error) => {
        console.warn('[useTracking] WebSocket connection failed, using HTTP fallback:', error?.message || error);
      });
    } else {
      console.log('[useTracking] WebSocket already connected');
    }

    return () => {
      // Cleanup listeners
      trackingService.off('connect', listenerRefsRef.current.handleConnect);
      trackingService.off('disconnect', listenerRefsRef.current.handleDisconnect);
      trackingService.off('orderUpdate', listenerRefsRef.current.handleOrderUpdate);
      trackingService.off('locationUpdate', listenerRefsRef.current.handleLocationUpdate);
      trackingService.off('error', listenerRefsRef.current.handleError);
    };
  }, [token, userId, url, userRole]);

  const sendLocation = useCallback((latitude, longitude, accuracy) => {
    return trackingService.sendLocation(latitude, longitude, accuracy);
  }, []);

  const subscribeToOrder = useCallback((orderId) => {
    return trackingService.subscribeToOrder(orderId);
  }, []);

  const unsubscribeFromOrder = useCallback((orderId) => {
    return trackingService.unsubscribeFromOrder(orderId);
  }, []);

  const acceptOrder = useCallback((orderId) => {
    return trackingService.acceptOrder(orderId);
  }, []);

  const startDelivery = useCallback((orderId) => {
    return trackingService.startDelivery(orderId);
  }, []);

  const completeDelivery = useCallback((orderId, notes = '') => {
    return trackingService.completeDelivery(orderId, notes);
  }, []);

  return {
    isConnected,
    error,
    orderUpdates,
    locationUpdates,
    sendLocation,
    subscribeToOrder,
    unsubscribeFromOrder,
    acceptOrder,
    startDelivery,
    completeDelivery,
  };
};
