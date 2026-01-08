import { useEffect, useRef, useState, useCallback } from 'react';
import trackingService from '../services/trackingService';

export const useAutoTracking = () => {
  const [location, setLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const permissionTimeoutRef = useRef(null);

  // Check if permission was previously granted
  const checkStoredPermission = useCallback(() => {
    const stored = localStorage.getItem('geolocation_permission_granted');
    if (stored === 'true') {
      setHasPermission(true);
      setPermissionRequested(true);
      return true;
    }
    return false;
  }, []);

  // Check permission status using the Permissions API
  const checkPermissionStatus = useCallback(async () => {
    if (!navigator.permissions) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch (err) {
      console.debug('Permissions API not available, falling back to direct request');
      return null;
    }
  }, []);

  // Start continuous location tracking
  const startContinuousTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (isTracking) {
      return;
    }

    setIsTracking(true);
    setError(null);

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        };
        console.log('[useAutoTracking] Location update received:', { latitude, longitude, accuracy, isReady: trackingService.isReady() });
        setLocation(newLocation);

        // Send to backend via WebSocket
        if (trackingService.isReady()) {
          console.log('[useAutoTracking] Sending location to backend');
          trackingService.sendLocation(latitude, longitude, accuracy);
        } else {
          console.warn('[useAutoTracking] Tracking service not ready, location not sent');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission was denied');
          setIsTracking(false);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        } else if (err.code === err.TIMEOUT) {
          // Timeout is normal on poor GPS connections, just log it without showing error
          console.debug('Watch position timeout - retrying with next update');
        } else {
          console.error('Watch position error:', err);
          setError(`Tracking error: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }, [isTracking]);

  // Request geolocation permission and start tracking
  const requestLocationPermission = useCallback(async (quickLocation = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (permissionRequested) {
      return;
    }

    setPermissionRequested(true);

    // Check if permission is already granted
    const permissionState = await checkPermissionStatus();

    // For quick location (delivery fee), use faster settings
    const locationOptions = quickLocation ? {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000
    } : {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    if (permissionState === 'granted') {
      // Permission already granted, get location directly without dialog
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
          setHasPermission(true);
          setError(null);
          localStorage.setItem('geolocation_permission_granted', 'true');
          if (!quickLocation) {
            startContinuousTracking();
          }
        },
        (err) => {
          if (quickLocation) {
            // For quick location, silently retry with lower accuracy
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(
                (retryPosition) => {
                  const { latitude, longitude, accuracy } = retryPosition.coords;
                  const newLocation = {
                    latitude,
                    longitude,
                    accuracy,
                    timestamp: new Date().toISOString(),
                  };
                  setLocation(newLocation);
                  setHasPermission(true);
                  setError(null);
                  localStorage.setItem('geolocation_permission_granted', 'true');
                },
                () => {
                  console.debug('Quick location retry failed, will use fallback');
                  setHasPermission(true);
                  setPermissionRequested(false);
                },
                {
                  enableHighAccuracy: false,
                  timeout: 8000,
                  maximumAge: 120000,
                }
              );
            }, 300);
            return;
          }
          setPermissionRequested(false);
          if (err.code === err.PERMISSION_DENIED) {
            setError('Location permission was denied. You can enable it in browser settings.');
            localStorage.setItem('geolocation_permission_granted', 'false');
          } else if (err.code === err.TIMEOUT) {
            setError('Location request timed out. Trying with lower accuracy...');
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(
                (retryPosition) => {
                  const { latitude, longitude, accuracy } = retryPosition.coords;
                  const newLocation = {
                    latitude,
                    longitude,
                    accuracy,
                    timestamp: new Date().toISOString(),
                  };
                  setLocation(newLocation);
                  setHasPermission(true);
                  setError(null);
                  localStorage.setItem('geolocation_permission_granted', 'true');
                  startContinuousTracking();
                },
                () => {
                  setError('Unable to get location. Please check location permissions and try again.');
                },
                {
                  enableHighAccuracy: false,
                  timeout: 5000,
                  maximumAge: 60000,
                }
              );
            }, 500);
          } else {
            setError(`Geolocation error: ${err.message}`);
          }
        },
        locationOptions
      );
    } else if (permissionState === 'denied') {
      // Permission explicitly denied
      setPermissionRequested(false);
      setError('Location permission was denied. You can enable it in browser settings.');
      localStorage.setItem('geolocation_permission_granted', 'false');
    } else {
      // Permission status unknown, request it (will show dialog)
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
          setHasPermission(true);
          setError(null);
          localStorage.setItem('geolocation_permission_granted', 'true');
          startContinuousTracking();
        },
        (err) => {
          setPermissionRequested(false);
          if (err.code === err.PERMISSION_DENIED) {
            setError('Location permission was denied. You can enable it in browser settings.');
            localStorage.setItem('geolocation_permission_granted', 'false');
          } else if (err.code === err.TIMEOUT) {
            setError('Location request timed out. Trying with lower accuracy...');
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(
                (retryPosition) => {
                  const { latitude, longitude, accuracy } = retryPosition.coords;
                  const newLocation = {
                    latitude,
                    longitude,
                    accuracy,
                    timestamp: new Date().toISOString(),
                  };
                  setLocation(newLocation);
                  setHasPermission(true);
                  setError(null);
                  localStorage.setItem('geolocation_permission_granted', 'true');
                  startContinuousTracking();
                },
                () => {
                  setError('Unable to get location. Please check location permissions and try again.');
                },
                {
                  enableHighAccuracy: false,
                  timeout: 20000,
                  maximumAge: 60000,
                }
              );
            }, 500);
          } else {
            setError(`Geolocation error: ${err.message}`);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
    }
  }, [permissionRequested, checkPermissionStatus]);

  // Stop continuous tracking
  const stopContinuousTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  }, []);

  // On mount: Check for previously granted permission and auto-start
  useEffect(() => {
    const hasStoredPermission = checkStoredPermission();
    if (hasStoredPermission && !permissionRequested) {
      // User previously granted permission, use fast location for delivery fee calculation
      requestLocationPermission(true);
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (permissionTimeoutRef.current) {
        clearTimeout(permissionTimeoutRef.current);
      }
    };
  }, []);

  return {
    location,
    hasPermission,
    permissionRequested,
    isTracking,
    error,
    requestLocationPermission,
    startContinuousTracking,
    stopContinuousTracking,
  };
};
