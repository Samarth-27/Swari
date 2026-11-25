import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { dbStore } from '../../server/db/store.js';

const BASE_URL = process.env.SWARI_API_URL || 'http://localhost:8000';

describe('Integration Tests: Supertest Seat Booking Race Conditions', () => {
  let hostDriverToken;
  let testRideId;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  beforeAll(async () => {
    // 1. Sign up a new host driver
    const driverRes = await request(BASE_URL)
      .post('/api/v1/auth/signup')
      .send({
        email: `race.driver.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: `Race Driver ${randomSuffix}`,
        phone: `+91 98${randomSuffix}12`,
        role: 'DRIVER'
      });

    expect(driverRes.status).toBe(201);
    hostDriverToken = driverRes.body.data.accessToken;

    // 2. Publish a trip with EXACTLY 1 SEAT available
    const pubRes = await request(BASE_URL)
      .post('/api/v1/trips/publish')
      .set('Authorization', `Bearer ${hostDriverToken}`)
      .send({
        routeId: 'BLR-MAA',
        origin: 'Bengaluru (Silk Board)',
        destination: 'Chennai (Guindy)',
        seatsAvailable: 1,
        pricePerSeat: 400,
        driver: {
          name: `Race Driver ${randomSuffix}`,
          phone: `+91 98${randomSuffix}12`
        },
        vehicle: {
          make: 'Tata',
          model: 'Nexon EV',
          plate: `KA 05 RC ${randomSuffix}`
        }
      });

    expect(pubRes.status).toBe(201);
    testRideId = pubRes.body.data.id;
    expect(testRideId).toBeDefined();
  });

  it('eliminates race conditions: exactly 1 of 5 concurrent seat booking attempts succeeds for the last seat', async () => {
    // Generate 5 distinct authenticated passenger tokens
    const paxTokens = [];
    for (let i = 1; i <= 5; i++) {
      const pRes = await request(BASE_URL)
        .post('/api/v1/auth/signup')
        .send({
          email: `race.pax.${i}.${randomSuffix}@swari.in`,
          password: 'Password123!',
          fullName: `Passenger Racer ${i}`,
          role: 'PASSENGER'
        });
      expect(pRes.status).toBe(201);
      paxTokens.push({ token: pRes.body.data.accessToken, name: `Passenger Racer ${i}` });
    }

    // Fire 5 concurrent booking requests simultaneously against the 1-seat trip
    const bookingPromises = paxTokens.map(pax => 
      request(BASE_URL)
        .post(`/api/v1/trips/${testRideId}/book`)
        .set('Authorization', `Bearer ${pax.token}`)
        .send({
          passengerName: pax.name,
          passengerDetails: { notes: 'Racer' }
        })
    );

    const responses = await Promise.all(bookingPromises);

    const successes = responses.filter(r => r.status === 200 && r.body.success === true);
    const failures = responses.filter(r => r.status !== 200 || r.body.success === false);

    // EXACTLY 1 booking must have secured the seat
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(4);

    // Verify trip seatsAvailable in database is now 0
    const finalTripRes = await request(BASE_URL)
      .get(`/api/v1/trips/${testRideId}`)
      .set('Authorization', `Bearer ${hostDriverToken}`);

    expect(finalTripRes.status).toBe(200);
    expect(finalTripRes.body.data.seatsAvailable).toBe(0);
  });

  it('rejects duplicate booking if passenger already holds an active booking', async () => {
    // Create passenger who books
    const paxRes = await request(BASE_URL)
      .post('/api/v1/auth/signup')
      .send({
        email: `single.active.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: `Single Active Pax ${randomSuffix}`,
        role: 'PASSENGER'
      });
    const paxToken = paxRes.body.data.accessToken;
    const paxName = `Single Active Pax ${randomSuffix}`;

    // Publish trip A
    const driverARes = await request(BASE_URL)
      .post('/api/v1/auth/signup')
      .send({
        email: `driverA.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: `Driver A ${randomSuffix}`,
        role: 'DRIVER'
      });
    const tripARes = await request(BASE_URL)
      .post('/api/v1/trips/publish')
      .set('Authorization', `Bearer ${driverARes.body.data.accessToken}`)
      .send({
        origin: 'Bengaluru',
        destination: 'Mysuru',
        seatsAvailable: 2,
        pricePerSeat: 300,
        vehicle: { plate: `KA 09 A ${randomSuffix}` }
      });
    const tripAId = tripARes.body.data.id;

    // Publish trip B
    const driverBRes = await request(BASE_URL)
      .post('/api/v1/auth/signup')
      .send({
        email: `driverB.${randomSuffix}@swari.in`,
        password: 'Password123!',
        fullName: `Driver B ${randomSuffix}`,
        role: 'DRIVER'
      });
    const tripBRes = await request(BASE_URL)
      .post('/api/v1/trips/publish')
      .set('Authorization', `Bearer ${driverBRes.body.data.accessToken}`)
      .send({
        origin: 'Bengaluru',
        destination: 'Coimbatore',
        seatsAvailable: 2,
        pricePerSeat: 500,
        vehicle: { plate: `KA 09 B ${randomSuffix}` }
      });
    const tripBId = tripBRes.body.data.id;

    // Book Trip A
    const bookARes = await request(BASE_URL)
      .post(`/api/v1/trips/${tripAId}/book`)
      .set('Authorization', `Bearer ${paxToken}`)
      .send({ passengerName: paxName });
    expect(bookARes.status).toBe(200);

    // Attempt to book Trip B simultaneously -> MUST FAIL with 400 ACTIVE_BOOKING_EXISTS
    const bookBRes = await request(BASE_URL)
      .post(`/api/v1/trips/${tripBId}/book`)
      .set('Authorization', `Bearer ${paxToken}`)
      .send({ passengerName: paxName });

    expect(bookBRes.status).toBe(400);
    expect(bookBRes.body.error).toBe('ACTIVE_BOOKING_EXISTS');
  });
});
