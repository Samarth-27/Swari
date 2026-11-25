// Swari Distributed Event Log & Sequence Tracking Engine
// Supplies monotonic sequence numbers per stream (user, trip, global) for reliable client reconnection

import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

class EventLogService {
  constructor() {
    this.currentSeq = 0;
    this.events = []; // Ordered array of events
    this.streamIndexes = new Map(); // streamId -> Array of event references
  }

  /**
   * Record an atomic real-time event with a monotonic sequence number
   */
  recordEvent({ streamId = 'global', eventName, payload, tripId = null, userId = null }) {
    this.currentSeq += 1;
    const seq = this.currentSeq;

    const event = {
      id: `EVT-${seq}`,
      seq,
      streamId,
      eventName,
      payload,
      tripId: tripId || payload?.tripId || payload?.trip?.id || null,
      userId: userId || payload?.userId || payload?.passengerId || payload?.driverId || null,
      createdAt: new Date().toISOString()
    };

    this.events.push(event);

    // Keep memory bound to last 10,000 events
    if (this.events.length > 10000) {
      this.events.shift();
    }

    // Index by stream
    if (!this.streamIndexes.has(streamId)) {
      this.streamIndexes.set(streamId, []);
    }
    const streamList = this.streamIndexes.get(streamId);
    streamList.push(event);
    if (streamList.length > 5000) {
      streamList.shift();
    }

    // Asynchronously insert into PostgreSQL event_log table
    query(
      `INSERT INTO event_log (seq, stream_id, event_name, payload, trip_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (seq) DO NOTHING`,
      [event.seq, event.streamId, event.eventName, JSON.stringify(event.payload), event.tripId, event.userId]
    ).catch(err => {
      logger.debug({ err: err.message }, 'PostgreSQL event_log insert skipped/offline');
    });

    return event;
  }

  /**
   * Query all events since a given sequence number
   */
  getEventsSince({ since = 0, streamId = null, tripId = null, userId = null, limit = 100 }) {
    const sinceSeq = Number(since) || 0;
    const maxLimit = Math.min(Number(limit) || 100, 500);

    let matching = this.events.filter(e => e.seq > sinceSeq);

    if (streamId) {
      matching = matching.filter(e => e.streamId === streamId || e.streamId === 'global');
    }
    if (tripId) {
      matching = matching.filter(e => e.tripId === tripId || e.streamId === `trip:${tripId}`);
    }
    if (userId) {
      matching = matching.filter(e => e.userId === userId || e.streamId === `user:${userId}`);
    }

    const sliced = matching.slice(0, maxLimit);

    return {
      success: true,
      since: sinceSeq,
      latestSeq: this.currentSeq,
      count: sliced.length,
      hasMore: matching.length > maxLimit,
      events: sliced
    };
  }

  getLatestSeq() {
    return this.currentSeq;
  }

  getCurrentSequence() {
    return this.currentSeq;
  }
}

export const eventLog = new EventLogService();
export default eventLog;
