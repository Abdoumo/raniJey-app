import io from 'socket.io-client';

class TrackingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = {
      connect: [],
      disconnect: [],
      orderUpdate: [],
      locationUpdate: [],
      orderStatusChange: [],
      error: [],
    };
  }

  connect(baseUrl, token, userId, userRole) {
    if (this.socket && this.socket.connected) {
      return Promise.resolve();
    }

    // Validate that required parameters are present
    if (!token || !userId) {
      return Promise.reject(new Error('Token and userId are required for WebSocket connection'));
    }

    console.log('Connecting to Socket.io server at:', baseUrl);

    return new Promise((resolve, reject) => {
      try {
        // Socket.io automatically handles ws:// vs http:// conversion
        this.socket = io(baseUrl, {
          auth: {
            token,
            userId,
            role: userRole || 'user',
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('Socket.io connected successfully');
          this.emit('connect');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket.io disconnected:', reason);
          this.isConnected = false;
          this.emit('disconnect');
        });

        this.socket.on('ORDER_UPDATE', (data) => {
          this.handleOrderUpdate(data);
        });

        this.socket.on('LOCATION_UPDATE', (data) => {
          console.log('[trackingService] Received LOCATION_UPDATE event:', data);
          this.handleLocationUpdate(data);
        });

        this.socket.on('STATUS_CHANGE', (data) => {
          this.handleStatusChange(data);
        });

        this.socket.on('DELIVERY_STARTED', (data) => {
          this.handleDeliveryStarted(data);
        });

        this.socket.on('DELIVERY_COMPLETED', (data) => {
          this.handleDeliveryCompleted(data);
        });

        this.socket.on('error', (error) => {
          console.error('Socket.io error:', error);
          // Don't reject on error after initial connection attempt
          if (!this.isConnected) {
            this.emit('error', {
              message: 'Real-time connection unavailable (using HTTP fallback)',
              details: error?.message || error,
              critical: false,
            });
          }
        });

        this.socket.on('connect_error', (error) => {
          console.debug('Socket.io connection error:', error?.message || error);
          // Will retry automatically due to reconnection settings
        })

        // Set a timeout for connection (increased to 20 seconds for slow networks)
        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            console.warn('Socket.io connection timeout - backend may not be available');
            // Don't reject - let the fallback HTTP work instead
            this.emit('error', {
              message: 'Real-time connection unavailable (using HTTP fallback)',
              details: 'WebSocket connection timeout',
              critical: false,
            });
          }
        }, 20000);

        // Listen for successful connection to clear timeout
        const originalEmit = this.emit.bind(this);
        const onceConnected = () => {
          clearTimeout(connectionTimeout);
        };
        this.emit = function(event, data) {
          if (event === 'connect') {
            clearTimeout(connectionTimeout);
          }
          return originalEmit(event, data);
        };
      } catch (error) {
        console.error('Error creating Socket.io connection:', error);
        reject(error);
      }
    });
  }

  handleOrderUpdate(data) {
    this.emit('orderUpdate', data);
  }

  handleLocationUpdate(data) {
    console.log('[trackingService] Emitting locationUpdate event:', data);
    this.emit('locationUpdate', data);
  }

  handleStatusChange(data) {
    this.emit('orderStatusChange', data);
  }

  handleDeliveryStarted(data) {
    this.emit('orderStatusChange', {
      orderId: data.orderId,
      status: 'on-the-way',
      deliveryPersonLocation: data.location,
    });
  }

  handleDeliveryCompleted(data) {
    this.emit('orderStatusChange', {
      orderId: data.orderId,
      status: 'delivered',
    });
  }

  sendMessage(eventName, payload) {
    if (!this.isConnected || !this.socket) {
      console.warn('Socket.io not connected');
      return false;
    }

    try {
      this.socket.emit(eventName, {
        ...payload,
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error sending Socket.io message:', error);
      return false;
    }
  }

  sendLocation(latitude, longitude, accuracy) {
    console.log('[trackingService] Sending location:', { latitude, longitude, accuracy, isConnected: this.isConnected });
    const result = this.sendMessage('LOCATION_UPDATE', {
      latitude,
      longitude,
      accuracy,
    });
    if (!result) {
      console.warn('[trackingService] Failed to send location - WebSocket not connected');
    }
    return result;
  }

  acceptOrder(orderId) {
    return this.sendMessage('ACCEPT_ORDER', { orderId });
  }

  startDelivery(orderId) {
    return this.sendMessage('START_DELIVERY', { orderId });
  }

  completeDelivery(orderId, notes = '') {
    return this.sendMessage('COMPLETE_DELIVERY', { orderId, notes });
  }

  subscribeToOrder(orderId) {
    return this.sendMessage('SUBSCRIBE_ORDER', { orderId });
  }

  unsubscribeFromOrder(orderId) {
    return this.sendMessage('UNSUBSCRIBE_ORDER', { orderId });
  }

  ping() {
    return this.sendMessage('PING', {});
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isReady() {
    return this.isConnected && this.socket !== null && this.socket.connected;
  }
}

export default new TrackingService();
