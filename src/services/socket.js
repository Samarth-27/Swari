// Swari Hardened Real-Time Socket Service
// Features: Authenticated JWT handshake, auto-resync via /api/v1/sync?since=<seq> on reconnect,
// offline action queue flush, and connection state recovery.

import { io } from 'socket.io-client';
import { tokenManager } from '../lib/tokenManager.js';
import { fetchCatchUpEvents } from './api.js';
import { offlineQueue } from '../lib/offlineQueue.js';

const SOCKET_URL = typeof window !== 'undefined' && window.location.port === '5174'
  ? 'http://localhost:8000'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.lastSequence = 0;
    this.eventListeners = new Map();
  }

  connect() {
    if (this.socket) return this.socket;

    const token = tokenManager.getAccessToken();

    try {
      this.socket = io(SOCKET_URL, {
        auth: { token: token || undefined },
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', async () => {
        const wasReconnection = this.isConnected === false && this.lastSequence > 0;
        this.isConnected = true;
        console.log('[SWARI-WS] Connected with ID:', this.socket.id);

        // Catch-up synchronization if reconnecting
        if (wasReconnection) {
          await this.syncCatchUpEvents();
        }

        // Flush offline queue if any queued actions exist
        try {
          await offlineQueue.flush();
        } catch (e) {
          console.warn('[SWARI-WS] Error flushing offline queue:', e);
        }
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log('[SWARI-WS] Disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[SWARI-WS] Handshake/Connection error:', err.message);
      });

      // Monotonic sequence updates from server
      this.socket.on('sync:seq', ({ seq }) => {
        if (typeof seq === 'number' && seq > this.lastSequence) {
          this.lastSequence = seq;
        }
      });

    } catch (e) {
      console.warn('[SWARI-WS] Socket init exception:', e);
    }

    return this.socket;
  }

  async syncCatchUpEvents() {
    try {
      const res = await fetchCatchUpEvents(this.lastSequence);
      if (res && res.events && Array.isArray(res.events)) {
        console.log(`[SWARI-WS] Replaying ${res.events.length} catch-up events since sequence ${this.lastSequence}`);
        for (const evt of res.events) {
          if (evt.seq > this.lastSequence) {
            this.lastSequence = evt.seq;
          }
          this.dispatchLocalEvent(evt.eventName, evt.payload);
        }
      }
    } catch (err) {
      console.warn('[SWARI-WS] Catch-up sync failed:', err.message);
    }
  }

  updateAuthToken(newToken) {
    if (this.socket) {
      this.socket.auth = { token: newToken || undefined };
      this.socket.disconnect().connect();
    }
  }

  dispatchLocalEvent(eventName, payload) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[SWARI-WS] Error in local listener for ${eventName}:`, e);
        }
      }
    }
  }

  on(event, callback) {
    if (!this.socket) this.connect();

    // Register with native socket
    this.socket?.on(event, (payload) => {
      // If server sends an event with seq, track it
      if (payload?._seq && payload._seq > this.lastSequence) {
        this.lastSequence = payload._seq;
      }
      callback(payload);
    });

    // Also register in local map for catch-up replay
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  onTripPublished(callback) {
    return this.on('trip:published', callback);
  }

  onTripSeatBooked(callback) {
    return this.on('trip:seat_booked', callback);
  }

  onTripSeatCancelled(callback) {
    return this.on('trip:seat_cancelled', callback);
  }

  onTripUpdated(callback) {
    return this.on('trip:updated', callback);
  }

  onTripCompleted(callback) {
    return this.on('trip:completed', callback);
  }

  onTripCancelled(callback) {
    return this.on('trip:cancelled', callback);
  }

  onBroadcastCreated(callback) {
    return this.on('broadcast:created', callback);
  }

  onOfferReceived(callback) {
    return this.on('offer:received', callback);
  }

  onCsMetricsUpdate(callback) {
    return this.on('cs:metrics:update', callback);
  }

  onTelemetryUpdate(callback) {
    return this.on('telemetry:update', callback);
  }

  onSosAlert(callback) {
    return this.on('sos:alert', callback);
  }

  // Real-Time Chat Room Gateway
  joinChatRoom(tripId, userName) {
    if (!this.socket) this.connect();
    this.socket?.emit('chat:join', { tripId, userName });
  }

  sendChatMessage(tripId, message) {
    if (!this.socket) this.connect();
    this.socket?.emit('chat:send_message', { tripId, message });
  }

  onChatMessage(callback) {
    return this.on('chat:new_message', callback);
  }

  onChatHistory(callback) {
    return this.on('chat:history', callback);
  }

  // Booking Approval & Request Listeners
  onBookingRequested(callback) {
    return this.on('trip:booking_requested', callback);
  }

  onBookingApproved(callback) {
    return this.on('trip:booking_approved', callback);
  }

  onBookingDeclined(callback) {
    return this.on('trip:booking_declined', callback);
  }

  sendTelemetryPing(payload) {
    if (this.socket && this.isConnected) {
      this.socket.emit('telemetry:ping', payload);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
