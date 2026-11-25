// Swari Production Rate Limiting Policies
// Stricter rate limits on authentication, booking, and real-time chat endpoints

import rateLimit from 'express-rate-limit';

const standardResponse = (message, retryAfterSeconds) => ({
  success: false,
  error: 'RATE_LIMIT_EXCEEDED',
  message,
  retryAfterSeconds
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // General traffic allowance
  standardHeaders: true,
  legacyHeaders: false,
  message: standardResponse('Too many requests from this IP, please try again later.', 900)
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: standardResponse('Too many authentication attempts. Please wait 15 minutes.', 900)
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 booking operations / min
  standardHeaders: true,
  legacyHeaders: false,
  message: standardResponse('Booking rate limit reached. Please wait a minute before reserving another seat.', 60)
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 chat messages / min
  standardHeaders: true,
  legacyHeaders: false,
  message: standardResponse('Slow down! You are sending chat messages too rapidly.', 60)
});

export const sosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: standardResponse('Emergency SOS rate limit reached.', 60)
});
