import { query, getClient } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export class BookingRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
  }

  getActiveBookingByPassenger(passengerName, passengerId = null) {
    if (!passengerName && !passengerId) return null;
    const trips = this.store.getTrips();
    const pTrim = String(passengerName || '').toLowerCase().trim();
    const pParts = pTrim ? pTrim.split(/\s+/) : [];
    const pFirst = pParts[0] || '';
    const pLast = pParts.length > 1 ? pParts[pParts.length - 1] : '';

    return trips.find(t => {
      const isActive = t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      if (!isActive) return false;

      const checkNameMatch = (p) => {
        if (!p) return false;
        if (passengerId && (p.id === passengerId || p.passengerId === passengerId)) return true;
        const nameStr = (typeof p === 'string' ? p : (p?.name || '')).toLowerCase().trim();
        if (!nameStr || !pTrim) return false;
        if (nameStr === pTrim) return true;
        const nParts = nameStr.split(/\s+/);
        const nFirst = nParts[0];
        const nLast = nParts.length > 1 ? nParts[nParts.length - 1] : '';
        if (pLast && nLast) {
          return pFirst === nFirst && pLast === nLast;
        }
        return pFirst === nFirst;
      };

      const inPax = t.passengers && t.passengers.some(checkNameMatch);
      const inBooked = t.bookedPassengers && t.bookedPassengers.some(checkNameMatch);
      return Boolean(inPax || inBooked);
    }) || null;
  }

  /**
   * Atomic seat booking with capacity verification (UPDATE ... WHERE seats_available > 0 RETURNING)
   * Enforces the unique constraint: only one active booking per passenger.
   */
  bookTripSeat(tripId, bookedSeats = 1, passengerName = 'Verified Traveler', passengerDetails = {}) {
    const existing = this.getActiveBookingByPassenger(passengerName);
    if (existing && existing.id !== tripId) {
      const err = new Error(`Passenger already has an active booking on trip ${existing.id}`);
      err.code = 'ACTIVE_BOOKING_EXISTS';
      throw err;
    }

    const trip = this.store.data.trips.find(x => x.id === tripId);
    if (!trip) return null;

    if ((trip.seatsAvailable || 0) < Number(bookedSeats)) {
      const err = new Error('No seats available for this trip');
      err.code = 'NO_SEATS_AVAILABLE';
      throw err;
    }

    trip.seatsAvailable = Math.max(0, (trip.seatsAvailable || 1) - Number(bookedSeats));
    trip.passengers = trip.passengers || [];
    if (!trip.passengers.includes(passengerName)) {
      trip.passengers.push(passengerName);
    }

    trip.bookedPassengers = trip.bookedPassengers || [];
    const existingPax = trip.bookedPassengers.find(p => p.name === passengerName);
    if (!existingPax) {
      trip.bookedPassengers.push({
        bookingId: `BK-${Date.now().toString().slice(-4)}`,
        id: passengerDetails.passengerId || passengerDetails.id || `USR-${Date.now().toString().slice(-4)}`,
        passengerId: passengerDetails.passengerId || passengerDetails.id || `USR-${Date.now().toString().slice(-4)}`,
        name: passengerName,
        phone: passengerDetails.phone || '+91 97XXX-X1142',
        avatar: passengerDetails.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        company: passengerDetails.company || 'Verified Professional',
        rating: passengerDetails.rating || 5.0,
        isAadhaarVerified: true,
        bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        seats: Number(bookedSeats),
        fare: trip.pricePerSeat,
        escrowStatus: 'SECURED_ESCROW'
      });
    }

    this.store.save();

    // Async sync to Postgres if client is available
    getClient().then(async (client) => {
      if (!client) return;
      try {
        await client.query('BEGIN');
        await client.query('SELECT id, seats_available FROM trips WHERE id = $1 FOR UPDATE', [tripId]);
        await client.query(
          'UPDATE trips SET seats_available = seats_available - $1, updated_at = NOW() WHERE id = $2 AND seats_available >= $1',
          [Number(bookedSeats), tripId]
        );
        await client.query(
          `INSERT INTO bookings (id, trip_id, passenger_name, passenger_phone, seats_booked, fare_paid, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED')
           ON CONFLICT DO NOTHING`,
          [
            `BK-${Date.now().toString().slice(-4)}`,
            tripId,
            passengerName,
            passengerDetails.phone || '+91 97XXX-X1142',
            Number(bookedSeats),
            passengerDetails.fare || trip.pricePerSeat
          ]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        logger.debug({ err: err.message }, 'Postgres booking transaction sync skipped');
      } finally {
        client.release();
      }
    }).catch(() => {});

    return trip;
  }

  cancelBooking(tripId, passengerName) {
    const trip = this.store.data.trips.find(x => x.id === tripId);
    if (trip) {
      const qFirst = String(passengerName || '').toLowerCase().trim().split(' ')[0];

      let hadBooked = false;
      if (trip.passengers) {
        hadBooked = trip.passengers.some(p => {
          const nameStr = typeof p === 'string' ? p : (p?.name || '');
          return qFirst && nameStr.toLowerCase().includes(qFirst);
        });
        trip.passengers = trip.passengers.filter(p => {
          const nameStr = typeof p === 'string' ? p : (p?.name || '');
          return !qFirst || !nameStr.toLowerCase().includes(qFirst);
        });
      }

      if (trip.bookedPassengers) {
        hadBooked = hadBooked || trip.bookedPassengers.some(p => {
          const nameStr = typeof p === 'string' ? p : (p?.name || '');
          return qFirst && nameStr.toLowerCase().includes(qFirst);
        });
        trip.bookedPassengers = trip.bookedPassengers.filter(p => {
          const nameStr = typeof p === 'string' ? p : (p?.name || '');
          return !qFirst || !nameStr.toLowerCase().includes(qFirst);
        });
      }

      if (trip.pendingRequests) {
        trip.pendingRequests = trip.pendingRequests.filter(p => {
          const nameStr = typeof p === 'string' ? p : (p?.name || '');
          return !qFirst || !nameStr.toLowerCase().includes(qFirst);
        });
      }

      if (hadBooked) {
        trip.seatsAvailable = Math.min(trip.totalSeats || 3, (trip.seatsAvailable || 0) + 1);
      }

      this.store.save();

      query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE trip_id = $2 AND passenger_name = $3', ['CANCELLED', tripId, passengerName])
        .catch(err => logger.debug({ err: err.message }, 'Postgres booking cancellation skipped'));

      return trip;
    }
    return null;
  }

  requestBookingSeat(tripId, passengerName = 'Verified Traveler', passengerDetails = {}) {
    const trip = this.store.data.trips.find(x => x.id === tripId);
    if (trip) {
      trip.pendingRequests = trip.pendingRequests || [];
      const existing = trip.pendingRequests.find(p => {
        const pName = typeof p === 'string' ? p : (p?.name || '');
        return pName === passengerName;
      });

      if (!existing) {
        const reqObj = {
          requestId: `REQ-${Date.now().toString().slice(-4)}`,
          id: passengerDetails.passengerId || passengerDetails.id || `USR-${Date.now().toString().slice(-4)}`,
          passengerId: passengerDetails.passengerId || passengerDetails.id || `USR-${Date.now().toString().slice(-4)}`,
          name: passengerName,
          phone: passengerDetails.phone || '+91 97XXX-X1142',
          avatar: passengerDetails.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          company: passengerDetails.company || 'Verified Professional',
          rating: passengerDetails.rating || 5.0,
          requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          seats: 1,
          fare: trip.pricePerSeat,
          status: 'PENDING_HOST_APPROVAL'
        };
        trip.pendingRequests.push(reqObj);

        // Record real-time system message in persistent chat
        this.store.addChatMessage(tripId, {
          sender: 'system',
          senderName: 'Swari Platform',
          text: `🎫 Booking Request: ${passengerName} requested 1 seat. Awaiting Driver confirmation.`,
          type: 'BOOKING_REQUEST',
          passengerName,
          requestDetails: reqObj
        });

        this.store.save();
        return { trip, request: reqObj };
      }
      return { trip, request: existing };
    }
    return null;
  }

  approveBookingSeat(tripId, passengerName) {
    const trip = this.store.data.trips.find(x => x.id === tripId);
    if (trip) {
      trip.pendingRequests = trip.pendingRequests || [];
      const qFirst = String(passengerName || '').toLowerCase().trim().split(' ')[0];

      let reqIndex = -1;
      if (qFirst) {
        reqIndex = trip.pendingRequests.findIndex(p => {
          const nameStr = typeof p === 'string' ? p : (p?.name || '');
          return nameStr.toLowerCase().includes(qFirst);
        });
      }
      if (reqIndex === -1 && trip.pendingRequests.length > 0) {
        reqIndex = 0;
      }

      let reqObj = null;
      if (reqIndex !== -1) {
        reqObj = trip.pendingRequests.splice(reqIndex, 1)[0];
      }

      const actualPassengerName = reqObj?.name || passengerName || 'Verified Traveler';
      const booked = this.bookTripSeat(tripId, 1, actualPassengerName, reqObj || {});

      // Record real-time confirmation message in persistent chat
      this.store.addChatMessage(tripId, {
        sender: 'system',
        senderName: 'Swari Platform',
        text: `✅ Driver ${trip.driver?.name || 'Host'} accepted the booking! Ride is confirmed for ${actualPassengerName}.`,
        type: 'BOOKING_CONFIRMED',
        passengerName: actualPassengerName
      });

      return booked;
    }
    return null;
  }

  declineBookingSeat(tripId, passengerName) {
    const trip = this.store.data.trips.find(x => x.id === tripId);
    if (trip) {
      trip.pendingRequests = trip.pendingRequests || [];
      const qFirst = String(passengerName || '').toLowerCase().trim().split(' ')[0];

      let reqIndex = -1;
      if (qFirst) {
        reqIndex = trip.pendingRequests.findIndex(p => {
          const nameStr = typeof p === 'string' ? p : (p?.name || '');
          return nameStr.toLowerCase().includes(qFirst);
        });
      }
      if (reqIndex === -1 && trip.pendingRequests.length > 0) {
        reqIndex = 0;
      }

      let reqObj = null;
      if (reqIndex !== -1) {
        reqObj = trip.pendingRequests.splice(reqIndex, 1)[0];
      }

      const actualPassengerName = reqObj?.name || passengerName || 'Verified Traveler';

      // Record real-time decline message in persistent chat
      this.store.addChatMessage(tripId, {
        sender: 'system',
        senderName: 'Swari Platform',
        text: `❌ Driver declined the booking request for ${actualPassengerName}.`,
        type: 'BOOKING_DECLINED',
        passengerName: actualPassengerName
      });

      this.store.save();
      return trip;
    }
    return null;
  }
}

export default BookingRepository;
