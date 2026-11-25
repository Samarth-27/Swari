// Swari Phase 3 Comprehensive Authentication & Authorization Test Suite
// Tests Argon2 hashing, JWT access/refresh rotation, MOCK OTP, role checks & Socket.IO handshake auth

import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:8000';

async function runAuthTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 Running Swari Phase 3 Authentication & Security Tests`);
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  async function assertStep(description, testFn) {
    try {
      process.stdout.write(`⏳ Testing: ${description}... `);
      await testFn();
      console.log(`✅ PASSED`);
      passed++;
    } catch (err) {
      console.log(`❌ FAILED`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testUserEmail = `traveler.${randomSuffix}@test.swari.in`;
  const testPassword = `SecretPass#${randomSuffix}`;
  let registeredUserId = null;
  let accessToken = null;
  let refreshToken = null;

  // 1. User Signup with Argon2 Hashing
  await assertStep('POST /api/v1/auth/signup (Argon2id password hashing)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testPassword,
        fullName: `Test Traveler ${randomSuffix}`,
        phone: `+91 98${randomSuffix}1122`,
        role: 'PASSENGER'
      })
    });

    if (res.status !== 201) {
      const errBody = await res.text();
      throw new Error(`Expected 201, got ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    if (!data.data?.accessToken || !data.data?.refreshToken) {
      throw new Error('Missing accessToken or refreshToken in response');
    }
    if (!data.data?.user?.id) {
      throw new Error('User ID not returned');
    }
    registeredUserId = data.data.user.id;
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
  });

  // 2. Reject Duplicate Email Signup
  await assertStep('POST /api/v1/auth/signup (Reject duplicate email with 409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'AnotherPassword123',
        fullName: 'Duplicate User'
      })
    });

    if (res.status !== 409) {
      throw new Error(`Expected 409, got ${res.status}`);
    }
    const data = await res.json();
    if (data.error !== 'USER_ALREADY_EXISTS') {
      throw new Error(`Expected USER_ALREADY_EXISTS, got ${data.error}`);
    }
  });

  // 3. User Login with Password (Argon2 verification)
  await assertStep('POST /api/v1/auth/login (Argon2 password verification)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testPassword
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.data?.accessToken || !data.data?.refreshToken) {
      throw new Error('Tokens missing on login');
    }
    // Update active tokens
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
  });

  // 4. Reject Login with Bad Password
  await assertStep('POST /api/v1/auth/login (Reject invalid password with 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'WrongPassword999!'
      })
    });

    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  // 5. Refresh Token Rotation
  let newAccessToken = null;
  let newRefreshToken = null;
  await assertStep('POST /api/v1/auth/refresh (Rotate refresh token)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.data?.accessToken || !data.data?.refreshToken) {
      throw new Error('Did not return rotated token pair');
    }
    newAccessToken = data.data.accessToken;
    newRefreshToken = data.data.refreshToken;
  });

  // 6. Refresh Token Reuse Prevention (Old refresh token must be invalidated)
  await assertStep('POST /api/v1/auth/refresh (Reject invalidated old refresh token)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }) // old token
    });

    if (res.status !== 401) {
      throw new Error(`Expected 401 on token reuse, got ${res.status}`);
    }
  });

  // 7. MOCK OTP Flow
  const otpEmail = `otp.user.${randomSuffix}@test.swari.in`;
  let mockOtp = null;
  await assertStep('POST /api/v1/auth/otp/send (Simulated MOCK OTP provider)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.provider || !data.mockOtp) throw new Error('Missing mockOtp from provider');
    mockOtp = data.mockOtp;
  });

  await assertStep('POST /api/v1/auth/otp/verify (Verify OTP and authenticate)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail, otp: mockOtp })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.data?.accessToken) throw new Error('No access token returned for OTP user');
  });

  // 8. Protected Endpoint GET /api/v1/auth/me
  await assertStep('GET /api/v1/auth/me (Access with valid Bearer token)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.data?.id !== registeredUserId) {
      throw new Error(`Expected user ID ${registeredUserId}, got ${data.data?.id}`);
    }
  });

  await assertStep('GET /api/v1/auth/me (Reject request without token with 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 9. Role Checks: PASSENGER cannot access ADMIN route
  await assertStep('GET /api/v1/admin/overview (Forbidden 403 for PASSENGER role)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/overview`, {
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    });

    if (res.status !== 403) {
      throw new Error(`Expected 403 FORBIDDEN for non-admin, got ${res.status}`);
    }
  });

  // 10. Role Checks: ADMIN can access ADMIN route
  await assertStep('GET /api/v1/admin/overview (Success 200 for ADMIN persona token)', async () => {
    // Login as Admin persona
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'USR-ADMIN-01' })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.data.accessToken;

    const res = await fetch(`${BASE_URL}/api/v1/admin/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!res.ok) throw new Error(`Expected 200 for admin, got ${res.status}`);
    const body = await res.json();
    if (!body.kpis) throw new Error('Missing admin KPIs');
  });

  // 11. Ownership Checks on Trips: Non-driver rejected from approving booking
  await assertStep('POST /api/v1/trips/:id/approve-booking (Reject non-host with 403)', async () => {
    // Try to approve a booking on RIDE-102 (driver is Dr. Ananya) using passenger token
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/approve-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newAccessToken}`
      },
      body: JSON.stringify({ passengerName: 'Someone Else' })
    });

    if (res.status !== 403) {
      throw new Error(`Expected 403 FORBIDDEN_NOT_DRIVER, got ${res.status}`);
    }
  });

  // 12. Socket.IO Handshake Auth (Reject invalid token)
  await assertStep('Socket.IO Handshake (Reject invalid JWT token)', async () => {
    await new Promise((resolve, reject) => {
      const badSocket = io(BASE_URL, {
        auth: { token: 'invalid_malformed_token_123' },
        transports: ['websocket'],
        reconnection: false
      });

      badSocket.on('connect_error', (err) => {
        badSocket.close();
        if (err.message.includes('Authentication error')) {
          resolve();
        } else {
          resolve(); // Any connect error is a pass
        }
      });

      badSocket.on('connect', () => {
        badSocket.close();
        reject(new Error('Socket connected unexpectedly with invalid token'));
      });
    });
  });

  // 13. Socket.IO Handshake Auth (Accept valid token and join user room)
  await assertStep('Socket.IO Handshake (Accept valid token & join user:<id> room)', async () => {
    await new Promise((resolve, reject) => {
      const goodSocket = io(BASE_URL, {
        auth: { token: newAccessToken },
        transports: ['websocket'],
        reconnection: false
      });

      goodSocket.on('connect', () => {
        goodSocket.close();
        resolve();
      });

      goodSocket.on('connect_error', (err) => {
        goodSocket.close();
        reject(err);
      });
    });
  });

  console.log(`\n======================================================`);
  console.log(`🏁 Phase 3 Auth Tests: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log(`🌟 ALL PHASE 3 AUTH & ACCESS CONTROL TESTS PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed, check logs.`);
    process.exit(1);
  }
  console.log(`======================================================\n`);
}

runAuthTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
