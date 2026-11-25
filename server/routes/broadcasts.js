import express from 'express';
import { dbStore } from '../db/store.js';
import { validateBody } from '../middleware/validate.js';
import { publishBroadcastSchema, offerBroadcastSchema } from '../validators/schemas.js';

const router = express.Router();

// GET /api/v1/broadcasts - Query active passenger broadcasts
router.get('/', (req, res) => {
  try {
    const list = dbStore.getBroadcasts();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/broadcasts/publish - Passenger posts travel request with budget
router.post('/publish', validateBody(publishBroadcastSchema), (req, res) => {
  try {
    const { origin, destination, desiredTime, seatsNeeded, budgetInRupees, luggage, notes } = req.body;

    if (!origin || !destination || !budgetInRupees) {
      return res.status(400).json({ success: false, error: 'Missing required travel details' });
    }

    const newBroadcast = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      routeId: 'BLR-MAA',
      passenger: {
        name: 'You (Verified Traveler)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        rating: 5.0,
        completedTrips: 1,
        isAadhaarVerified: true,
        isCorporateVerified: true,
        company: 'Swari Community'
      },
      origin,
      destination,
      desiredTime: desiredTime || 'Tomorrow morning',
      seatsNeeded: Number(seatsNeeded) || 1,
      budgetInRupees: Number(budgetInRupees),
      luggage: luggage || '1 Bag',
      notes: notes || '',
      driverOffers: [],
      createdAt: new Date().toISOString()
    };

    dbStore.addBroadcast(newBroadcast);

    // Broadcast WebSocket Synchronization event to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('broadcast:created', newBroadcast);
    }

    res.status(201).json({ success: true, message: 'Request broadcasted live', data: newBroadcast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/broadcasts/:id/offer - Driver sends car offer to passenger
router.post('/:id/offer', validateBody(offerBroadcastSchema), (req, res) => {
  try {
    const { id } = req.params;
    const { driverName, car, offeredFare, pickupEstimate, note } = req.body;

    const offer = {
      offerId: `OFFER-${Date.now().toString().slice(-4)}`,
      driverName: driverName || 'Vikramaditya Rao',
      car: car || 'Tata Nexon EV (KA 05 MN 2819)',
      offeredFare: Number(offeredFare),
      pickupEstimate: pickupEstimate || 'In 45 mins',
      note: note || '',
      status: 'PENDING',
      timestamp: Date.now()
    };

    const saved = dbStore.addOfferToBroadcast(id, offer);
    if (!saved) {
      return res.status(404).json({ success: false, error: 'Broadcast request not found' });
    }

    // Broadcast WebSocket event via io
    const io = req.app.get('io');
    if (io) {
      io.emit('offer:received', { broadcastId: id, offer });
    }

    res.json({ success: true, message: 'Car offer delivered & persisted', data: offer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
