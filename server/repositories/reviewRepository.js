import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export class ReviewRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
  }

  addRating(tripId, ratingData) {
    this.store.data.reviews = this.store.data.reviews || [];
    const reviewRecord = {
      id: `REV-${Date.now().toString().slice(-5)}`,
      tripId,
      timestamp: new Date().toISOString(),
      ...ratingData
    };
    this.store.data.reviews.unshift(reviewRecord);

    const trip = this.store.data.trips.find(x => x.id === tripId);
    if (trip) {
      trip.twoWayRatings = trip.twoWayRatings || [];
      trip.twoWayRatings.push(reviewRecord);

      if (ratingData.targetRole === 'DRIVER' && trip.driver) {
        const curRating = trip.driver.rating || 4.9;
        const total = trip.driver.totalRides || 10;
        trip.driver.rating = Number(((curRating * total + Number(ratingData.rating)) / (total + 1)).toFixed(2));
        trip.driver.totalRides = total + 1;
      }
    }

    this.store.save();

    query(
      `INSERT INTO reviews (id, trip_id, reviewer_name, reviewer_role, target_name, target_role, rating, badge, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [
        reviewRecord.id,
        tripId,
        reviewRecord.reviewerName,
        reviewRecord.reviewerRole || 'PASSENGER',
        reviewRecord.targetName,
        reviewRecord.targetRole || 'DRIVER',
        reviewRecord.rating,
        reviewRecord.badge || null,
        reviewRecord.comment || null
      ]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres reviews insert background sync skipped'));

    return reviewRecord;
  }

  getReviews(name) {
    this.store.data.reviews = this.store.data.reviews || [];
    if (!name) return this.store.data.reviews;
    const lower = name.toLowerCase().trim();
    return this.store.data.reviews.filter(r => 
      (r.targetName && r.targetName.toLowerCase().includes(lower)) ||
      (r.reviewerName && r.reviewerName.toLowerCase().includes(lower))
    );
  }
}

export default ReviewRepository;
