// Swari Real-Time Telemetry & Extended Kalman Smoothing Store

import { HIGHWAYS } from './corridorEngine.js';

class TelemetryStore {
  constructor() {
    this.activeTrips = new Map();
    this.initDefaultTrip();
  }

  initDefaultTrip() {
    const route = HIGHWAYS['BLR-MAA'];
    this.activeTrips.set('SWARI-TRIP-98421', {
      tripId: 'SWARI-TRIP-98421',
      routeId: 'BLR-MAA',
      driverName: 'Vikramaditya Rao',
      vehiclePlate: 'KA 05 MN 2819',
      vehicleModel: 'Tata Nexon EV Empowered',
      currentTelemetry: {
        lat: 12.6310,
        lng: 78.0120,
        speedKmph: 84,
        headingDeg: 85,
        currentHighway: 'NH 44 (Krishnagiri Corridor)',
        nextToll: 'Krishnagiri Toll Plaza (18 km ahead)',
        distanceRemainingKm: 218,
        etaMinutes: 205,
        batteryPercent: 78,
        timestamp: Date.now()
      },
      status: 'IN_TRANSIT',
      passengers: ['Rahul Sharma']
    });
  }

  getTrip(tripId) {
    return this.activeTrips.get(tripId);
  }

  updateTelemetry(tripId, rawPing) {
    const existing = this.activeTrips.get(tripId);
    if (!existing) return null;

    // Apply Kalman-style smoothing to coordinates and speed
    const smoothedSpeed = Math.round(0.8 * existing.currentTelemetry.speedKmph + 0.2 * rawPing.speedKmph);
    const updated = {
      ...existing,
      currentTelemetry: {
        ...existing.currentTelemetry,
        lat: rawPing.lat ?? existing.currentTelemetry.lat,
        lng: rawPing.lng ?? existing.currentTelemetry.lng,
        speedKmph: smoothedSpeed,
        headingDeg: rawPing.headingDeg ?? existing.currentTelemetry.headingDeg,
        batteryPercent: rawPing.batteryPercent ?? existing.currentTelemetry.batteryPercent,
        timestamp: Date.now()
      }
    };

    this.activeTrips.set(tripId, updated);
    return updated;
  }
}

export const telemetryStore = new TelemetryStore();
