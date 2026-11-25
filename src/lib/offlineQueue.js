// Swari Client Offline Action Queue & Replay Manager
// Persists pending offline actions (bookings, chat messages, approvals) with Idempotency Keys

export class OfflineQueueManager {
  constructor({ baseUrl = '', onSync = null } = {}) {
    this.baseUrl = baseUrl;
    this.onSync = onSync;
    this.queue = this.loadQueue();
    this.lastSeenSeq = this.loadLastSeq();
    this.isFlushing = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flush());
    }
  }

  loadQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('swari_offline_queue');
        return raw ? JSON.parse(raw) : [];
      }
    } catch {
      // Fallback in-memory
    }
    return [];
  }

  saveQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('swari_offline_queue', JSON.stringify(this.queue));
      }
    } catch {
      // Ignore storage errors
    }
  }

  loadLastSeq() {
    try {
      if (typeof localStorage !== 'undefined') {
        const seq = localStorage.getItem('swari_last_seq');
        return seq ? Number(seq) : 0;
      }
    } catch {
      // Fallback
    }
    return 0;
  }

  setLastSeq(seq) {
    this.lastSeenSeq = Math.max(this.lastSeenSeq, Number(seq) || 0);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('swari_last_seq', String(this.lastSeenSeq));
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Enqueue a pending mutation when offline or during transient failures
   */
  enqueue({ url, method = 'POST', headers = {}, body = {}, type = 'GENERIC' }) {
    const idempotencyKey = headers['Idempotency-Key'] || 
      `IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const action = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      idempotencyKey,
      url,
      method,
      headers: {
        ...headers,
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json'
      },
      body,
      type,
      attempts: 0,
      createdAt: new Date().toISOString()
    };

    this.queue.push(action);
    this.saveQueue();
    return action;
  }

  /**
   * Drain and retry all queued actions upon reconnection
   */
  async flush() {
    if (this.isFlushing || this.queue.length === 0) return { flushed: 0, pending: this.queue.length };
    this.isFlushing = true;

    const remaining = [];
    let flushedCount = 0;

    for (const action of this.queue) {
      try {
        action.attempts += 1;
        const res = await fetch(`${this.baseUrl}${action.url}`, {
          method: action.method,
          headers: action.headers,
          body: JSON.stringify(action.body)
        });

        if (res.ok || (res.status >= 400 && res.status < 500)) {
          // Success or definitive client error (e.g. invalid parameter), don't retry
          flushedCount++;
        } else {
          // Server error 5xx, keep in queue
          remaining.push(action);
        }
      } catch (err) {
        // Network still unreachable
        remaining.push(action);
      }
    }

    this.queue = remaining;
    this.saveQueue();
    this.isFlushing = false;

    // Resynchronize state after draining offline queue
    await this.syncMissedEvents();

    return { flushed: flushedCount, pending: this.queue.length };
  }

  /**
   * Catch up on any events missed while disconnected
   */
  async syncMissedEvents() {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/sync?since=${this.lastSeenSeq}`);
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          if (typeof this.onSync === 'function') {
            this.onSync(data.events);
          }
          this.setLastSeq(data.latestSeq);
        }
        return data;
      }
    } catch {
      // Re-sync failed, will retry next heartbeat
    }
    return null;
  }
}

export const offlineQueue = new OfflineQueueManager();
