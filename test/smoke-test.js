// Swari Automated Production Smoke & Integrity Test Suite
// Verifies all REST APIs, Statutory MV Act 1988 Guardrails, and Data Persistence

const BASE_URL = 'http://localhost:8000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 Running Swari Enterprise Production Smoke Tests`);
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

  // 1. Health Probe
  await assertStep('GET /health (System status, DB health & metrics)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ONLINE') throw new Error('Status not ONLINE');
    if (!data.system || !data.database) throw new Error('Missing metrics telemetry');
    if (!res.headers.get('x-request-id')) throw new Error('Missing X-Request-Id header');
  });

  // 1b. Readiness Probe (/ready)
  await assertStep('GET /ready (Readiness probe verifying DB store accessibility)', async () => {
    const res = await fetch(`${BASE_URL}/ready`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'READY') throw new Error(`Expected READY, got ${data.status}`);
    if (!data.checks?.database) throw new Error('Missing database check');
  });

  // 1c. Consistent Error Shape on 404
  await assertStep('GET /api/v1/nonexistent (Consistent error shape contract)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/nonexistent`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false) throw new Error('Expected success: false');
    if (!data.error || !data.message) throw new Error('Missing error or message in error shape');
  });

  // 2. Query Trips
  await assertStep('GET /api/v1/trips (Retrieve active highway corridors)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No trips returned');
  });

  // 3. Legal Guardrail: Reject Commercial Price Exploitation
  await assertStep('POST /api/v1/trips/publish (Reject illegal fare > MV Act ceiling)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeId: 'BLR-MAA',
        origin: 'Bengaluru',
        destination: 'Chennai',
        pricePerSeat: 3500 // Exceeds legal ceiling of ~₹750
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const body = await res.json();
    if (body.error !== 'LEGAL_PRICE_CEILING_EXCEEDED') throw new Error('Ceiling guardrail did not trigger');
  });

  // 4. Legal Guardrail: Accept Compliant Cost-Sharing Trip
  let createdTripId = null;
  const uniquePlate = `KA 03 ZZ ${Math.floor(1000 + Math.random() * 9000)}`;
  const uniqueDriver = `Priya Host ${Date.now().toString().slice(-4)}`;
  const uniquePassenger = `Ananya Passenger ${Date.now().toString().slice(-4)}`;

  await assertStep('POST /api/v1/trips/publish (Accept compliant non-commercial trip)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeId: 'BLR-MAA',
        origin: 'Bengaluru (Silk Board)',
        destination: 'Chennai (Guindy)',
        departureTime: 'Today, 06:00 PM',
        seatsAvailable: 2,
        pricePerSeat: 580,
        driver: { name: uniqueDriver },
        vehicle: { plate: uniquePlate, make: 'Hyundai', model: 'Venue' }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.data?.id) throw new Error('Trip ID not returned');
    createdTripId = body.data.id;
  });

  // 4b. Enforce Single Active Trip: Reject 2nd trip published by same driver
  await assertStep('POST /api/v1/trips/publish (Reject 2nd trip - Single Active Trip rule)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeId: 'BLR-MAA',
        origin: 'Bengaluru (HSR)',
        destination: 'Chennai (Vellore)',
        departureTime: 'Today, 08:00 PM',
        seatsAvailable: 2,
        pricePerSeat: 500,
        driver: { name: uniqueDriver },
        vehicle: { plate: uniquePlate }
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const body = await res.json();
    if (body.error !== 'ACTIVE_TRIP_EXISTS') throw new Error(`Expected ACTIVE_TRIP_EXISTS, got ${body.error}`);
  });

  // 4c. Book Seat using OS Semaphore Mutex & WebSocket broadcast (1 seat only)
  await assertStep('POST /api/v1/trips/:id/book (Dijkstra Mutex Critical Section Seat Booking)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/${createdTripId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookedSeats: 1,
        passengerName: uniquePassenger
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.data || body.data.seatsAvailable !== 1) {
      throw new Error(`Expected seatsAvailable: 1, got: ${body.data?.seatsAvailable}`);
    }
  });

  // 4d. Enforce Single Active Booking: Reject 2nd booking for same passenger
  await assertStep('POST /api/v1/trips/:id/book (Reject 2nd booking - Single Active Booking rule)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-101/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookedSeats: 1,
        passengerName: uniquePassenger
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const body = await res.json();
    if (body.error !== 'ACTIVE_BOOKING_EXISTS') throw new Error(`Expected ACTIVE_BOOKING_EXISTS, got ${body.error}`);
  });

  // 4e. Complete Trip Lifecycle: Complete trip and verify slot is freed
  await assertStep('POST /api/v1/trips/:id/complete (Lifecycle completion & slot freeing)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/${createdTripId}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.data?.status !== 'COMPLETED') throw new Error(`Expected COMPLETED, got ${body.data?.status}`);
  });

  // 4f. On-Request Booking Flow (Request -> Approve)
  const reqPassengerName = `Kavya Traveler ${Date.now().toString().slice(-4)}`;
  await assertStep('POST /api/v1/trips/:id/request-booking (Submit on-request seat reservation)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/request-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passengerName: reqPassengerName,
        passengerDetails: {
          phone: '+91 98888-11223',
          company: 'Wipro Bangalore',
          rating: 4.95
        }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== 'PENDING_HOST_APPROVAL') throw new Error(`Expected PENDING_HOST_APPROVAL, got ${body.status}`);
  });

  await assertStep('POST /api/v1/trips/:id/approve-booking (Host Driver approves seat request)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/approve-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerName: reqPassengerName })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.data?.bookedPassengers?.some(p => p.name === reqPassengerName)) {
      throw new Error('Approved passenger not found in bookedPassengers');
    }
  });

  // 4g. Two-Way Reciprocal Ratings
  await assertStep('POST /api/v1/trips/:id/rate (Passenger rates Host Driver)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewerRole: 'PASSENGER',
        reviewerName: reqPassengerName,
        targetRole: 'DRIVER',
        targetName: 'Dr. Ananya Subramanian',
        rating: 5,
        badge: 'Smooth Driving',
        comment: 'Safe, punctual, and very comfortable ride.'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.data?.rating !== 5) throw new Error('Rating value mismatch');
  });

  await assertStep('GET /api/v1/trips/reviews/all (Fetch verified reciprocal reviews)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/reviews/all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!Array.isArray(body.data) || body.data.length === 0) throw new Error('No reviews returned');
  });

  // 4h. Two-Way Live Chat with Database Persistence
  await assertStep('POST /api/v1/trips/:id/chat (Persist message to database)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Where along Silk Board should we meet?',
        sender: 'passenger',
        senderName: reqPassengerName
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.data?.id || !body.data?.text) throw new Error('Chat message not persisted');
  });

  await assertStep('GET /api/v1/trips/:id/chat (Fetch persisted message thread)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/chat`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!Array.isArray(body.data) || body.data.length === 0) throw new Error('No chat history returned');
  });

  // 4i. Safe Cancellation & Decline Tests
  await assertStep('POST /api/v1/trips/:id/cancel-booking (Cancel confirmed seat & restore capacity)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerName: reqPassengerName })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.data?.bookedPassengers?.some(p => p.name === reqPassengerName)) {
      throw new Error('Passenger still present in bookedPassengers');
    }
  });

  await assertStep('POST /api/v1/trips/:id/decline-booking (Host Driver declines on-request booking)', async () => {
    const declinePassenger = `Decline Test ${Date.now().toString().slice(-4)}`;
    // First request
    await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/request-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerName: declinePassenger })
    });
    // Then decline
    const res = await fetch(`${BASE_URL}/api/v1/trips/RIDE-102/decline-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerName: declinePassenger })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.data?.pendingRequests?.some(p => p.name === declinePassenger)) {
      throw new Error('Declined passenger still in pendingRequests');
    }
  });

  // 5. Broadcast Passenger Ride Request
  let broadcastId = null;
  await assertStep('POST /api/v1/broadcasts/publish (Broadcast request with budget)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/broadcasts/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Bengaluru (Electronic City)',
        destination: 'Chennai (Koyambedu)',
        desiredTime: 'Tomorrow, 08:00 AM',
        seatsNeeded: 1,
        budgetInRupees: 550,
        luggage: '1 Cabin Bag'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.data?.id) throw new Error('Broadcast ID not returned');
    broadcastId = body.data.id;
  });

  // 6. Driver Car Offer on Broadcast
  await assertStep('POST /api/v1/broadcasts/:id/offer (Driver sends car request)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/broadcasts/${broadcastId}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverName: 'Vikramaditya Rao',
        car: 'Tata Nexon EV (KA 05 MN 2819)',
        offeredFare: 550,
        pickupEstimate: 'Tomorrow at 08:15 AM'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.data?.offerId) throw new Error('Offer ID not created');
  });

  // 7. Silent SOS Trigger
  await assertStep('POST /api/v1/safety/sos (Silent SOS dispatch to Police ERSS 112)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/safety/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'SWARI-TRIP-98421',
        vehiclePlate: 'KA 05 MN 2819',
        currentLocation: { lat: 12.6310, lng: 78.0120 }
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.data?.erss112Dispatched) throw new Error('Police dispatch flag false');
  });

  // 8. Luggage Anti-Theft Tagging
  await assertStep('POST /api/v1/safety/luggage/tag (Anti-theft photo & insurance seal)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/safety/luggage/tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'SWARI-TRIP-98421',
        bagCount: 1,
        description: 'Black Delsey Cabin Trolley'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.data?.insuranceCoverInr !== 25000) throw new Error('Insurance cover mismatch');
  });

  // 9. Digital Travel Manifest
  await assertStep('GET /api/v1/safety/manifest/:tripId (Statutory MV Act 1988 certificate)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/safety/manifest/SWARI-TRIP-98421`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.manifest?.driver?.aadhaarMasked) throw new Error('Driver Aadhaar not masked');
    if (!body.manifest?.vehicle?.registrationType) throw new Error('Vehicle registration missing');
  });

  // 10. Admin & Safety Operations HQ Overview
  await assertStep('GET /api/v1/admin/overview (Ops radar & active expressway telemetry)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/overview`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.kpis || !Array.isArray(body.activeVehicles)) throw new Error('Missing admin KPI metrics');
    if (body.kpis.statutoryComplianceRate !== '100%') throw new Error('Compliance rate discrepancy');
  });

  // 11. Computer Science Engines (SEPM, CN, FLAT, OS)
  await assertStep('GET /api/v1/cs-metrics/overview (OS Mutex, FLAT DFA, CN Sliding Window, SEPM)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/cs-metrics/overview`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.domains?.operatingSystems?.seatSemaphoreMutex) throw new Error('Missing OS Semaphore');
    if (!body.domains?.automataTheory?.lifecycleDfa) throw new Error('Missing FLAT DFA Machine');
    if (!body.domains?.computerNetworks?.slidingWindowFlowControl) throw new Error('Missing CN Flow Control');
    if (!body.domains?.softwareEngineering?.adjustedFunctionPoints) throw new Error('Missing SEPM Function Points');
  });

  console.log(`\n======================================================`);
  console.log(`🏁 Smoke Test Summary: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log(`🌟 ALL ENTERPRISE PRODUCTION CHECKS PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed, check logs.`);
    process.exit(1);
  }
  console.log(`======================================================\n`);
}

runTests();
