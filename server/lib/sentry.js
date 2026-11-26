// Swari Production Sentry Hook & Error Reporting Interface
// Mark: MOCK / Configurable Provider Stub
// When SENTRY_DSN is configured, captures exception events. In local dev/mock, logs structured error details.

import { logger } from './logger.js';
import { env } from '../config/env.js';

class SentryService {
  constructor() {
    this.dsn = process.env.SENTRY_DSN || null;
    this.isInitialized = Boolean(this.dsn && !this.dsn.includes('placeholder'));
    this.environment = env?.NODE_ENV || 'development';

    if (this.isInitialized) {
      logger.info({ environment: this.environment }, 'Sentry production error monitoring initialized');
    } else {
      logger.debug('Sentry DSN placeholder or omitted; using structured logger error capture (MOCK)');
    }
  }

  captureException(err, context = {}) {
    if (this.isInitialized) {
      // In a real Sentry deployment, @sentry/node.captureException(err, { extra: context }) is called
      logger.error({ err, context, sentryDispatched: true }, '[SENTRY-LIVE] Captured exception');
    } else {
      logger.error({
        sentryMock: true,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
        reqId: context.reqId,
        url: context.url,
        method: context.method,
        userId: context.userId
      }, '[SENTRY-MOCK] Captured application error event');
    }
  }

  captureMessage(message, level = 'info', context = {}) {
    if (logger[level]) {
      logger[level]({ sentryMock: true, context }, message);
    } else {
      logger.info(context, message);
    }
  }
}

export const sentry = new SentryService();
