// Swari Persistent Data Engine & Repository Orchestrator
// Coordinates between local atomic JSON persistence and PostgreSQL Repository Layer

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { TripRepository } from '../repositories/tripRepository.js';
import { BookingRepository } from '../repositories/bookingRepository.js';
import { ChatRepository } from '../repositories/chatRepository.js';
import { ReviewRepository } from '../repositories/reviewRepository.js';
import { BroadcastRepository } from '../repositories/broadcastRepository.js';
import { SafetyRepository } from '../repositories/safetyRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';
import { UserRepository } from '../repositories/userRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Initial Seed Data
const INITIAL_SEED = {
  trips: [
    {
      id: 'RIDE-101',
      routeId: 'BLR-MAA',
      driver: {
        name: 'Vikramaditya Rao',
        rating: 4.92,
        totalRides: 84,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        isAadhaarVerified: true,
        isDlVerified: true,
        phoneMasked: '+91 98XXX-X4921'
      },
      vehicle: {
        make: 'Tata',
        model: 'Nexon EV Empowered',
        plate: 'KA 05 MN 2819',
        color: 'Daytona Grey',
        fuelType: 'ELECTRIC_EV',
        ac: true
      },
      origin: 'Bengaluru (Electronic City Toll)',
      destination: 'Chennai (Koyambedu Metro)',
      departureTime: 'Today, 04:30 PM',
      seatsAvailable: 2,
      totalSeats: 3,
      pricePerSeat: 620,
      womenOnly: false,
      bookingMode: 'INSTANT',
      status: 'ACTIVE_AVAILABLE',
      passengers: [],
      bookedPassengers: [],
      pendingRequests: []
    },
    {
      id: 'RIDE-102',
      routeId: 'BLR-MAA',
      driver: {
        name: 'Dr. Ananya Subramanian',
        rating: 4.98,
        totalRides: 42,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        isAadhaarVerified: true,
        isDlVerified: true,
        phoneMasked: '+91 94XXX-X8312'
      },
      vehicle: {
        make: 'Hyundai',
        model: 'Creta SX(O)',
        plate: 'TN 07 BQ 6190',
        color: 'Polar White',
        fuelType: 'PETROL',
        ac: true
      },
      origin: 'Bengaluru (Silk Board Junction)',
      destination: 'Chennai (Guindy Kathipara)',
      departureTime: 'Tomorrow, 07:00 AM',
      seatsAvailable: 3,
      totalSeats: 3,
      pricePerSeat: 590,
      womenOnly: true,
      bookingMode: 'ON_REQUEST',
      status: 'ACTIVE_AVAILABLE',
      passengers: [],
      bookedPassengers: [],
      pendingRequests: []
    },
    {
      id: 'RIDE-103',
      routeId: 'DEL-CHD',
      driver: {
        name: 'Col. Rajesh Bakshi (Retd.)',
        rating: 4.95,
        totalRides: 110,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        isAadhaarVerified: true,
        isDlVerified: true,
        phoneMasked: '+91 98XXX-X2281'
      },
      vehicle: {
        make: 'Mahindra',
        model: 'XUV700 AX7L',
        plate: 'CH 01 BG 4410',
        color: 'Midnight Black',
        fuelType: 'DIESEL',
        ac: true
      },
      origin: 'Delhi (Kashmere Gate ISBT)',
      destination: 'Chandigarh (Tribune Chowk Sector 29)',
      departureTime: 'Today, 06:15 PM',
      seatsAvailable: 3,
      totalSeats: 4,
      pricePerSeat: 460,
      womenOnly: false,
      bookingMode: 'INSTANT',
      status: 'ACTIVE_AVAILABLE',
      passengers: [],
      bookedPassengers: [],
      pendingRequests: []
    }
  ],
  broadcasts: [
    {
      id: 'REQ-201',
      routeId: 'BLR-MAA',
      passenger: {
        name: 'Rahul Sharma',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        rating: 4.9,
        completedTrips: 18,
        isAadhaarVerified: true,
        isCorporateVerified: true,
        company: 'Infosys Bangalore'
      },
      origin: 'Bengaluru (Electronic City Toll Gate)',
      destination: 'Chennai (Vellore Bypass or Koyambedu)',
      desiredTime: 'Today between 4:00 PM – 5:30 PM',
      seatsNeeded: 1,
      budgetInRupees: 550,
      luggage: '1 Laptop Backpack + 1 Cabin Trolley',
      notes: 'Going home for weekend. Flexible on exact drop location.',
      driverOffers: []
    },
    {
      id: 'REQ-202',
      routeId: 'BLR-MAA',
      passenger: {
        name: 'Pooja Venkatesh',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        rating: 5.0,
        completedTrips: 9,
        isAadhaarVerified: true,
        isCorporateVerified: true,
        company: 'Wipro Sarjapur'
      },
      origin: 'Bengaluru (HSR Layout / Silk Board)',
      destination: 'Chennai (Guindy Kathipara)',
      desiredTime: 'Tomorrow morning, 07:00 AM – 08:00 AM',
      seatsNeeded: 1,
      budgetInRupees: 600,
      luggage: '1 Medium Suitcase',
      notes: 'Prefers non-smoking & women driver if available.',
      driverOffers: []
    }
  ],
  sosLogs: [],
  luggageTags: [],
  chats: {},
  reviews: [
    {
      id: 'REV-001',
      tripId: 'RIDE-101',
      timestamp: '2026-11-20T10:30:00.000Z',
      reviewerName: 'Priya Sundaram',
      reviewerRole: 'PASSENGER',
      targetName: 'Vikramaditya Rao',
      targetRole: 'DRIVER',
      rating: 5,
      badge: 'Punctual & Safe Driver',
      comment: 'Very smooth highway driving on NH 44. Stopped at a clean A2B for coffee.'
    },
    {
      id: 'REV-002',
      tripId: 'RIDE-101',
      timestamp: '2026-11-20T11:00:00.000Z',
      reviewerName: 'Vikramaditya Rao',
      reviewerRole: 'DRIVER',
      targetName: 'Priya Sundaram',
      targetRole: 'PASSENGER',
      rating: 5,
      badge: 'Great Co-Traveler',
      comment: 'Arrived at Electronic City toll plaza right on time. Great conversation!'
    }
  ],
  auditLogs: []
};

