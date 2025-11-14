import axios from 'axios';
import io from 'socket.io-client';

class LocationService {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.socket = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  initSocket() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(this.baseURL, {
      auth: {
        token: this.token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('Location tracking socket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    });

    this.socket.on('disconnect', () => {
      console.log('Location tracking socket disconnected');
      this.emit('disconnected', {});
    });

    this.socket.on('location-updated', (data) => {
      this.emit('location-updated', data);
    });

    this.socket.on('delivery-location-updated', (data) => {
      this.emit('delivery-location-updated', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners = {};
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        callback(data);
      });
    }
  }

  // Update user location
  async updateLocation(latitude, longitude, accuracy = 0) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/location/update`,
        { latitude, longitude, accuracy },
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  // Get current location of a user
  async getUserLocation(userId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/location/user/${userId}`,
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user location:', error);
      throw error;
    }
  }

  // Get all active delivery people
  async getActiveDeliveryPeople() {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/location/delivery/active/list`,
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching active delivery people:', error);
      throw error;
    }
  }

  // Auto-assign closest delivery person to order
  async assignDeliveryPerson(orderId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/location/match/${orderId}`,
        {},
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning delivery person:', error);
      throw error;
    }
  }

  // Get delivery person location for an order
  async getOrderDeliveryLocation(orderId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/location/order/${orderId}`,
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching order delivery location:', error);
      throw error;
    }
  }

  // Get location history for a user
  async getLocationHistory(userId, limit = 100) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/location/history/${userId}?limit=${limit}`,
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching location history:', error);
      throw error;
    }
  }

  // Get order delivery history
  async getOrderDeliveryHistory(orderId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/location/order-history/${orderId}`,
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching order delivery history:', error);
      throw error;
    }
  }

  // Toggle location sharing
  async toggleLocationSharing(enabled) {
    try {
      const response = await axios.patch(
        `${this.baseURL}/api/location/sharing/toggle`,
        { enabled },
        { headers: { token: this.token } }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      throw error;
    }
  }

  // Join tracking for WebSocket
  joinTracking() {
    if (this.socket) {
      this.socket.emit('join-tracking', {});
    }
  }

  // Send location update via WebSocket
  sendLocationUpdate(latitude, longitude, accuracy = 0) {
    if (this.socket) {
      this.socket.emit('update-location', {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get active deliveries via WebSocket
  getActiveDeliveries() {
    if (this.socket) {
      this.socket.emit('get-active-deliveries', {});
    }
  }
}

export default LocationService;
