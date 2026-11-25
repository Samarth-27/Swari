// Swari Role-Based Access Control and Authentication Middleware

import { verifyAccessToken } from '../services/authService.js';
import { dbStore } from '../db/store.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    } else {
      req.authError = 'INVALID_OR_EXPIRED_TOKEN';
    }
  } else if (req.headers['x-persona-id']) {
    const user = dbStore.getUserById(req.headers['x-persona-id']);
    if (user) {
      req.user = { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
    }
  } else if (req.headers['x-user-id']) {
    const user = dbStore.getUserById(req.headers['x-user-id']);
    if (user) {
      req.user = { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (req.authError) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication token is invalid or expired.'
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid Bearer token.'
    });
  }

  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // If no user attached
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Forbidden: role '${req.user.role}' lacks permission. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

export function requireTripDriver(req, res, next) {
  // If user is authenticated via JWT or header, enforce strict driver ownership
  if (req.user) {
    const trip = dbStore.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }

    const isDriverId = trip.driverId && trip.driverId === req.user.id;
    const isDriverName = trip.driver?.name && req.user.fullName && 
      trip.driver.name.trim().toLowerCase() === req.user.fullName.trim().toLowerCase();

    if (!isDriverId && !isDriverName && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_NOT_DRIVER',
        message: 'Only the trip host driver can perform this action.'
      });
    }
  }
  next();
}

export function requireBookedPassenger(req, res, next) {
  if (req.user) {
    const trip = dbStore.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }

    const passengerName = req.body?.passengerName || req.user.fullName;
    const passengerId = req.body?.passengerId || req.user.id;

    const isBooked = (trip.bookedPassengers || []).some(p => 
      (p.id && p.id === req.user.id) ||
      (p.passengerId && p.passengerId === req.user.id) ||
      (p.name && req.user.fullName && p.name.trim().toLowerCase() === req.user.fullName.trim().toLowerCase())
    );

    // Also driver may cancel on behalf of passenger if needed, or admin
    const isDriver = (trip.driverId && trip.driverId === req.user.id) || 
      (trip.driver?.name && req.user.fullName && trip.driver.name.trim().toLowerCase() === req.user.fullName.trim().toLowerCase());

    if (!isBooked && !isDriver && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_NOT_PASSENGER',
        message: 'Only the booked passenger or host driver can cancel this reservation.'
      });
    }
  }
  next();
}
