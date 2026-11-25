import { describe, it, expect, beforeEach } from 'vitest';
import { RideLifecycleDFA, SeatMutexSemaphore, LruRouteCache } from '../../server/services/csCoreEngines.js';

describe('FLAT Deterministic Finite Automaton (RideLifecycleDFA)', () => {
  let dfa;

  beforeEach(() => {
    dfa = new RideLifecycleDFA();
  });

  it('initializes in standard valid state', () => {
    expect(dfa.currentState).toBe('IN_TRANSIT');
  });

  it('executes valid ARRIVE transition to COMPLETED final state', () => {
    const res = dfa.transition('ARRIVE');
    expect(res.success).toBe(true);
    expect(res.from).toBe('IN_TRANSIT');
    expect(res.to).toBe('COMPLETED');
    expect(dfa.currentState).toBe('COMPLETED');
    expect(dfa.getDfaSpecification().isAcceptedFinalState).toBe(true);
  });

  it('triggers emergency halt transition upon TRIGGER_SOS symbol', () => {
    const res = dfa.transition('TRIGGER_SOS');
    expect(res.success).toBe(true);
    expect(res.to).toBe('EMERGENCY_HALT');
    expect(dfa.currentState).toBe('EMERGENCY_HALT');

    // Resolves back to in transit
    const resolve = dfa.transition('RESOLVE_SOS');
    expect(resolve.success).toBe(true);
    expect(resolve.to).toBe('IN_TRANSIT');
  });

  it('rejects invalid transition according to formal grammar', () => {
    // Cannot directly PUBLISH or ACCEPT when already in IN_TRANSIT
    const res = dfa.transition('PUBLISH');
    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid transition: input 'PUBLISH' not accepted in state 'IN_TRANSIT'");
    expect(dfa.currentState).toBe('IN_TRANSIT');
  });
});

describe('OS Synchronization Primitives (SeatMutexSemaphore)', () => {
  it('acquires and releases permits under semaphore rules', async () => {
    const sem = new SeatMutexSemaphore(2);
    expect(sem.permits).toBe(2);

    await sem.acquire('proc_1');
    expect(sem.permits).toBe(1);

    await sem.acquire('proc_2');
    expect(sem.permits).toBe(0);
    expect(sem.getStatus().isLocked).toBe(true);

    sem.release();
    expect(sem.permits).toBe(1);
    expect(sem.getStatus().isLocked).toBe(false);
  });
});

describe('OS LRU Cache (LruRouteCache)', () => {
  it('evicts least recently used items on capacity overflow', () => {
    const lru = new LruRouteCache(2);
    lru.put('trip:1', { fare: 500 });
    lru.put('trip:2', { fare: 600 });
    expect(lru.get('trip:1')).toEqual({ fare: 500 }); // trip:1 accessed, trip:2 is LRU

    lru.put('trip:3', { fare: 700 }); // should evict trip:2
    expect(lru.get('trip:2')).toBeNull();
    expect(lru.get('trip:1')).toEqual({ fare: 500 });
    expect(lru.get('trip:3')).toEqual({ fare: 700 });
  });
});
