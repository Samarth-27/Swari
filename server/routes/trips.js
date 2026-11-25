import express from 'express';
import { calculateLegalPriceCeiling } from '../services/legalGuardrail.js';
import { HIGHWAYS } from '../services/corridorEngine.js';
import { dbStore } from '../db/store.js';
import { seatSemaphore } from '../services/csCoreEngines.js';
import { authenticate, requireTripDriver, requireBookedPassenger } from '../middleware/auth.js';
import { idempotency } from '../middleware/idempotency.js';
import { eventLog } from '../services/eventLog.js';
import { validateBody } from '../middleware/validate.js';
import {
  publishTripSchema,
  bookSeatSchema,
  requestBookingSchema,
  approveBookingSchema,
  declineBookingSchema,
  cancelBookingSchema,
  rateTripSchema,
  chatMessageSchema
} from '../validators/schemas.js';
import { sanitizeChatText, filterTripForViewer, maskPhoneNumber } from '../lib/sanitizer.js';
import { bookingLimiter, chatLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
router.use(authenticate);

export function sanitizeTripForPublic(trip) {
  if (!trip) return null;
  const cloned = JSON.parse(JSON.stringify(trip));

  if (cloned.driver) {
    delete cloned.driver.phone;
    cloned.driver.phoneMasked = '+91 98XXX-X0000';
  }

  cloned.passengers = [];
  cloned.bookedPassengers = (cloned.bookedPassengers || []).map((p, idx) => ({
    bookingId: `BK-PUB-${idx + 1}`,
    name: 'Verified Co-Traveler',
    seats: p.seats || 1,
    rating: p.rating || 5.0
  }));
  cloned.pendingRequests = [];

  return cloned;
}

function broadcastTripUpdated(io, trip) {
  if (!io || !trip) return;

  eventLog.recordEvent({
    streamId: `trip:${trip.id}`,
    eventName: 'trip:updated',
    payload: sanitizeTripForPublic(trip),
    tripId: trip.id
  });

  // 1. Sanitized public broadcast (no phones, no passenger list)
  io.emit('trip:updated', sanitizeTripForPublic(trip));

  // 2. Full details sent to participants in trip:<tripId> room
  io.to(`trip:${trip.id}`).emit('trip:updated:full', trip);
  io.to(trip.id).emit('trip:updated:full', trip);

  // 3. Full details sent to driver's user room
  if (trip.driverId) {
    io.to(`user:${trip.driverId}`).emit('trip:updated:full', trip);
  }

  // 4. Full details sent to each booked passenger's user room
  for (const pax of trip.bookedPassengers || []) {
    const pId = pax.passengerId || pax.id;
    if (pId) {
      io.to(`user:${pId}`).emit('trip:updated:full', trip);
    }
  }
}

// GET /api/v1/trips - Query active trips from persistent store
router.get('/', (req, res) => {
  try {
    const { corridor, womenOnly, query } = req.query;
    let results = dbStore.getTrips();

    if (corridor && corridor !== 'ALL') {
      results = results.filter(t => t.routeId === corridor);
    }
    if (womenOnly === 'true') {
      results = results.filter(t => t.womenOnly);
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(t => 
        t.origin.toLowerCase().includes(q) || 
        t.destination.toLowerCase().includes(q)
      );
    }

    // Co-traveler privacy filter: mask phones for strangers, reveal only to confirmed co-travelers
    results = results.map(t => filterTripForViewer(t, req.user));

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: 'QUERY_FAILED', message: err.message });
  }
});

// GET /api/v1/trips/:id - Query specific trip with privacy filter
router.get('/:id', (req, res) => {
  try {
    const trip = dbStore.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }
    res.json({ success: true, data: filterTripForViewer(trip, req.user) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'QUERY_FAILED', message: err.message });
  }
});

