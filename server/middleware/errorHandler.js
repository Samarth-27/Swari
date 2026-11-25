import { logger } from '../lib/logger.js';
import { sentry } from '../lib/sentry.js';

export class AppError extends Error {
  constructor(statusCode, error, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.message = message;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.originalUrl || req.url}`
  });
};

export const errorHandler = (err, req, res, next) => {
  const reqLog = req.log || logger;

  // Handle AppError
  if (err instanceof AppError) {
    reqLog.warn({ err, reqId: req.id }, `AppError: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      error: err.error || 'BAD_REQUEST',
      message: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  // Handle JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    reqLog.warn({ err, reqId: req.id }, 'Malformed JSON payload');
    return res.status(400).json({
      success: false,
      error: 'MALFORMED_JSON',
      message: 'Invalid JSON payload received in request body.'
    });
  }

  // Handle Zod Error
  if (err?.name === 'ZodError') {
    const formatted = err.issues?.map(i => ({ path: i.path.join('.'), message: i.message }));
    reqLog.warn({ issues: formatted, reqId: req.id }, 'Validation error');
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request payload validation failed.',
      details: formatted
    });
  }

  // Unhandled / Internal Server Error
  reqLog.error({ err, reqId: req.id }, `Unhandled Exception: ${err.message}`);
  sentry.captureException(err, { reqId: req.id, url: req.originalUrl || req.url, method: req.method, userId: req.user?.id });
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred while processing the request.'
      : err.message
  });
};

export default errorHandler;
