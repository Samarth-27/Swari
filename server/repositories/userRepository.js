import { randomUUID } from 'crypto';
import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export const INITIAL_PERSONAS = [
  {
    id: 'USR-ADMIN-01',
    role: 'ADMIN',
    fullName: 'Swari Operations & Safety Command HQ',
    phone: '+91 80-2800-SWARI',
    email: 'ops-command@swari.in',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    title: 'Chief Safety & Highway Operations Officer',
    badge: 'HQ PLATFORM OPERATOR',
    rating: 5.0,
    isAadhaarVerified: true,
    isPhoneVerified: true,
    isEmailVerified: true
  },
  {
    id: 'USR-PASS-01',
    role: 'PASSENGER',
    fullName: 'Rahul Sharma',
    phone: '+91 97412-88412',
    email: 'rahul.sharma@infosys.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    company: 'Infosys Bangalore',
    rating: 4.92,
    totalTrips: 18,
    aadhaarMasked: 'XXXX-XXXX-4412',
    isAadhaarVerified: true,
    isCorporateVerified: true,
    safePayBalanceInr: 1250,
    isPhoneVerified: true,
    isEmailVerified: true
  },
  {
    id: 'USR-DRIV-01',
    role: 'DRIVER',
    fullName: 'Vikramaditya Rao',
    phone: '+91 98451-94921',
    email: 'vikram.rao@techcorp.in',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.96,
    totalHostedRides: 84,
    fuelOffsetTotalInr: 54800,
    aadhaarMasked: 'XXXX-XXXX-9182',
    isAadhaarVerified: true,
    isDlVerified: true,
    isRcVerified: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    vehicle: {
      make: 'Tata',
      model: 'Nexon EV Empowered',
      plate: 'KA 05 MN 2819',
      color: 'Daytona Grey',
      fuelType: 'ELECTRIC_EV',
      insuranceValidTill: '2027-10-15',
      fastagBalance: 1420
    }
  },
  {
    id: 'USR-DRIV-02',
    role: 'DRIVER',
    fullName: 'Dr. Ananya Subramanian',
    phone: '+91 94432-88312',
    email: 'ananya.s@apollohospitals.org',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    rating: 4.98,
    totalHostedRides: 42,
    fuelOffsetTotalInr: 32600,
    aadhaarMasked: 'XXXX-XXXX-7120',
    isAadhaarVerified: true,
    isDlVerified: true,
    isRcVerified: true,
    womenOnlyHost: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    vehicle: {
      make: 'Hyundai',
      model: 'Creta SX(O)',
      plate: 'TN 07 BQ 6190',
      color: 'Polar White',
      fuelType: 'PETROL',
      insuranceValidTill: '2026-12-30',
      fastagBalance: 850
    }
  }
];

export class UserRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
    if (!this.store.data.users) {
      this.store.data.users = [...INITIAL_PERSONAS];
      this.store.save();
    }
  }

  getUsers() {
    if (!this.store.data.users) {
      this.store.data.users = [...INITIAL_PERSONAS];
    }
    return this.store.data.users;
  }

  getUserById(id) {
    if (!id) return null;
    return this.getUsers().find(u => u.id === id) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const norm = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email && u.email.trim().toLowerCase() === norm) || null;
  }

  getUserByPhone(phone) {
    if (!phone) return null;
    const clean = phone.replace(/[^0-9]/g, '');
    return this.getUsers().find(u => {
      if (!u.phone) return false;
      const uClean = u.phone.replace(/[^0-9]/g, '');
      return uClean.endsWith(clean.slice(-10)) || clean.endsWith(uClean.slice(-10));
    }) || null;
  }

  getUserByName(name) {
    if (!name) return null;
    const norm = name.trim().toLowerCase();
    return this.getUsers().find(u => u.fullName && u.fullName.trim().toLowerCase() === norm) || null;
  }

  createUser(userData) {
    const id = userData.id || `USR-${randomUUID().slice(0, 8).toUpperCase()}`;
    const newUser = {
      id,
      role: userData.role || 'PASSENGER',
      fullName: userData.fullName || 'Verified Traveler',
      email: userData.email,
      phone: userData.phone || userData.phoneNumber || `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
      passwordHash: userData.passwordHash || null,
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      totalTrips: 0,
      totalHostedRides: 0,
      aadhaarMasked: userData.aadhaarMasked || 'XXXX-XXXX-4412',
      isAadhaarVerified: Boolean(userData.isAadhaarVerified),
      isPhoneVerified: Boolean(userData.isPhoneVerified),
      isEmailVerified: Boolean(userData.isEmailVerified),
      isDlVerified: Boolean(userData.isDlVerified),
      safePayBalanceInr: 1000,
      tokenVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.getUsers().push(newUser);
    this.store.save();

    // Async sync to Postgres if connected
    query(
      `INSERT INTO users (id, full_name, email, phone_number, role, is_phone_verified, is_email_verified, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [
        newUser.id.includes('-') && newUser.id.length === 36 ? newUser.id : randomUUID(),
        newUser.fullName,
        newUser.email,
        newUser.phone,
        newUser.role,
        newUser.isPhoneVerified,
        newUser.isEmailVerified,
        newUser.rating
      ]
    ).catch(err => {
      logger.debug({ err: err.message }, 'PostgreSQL user async sync skipped/error');
    });

    return newUser;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.store.save();
    return user;
  }
}