// POST /api/v1/trips/publish - Car owner publishes trip with statutory fuel cap check
router.post('/publish', validateBody(publishTripSchema), (req, res) => {
  try {
    const { 
      routeId, 
      origin, 
      destination, 
      departureTime, 
      seatsAvailable, 
      pricePerSeat, 
      vehicle, 
      womenOnly, 
      driver,
      bookingMode = 'INSTANT',
      isTwoWayTrip = false,
      returnLeg = null
    } = req.body;

    if (!origin || !destination || !pricePerSeat) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Missing required trip parameters' });
    }

    // 1. Statutory Price Ceiling Guardrail (MV Act 1988)
    const highway = HIGHWAYS[routeId] || HIGHWAYS['BLR-MAA'];
    const ceiling = calculateLegalPriceCeiling(routeId, highway.distanceKm, vehicle?.fuelType || 'PETROL');

    if (Number(pricePerSeat) > ceiling.legalCeilingPerSeatInr) {
      return res.status(400).json({
        success: false,
        error: 'LEGAL_PRICE_CEILING_EXCEEDED',
        message: `Maximum allowable fare per seat under Motor Vehicles Act 1988 cost-ceiling is ₹${ceiling.legalCeilingPerSeatInr}. You entered ₹${pricePerSeat}.`,
        statutoryCeilingInr: ceiling.legalCeilingPerSeatInr
      });
    }

    // 2. ENFORCE: Driver can only publish ONE car trip at a time
    const driverId = req.user?.id || driver?.id || `USR-DRIV-${Date.now().toString().slice(-4)}`;
    const driverName = req.user?.fullName || driver?.name || 'You (Verified Host)';
    const vehiclePlate = vehicle?.plate || 'KA 05 MN 2819';
    const existingActiveTrip = dbStore.getActiveTripByDriver(driverName, vehiclePlate);
    if (existingActiveTrip) {
      return res.status(400).json({
        success: false,
        error: 'ACTIVE_TRIP_EXISTS',
        message: `You already have an active car trip published (${existingActiveTrip.origin} ➔ ${existingActiveTrip.destination}). A driver can only host one trip at a time under safety regulations. Complete or cancel your existing trip first.`,
        activeTripId: existingActiveTrip.id
      });
    }

    const rawPhone = driver?.phone || req.user?.phone || '+91 98451-94921';
    const newTrip = {
      id: `RIDE-${Date.now().toString().slice(-4)}`,
      routeId: routeId || 'BLR-MAA',
      driverId,
      driver: {
        id: driverId,
        name: driverName,
        phone: rawPhone,
        phoneMasked: maskPhoneNumber(rawPhone),
        rating: 5.0,
        totalRides: 14,
        avatar: driver?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        isAadhaarVerified: true,
        isDlVerified: true
      },
      vehicle: vehicle || {
        make: 'Tata',
        model: 'Nexon EV',
        plate: vehiclePlate,
        color: 'Daytona Grey',
        fuelType: 'ELECTRIC_EV',
        ac: true
      },
      origin,
      destination,
      departureTime: departureTime || 'Today, 05:00 PM',
      seatsAvailable: Number(seatsAvailable) || 2,
      totalSeats: 3,
      pricePerSeat: Number(pricePerSeat),
      womenOnly: Boolean(womenOnly),
      bookingMode: bookingMode || 'INSTANT',
      isTwoWayTrip: Boolean(isTwoWayTrip),
      returnLeg: returnLeg || null,
      status: 'ACTIVE_AVAILABLE',
      passengers: [],
      bookedPassengers: [],
      pendingRequests: [],
      createdAt: new Date().toISOString()
    };

    dbStore.addTrip(newTrip);

    // Record in Event Log for catch-up sync
    eventLog.recordEvent({
      streamId: `trip:${newTrip.id}`,
      eventName: 'trip:published',
      payload: newTrip,
      tripId: newTrip.id,
      userId: newTrip.driverId
    });

    // Broadcast WebSocket Synchronization event to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('trip:published', newTrip);
      broadcastTripUpdated(io, newTrip);
    }

    res.status(201).json({ success: true, message: 'Trip published & persisted legally', data: newTrip });
  } catch (err) {
    res.status(500).json({ success: false, error: 'PERSISTENCE_ERROR', message: err.message });
  }
});

