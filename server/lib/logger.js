import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'swari-api',
    env: env.NODE_ENV
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label })
  }
});

export const createRequestLogger = (requestId) => {
  return logger.child({ reqId: requestId });
};

export default logger;
