import express from 'express';
import { eventLog } from '../services/eventLog.js';

const router = express.Router();

// GET /api/v1/sync - Retrieve missed real-time events since a specific sequence number
router.get('/', (req, res) => {
  try {
    const { since = 0, streamId, tripId, userId, limit = 100 } = req.query;

    const result = eventLog.getEventsSince({
      since: Number(since),
      streamId,
      tripId,
      userId: userId || req.user?.id,
      limit: Number(limit)
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: 'SYNC_FAILED', message: err.message });
  }
});

// GET /api/v1/sync/status - Returns the current global latest sequence watermark
router.get('/status', (req, res) => {
  res.json({
    success: true,
    latestSeq: eventLog.getLatestSeq(),
    timestamp: new Date().toISOString()
  });
});

export default router;
