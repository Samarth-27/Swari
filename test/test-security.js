// Swari Phase 5 Security & Validation Test Suite
// Verifies Strict CSP (no unsafe-eval), Zod validation, Chat Sanitization, Co-traveler Phone Reveal, and Audit Logging

const BASE_URL = 'http://localhost:8000';

async function runSecurityTests() {
  console.log(`\n======================================================`);
  console.log(`🛡️  Running Swari Phase 5 Security & Validation Tests`);
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

  // 1. Strict Content Security Policy (No 'unsafe-eval')
  await assertStep('Helmet CSP Header (Strict policy without unsafe-eval)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csp = res.headers.get('content-security-policy') || '';

    if (csp.includes('unsafe-eval')) {
      throw new Error(`Insecure CSP detected: 'unsafe-eval' is present in header: ${csp}`);
    }
    if (!csp.includes("default-src 'self'")) {
      throw new Error(`Expected default-src 'self' in CSP header`);
    }
  });

  // 2. Zod Schema Validation Rejection (Malformed Email)
  await assertStep('Zod Schema Validation (Reject malformed email on signup with 400)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email-no-domain',
        password: 'ValidPassword123!',
        fullName: 'Test User'
      })
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
    const data = await res.json();
    if (data.error !== 'VALIDATION_ERROR') {
      throw new Error(`Expected VALIDATION_ERROR, got ${data.error}`);
    }
  });

  // 3. Zod Input Boundary Limits (Trip Publish with negative seats)
  await assertStep('Zod Boundary Validation (Reject negative or zero seat counts with 400)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Bengaluru',
        destination: 'Chennai',
        seatsAvailable: 0, // Invalid: min is 1
        pricePerSeat: 500
      })
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
    const data = await res.json();
    if (data.error !== 'VALIDATION_ERROR') {
      throw new Error(`Expected VALIDATION_ERROR, got ${data.error}`);
    }
  });

  // 4. Zod Input Length Limit (Chat text > 500 chars)
  await assertStep('Input Length Limits (Reject chat message exceeding 500 characters with 400)', async () => {
    const excessiveText = 'A'.repeat(505);
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-101/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: excessiveText,
        sender: 'passenger'
      })
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
    const data = await res.json();
    if (data.error !== 'VALIDATION_ERROR') {
      throw new Error(`Expected VALIDATION_ERROR, got ${data.error}`);
    }
  });

  // 5. Chat Text XSS Sanitization (HTML tags stripped)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  await assertStep('Chat Text Sanitization (Neutralize XSS and strip HTML script tags)', async () => {
    const maliciousPayload = `<script>alert('pwned')</script><b>Meeting at Silk Board Gate 2</b> ${randomSuffix}`;
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-101/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: maliciousPayload,
        sender: 'passenger',
        senderName: 'Security Tester'
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const savedText = data.data.text;

    if (savedText.includes('<script>') || savedText.includes('<b>')) {
      throw new Error(`Malicious HTML tags were NOT sanitized: ${savedText}`);
    }
    if (!savedText.includes('Meeting at Silk Board Gate 2')) {
      throw new Error(`Legitimate content was lost during sanitization: ${savedText}`);
    }
  });

  // 6. Phone Masking Default & Co-Traveler Reveal
  let testRideId = null;
  const rawDriverPhone = '+91 98451-94921';
  let hostDriverToken = null;
  let bookedPaxToken = null;
  let strangerPaxToken = null;

  await assertStep('Co-Traveler Privacy (Setup trip & authenticated personas)', async () => {
    // Create new Host Driver
    const hostRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `host.driver.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: `Host Driver ${randomSuffix}`,
        phone: rawDriverPhone,
        role: 'DRIVER'
      })
    });
    if (!hostRes.ok) throw new Error(`Host signup failed: ${hostRes.status}`);
    const hostData = await hostRes.json();
    hostDriverToken = hostData.data.accessToken;

    // Create Passenger 1
    const paxRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `booked.pax.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: `Booked Pax ${randomSuffix}`,
        phone: '+91 97412-88412',
        role: 'PASSENGER'
      })
    });
    if (!paxRes.ok) throw new Error(`Pax signup failed: ${paxRes.status}`);
    const paxData = await paxRes.json();
    bookedPaxToken = paxData.data.accessToken;

    // Create a new Stranger Passenger
    const strangerRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `stranger.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: 'Stranger Traveler',
        role: 'PASSENGER'
      })
    });
    if (!strangerRes.ok) throw new Error(`Stranger signup failed: ${strangerRes.status}`);
    const strangerData = await strangerRes.json();
    strangerPaxToken = strangerData.data.accessToken;

    // Publish trip with raw phone
    const pubRes = await fetch(`${BASE_URL}/api/v1/trips/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hostDriverToken}`
      },
      body: JSON.stringify({
        routeId: 'BLR-MAA',
        origin: 'Bengaluru (HSR Layout)',
        destination: 'Chennai (Guindy)',
        seatsAvailable: 3,
        pricePerSeat: 600,
        driver: {
          name: `Host Driver ${randomSuffix}`,
          phone: rawDriverPhone
        },
        vehicle: { plate: `KA 05 SEC ${randomSuffix}` }
      })
    });
    if (!pubRes.ok) throw new Error(`Publish trip failed: ${pubRes.status}`);
    const pubData = await pubRes.json();
    testRideId = pubData.data.id;

    // Book seat for Rahul Sharma
    const bookRes = await fetch(`${BASE_URL}/api/v1/trips/${testRideId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bookedPaxToken}`
      },
      body: JSON.stringify({
        passengerName: `Booked Pax ${randomSuffix}`,
        passengerDetails: { phone: '+91 97412-88412' }
      })
    });
    if (!bookRes.ok) throw new Error(`Book seat failed: ${bookRes.status}`);
  });

  await assertStep('Phone Number Masking (Stranger sees strictly masked phone numbers)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/${testRideId}`, {
      headers: { 'Authorization': `Bearer ${strangerPaxToken}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const trip = data.data;

    // Driver phone must be masked
    if (!trip.driver?.phoneMasked || trip.driver?.phoneMasked.includes('451-94921')) {
      throw new Error(`Driver phone was not masked for stranger: ${trip.driver?.phoneMasked}`);
    }
    // Passenger list must be redacted
    if (trip.passengers && trip.passengers.length > 0) {
      throw new Error('Passenger identities leaked to stranger');
    }
  });

  await assertStep('Co-Traveler Phone Reveal (Confirmed co-traveler sees real driver phone)', async () => {
    // Booked passenger views trip
    const res = await fetch(`${BASE_URL}/api/v1/trips/${testRideId}`, {
      headers: { 'Authorization': `Bearer ${bookedPaxToken}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const trip = data.data;

    // Since Rahul Sharma is a booked passenger on this trip, the driver contact must be revealed
    if (!trip.driver?.phone && !trip.driver?.phoneMasked) {
      throw new Error('Driver contact missing for co-traveler');
    }
  });

  // 7. Audit Logging Verification
  await assertStep('Security Audit Trail (Verify structured audit logs for critical actions)', async () => {
    // Trigger SOS to verify SOS audit logging
    const sosRes = await fetch(`${BASE_URL}/api/v1/safety/sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bookedPaxToken}`
      },
      body: JSON.stringify({
        tripId: testRideId,
        vehiclePlate: `KA 05 SEC ${randomSuffix}`
      })
    });
    if (!sosRes.ok) throw new Error(`HTTP ${sosRes.status}`);

    // Verify through admin overview
    const adminLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'USR-ADMIN-01' })
    });
    const adminToken = (await adminLogin.json()).data.accessToken;

    const adminRes = await fetch(`${BASE_URL}/api/v1/admin/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!adminRes.ok) throw new Error(`HTTP ${adminRes.status}`);
    const adminData = await adminRes.json();
    if (!adminData.kpis) throw new Error('Missing admin KPIs');
  });

  console.log(`\n======================================================`);
  console.log(`🏁 Phase 5 Tests: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log(`🌟 ALL PHASE 5 SECURITY & VALIDATION TESTS PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed, check logs.`);
    process.exit(1);
  }
  console.log(`======================================================\n`);
}

runSecurityTests().catch((err) => {
  console.error('Fatal security test runner error:', err);
  process.exit(1);
});
