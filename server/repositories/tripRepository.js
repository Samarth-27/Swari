import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export class TripRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
  }

  getTrips() {
    return this.store.getTrips();
  }

  getTripById(id) {
    const trips = this.getTrips();
    return trips.find(t => t.id === id) || null;
  }

  getActiveTripByDriver(driverName, vehiclePlate, driverId = null) {
    const trips = this.getTrips();
    const normPlate = (p) => (p || '').replace(/\s+/g, '').toUpperCase();

    return trips.find(t => {
      const isActive = t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      if (!isActive) return false;

      if (driverId && (t.driverId === driverId || t.driver?.id === driverId)) {
        return true;
      }

      const plateMatch = vehiclePlate && t.vehicle?.plate && normPlate(t.vehicle.plate) === normPlate(vehiclePlate);
      const isCallerYou = driverName && (driverName.includes('You') || driverName.toLowerCase().includes('verified host'));
      const isTripYou = t.driver?.name && (t.driver.name.includes('You') || t.driver.name.toLowerCase().includes('verified host'));

      const driverMatch = (isCallerYou && isTripYou) ||
        (driverName && t.driver?.name && driverName.trim().toLowerCase() === t.driver.name.trim().toLowerCase());

      return Boolean(plateMatch || driverMatch);
    }) || null;
  }

  addTrip(trip) {
    const active = this.getActiveTripByDriver(trip.driver?.name, trip.vehicle?.plate, trip.driverId || trip.driver?.id);
    if (active) {
      const err = new Error(`Driver already has an active published trip (${active.id}: ${active.origin} -> ${active.destination}).`);
      err.code = 'ACTIVE_TRIP_EXISTS';
      throw err;
    }

    this.store.data.trips.unshift(trip);
    this.store.save();

    // Async sync to Postgres if pool available
    query(
      `INSERT INTO trips (id, driver_name, vehicle_plate, vehicle_make, vehicle_model, route_id, origin, destination, departure_time, total_seats, seats_available, price_per_seat, booking_mode, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO NOTHING`,
      [
        trip.id,
        trip.driver?.name || 'Verified Driver',
        trip.vehicle?.plate || 'KA 01 AB 1234',
        trip.vehicle?.make || 'Tata',
        trip.vehicle?.model || 'Nexon',
        trip.routeId,
        trip.origin,
        trip.destination,
        trip.departureTime || 'Today',
        trip.totalSeats || 3,
        trip.seatsAvailable || 2,
        trip.pricePerSeat || 500,
        trip.bookingMode || 'INSTANT',
        trip.status || 'ACTIVE_AVAILABLE'
      ]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres trips insert background sync skipped'));

    return trip;
  }

  completeTrip(tripId) {
    const trip = this.getTripById(tripId);
    if (trip) {
      trip.status = 'COMPLETED';
      this.store.save();
      query('UPDATE trips SET status = $1, updated_at = NOW() WHERE id = $2', ['COMPLETED', tripId])
        .catch(err => logger.debug({ err: err.message }, 'Postgres completeTrip update skipped'));
      return trip;
    }
    return null;
  }

  cancelTrip(tripId) {
    const trip = this.getTripById(tripId);
    if (trip) {
      trip.status = 'CANCELLED';
      this.store.save();
      query('UPDATE trips SET status = $1, updated_at = NOW() WHERE id = $2', ['CANCELLED', tripId])
        .catch(err => logger.debug({ err: err.message }, 'Postgres cancelTrip update skipped'));
      return trip;
    }
    return null;
  }
}

export default TripRepository;
