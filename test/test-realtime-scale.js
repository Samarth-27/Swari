// Swari Phase 4 Real-Time at Scale Test Suite
// Verifies Event Log sequence ordering, /api/v1/sync, Idempotency Keys, and Sanitized Public vs Participant events

import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:8000';

async function runRealtimeScaleTests() {
  console.log(`\n======================================================`);
  console.log(`⚡ Running Swari Phase 4 Real-Time at Scale Tests`);
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

  // 1. Sync Status Watermark
  let initialSeq = 0;
  await assertStep('GET /api/v1/sync/status (Current monotonic sequence watermark)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/sync/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.latestSeq !== 'number') throw new Error('latestSeq is not a number');
    initialSeq = data.latestSeq;
  });

  // 2. Publish Trip & Verify Event Log Sequence Progression
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  let testTripId = null;

  await assertStep('POST /api/v1/trips/publish (Monotonic sequence number increment)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeId: 'BLR-MAA',
        origin: 'Bengaluru (Koramangala)',
        destination: 'Chennai (Adyar)',
        departureTime: 'Tomorrow, 06:00 AM',
        seatsAvailable: 3,
        pricePerSeat: 580,
        driver: { name: `Scale Driver ${randomSuffix}` },
        vehicle: { plate: `KA 04 SC ${randomSuffix}`, make: 'Tata', model: 'Curvv EV' }
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    testTripId = data.data.id;

    // Check status watermark incremented
    const statusRes = await fetch(`${BASE_URL}/api/v1/sync/status`);
    const statusData = await statusRes.json();
    if (statusData.latestSeq <= initialSeq) {
      throw new Error(`Expected latestSeq > ${initialSeq}, got ${statusData.latestSeq}`);
    }
  });

  // 3. Catch-up Sync GET /api/v1/sync?since=<seq>
  await assertStep('GET /api/v1/sync?since=<seq> (Retrieve missed ordered events)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/sync?since=${initialSeq}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.events) || data.events.length === 0) {
      throw new Error('No events returned since initial sequence');
    }

    // Verify ordering
    let prevSeq = initialSeq;
    for (const evt of data.events) {
      if (evt.seq <= prevSeq) {
        throw new Error(`Events not strictly monotonically ordered: ${evt.seq} <= ${prevSeq}`);
      }
      prevSeq = evt.seq;
    }
  });

  // 4. Idempotency on Seat Booking (No Double Booking on Network Replay)
  const bookIdempotencyKey = `IDEMP-BOOK-${Date.now()}-${randomSuffix}`;
  let firstBookingResponse = null;

  await assertStep('POST /api/v1/trips/:id/book (Initial request with Idempotency-Key)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/${testTripId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': bookIdempotencyKey
      },
      body: JSON.stringify({
        passengerName: `Scale Pax ${randomSuffix}`,
        bookedSeats: 1
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    firstBookingResponse = await res.json();
    if (firstBookingResponse.data.seatsAvailable !== 2) {
      throw new Error(`Expected 2 seats remaining, got ${firstBookingResponse.data.seatsAvailable}`);
    }
  });

  await assertStep('POST /api/v1/trips/:id/book (Replay with same Idempotency-Key returns cached result)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/trips/${testTripId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': bookIdempotencyKey
      },
      body: JSON.stringify({
        passengerName: `Scale Pax ${randomSuffix}`,
        bookedSeats: 1
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const isReplayed = res.headers.get('x-idempotent-replayed');
    if (isReplayed !== 'true') {
      throw new Error('X-Idempotent-Replayed header missing on duplicate request');
    }

    const data = await res.json();
    // Seat count must still be 2, NOT deducted again to 1!
    if (data.data.seatsAvailable !== 2) {
      throw new Error(`Double seat deduction detected! Expected 2 seats, got ${data.data.seatsAvailable}`);
    }
  });

  // 5. Idempotency on Chat Endpoint
  const chatIdempotencyKey = `IDEMP-CHAT-${Date.now()}-${randomSuffix}`;
  const chatMsgText = `Idempotent Message test ${randomSuffix}`;

  await assertStep('POST /api/v1/trips/:id/chat (Idempotent chat message replay prevention)', async () => {
    // 1st chat call
    const res1 = await fetch(`${BASE_URL}/api/v1/trips/${testTripId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': chatIdempotencyKey
      },
      body: JSON.stringify({
        text: chatMsgText,
        sender: 'passenger',
        senderName: 'Test Traveler'
      })
    });
    if (!res1.ok) throw new Error(`HTTP ${res1.status}`);

    // Replay call with exact same key
    const res2 = await fetch(`${BASE_URL}/api/v1/trips/${testTripId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': chatIdempotencyKey
      },
      body: JSON.stringify({
        text: chatMsgText,
        sender: 'passenger',
        senderName: 'Test Traveler'
      })
    });
    if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
    if (res2.headers.get('x-idempotent-replayed') !== 'true') {
      throw new Error('X-Idempotent-Replayed missing on chat duplicate');
    }

    // Verify chat thread only contains 1 copy of the message
    const historyRes = await fetch(`${BASE_URL}/api/v1/trips/${testTripId}/chat`);
    const history = await historyRes.json();
    const count = (history.data || []).filter(m => m.text === chatMsgText).length;
    if (count !== 1) {
      throw new Error(`Expected exactly 1 message in thread, found ${count}`);
    }
  });

  // 6. Sanitized Public trip:updated vs Full Participant Details
  await assertStep('WebSocket Sanitized Public trip:updated vs Participant Full Details', async () => {
    const publicClient = io(BASE_URL, { transports: ['websocket'] });
    const participantClient = io(BASE_URL, { transports: ['websocket'] });

    await new Promise((resolve) => {
      let ready = 0;
      const onConnect = () => {
        ready++;
        if (ready === 2) resolve();
      };
      publicClient.on('connect', onConnect);
      participantClient.on('connect', onConnect);
    });

    // Participant joins trip room
    participantClient.emit('trip:join', { tripId: testTripId });

    let publicTripReceived = null;
    let participantTripReceived = null;

    publicClient.on('trip:updated', (trip) => {
      if (trip.id === testTripId) {
        publicTripReceived = trip;
      }
    });

    participantClient.on('trip:updated:full', (trip) => {
      if (trip.id === testTripId) {
        participantTripReceived = trip;
      }
    });

    // Trigger an update by booking 1 more seat
    await fetch(`${BASE_URL}/api/v1/trips/${testTripId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passengerName: `Pax Two ${randomSuffix}`,
        bookedSeats: 1
      })
    });

    await new Promise(r => setTimeout(r, 600));

    publicClient.close();
    participantClient.close();

    if (!publicTripReceived) throw new Error('Public client did not receive trip:updated');
    if (!participantTripReceived) throw new Error('Participant client did not receive trip:updated:full');

    // Verify sanitization on public event:
    if (publicTripReceived.passengers && publicTripReceived.passengers.length > 0) {
      throw new Error('Public trip event leaked unredacted passenger names!');
    }
    if (publicTripReceived.driver?.phone) {
      throw new Error('Public trip event leaked raw driver phone!');
    }
    if (publicTripReceived.driver?.phoneMasked !== '+91 98XXX-X0000') {
      throw new Error('Public trip event did not mask driver phone');
    }

    // Verify full details on participant event:
    if (!participantTripReceived.bookedPassengers || participantTripReceived.bookedPassengers.length === 0) {
      throw new Error('Participant full trip event missing bookedPassengers!');
    }
  });

  console.log(`\n======================================================`);
  console.log(`🏁 Phase 4 Tests: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log(`🌟 ALL PHASE 4 REAL-TIME AT SCALE TESTS PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed, check logs.`);
    process.exit(1);
  }
  console.log(`======================================================\n`);
}

runRealtimeScaleTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
