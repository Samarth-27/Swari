// Multi-Client Real-Time WebSocket Synchronization Verification Test
import { io } from 'socket.io-client';

const URL = 'http://localhost:8000';

async function testWebSocketSync() {
  console.log('\n======================================================');
  console.log('🔄 Testing Multi-Client Real-Time WebSocket Synchronization');
  console.log('======================================================\n');

  const clientA = io(URL, { transports: ['websocket'] });
  const clientB = io(URL, { transports: ['websocket'] });

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    clientA.on('connect', check);
    clientB.on('connect', check);
  });

  console.log(`✅ Client A connected (ID: ${clientA.id})`);
  console.log(`✅ Client B connected (ID: ${clientB.id})`);

  let tripReceivedByB = null;
  let seatBookedReceivedByA = null;
  let broadcastReceivedByB = null;
  let csMetricsReceivedByB = null;

  clientB.on('trip:published', (trip) => {
    tripReceivedByB = trip;
  });

  clientA.on('trip:seat_booked', (payload) => {
    seatBookedReceivedByA = payload;
  });

  clientB.on('broadcast:created', (req) => {
    broadcastReceivedByB = req;
  });

  clientB.on('cs:metrics:update', (metrics) => {
    csMetricsReceivedByB = metrics;
  });

  // STEP 1: Client A publishes a trip via API
  console.log('⏳ Client A publishing trip...');
  const syncDriver = `Sync Driver ${Date.now().toString().slice(-4)}`;
  const syncPlate = `KA 51 WS ${Math.floor(1000 + Math.random() * 9000)}`;
  const pubRes = await fetch(`${URL}/api/v1/trips/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routeId: 'BLR-MAA',
      origin: 'Bengaluru (HSR Layout)',
      destination: 'Chennai (T. Nagar)',
      seatsAvailable: 3,
      pricePerSeat: 600,
      driver: { name: syncDriver },
      vehicle: { plate: syncPlate, make: 'MG', model: 'ZS EV' }
    })
  });
  const pubJson = await pubRes.json();
  if (!pubJson.data) throw new Error(`Publish failed: ${JSON.stringify(pubJson)}`);
  const tripData = pubJson.data;
  console.log(`   Trip published with ID: ${tripData.id}`);

  // Wait for Client B to receive broadcast
  await new Promise(r => setTimeout(r, 600));
  if (tripReceivedByB && tripReceivedByB.id === tripData.id) {
    console.log('✅ PASS: Client B received real-time trip:published event instantaneously!');
  } else {
    throw new Error('FAIL: Client B did not receive trip:published');
  }

  // STEP 2: Client B books a seat on that trip
  console.log('⏳ Client B booking 1 seat...');
  const syncPassenger = `Sync Pax ${Date.now().toString().slice(-4)}`;
  const bookRes = await fetch(`${URL}/api/v1/trips/${tripData.id}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookedSeats: 1, passengerName: syncPassenger })
  });
  const bookJson = await bookRes.json();
  console.log(`   Seat booked, remaining: ${bookJson.data.seatsAvailable}`);

  await new Promise(r => setTimeout(r, 600));
  if (seatBookedReceivedByA && seatBookedReceivedByA.tripId === tripData.id && seatBookedReceivedByA.seatsAvailable === 2) {
    console.log('✅ PASS: Client A received real-time trip:seat_booked event with updated seat count (2 remaining)!');
  } else {
    throw new Error('FAIL: Client A did not receive trip:seat_booked');
  }

  // STEP 3: Client A posts a public broadcast travel request
  console.log('⏳ Client A broadcasting public travel request...');
  const bcastRes = await fetch(`${URL}/api/v1/broadcasts/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: 'Bengaluru (Koramangala)',
      destination: 'Chennai (Adyar)',
      budgetInRupees: 500,
      seatsNeeded: 1
    })
  });
  const bcastData = (await bcastRes.json()).data;
  console.log(`   Broadcast published with ID: ${bcastData.id}`);

  await new Promise(r => setTimeout(r, 600));
  if (broadcastReceivedByB && broadcastReceivedByB.id === bcastData.id) {
    console.log('✅ PASS: Client B received real-time broadcast:created event on their radar!');
  } else {
    throw new Error('FAIL: Client B did not receive broadcast:created');
  }

  // STEP 4: Client A triggers OS Semaphore acquire -> Client B gets CS Engine sync
  console.log('⏳ Client A triggering Dijkstra Mutex acquire...');
  await fetch(`${URL}/api/v1/cs-metrics/semaphore/acquire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processId: 'client_A_process' })
  });

  await new Promise(r => setTimeout(r, 600));
  if (csMetricsReceivedByB && csMetricsReceivedByB.operatingSystems?.seatSemaphoreMutex?.activeHolder === 'client_A_process') {
    console.log(`✅ PASS: Client B received real-time cs:metrics:update with activeHolder: ${csMetricsReceivedByB.operatingSystems.seatSemaphoreMutex.activeHolder}!`);
  } else {
    throw new Error(`FAIL: Client B did not receive expected cs:metrics:update. Received: ${JSON.stringify(csMetricsReceivedByB?.operatingSystems?.seatSemaphoreMutex)}`);
  }

  // STEP 5: Test FLAT DFA state transition
  console.log('⏳ Client A triggering FLAT DFA transition: TRIGGER_SOS...');
  await fetch(`${URL}/api/v1/cs-metrics/dfa/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol: 'TRIGGER_SOS' })
  });

  await new Promise(r => setTimeout(r, 600));
  if (csMetricsReceivedByB && csMetricsReceivedByB.automataTheory?.lifecycleDfa?.currentState === 'EMERGENCY_HALT') {
    console.log(`✅ PASS: Client B received real-time DFA state update: ${csMetricsReceivedByB.automataTheory.lifecycleDfa.currentState}!`);
  } else {
    throw new Error(`FAIL: Client B did not receive expected DFA update. CurrentState: ${csMetricsReceivedByB?.automataTheory?.lifecycleDfa?.currentState}`);
  }

  // Restore DFA back to IN_TRANSIT
  await fetch(`${URL}/api/v1/cs-metrics/dfa/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol: 'RESOLVE_SOS' })
  });

  // Release semaphore
  await fetch(`${URL}/api/v1/cs-metrics/semaphore/release`, { method: 'POST' });

  clientA.disconnect();
  clientB.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL MULTI-CLIENT REAL-TIME SYNCHRONIZATION TESTS PASSED 100%!');
  console.log('======================================================\n');
}

testWebSocketSync().catch(err => {
  console.error('❌ Sync test failed:', err);
  process.exit(1);
});
