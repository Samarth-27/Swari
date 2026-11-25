# Swari (सवारी) System Architecture & Engineering Blueprint

**Platform Version:** 2.0.0-PROD  
**Runtime Architecture:** Single-Container Dual-Mode (Node.js 22 LTS / Express 5 + Socket.IO + Vite React 19 Frontend)  
**Database & Cache:** PostgreSQL 16 Relational Repository Layer + Redis 7 Adapter Cluster  
**Legal Classification:** Cost-sharing model designed to align with Motor Vehicles Act rules; needs legal review per state

---

## 1. Actual System Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │          React 19 + Vite 6 Single Page App             │
                       │   (TokenManager, Typed ApiClient, Resync SocketClient) │
                       └───────────────────────────┬────────────────────────────┘
                                                   │ HTTPS / WSS
                                                   ▼
                       ┌────────────────────────────────────────────────────────┐
                       │               NGINX Production Reverse Proxy           │
                       │    (HTTP/2, WebSocket Upgrade, Sticky IP Hash Sessions)│
                       └───────────────────────────┬────────────────────────────┘
                                                   │ Port 8000
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                            Swari Express 5 Application Server                                │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Middleware Layer:                                                                           │
│    - Helmet Strict CSP (no 'unsafe-eval')    - RequestId tracing (UUIDv4)                    │
│    - Pino HTTP structured logging            - Rate Limiting (global, auth, booking, sos)    │
│    - Zod Request Validators                  - JWT Access (15m) + Refresh Token Rotation (7d)│
├──────────────────────────────────────┬───────────────────────────────────────────────────────┤
│  REST API Subsystems (/api/v1):      │  Real-Time Socket.IO Cluster:                         │
│    - /auth: Argon2id, Refresh Rot.   │    - Handshake JWT Authentication                     │
│    - /trips: Dijkstra Mutex Locking  │    - Scoped Rooms: user:<userId>, trip:<tripId>       │
│    - /broadcasts: Passenger Bidding  │    - Monotonic Event Log Watermarking                 │
│    - /safety: SOS & Luggage Sealing  │    - Replay Catch-up Sync (/api/v1/sync?since=<seq>)  │
│    - /metrics: OpenMetrics Exporter  │    - @socket.io/redis-adapter multi-node mesh         │
├──────────────────────────────────────┴───────────────────────────────────────────────────────┤
│  Data & Concurrency Layer:                                                                   │
│    - Repository Layer: server/repositories/*.js (trips, users, bookings, chat, audit)        │
│    - Concurrency Control: Dijkstra Mutex Semaphore + PostgreSQL SELECT ... FOR UPDATE        │
│    - Constraints: 1 active car trip per driver, 1 active booking per passenger               │
└──────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
         ┌─────────────────────────┐       ┌─────────────────────────┐
         │      PostgreSQL 16      │       │         Redis 7         │
         │  (ACID Migrations 001-9)│       │  (Cluster Event Adapter │
         │   Audit Log, Row Locks  │       │  & Geocoded Coordinates)│
         └─────────────────────────┘       └─────────────────────────┘
```

---

## 2. Core Implemented Subsystems

### 2.1 Concurrency & Seat Booking Protection
- **Pessimistic Locking**: Prevents overbooking races when multiple passengers request the last available seat concurrently.
- **Single Active Invariant**: A passenger can only hold one active booking at a time; a host driver can only publish one active car trip at a time.
- **Idempotency**: All mutating operations (`/book`, `/request-booking`, `/approve-booking`, `/chat`) support `Idempotency-Key` headers with cached replay.

### 2.2 Security & Privacy Controls
- **Authentication**: Passwords hashed with Argon2id; stateless access JWT (15-min expiry) paired with single-use rotating refresh tokens (7-day expiry). Old refresh tokens are invalidated on rotation.
- **Phone Number Masking**: Raw phone numbers are masked by default (`+91 98XXX-X4412`). Real contact details are revealed strictly to confirmed co-travelers on the same booking. Full Aadhaar numbers are never stored; only provider token references and verification statuses are retained.
- **Input Sanitization**: In-ride chat text is sanitized against HTML and script injection with a strict 500-character ceiling.
- **Audit Trail**: Critical mutations (`BOOKING_CREATED`, `BOOKING_CANCELLED`, `SOS_TRIGGERED`) are written to an append-only audit log.

### 2.3 Resilient Real-Time Synchronization
- **Monotonic Event Log**: Every mutation records an event with an incrementing sequence number.
- **Catch-Up Synchronization**: Reconnecting clients pass `GET /api/v1/sync?since=<lastSeq>` to retrieve and replay missed events into frontend state.
- **Offline Client Queue**: Actions taken while offline are queued in `src/lib/offlineQueue.js` and flushed upon reconnection.

---

## 3. Simulated Integrations & MOCK Interfaces

All external statutory and third-party systems are isolated behind explicit interfaces with mock implementations and real-provider stubs.

| Integration | Implementation Class | Status | Storage / Security Policy |
| :--- | :--- | :--- | :--- |
| **DigiLocker / Aadhaar** | `MockKycProvider` | **MOCK** | Masked reference only (`XXXX-XXXX-4412`). Full 12-digit Aadhaar numbers are NEVER stored. |
| **Parivahan DL / RC** | `MockParivahanProvider` | **MOCK** | Validates vehicle plate syntax and commercial vs non-commercial classification. |
| **Police ERSS 112** | `MockErssProvider` | **MOCK** | Simulated silent dispatch with structured lat/lng coordinates and vehicle telemetry. |
| **SafePay Escrow / UPI** | `MockPaymentEscrowProvider`| **MOCK** | Expense pooling authorization under cost-ceiling without commercial banking rails. |
| **Luggage Insurance** | `MockInsuranceProvider` | **MOCK** | Digital anti-theft photo hash and simulated loss-protection seal. |

---

## 4. Statutory Legal Framework

> [!IMPORTANT]
> **Legal Model Notice:**
> Swari operates on a **"cost-sharing model designed to align with Motor Vehicles Act rules; needs legal review per state"**.
> Fares are mathematically capped by `calculateLegalPriceCeiling(distanceKm, fuelType)` based on fuel rate plus highway tolls divided by standard vehicle occupancy (4). Commercial surge pricing and profit-taking are prohibited under platform code constraints.
