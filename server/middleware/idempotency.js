// Swari Idempotency Engine Middleware
// Prevents duplicate operations across bookings, approvals, and chat on retries

import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

class IdempotencyStore {
  constructor() {
    this.memoryCache = new Map(); // key -> { statusCode, headers, body, expiresAt }
  }

  get(key) {
    const record = this.memoryCache.get(key);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return record;
  }

  set(key, statusCode, headers, body, ttlMs = 24 * 60 * 60 * 1000) {
    const record = {
      statusCode,
      headers: {
        'content-type': headers['content-type'] || 'application/json; charset=utf-8',
        'x-idempotent-replayed': 'true'
      },
      body,
      expiresAt: Date.now() + ttlMs
    };

    this.memoryCache.set(key, record);

    // Clean up older records if store exceeds 5,000 entries
    if (this.memoryCache.size > 5000) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    // Async sync to Postgres if connection is active
    query(
      `INSERT INTO idempotency_keys (key, path, status_code, response_headers, response_body, expires_at)
       VALUES ($1, $2, $3, $4, $5, TO_TIMESTAMP($6 / 1000.0))
       ON CONFLICT (key) DO NOTHING`,
      [key, headers['x-request-path'] || 'api', statusCode, JSON.stringify(record.headers), JSON.stringify(body), record.expiresAt]
    ).catch(err => {
      logger.debug({ err: err.message }, 'PostgreSQL idempotency key persist skipped/offline');
    });

    return record;
  }
}

export const idempotencyStore = new IdempotencyStore();

export function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  if (!key) {
    return next();
  }

  // Check if we already processed this request
  const cached = idempotencyStore.get(key);
  if (cached) {
    logger.info({ idempotencyKey: key, path: req.originalUrl }, 'Idempotent request replayed from cache');
    res.setHeader('X-Idempotent-Replayed', 'true');
    res.setHeader('X-Cache-Lookup', 'HIT');
    return res.status(cached.statusCode).json(cached.body);
  }

  // Intercept response to store result
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Only cache successful or definitive client responses (2xx, 4xx)
    if (res.statusCode >= 200 && res.statusCode < 500) {
      idempotencyStore.set(key, res.statusCode, {
        ...res.getHeaders(),
        'x-request-path': req.originalUrl
      }, body);
    }
    return originalJson(body);
  };

  next();
}
