// Swari Central Request Validation Schemas (Zod)
// Enforces strict input typing, boundary limits, and parameter constraints

import { z } from 'zod';

// ==========================================
// 1. Auth Schemas
// ==========================================
export const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address format').max(160),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(['PASSENGER', 'DRIVER', 'ADMIN']).default('PASSENGER')
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160).optional(),
  password: z.string().max(100).optional(),
  personaId: z.string().max(50).optional(),
  phoneNumber: z.string().max(20).optional(),
  otp: z.string().max(10).optional()
}).refine(data => data.email || data.personaId || data.phoneNumber, {
  message: 'Must provide either email, personaId, or phoneNumber'
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token required')
});

export const otpSendSchema = z.object({
  destination: z.string().trim().min(3).max(160).optional(),
  email: z.string().trim().min(3).max(160).optional()
}).refine(data => data.destination || data.email, {
  message: 'Either email or destination is required'
});

export const otpVerifySchema = z.object({
  destination: z.string().trim().min(3).max(160).optional(),
  email: z.string().trim().min(3).max(160).optional(),
  otp: z.string().trim().min(4).max(10, 'Invalid OTP format')
}).refine(data => data.destination || data.email, {
  message: 'Either email or destination is required'
});

// ==========================================
// 2. Trip Schemas
// ==========================================
export const publishTripSchema = z.object({
  routeId: z.string().max(50).default('BLR-MAA'),
  origin: z.string().trim().min(2, 'Origin required').max(150),
  destination: z.string().trim().min(2, 'Destination required').max(150),
  departureTime: z.string().max(100).optional(),
  seatsAvailable: z.coerce.number().int().min(1, 'Minimum 1 seat').max(8, 'Maximum 8 seats').default(2),
  pricePerSeat: z.coerce.number().positive('Fare must be positive').max(5000, 'Statutory cost sharing maximum ₹5000'),
  vehicle: z.object({
    make: z.string().max(50).optional(),
    model: z.string().max(50).optional(),
    plate: z.string().max(30).optional(),
    color: z.string().max(30).optional(),
    fuelType: z.string().max(30).optional()
  }).optional(),
  womenOnly: z.boolean().optional(),
  driver: z.object({
    name: z.string().max(120).optional(),
    avatar: z.string().max(300).optional(),
    phone: z.string().max(30).optional()
  }).optional(),
  bookingMode: z.enum(['INSTANT', 'ON_REQUEST']).default('INSTANT'),
  isTwoWayTrip: z.boolean().optional(),
  returnLeg: z.any().optional()
});

export const bookSeatSchema = z.object({
  passengerName: z.string().trim().max(120).optional(),
  bookedSeats: z.coerce.number().int().min(1).max(4).default(1),
  passengerDetails: z.record(z.string(), z.any()).optional()
});

export const requestBookingSchema = z.object({
  passengerName: z.string().trim().max(120).optional(),
  passengerDetails: z.record(z.string(), z.any()).optional()
});

export const approveBookingSchema = z.object({
  passengerName: z.string().trim().max(120).optional()
});

export const declineBookingSchema = z.object({
  passengerName: z.string().trim().max(120).optional()
});

export const cancelBookingSchema = z.object({
  passengerName: z.string().trim().max(120).optional()
});

export const rateTripSchema = z.object({
  reviewerName: z.string().trim().min(1, 'Reviewer name required').max(120),
  reviewerRole: z.enum(['PASSENGER', 'DRIVER']).default('PASSENGER'),
  targetName: z.string().trim().max(120).optional(),
  targetRole: z.enum(['PASSENGER', 'DRIVER']).default('DRIVER'),
  rating: z.coerce.number().min(1).max(5),
  tags: z.array(z.string().max(50)).max(10).optional(),
  reviewText: z.string().max(500, 'Review cannot exceed 500 characters').optional()
});

export const chatMessageSchema = z.object({
  text: z.string().min(1, 'Message text is required').max(500, 'Chat messages capped at 500 characters'),
  sender: z.string().max(50).optional(),
  senderName: z.string().max(120).optional(),
  type: z.string().max(50).default('TEXT')
});

// ==========================================
// 3. Broadcast Schemas
// ==========================================
export const publishBroadcastSchema = z.object({
  origin: z.string().trim().min(2).max(150),
  destination: z.string().trim().min(2).max(150),
  desiredTime: z.string().max(100).optional(),
  seatsNeeded: z.coerce.number().int().min(1).max(6).default(1),
  budgetInRupees: z.coerce.number().positive().max(5000).optional(),
  luggage: z.string().max(100).optional(),
  notes: z.string().max(300).optional()
});

export const offerBroadcastSchema = z.object({
  driverName: z.string().trim().min(1).max(120),
  car: z.string().max(120).optional(),
  offeredFare: z.coerce.number().positive().max(5000),
  pickupEstimate: z.string().max(100).optional()
});

// ==========================================
// 4. Safety Schemas
// ==========================================
export const sosSchema = z.object({
  tripId: z.string().trim().min(1).max(100),
  vehiclePlate: z.string().max(30).optional(),
  currentLocation: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number()
  }).optional()
});

export const luggageTagSchema = z.object({
  tripId: z.string().trim().min(1).max(100),
  bagCount: z.coerce.number().int().min(1).max(10).default(1),
  description: z.string().max(200).optional(),
  photoUrl: z.string().max(500).optional()
});
