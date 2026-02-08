import React, { useState } from 'react';

export const useAutoTracking = () => {
  const [error, setError] = useState(null);

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success - location obtained
          console.log('Location:', position.coords);
          setError(null);
        },
        (err) => {
          // Error handling
          console.error('Geolocation error:', err);
          setError(err.message);
        }
      );
    } else {
      const errorMsg = 'Geolocation is not supported by this browser';
      console.error(errorMsg);
      setError(errorMsg);
    }
  };

  return {
    requestLocationPermission,
    error
  };
};
