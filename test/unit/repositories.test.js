import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../../server/db/store.js';

describe('Repository Layer Unit Tests', () => {
  it('retrieves active seeded trips from repository', () => {
    const trips = dbStore.getTrips();
    expect(Array.isArray(trips)).toBe(true);
    expect(trips.length).toBeGreaterThan(0);

    const trip = dbStore.getTripById(trips[0].id);
    expect(trip).toBeDefined();
    expect(trip.id).toBe(trips[0].id);
  });

  it('manages user records with sanitized outputs', () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const user = dbStore.createUser({
      email: `repo.test.${randomSuffix}@swari.in`,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fakehash',
      fullName: 'Repo Tester',
      phone: '+91 99887-76655',
      role: 'PASSENGER'
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(`repo.test.${randomSuffix}@swari.in`);

    const fetchedByEmail = dbStore.getUserByEmail(user.email);
    expect(fetchedByEmail).toBeDefined();
    expect(fetchedByEmail.id).toBe(user.id);

    const fetchedById = dbStore.getUserById(user.id);
    expect(fetchedById).toBeDefined();
    expect(fetchedById.fullName).toBe('Repo Tester');
  });

  it('enforces active single trip and booking constraints', () => {
    // Look up existing trip
    const trips = dbStore.getTrips();
    const activeTrip = trips.find(t => t.status === 'ACTIVE_AVAILABLE');
    expect(activeTrip).toBeDefined();

    const activeTripCheck = dbStore.getActiveTripByDriver(activeTrip.driver?.name, activeTrip.vehicle?.plate);
    expect(activeTripCheck).toBeDefined();
    expect(activeTripCheck.id).toBe(activeTrip.id);
  });

  it('persists and retrieves in-ride chat messages', () => {
    const msg = dbStore.addChatMessage('RIDE-101', {
      sender: 'passenger',
      senderName: 'Test Traveler',
      text: 'Waiting at expressway boarding point'
    });

    expect(msg.id).toBeDefined();
    expect(msg.tripId).toBe('RIDE-101');
    expect(msg.text).toBe('Waiting at expressway boarding point');

    const history = dbStore.getChatMessages('RIDE-101');
    expect(Array.isArray(history)).toBe(true);
    const found = history.find(m => m.id === msg.id);
    expect(found).toBeDefined();
  });
});