class Store {
  constructor() {
    this.data = this.load();

    // Initialize the modular repository layer behind the same interface
    this.tripRepo = new TripRepository(this);
    this.bookingRepo = new BookingRepository(this);
    this.chatRepo = new ChatRepository(this);
    this.reviewRepo = new ReviewRepository(this);
    this.broadcastRepo = new BroadcastRepository(this);
    this.safetyRepo = new SafetyRepository(this);
    this.auditRepo = new AuditRepository(this);
    this.userRepo = new UserRepository(this);
  }

  load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...INITIAL_SEED,
          ...parsed,
          trips: Array.isArray(parsed.trips) && parsed.trips.length > 0 ? parsed.trips : INITIAL_SEED.trips,
          broadcasts: Array.isArray(parsed.broadcasts) ? parsed.broadcasts : INITIAL_SEED.broadcasts,
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews : INITIAL_SEED.reviews
        };
      }
    } catch (e) {
      console.warn('[SWARI-STORE] Warning loading store.json, using seed data:', e.message);
    }
    return JSON.parse(JSON.stringify(INITIAL_SEED));
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[SWARI-STORE] Error saving store.json:', e);
    }
  }

  // --- USER REPOSITORY METHODS ---
  getUsers() {
    return this.userRepo.getUsers();
  }

  getUserById(id) {
    return this.userRepo.getUserById(id);
  }

  getUserByEmail(email) {
    return this.userRepo.getUserByEmail(email);
  }

  getUserByPhone(phone) {
    return this.userRepo.getUserByPhone(phone);
  }

  getUserByName(name) {
    return this.userRepo.getUserByName(name);
  }

  createUser(userData) {
    return this.userRepo.createUser(userData);
  }

  updateUser(id, updates) {
    return this.userRepo.updateUser(id, updates);
  }

  // --- TRIP REPOSITORY METHODS ---
  getTrips() {
    return this.data.trips || [];
  }

  getTripById(id) {
    return this.tripRepo.getTripById(id);
  }

  getActiveTripByDriver(driverName, vehiclePlate) {
    return this.tripRepo.getActiveTripByDriver(driverName, vehiclePlate);
  }

  addTrip(trip) {
    return this.tripRepo.addTrip(trip);
  }

  completeTrip(tripId) {
    return this.tripRepo.completeTrip(tripId);
  }

  cancelTrip(tripId) {
    return this.tripRepo.cancelTrip(tripId);
  }

  // --- BOOKING REPOSITORY METHODS ---
  getActiveBookingByPassenger(passengerName) {
    return this.bookingRepo.getActiveBookingByPassenger(passengerName);
  }

  bookTripSeat(tripId, bookedSeats = 1, passengerName = 'Verified Traveler', passengerDetails = {}) {
    return this.bookingRepo.bookTripSeat(tripId, bookedSeats, passengerName, passengerDetails);
  }

  cancelBooking(tripId, passengerName) {
    return this.bookingRepo.cancelBooking(tripId, passengerName);
  }

  requestBookingSeat(tripId, passengerName = 'Verified Traveler', passengerDetails = {}) {
    return this.bookingRepo.requestBookingSeat(tripId, passengerName, passengerDetails);
  }

  approveBookingSeat(tripId, passengerName) {
    return this.bookingRepo.approveBookingSeat(tripId, passengerName);
  }

  declineBookingSeat(tripId, passengerName) {
    return this.bookingRepo.declineBookingSeat(tripId, passengerName);
  }

  // --- CHAT REPOSITORY METHODS ---
  getChatMessages(tripId) {
    return this.chatRepo.getChatMessages(tripId);
  }

  addChatMessage(tripId, message) {
    return this.chatRepo.addChatMessage(tripId, message);
  }

  // --- REVIEW REPOSITORY METHODS ---
  addRating(tripId, ratingData) {
    return this.reviewRepo.addRating(tripId, ratingData);
  }

  getReviews(name) {
    return this.reviewRepo.getReviews(name);
  }

  // --- BROADCAST REPOSITORY METHODS ---
  getBroadcasts() {
    return this.broadcastRepo.getBroadcasts();
  }

  addBroadcast(broadcast) {
    return this.broadcastRepo.addBroadcast(broadcast);
  }

  addDriverOffer(broadcastId, offer) {
    return this.broadcastRepo.addDriverOffer(broadcastId, offer);
  }

  addOfferToBroadcast(broadcastId, offer) {
    return this.broadcastRepo.addOfferToBroadcast(broadcastId, offer);
  }

  // --- SAFETY REPOSITORY METHODS ---
  logSos(sosData) {
    return this.safetyRepo.logSos(sosData);
  }

  createLuggageTag(tagData) {
    return this.safetyRepo.createLuggageTag(tagData);
  }

  saveLuggageTag(tagData) {
    return this.safetyRepo.saveLuggageTag(tagData);
  }

  // --- AUDIT REPOSITORY METHODS ---
  logAudit(action, entityType, entityId, actorId, actorRole, details) {
    return this.auditRepo.logAudit(action, entityType, entityId, actorId, actorRole, details);
  }

  getAuditLogs() {
    return this.auditRepo.getAuditLogs();
  }
}

export const dbStore = new Store();
export default dbStore;
