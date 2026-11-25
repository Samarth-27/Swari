import crypto from 'crypto';
import { logger } from '../lib/logger.js';

export const requestIdMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  req.log = logger.child({ reqId });

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration
    };

    if (res.statusCode >= 500) {
      req.log.error(logData, 'HTTP request server error');
    } else if (res.statusCode >= 400) {
      req.log.warn(logData, 'HTTP request client error');
    } else if (req.url.startsWith('/api')) {
      req.log.info(logData, 'HTTP request completed');
    }
  });

  next();
};

export default requestIdMiddleware;
