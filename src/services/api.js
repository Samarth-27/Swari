// Swari Hardened API Services
// Strictly typed with ApiError, automatic Bearer JWT injection, refresh token rotation,
// Idempotency-Key support, and zero silent fallbacks in production.

import { apiClient, ApiError } from '../lib/apiClient.js';
import { tokenManager } from '../lib/tokenManager.js';

export { ApiError };

// ==========================================
// Authentication & Persona Services
// ==========================================

export async function loginUser(credentials) {
  const data = await apiClient.post('/auth/login', credentials);
  if (data?.data?.accessToken) {
    tokenManager.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      user: data.data.user
    });
  }
  return data;
}

export async function signupUser(registrationData) {
  const data = await apiClient.post('/auth/signup', registrationData);
  if (data?.data?.accessToken) {
    tokenManager.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      user: data.data.user
    });
  }
  return data;
}

export async function sendOtp(phoneOrEmail) {
  return await apiClient.post('/auth/otp/send', {
    phone: phoneOrEmail.includes('@') ? undefined : phoneOrEmail,
    email: phoneOrEmail.includes('@') ? phoneOrEmail : undefined
  });
}

export async function verifyOtp(phoneOrEmail, otp) {
  const data = await apiClient.post('/auth/otp/verify', {
    phone: phoneOrEmail.includes('@') ? undefined : phoneOrEmail,
    email: phoneOrEmail.includes('@') ? phoneOrEmail : undefined,
    otp
  });
  if (data?.data?.accessToken) {
    tokenManager.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      user: data.data.user
    });
  }
  return data;
}

export async function fetchCurrentUser() {
  return await apiClient.get('/auth/me');
}

export function logoutUser() {
  tokenManager.clearTokens();
}

// ==========================================
// Trip Operations
// ==========================================

export async function fetchTrips(filters = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      params.append(k, v);
    }
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  return await apiClient.get(`/trips${query}`);
}

export async function publishTrip(tripData) {
  return await apiClient.post('/trips/publish', tripData);
}

export async function bookTripSeat(tripId, bookedSeats = 1, passengerName = 'Verified Traveler', passengerDetails = {}) {
  return await apiClient.post(`/trips/${tripId}/book`, {
    bookedSeats: Number(bookedSeats) || 1,
    passengerName,
    passengerDetails
  });
}

export async function completeTrip(tripId) {
  return await apiClient.post(`/trips/${tripId}/complete`, {});
}

export async function cancelTrip(tripId) {
  return await apiClient.post(`/trips/${tripId}/cancel`, {});
}

export async function cancelBooking(tripId, passengerName = 'Verified Traveler') {
  return await apiClient.post(`/trips/${tripId}/cancel-booking`, { passengerName });
}

export async function requestBooking(tripId, passengerName = 'Verified Traveler', passengerDetails = {}) {
  return await apiClient.post(`/trips/${tripId}/request-booking`, {
    passengerName,
    passengerDetails
  });
}

export async function approveBooking(tripId, passengerName) {
  return await apiClient.post(`/trips/${tripId}/approve-booking`, { passengerName });
}

export async function declineBooking(tripId, passengerName) {
  return await apiClient.post(`/trips/${tripId}/decline-booking`, { passengerName });
}

export async function submitTwoWayRating(tripId, ratingData) {
  return await apiClient.post(`/trips/${tripId}/rate`, ratingData);
}

export async function fetchReviews(userName = '') {
  const query = userName ? `?user=${encodeURIComponent(userName)}` : '';
  return await apiClient.get(`/trips/reviews/all${query}`);
}

// ==========================================
// Passenger Broadcast Radar Operations
// ==========================================

export async function fetchBroadcasts() {
  return await apiClient.get('/broadcasts');
}

export async function publishBroadcast(broadcastData) {
  return await apiClient.post('/broadcasts/publish', broadcastData);
}

export async function sendDriverOffer(broadcastId, offerData) {
  return await apiClient.post(`/broadcasts/${broadcastId}/offer`, offerData);
}

// ==========================================
// Safety & Statutory Manifest
// ==========================================

export async function triggerEmergencySos(sosData) {
  return await apiClient.post('/safety/sos', sosData);
}

export async function fetchLegalManifest(tripId) {
  return await apiClient.get(`/safety/manifest/${tripId}`);
}

export async function createLuggageTag(tagData) {
  return await apiClient.post('/safety/luggage/tag', tagData);
}

// ==========================================
// In-Ride Chat Operations
// ==========================================

export async function fetchChatMessages(tripId) {
  return await apiClient.get(`/trips/${tripId}/chat`);
}

export async function sendChatMessageApi(tripId, message) {
  return await apiClient.post(`/trips/${tripId}/chat`, message);
}

// ==========================================
// Event Catch-Up Resync
// ==========================================

export async function fetchCatchUpEvents(sinceSeq = 0) {
  return await apiClient.get(`/sync?since=${Number(sinceSeq) || 0}`);
}
