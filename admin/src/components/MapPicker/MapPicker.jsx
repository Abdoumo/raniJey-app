import React, { useEffect, useRef, useState } from 'react';
import './MapPicker.css';

const MapPicker = ({ latitude, longitude, onLocationSelect }) => {
  const DEFAULT_LAT = 36.7372;
  const DEFAULT_LNG = 3.0868;

  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: latitude && latitude !== null ? latitude : DEFAULT_LAT,
    lng: longitude && longitude !== null ? longitude : DEFAULT_LNG,
  });
  const markerRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet dynamically
    if (!window.L) {
      const leafletLink = document.createElement('link');
      leafletLink.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
      leafletLink.rel = 'stylesheet';
      leafletLink.id = 'leaflet-css';
      document.head.appendChild(leafletLink);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
      script.id = 'leaflet-js';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      setSelectedLocation({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (leafletLoaded && mapRef.current && !mapInstance) {
      initMap();
    }
  }, [leafletLoaded, mapInstance]);

  const initMap = () => {
    if (mapRef.current && !mapInstance) {
      const L = window.L;
      const lat = selectedLocation.lat || DEFAULT_LAT;
      const lng = selectedLocation.lng || DEFAULT_LNG;
      const map = L.map(mapRef.current).setView([lat, lng], 13);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 18,
      }).addTo(map);

      // Add marker
      const marker = L.marker([lat, lng], {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setSelectedLocation({ lat: position.lat, lng: position.lng });
        onLocationSelect(position.lat, position.lng);
      });

      // Map click handler
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current = marker;
      setMapInstance(map);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        
        if (mapInstance) {
          mapInstance.setView([latitude, longitude], 13);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          }
        }
        
        onLocationSelect(latitude, longitude);
      },
      (error) => {
        alert(`Error getting location: ${error.message}`);
      }
    );
  };

  return (
    <div className="map-picker">
      <div className="map-picker-header">
        <h3>Select Shop Location</h3>
        <button type="button" className="current-location-btn" onClick={handleUseCurrentLocation}>
          📍 Use Current Location
        </button>
      </div>
      
      <div className="map-info">
        <p>Click on map to select location or drag marker</p>
        <div className="coordinates">
          <span>Lat: {(selectedLocation.lat || DEFAULT_LAT).toFixed(6)}</span>
          <span>Lng: {(selectedLocation.lng || DEFAULT_LNG).toFixed(6)}</span>
        </div>
      </div>

      <div ref={mapRef} className="map-container" />
    </div>
  );
};

export default MapPicker;