// POST /api/v1/trips/:id/book - Synchronized seat booking with OS Mutex Semaphore (1 Seat per Person)
router.post('/:id/book', bookingLimiter, validateBody(bookSeatSchema), idempotency, async (req, res) => {
  try {
    const { id } = req.params;
    const { passengerName = 'Verified Traveler', passengerDetails = {} } = req.body;
    const bookedSeats = 1; // Strict: Single seat per booking

    // ENFORCE: A passenger can only book ONE ride at a time
    const existingActiveBooking = dbStore.getActiveBookingByPassenger(passengerName);
    if (existingActiveBooking && existingActiveBooking.id !== id) {
      return res.status(400).json({
        success: false,
        error: 'ACTIVE_BOOKING_EXISTS',
        message: `You already have an active booking on trip ${existingActiveBooking.id} (${existingActiveBooking.origin} ➔ ${existingActiveBooking.destination}). A passenger can only book one ride at a time. Complete or cancel your existing booking first.`,
        activeTripId: existingActiveBooking.id
      });
    }

    // OS Concurrency Synchronization: Acquire critical section lock
    await seatSemaphore.acquire(`booking_${id}_${Date.now()}`);

    const updated = dbStore.bookTripSeat(id, Number(bookedSeats), passengerName, passengerDetails);

    // Release critical section lock
    seatSemaphore.release();

    if (!updated) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND', message: 'Trip does not exist' });
    }

    // Audit Log: Record booking creation
    dbStore.logAudit('BOOKING_CREATED', 'TRIP', id, req.user?.id || passengerName, req.user?.role || 'PASSENGER', {
      passengerName,
      bookedSeats: Number(bookedSeats)
    });

    // Broadcast Real-Time WebSocket Synchronization event
    const io = req.app.get('io');
    if (io) {
      const seatPayload = {
        tripId: id,
        bookedSeats: Number(bookedSeats),
        seatsAvailable: updated.seatsAvailable,
        totalSeats: updated.totalSeats || 3,
        passengerName,
        passengers: updated.passengers,
        bookedPassengers: updated.bookedPassengers,
        passengerDetails
      };

      eventLog.recordEvent({
        streamId: `trip:${id}`,
        eventName: 'trip:seat_booked',
        payload: seatPayload,
        tripId: id
      });

      io.emit('trip:seat_booked', seatPayload);
      broadcastTripUpdated(io, updated);
    }

    res.json({
      success: true,
      message: '1 seat synchronized and reserved under OS Semaphore Mutex',
      data: updated
    });
  } catch (err) {
    seatSemaphore.release();
    res.status(500).json({ success: false, error: 'BOOKING_SYNC_ERROR', message: err.message });
  }
});

