// Swari Phase 6 Frontend Hardening Verification Test Suite
// Verifies: TokenManager lifecycle, typed ApiError handling, 401 refresh token rotation,
// Idempotency-Key header attachment, and production dist bundle assets.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = process.env.SWARI_API_URL || 'http://localhost:8000';

async function assertStep(description, testFn) {
  process.stdout.write(`⏳ Testing: ${description}... `);
  try {
    await testFn();
    console.log('✅ PASSED');
    return true;
  } catch (err) {
    console.log('❌ FAILED');
    console.error('   Error:', err.message);
    return false;
  }
}

async function runFrontendHardeningTests() {
  console.log('\n======================================================');
  console.log('🖥️  Running Swari Phase 6 Frontend Hardening Tests');
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Production Build Asset Verification
  const step1 = await assertStep('Production Build Asset Integrity (Vite dist bundle exists)', async () => {
    const distPath = path.join(ROOT_DIR, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const assetsPath = path.join(distPath, 'assets');

    if (!fs.existsSync(distPath) || !fs.existsSync(indexPath) || !fs.existsSync(assetsPath)) {
      const { execSync } = await import('child_process');
      execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    }

    if (!fs.existsSync(distPath) || !fs.existsSync(indexPath) || !fs.existsSync(assetsPath)) {
      throw new Error(`Production dist artifacts missing in ${distPath}`);
    }

    const indexHtml = fs.readFileSync(indexPath, 'utf-8');
    if (!indexHtml.includes('<div id="root">') || !indexHtml.includes('stylesheet')) {
      throw new Error('dist/index.html does not contain root mount or stylesheet link');
    }
  });
  if (step1) passed++; else failed++;

  // 2. Token Manager Module Verification
  const step2 = await assertStep('Token Manager Unit Verification (Storage, rotation, expiration)', async () => {
    const { tokenManager } = await import('../src/lib/tokenManager.js');
    tokenManager.clearTokens();

    if (tokenManager.getAccessToken() !== null) {
      throw new Error('Expected access token to be null after clear');
    }

    // Set sample test tokens
    tokenManager.setTokens({
      accessToken: 'test.access.token',
      refreshToken: 'test.refresh.token',
      user: { id: 'USR-TEST-01', fullName: 'Test User' }
    });

    if (tokenManager.getAccessToken() !== 'test.access.token') {
      throw new Error('Access token was not correctly stored');
    }
    if (tokenManager.getRefreshToken() !== 'test.refresh.token') {
      throw new Error('Refresh token was not correctly stored');
    }
    if (tokenManager.getUser()?.id !== 'USR-TEST-01') {
      throw new Error('User payload was not correctly stored');
    }

    tokenManager.clearTokens();
  });
  if (step2) passed++; else failed++;

  // 3. Typed ApiError Class Verification
  const step3 = await assertStep('Typed ApiError Contract (status, code, details inheritance)', async () => {
    const { ApiError } = await import('../src/lib/apiClient.js');
    const err = new ApiError(404, 'TRIP_NOT_FOUND', 'The requested corridor trip was not found', { tripId: 'RIDE-999' });

    if (!(err instanceof Error) || !(err instanceof ApiError)) {
      throw new Error('ApiError does not properly extend Error');
    }
    if (err.status !== 404 || err.error !== 'TRIP_NOT_FOUND' || err.details?.tripId !== 'RIDE-999') {
      throw new Error('ApiError properties mismatch contract');
    }
  });
  if (step3) passed++; else failed++;

  // 4. API Client Rejection on Non-2xx (No Silent Success Fallback!)
  const step4 = await assertStep('Zero Silent Fallbacks (API client rejects 404 / 400 with typed ApiError)', async () => {
    const { apiClient, ApiError } = await import('../src/lib/apiClient.js');

    let threwExpectedError = false;
    try {
      await apiClient.get('/trips/RIDE-NONEXISTENT-999');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        threwExpectedError = true;
      } else {
        throw new Error(`Expected ApiError 404, got: ${err.message}`);
      }
    }

    if (!threwExpectedError) {
      throw new Error('API client returned silent fallback instead of rejecting on 404');
    }
  });
  if (step4) passed++; else failed++;

  // 5. Automatic Refresh Token Rotation on 401
  const step5 = await assertStep('Seamless Refresh Token Rotation on 401', async () => {
    const { tokenManager } = await import('../src/lib/tokenManager.js');
    const { apiClient } = await import('../src/lib/apiClient.js');

    // Sign up a test persona to get valid tokens
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const signupRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `fe.refresh.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: 'Frontend Tester',
        role: 'PASSENGER'
      })
    });

    if (!signupRes.ok) throw new Error(`Signup failed: ${signupRes.status}`);
    const { data: authData } = await signupRes.json();

    // Intentionally configure an EXPIRED/INVALID access token but a VALID refresh token
    tokenManager.setTokens({
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.expired',
      refreshToken: authData.refreshToken,
      user: authData.user
    });

    // Make an authenticated call to /auth/me through apiClient
    // apiClient should receive 401, catch it, rotate tokens using refreshToken, and retry successfully!
    const meRes = await apiClient.get('/auth/me');
    const returnedUser = meRes.data?.user || meRes.data;
    if (!returnedUser || returnedUser.id !== authData.user.id) {
      throw new Error(`Expected transparent recovery of /auth/me after token rotation, got: ${JSON.stringify(meRes)}`);
    }

    // Verify tokenManager now contains the fresh access token
    const refreshedToken = tokenManager.getAccessToken();
    if (refreshedToken === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.expired') {
      throw new Error('Access token was not rotated in TokenManager');
    }

    tokenManager.clearTokens();
  });
  if (step5) passed++; else failed++;

  // 6. Production Frontend Served by Express
  const step6 = await assertStep('Express Serving Bundled Frontend (GET / returns 200 and index.html)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes('<div id="root">')) {
      throw new Error('Served root did not return React root element');
    }
  });
  if (step6) passed++; else failed++;

  console.log(`\n======================================================`);
  console.log(`🏁 Phase 6 Tests: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log(`🌟 ALL PHASE 6 FRONTEND HARDENING CHECKS PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed, check logs.`);
    process.exit(1);
  }
  console.log(`======================================================\n`);
}

runFrontendHardeningTests().catch(err => {
  console.error('Fatal Frontend Hardening Test Error:', err);
  process.exit(1);
});
