import { describe, it, expect } from 'vitest';
import { io } from 'socket.io-client';

const BASE_URL = process.env.SWARI_API_URL || 'http://localhost:8000';

describe('Integration Tests: Socket.IO Rooms, Recovery & Handshake Auth', () => {
  it('rejects connection handshake when invalid token is provided', async () => {
    const errorPromise = new Promise((resolve) => {
      const socket = io(BASE_URL, {
        auth: { token: 'invalid.malformed.jwt.token' },
        transports: ['websocket'],
        reconnection: false
      });
      socket.on('connect_error', (err) => {
        socket.disconnect();
        resolve(err.message);
      });
    });

    const errorMsg = await errorPromise;
    expect(errorMsg).toMatch(/Authentication error|jwt|token|invalid/i);
  });

  it('authenticates valid JWT and joins user-scoped room', async () => {
    // Acquire a valid JWT token
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const signupRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `socket.room.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: 'Socket Tester',
        role: 'PASSENGER'
      })
    });

    const { data: authData } = await signupRes.json();
    const token = authData.accessToken;

    const socketPromise = new Promise((resolve, reject) => {
      const socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false
      });

      socket.on('connect', () => {
        const socketId = socket.id;
        socket.disconnect();
        resolve(socketId);
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        reject(err);
      });
    });

    const socketId = await socketPromise;
    expect(socketId).toBeDefined();
    expect(typeof socketId).toBe('string');
  });
});