// POST /api/v1/trips/:id/request-booking - Passenger requests seat on an On-Request trip
router.post('/:id/request-booking', bookingLimiter, validateBody(requestBookingSchema), idempotency, (req, res) => {
  try {
    const { id } = req.params;
    const { passengerName = 'Verified Traveler', passengerDetails = {} } = req.body;

    const result = dbStore.requestBookingSeat(id, passengerName, passengerDetails);
    if (!result) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND' });
    }

    const io = req.app.get('io');
    if (io) {
      eventLog.recordEvent({
        streamId: `trip:${id}`,
        eventName: 'trip:booking_requested',
        payload: { tripId: id, passengerName, request: result.request },
        tripId: id
      });

      io.emit('trip:booking_requested', {
        tripId: id,
        passengerName,
        request: result.request,
        trip: result.trip
      });
      broadcastTripUpdated(io, result.trip);
    }

    res.json({
      success: true,
      status: 'PENDING_HOST_APPROVAL',
      message: 'Booking request sent to host driver for approval.',
      data: result.request
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/trips/:id/approve-booking - Driver approves pending passenger request
router.post('/:id/approve-booking', validateBody(approveBookingSchema), idempotency, requireTripDriver, (req, res) => {
  try {
    const { id } = req.params;
    const { passengerName } = req.body;

    const updated = dbStore.approveBookingSeat(id, passengerName);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'REQUEST_OR_TRIP_NOT_FOUND' });
    }

    // Audit Log: Record booking approval
    dbStore.logAudit('BOOKING_APPROVED', 'TRIP', id, req.user?.id || updated.driverId, 'DRIVER', {
      passengerName,
      tripId: id
    });

    const io = req.app.get('io');
    if (io) {
      const payload = {
        tripId: id,
        passengerName,
        seatsAvailable: updated.seatsAvailable,
        passengers: updated.passengers,
        bookedPassengers: updated.bookedPassengers,
        trip: updated
      };

      eventLog.recordEvent({
        streamId: `trip:${id}`,
        eventName: 'trip:booking_approved',
        payload,
        tripId: id
      });

      io.emit('trip:booking_approved', payload);
      broadcastTripUpdated(io, updated);
    }

    res.json({
      success: true,
      message: `Passenger ${passengerName} approved and seat confirmed!`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/trips/:id/decline-booking - Driver declines pending passenger request
router.post('/:id/decline-booking', validateBody(declineBookingSchema), requireTripDriver, (req, res) => {
  try {
    const { id } = req.params;
    const { passengerName } = req.body;

    const updated = dbStore.declineBookingSeat(id, passengerName);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND' });
    }

    // Audit Log: Record booking decline
    dbStore.logAudit('BOOKING_DECLINED', 'TRIP', id, req.user?.id || updated.driverId, 'DRIVER', {
      passengerName,
      tripId: id
    });

    const io = req.app.get('io');
    if (io) {
      eventLog.recordEvent({
        streamId: `trip:${id}`,
        eventName: 'trip:booking_declined',
        payload: { tripId: id, passengerName },
        tripId: id
      });

      io.emit('trip:booking_declined', {
        tripId: id,
        passengerName
      });
      broadcastTripUpdated(io, updated);
    }

    res.json({
      success: true,
      message: `Passenger request for ${passengerName} declined.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/trips/:id/complete - Driver or Host marks trip completed
router.post('/:id/complete', requireTripDriver, (req, res) => {
  try {
    const { id } = req.params;
    const updated = dbStore.completeTrip(id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND' });
    }

    // Audit Log: Record trip completion
    dbStore.logAudit('TRIP_COMPLETED', 'TRIP', id, req.user?.id || updated.driverId, 'DRIVER', {
      tripId: id
    });

    const io = req.app.get('io');
    if (io) {
      eventLog.recordEvent({
        streamId: `trip:${id}`,
        eventName: 'trip:completed',
        payload: { tripId: id },
        tripId: id
      });

      io.emit('trip:completed', { tripId: id, trip: updated });
      broadcastTripUpdated(io, updated);
    }

    res.json({ success: true, message: 'Trip marked as completed. Driver slot is now free.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/trips/:id/cancel - Driver cancels trip
router.post('/:id/cancel', requireTripDriver, (req, res) => {
  try {
    const { id } = req.params;
    const updated = dbStore.cancelTrip(id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND' });
    }

    // Audit Log: Record trip cancellation
    dbStore.logAudit('TRIP_CANCELLED', 'TRIP', id, req.user?.id || updated.driverId, 'DRIVER', {
      tripId: id
    });

    const io = req.app.get('io');
    if (io) {
      eventLog.recordEvent({
        streamId: `trip:${id}`,
        eventName: 'trip:cancelled',
        payload: { tripId: id },
        tripId: id
      });

      io.emit('trip:cancelled', { tripId: id, trip: updated });
      broadcastTripUpdated(io, updated);
    }

    res.json({ success: true, message: 'Trip successfully cancelled. Driver slot is now free.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/trips/:id/cancel-booking - Passenger cancels their booked seat
router.post('/:id/cancel-booking', validateBody(cancelBookingSchema), requireBookedPassenger, async (req, res) => {
  try {
    const { id } = req.params;
    const { passengerName = 'Verified Traveler' } = req.body;
    const updated = dbStore.cancelBooking(id, passengerName);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND' });
    }

    // Audit Log: Record booking cancellation
    dbStore.logAudit('BOOKING_CANCELLED', 'TRIP', id, req.user?.id || passengerName, req.user?.role || 'PASSENGER', {
      passengerName,
      tripId: id
    });

    const io = req.app.get('io');
    if (io) {
      eventLog.recordEvent({
        streamId: `trip:${id}`,
        eventName: 'trip:seat_cancelled',
        payload: { tripId: id, passengerName, seatsAvailable: updated.seatsAvailable },
        tripId: id
      });

      io.emit('trip:seat_cancelled', { tripId: id, passengerName, seatsAvailable: updated.seatsAvailable });
      broadcastTripUpdated(io, updated);
    }

    res.json({ success: true, message: 'Booking cancelled and seat returned to pool.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/trips/:id/rate - Two-way rating submission (Driver rates Passenger or Passenger rates Driver)
router.post('/:id/rate', validateBody(rateTripSchema), (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerName, reviewerRole, targetName, targetRole, rating, tags, reviewText } = req.body;

    const trip = dbStore.getTripById(id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }

    // Role check: Only booked passenger, host driver, or admin may rate
    if (req.user) {
      const isDriver = (trip.driverId && trip.driverId === req.user.id) ||
        (trip.driver?.name && req.user.fullName && trip.driver.name.trim().toLowerCase() === req.user.fullName.trim().toLowerCase());
      const isBooked = (trip.bookedPassengers || []).some(p =>
        (p.id && p.id === req.user.id) ||
        (p.passengerId && p.passengerId === req.user.id) ||
        (p.name && req.user.fullName && p.name.trim().toLowerCase() === req.user.fullName.trim().toLowerCase())
      );

      if (!isDriver && !isBooked && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN_NOT_PARTICIPANT',
          message: 'Only a booked passenger or host driver of this trip can submit reciprocal ratings.'
        });
      }
    }

    const reviewRecord = dbStore.addRating(id, {
      reviewerName,
      reviewerRole: reviewerRole || 'PASSENGER',
      targetName: targetName || 'Co-Traveler',
      targetRole: targetRole || 'DRIVER',
      rating: Number(rating),
      tags: tags || [],
      reviewText: reviewText || ''
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('trip:rated', { tripId: id, review: reviewRecord });
    }

    res.json({ success: true, message: 'Two-way verified rating recorded successfully', data: reviewRecord });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/trips/reviews - Query two-way verified reviews
router.get('/reviews/all', (req, res) => {
  try {
    const { user } = req.query;
    const reviews = dbStore.getReviews(user);
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/trips/:id/chat - Fetch persisted two-way chat messages
router.get('/:id/chat', (req, res) => {
  try {
    const { id } = req.params;
    const messages = dbStore.getChatMessages(id);
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/trips/:id/chat - Persist message & broadcast in real-time
router.post('/:id/chat', chatLimiter, validateBody(chatMessageSchema), idempotency, (req, res) => {
  try {
    const { id } = req.params;
    const { text, sender, senderName, type } = req.body;

    // Strict XSS Sanitization & HTML strip
    const cleanText = sanitizeChatText(text);

    const savedMsg = dbStore.addChatMessage(id, {
      text: cleanText,
      sender: sender || 'passenger',
      senderName: senderName || 'Verified Member',
      type: type || 'TEXT'
    });

    eventLog.recordEvent({
      streamId: `trip:${id}`,
      eventName: 'chat:new_message',
      payload: savedMsg,
      tripId: id
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${id}`).emit('chat:new_message', savedMsg);
      io.to(id).emit('chat:new_message', savedMsg);
      io.emit('chat:new_message', savedMsg);
    }

    res.json({ success: true, message: 'Message saved and delivered', data: savedMsg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
