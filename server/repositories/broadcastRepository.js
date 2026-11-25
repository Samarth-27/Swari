import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export class BroadcastRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
  }

  getBroadcasts() {
    return this.store.data.broadcasts || [];
  }

  addBroadcast(broadcast) {
    const newBroadcast = {
      ...broadcast,
      id: broadcast.id || `REQ-${Date.now().toString().slice(-4)}`,
      status: 'ACTIVE',
      driverOffers: [],
      createdAt: new Date().toISOString()
    };

    this.store.data.broadcasts = this.store.data.broadcasts || [];
    this.store.data.broadcasts.unshift(newBroadcast);
    this.store.save();

    query(
      `INSERT INTO broadcasts (id, route_id, passenger_name, origin, destination, desired_time, seats_needed, budget_in_rupees, luggage, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING`,
      [
        newBroadcast.id,
        newBroadcast.routeId || 'HIGHWAY',
        newBroadcast.passenger?.name || 'Verified Traveler',
        newBroadcast.origin,
        newBroadcast.destination,
        newBroadcast.desiredTime || 'Today',
        newBroadcast.seatsNeeded || 1,
        newBroadcast.budgetInRupees || 500,
        newBroadcast.luggage || null,
        newBroadcast.notes || null,
        'ACTIVE'
      ]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres broadcasts insert background sync skipped'));

    return newBroadcast;
  }

  addDriverOffer(broadcastId, offer) {
    const broadcast = (this.store.data.broadcasts || []).find(b => b.id === broadcastId);
    if (!broadcast) return null;

    const offerObj = {
      offerId: `OFFER-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      ...offer
    };

    broadcast.driverOffers = broadcast.driverOffers || [];
    broadcast.driverOffers.push(offerObj);
    this.store.save();

    query(
      `INSERT INTO driver_offers (id, broadcast_id, driver_name, car, offered_fare, pickup_estimate, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        offerObj.offerId,
        broadcastId,
        offer.driverName || 'Verified Driver',
        offer.car || 'Car',
        offer.offeredFare || 500,
        offer.pickupEstimate || 'Today',
        offer.notes || null,
        'PENDING'
      ]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres driver_offers insert background sync skipped'));

    return offerObj;
  }

  addOfferToBroadcast(broadcastId, offer) {
    return this.addDriverOffer(broadcastId, offer);
  }
}

export default BroadcastRepository;
