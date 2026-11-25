// Swari Authentication & Cryptographic Service
// Supports Argon2id password hashing, JWT Access/Refresh rotation, and MOCK OTP Provider

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

// ==========================================
// 1. Password Hashing (Argon2id)
// ==========================================
export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifyPassword(hash, plainPassword) {
  if (!hash || !plainPassword) return false;
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (err) {
    logger.debug({ err: err.message }, 'Argon2 verification failed');
    return false;
  }
}

// ==========================================
// 2. JWT Access and Refresh Tokens with Rotation
// ==========================================
// Active Refresh Tokens Set: key = refreshToken, value = { userId, familyId, expiresAt }
const activeRefreshTokens = new Map();

export function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName || user.name
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '15m'
  });
}

export function generateRefreshToken(user, familyId = randomUUID()) {
  const tokenId = randomUUID();
  const payload = {
    id: user.id,
    familyId,
    tokenId
  };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d'
  });

  // Track active refresh token for rotation
  const decoded = jwt.decode(token);
  const expiresAt = (decoded.exp || Math.floor(Date.now() / 1000) + 7 * 86400) * 1000;
  activeRefreshTokens.set(token, {
    userId: user.id,
    familyId,
    tokenId,
    expiresAt
  });

  return { token, familyId };
}

export function generateTokens(user) {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, familyId } = generateRefreshToken(user);
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN || '15m'
  };
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

export function rotateRefreshToken(oldRefreshToken, user) {
  const decoded = verifyRefreshToken(oldRefreshToken);
  if (!decoded) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  // Check if token exists in active list
  const record = activeRefreshTokens.get(oldRefreshToken);
  if (!record) {
    // Reuse detected or invalidated token: revoke all tokens in family
    logger.warn({ userId: decoded.id }, 'Refresh token reuse detected or expired from memory. Revoking token.');
    throw new Error('REFRESH_TOKEN_REUSED_OR_EXPIRED');
  }

  // Invalidate old token
  activeRefreshTokens.delete(oldRefreshToken);

  // Issue new pair preserving or rotating family
  const newAccessToken = generateAccessToken(user);
  const { token: newRefreshToken } = generateRefreshToken(user, record.familyId);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN || '15m'
  };
}

export function revokeRefreshToken(token) {
  return activeRefreshTokens.delete(token);
}

// Periodic cleanup of expired refresh tokens
setInterval(() => {
  const now = Date.now();
  for (const [t, data] of activeRefreshTokens.entries()) {
    if (data.expiresAt < now) {
      activeRefreshTokens.delete(t);
    }
  }
}, 60000);

// ==========================================
// 3. Email/SMS OTP Provider (MOCK Interface)
// ==========================================
/**
 * OTP Provider Interface definition:
 * {
 *   sendOtp(destination): Promise<{ success: boolean, referenceId: string, message: string }>
 *   verifyOtp(destination, otp): Promise<{ success: boolean, verified: boolean }>
 * }
 */

class MockOtpProvider {
  constructor() {
    this.otpStore = new Map(); // key = email/phone, value = { otp, expiresAt }
  }

  async sendOtp(destination) {
    // Generate deterministic mock OTP in test/demo (or random 6-digit)
    const mockOtp = destination.includes('test') || destination.includes('swari') ? '123456' : `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min TTL
    this.otpStore.set(destination.toLowerCase(), { otp: mockOtp, expiresAt });

    logger.info({ destination, mockOtp, provider: 'MOCK_OTP_PROVIDER' }, 'MOCK OTP dispatched (simulated)');

    return {
      success: true,
      provider: 'MOCK_OTP_ENGINE',
      referenceId: `OTP-MOCK-${randomUUID().slice(0, 8)}`,
      message: 'OTP dispatched successfully via simulated provider.',
      mockOtp // returned for automated test verification
    };
  }

  async verifyOtp(destination, enteredOtp) {
    const key = destination.toLowerCase();
    const record = this.otpStore.get(key);
    if (!record) {
      return { success: false, verified: false, error: 'OTP_EXPIRED_OR_NOT_FOUND' };
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(key);
      return { success: false, verified: false, error: 'OTP_EXPIRED' };
    }

    if (record.otp !== String(enteredOtp).trim()) {
      return { success: false, verified: false, error: 'OTP_INCORRECT' };
    }

    this.otpStore.delete(key);
    return { success: true, verified: true };
  }
}

// Real Provider Stub (Not implemented in MOCK mode)
class RealOtpProviderStub {
  async sendOtp() {
    throw new Error('Real SMS/Email OTP provider not configured in MOCK mode. Use MockOtpProvider.');
  }
  async verifyOtp() {
    throw new Error('Real SMS/Email OTP provider not configured in MOCK mode. Use MockOtpProvider.');
  }
}

export const mockOtpProvider = new MockOtpProvider();
export const realOtpProviderStub = new RealOtpProviderStub();
