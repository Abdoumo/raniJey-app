import React, { useEffect, useCallback, useRef, useState } from 'react';
import trackingService from '../services/trackingService';

export const useNotifications = (token, userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
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
      // Subscribe to notifications when connected
      if (trackingService.socket) {
        trackingService.socket.emit('SUBSCRIBE_NOTIFICATIONS');
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNotification = (data) => {
      if (data.notification) {
        // Add new notification to the beginning of the list
        setNotifications((prev) => [data.notification, ...prev.slice(0, 49)]);
        // Update unread count
        setUnreadCount(data.unreadCount || 0);
      }
    };

    const handleError = (errorData) => {
      console.error('Notification error:', errorData.message);
      setError(errorData.message);
    };

    // Register listeners
    trackingService.on('connect', handleConnect);
    trackingService.on('disconnect', handleDisconnect);
    trackingService.on('NOTIFICATION', handleNotification);
    trackingService.on('error', handleError);

    listenerRefsRef.current = {
      handleConnect,
      handleDisconnect,
      handleNotification,
      handleError,
    };

    // Connect if not already connected
    if (!trackingService.isReady()) {
      trackingService.connect('', token, userId, 'user').catch((error) => {
        console.warn('WebSocket connection failed:', error?.message || error);
      });
    } else {
      setIsConnected(true);
      // Subscribe to notifications if already connected
      if (trackingService.socket) {
        trackingService.socket.emit('SUBSCRIBE_NOTIFICATIONS');
      }
    }

    return () => {
      // Cleanup listeners
      trackingService.off('connect', listenerRefsRef.current.handleConnect);
      trackingService.off('disconnect', listenerRefsRef.current.handleDisconnect);
      trackingService.off('NOTIFICATION', listenerRefsRef.current.handleNotification);
      trackingService.off('error', listenerRefsRef.current.handleError);
    };
  }, [token, userId]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
  }, []);

  const updateUnreadCount = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  const clearNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    addNotification,
    updateUnreadCount,
    clearNotification,
  };
};
