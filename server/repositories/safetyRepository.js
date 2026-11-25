import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export class SafetyRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
  }

  logSos(sosData) {
    this.store.data.sosLogs = this.store.data.sosLogs || [];
    const logEntry = {
      id: `SOS-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      erss112Dispatched: true,
      policeRef: `MOCK-ERSS-112-${Date.now().toString().slice(-6)}`,
      status: 'DISPATCHED',
      ...sosData
    };

    this.store.data.sosLogs.unshift(logEntry);
    this.store.save();

    query(
      `INSERT INTO sos_alerts (id, trip_id, vehicle_plate, latitude, longitude, erss_112_dispatched, police_ref, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        logEntry.id,
        sosData.tripId || 'TRIP-UNKNOWN',
        sosData.vehiclePlate || 'KA-XX-XXXX',
        sosData.currentLocation?.lat || 12.9716,
        sosData.currentLocation?.lng || 77.5946,
        true,
        logEntry.policeRef,
        'DISPATCHED'
      ]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres sos_alerts insert background sync skipped'));

    return logEntry;
  }

  createLuggageTag(tagData) {
    this.store.data.luggageTags = this.store.data.luggageTags || [];
    const tagEntry = {
      tagId: `LUG-${Date.now().toString().slice(-4)}`,
      qrCodeData: `SWARI-LUGGAGE-VERIFIED-${Date.now()}`,
      insurancePolicyRef: `MOCK-INS-25K-${Date.now().toString().slice(-6)}`,
      insuranceCoverInr: 25000,
      sealedAt: new Date().toISOString(),
      status: 'SEALED',
      ...tagData
    };

    this.store.data.luggageTags.unshift(tagEntry);
    this.store.save();

    query(
      `INSERT INTO luggage_tags (id, trip_id, bag_count, description, photo_hash, insurance_cover_inr, insurance_policy_ref, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        tagEntry.tagId,
        tagData.tripId || 'TRIP-UNKNOWN',
        tagData.bagCount || 1,
        tagData.description || 'Luggage item',
        tagData.photoHash || 'sha256-mock-photo-hash',
        25000,
        tagEntry.insurancePolicyRef,
        'SEALED'
      ]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres luggage_tags insert background sync skipped'));

    return tagEntry;
  }

  saveLuggageTag(tagData) {
    return this.createLuggageTag(tagData);
  }
}

export default SafetyRepository;
