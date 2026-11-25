import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../server/config/env.js';
import { logger } from '../server/lib/logger.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE = path.join(__dirname, '../server/data/store.json');

export async function importStoreData() {
  if (!fs.existsSync(STORE_FILE)) {
    logger.warn(`Store file not found at ${STORE_FILE}`);
    return { success: false, reason: 'FILE_NOT_FOUND' };
  }

  const rawData = fs.readFileSync(STORE_FILE, 'utf8');
  const storeData = JSON.parse(rawData);

  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set in environment. Import skipped.');
    return { success: false, reason: 'NO_DATABASE_URL' };
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 5000
  });

  const client = await pool.connect().catch((err) => {
    logger.warn({ err: err.message }, 'Could not connect to PostgreSQL. Import skipped.');
    return null;
  });

  if (!client) {
    await pool.end();
    return { success: false, reason: 'CONNECTION_FAILED' };
  }

  try {
    logger.info('Starting atomic import of store.json into PostgreSQL...');
    await client.query('BEGIN');

    let tripCount = 0;
    let bookingCount = 0;
    let chatCount = 0;
    let reviewCount = 0;
    let broadcastCount = 0;

    // 1. Import Trips
    if (Array.isArray(storeData.trips)) {
      for (const trip of storeData.trips) {
        await client.query(
          `INSERT INTO trips (id, driver_name, vehicle_plate, vehicle_make, vehicle_model, route_id, origin, destination, departure_time, total_seats, seats_available, price_per_seat, booking_mode, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             seats_available = EXCLUDED.seats_available,
             status = EXCLUDED.status,
             updated_at = NOW()`,
          [
            trip.id,
            trip.driver?.name || 'Verified Driver',
            trip.vehicle?.plate || 'KA-XX-XXXX',
            trip.vehicle?.make || 'Tata',
            trip.vehicle?.model || 'Nexon',
            trip.routeId || 'HIGHWAY',
            trip.origin,
            trip.destination,
            trip.departureTime || 'Today',
            trip.totalSeats || 3,
            trip.seatsAvailable || 2,
            trip.pricePerSeat || 500,
            trip.bookingMode || 'INSTANT',
            trip.status || 'ACTIVE_AVAILABLE'
          ]
        );
        tripCount++;

        // Import Booked Passengers
        if (Array.isArray(trip.bookedPassengers)) {
          for (const bp of trip.bookedPassengers) {
            await client.query(
              `INSERT INTO bookings (id, trip_id, passenger_name, passenger_phone, seats_booked, fare_paid, status)
               VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED')
               ON CONFLICT (id) DO NOTHING`,
              [
                bp.bookingId || `BK-${trip.id}-${Math.floor(Math.random() * 1000)}`,
                trip.id,
                bp.name,
                bp.phone || '+91 97XXX-X1142',
                bp.seats || 1,
                bp.fare || trip.pricePerSeat
              ]
            );
            bookingCount++;
          }
        }

        // Import Pending Requests
        if (Array.isArray(trip.pendingRequests)) {
          for (const req of trip.pendingRequests) {
            await client.query(
              `INSERT INTO booking_requests (id, trip_id, passenger_name, passenger_phone, seats, fare, notes, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_HOST_APPROVAL')
               ON CONFLICT (id) DO NOTHING`,
              [
                req.requestId || `REQ-${trip.id}-${Math.floor(Math.random() * 1000)}`,
                trip.id,
                req.name,
                req.phone || '+91 97XXX-X1142',
                req.seats || 1,
                req.fare || trip.pricePerSeat,
                req.notes || null
              ]
            );
          }
        }
      }
    }

    // 2. Import Broadcasts
    if (Array.isArray(storeData.broadcasts)) {
      for (const b of storeData.broadcasts) {
        await client.query(
          `INSERT INTO broadcasts (id, route_id, passenger_name, origin, destination, desired_time, seats_needed, budget_in_rupees, luggage, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            b.id,
            b.routeId || 'HIGHWAY',
            b.passenger?.name || 'Verified Traveler',
            b.origin,
            b.destination,
            b.desiredTime || 'Today',
            b.seatsNeeded || 1,
            b.budgetInRupees || 500,
            b.luggage || null,
            b.notes || null,
            b.status || 'ACTIVE'
          ]
        );
        broadcastCount++;
      }
    }

    // 3. Import Reviews
    if (Array.isArray(storeData.reviews)) {
      for (const rev of storeData.reviews) {
        await client.query(
          `INSERT INTO reviews (id, trip_id, reviewer_name, reviewer_role, target_name, target_role, rating, badge, comment)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            rev.id,
            rev.tripId || 'RIDE-101',
            rev.reviewerName || 'Reviewer',
            rev.reviewerRole || 'PASSENGER',
            rev.targetName || 'Host',
            rev.targetRole || 'DRIVER',
            rev.rating || 5,
            rev.badge || null,
            rev.comment || null
          ]
        );
        reviewCount++;
      }
    }

    await client.query('COMMIT');
    logger.info({ tripCount, bookingCount, reviewCount, broadcastCount }, 'Successfully imported store.json data to PostgreSQL.');
    return { success: true, counts: { tripCount, bookingCount, reviewCount, broadcastCount } };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error({ err }, 'Error importing store.json to PostgreSQL.');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// CLI check
if (process.argv[1] && process.argv[1].endsWith('importStoreData.js')) {
  importStoreData()
    .then((res) => {
      console.log('Import result:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Import failed:', err);
      process.exit(1);
    });
}
