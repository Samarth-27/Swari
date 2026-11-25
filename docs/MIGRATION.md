# Swari Architecture Migration & Changelog Guide

This document records architectural transitions, path changes, and phase deliverables as the Swari carpooling platform migrates from prototype to production-grade.

---

## Phase 1 — Project Structure, Configuration & Error Handling

### 1. New Deliverables Added
- **`server/config/env.js`:** Fast-failing environment variable schema validation using `zod`. Enforces typed runtime configuration with defaults for `PORT`, `HOST`, `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGIN`, and placeholders for database & auth tokens.
- **`server/lib/logger.js`:** Production logger based on `pino` with ISO timestamps, service and environment metadata, and request-id child logger generation.
- **`server/middleware/requestId.js`:** Attaches or propagates `X-Request-Id` (UUID v4) on every request and response, creating an isolated `req.log` context.
- **`server/middleware/errorHandler.js`:** Centralized operational and exception error handler enforcing the standard error response contract:
  ```json
  {
    "success": false,
    "error": "ERROR_CODE",
    "message": "Human-readable description"
  }
  ```
  Includes `AppError` class, malformed JSON handling, Zod validation formatting, and 404 API router handling.
- **`.env.example`:** Clean template with placeholder values only (no real secrets or keys).
- **`/health` & `/ready` Probes:**
  - `GET /health`: Liveness probe reporting process uptime, memory usage, socket count, and storage status.
  - `GET /ready`: Readiness probe verifying store and data accessibility.
- **Graceful Shutdown:** Drains connections cleanly on `SIGTERM` and `SIGINT` with a 10s watchdog timeout.

### 2. Legal Alignment
- Updated legal declarations across manifests and server logs to state:
  > *"cost-sharing model designed to align with Motor Vehicles Act rules; needs legal review per state"*
  (Removed any claims of absolute legal certainty).

### 3. REST Paths & Event Names
- **Zero breaking changes to existing REST endpoints or WebSocket events.**
- Added endpoint: `GET /ready` (readiness probe).
- Added scripts in `package.json`:
  - `npm run test:smoke`
  - `npm run test:sync`
  - `npm run test:socket`

---

## Phase 2 — Database (PostgreSQL) & Repository Layer

### 1. Migrations Added (`database/migrations/`)
- `001_create_users.sql`: Users table with tokenized Aadhaar/DL verification references (MOCK provider stubs; zero raw 12-digit Aadhaar storage).
- `002_create_vehicles_and_trips.sql`: Vehicles and trips tables with unique constraint:
  `idx_unique_active_trip_driver` (Exactly one active trip per driver).
- `003_create_bookings_and_requests.sql`: Bookings and booking_requests tables with unique constraint:
  `idx_unique_active_booking_passenger` (Exactly one active booking per passenger).
- `004_create_chat_messages.sql`: Persistent chat table for real-time messaging.
- `005_create_reviews.sql`: Two-way reciprocal ratings and reviews.
- `006_create_broadcasts_and_offers.sql`: Passenger broadcasts and driver offers.
- `007_create_safety_and_audit.sql`: SOS alerts, luggage tags (MOCK provider stubs), and immutable audit log.
- `database/migrate.js`: Migration runner with `schema_migrations` tracking table (`npm run db:migrate`).

### 2. Repository Layer (`server/repositories/`)
- `TripRepository`: Trip queries, active driver checks, status updates.
- `BookingRepository`: Implements atomic seat booking with pessimistic concurrency (`SELECT ... FOR UPDATE` / `UPDATE trips SET seats_available = seats_available - $1 WHERE seats_available >= $1`), single active booking constraint check, and on-request approval/decline workflows.
- `ChatRepository`: Persistent message history and message inserts.
- `ReviewRepository`: Reciprocal rating submission and user review queries.
- `BroadcastRepository`: Passenger broadcast lifecycle and driver car offers.
- `SafetyRepository`: Emergency SOS dispatch records and luggage photo seals.
- `AuditRepository`: Structured audit trail logging.
- `server/db/store.js`: Refactored to coordinate and delegate through the repository layer behind identical method names.

### 3. Data Import Script
- `scripts/importStoreData.js`: Atomic import script parsing `server/data/store.json` and upserting data into PostgreSQL (`npm run db:import`).

---

## Phase 3 — Authentication, Authorization & User IDs

### 1. New Deliverables Added
- **`database/migrations/008_add_auth_fields_to_users.sql`:**
  - Adds `password_hash`, `token_version`, and `last_login_at` columns to `users` table.
- **`server/services/authService.js`:**
  - **Argon2id Password Hashing:** `hashPassword(password)` and `verifyPassword(hash, password)` with 19 MiB memory cost and 2 iterations.
  - **JWT Tokens:**
    - Short-lived Access Token (15m default) with payload `{ id, email, role, fullName }`.
    - Refresh Token (7d default) with family tracking and single-use rotation.
    - Token rotation logic: Reusing an old refresh token invalidates the family and rejects the request.
  - **MOCK OTP Engine:**
    - `IOtpProvider` specification with `MockOtpProvider` (in-memory store, 5-minute TTL) and `RealOtpProviderStub` (throws if called without live credentials).
- **`server/middleware/auth.js`:**
  - `authenticate`: Extracts and verifies `Bearer <token>` from the `Authorization` header, attaching `req.user` to the request. Also supports backward-compatible persona headers (`X-Persona-Id`, `X-User-Id`).
  - `requireAuth`: Enforces that an authenticated user is attached.
  - `requireRole(...roles)`: Enforces role permissions (e.g. `ADMIN`).
  - `requireTripDriver`: Verifies that the authenticated user is the host driver of the target trip.
  - `requireBookedPassenger`: Verifies that the authenticated user is a booked passenger or host driver of the trip.
- **`server/repositories/userRepository.js` & `server/db/store.js`:**
  - Implements user lookup by `id`, `email`, and `phone`.
  - Replaced name-based identity with unique User IDs (`id`, `driverId`, `passengerId`).
  - Backward compatibility: fallbacks to name matching preserved where legacy clients or tests omit user IDs.
- **`server/routes/auth.js`:**
  - `POST /api/v1/auth/signup`: Password hashing via Argon2id, user creation, returns user profile + token pair.
  - `POST /api/v1/auth/login`: Supports email + password (Argon2 verified), email + OTP, or `personaId` for 1-click test UI.
  - `POST /api/v1/auth/refresh`: Refresh token rotation.
  - `POST /api/v1/auth/otp/send`: Simulated MOCK OTP dispatch.
  - `POST /api/v1/auth/otp/verify`: Simulated OTP verification & user authentication.
  - `GET /api/v1/auth/me`: Protected route returning current user profile.
  - `GET /api/v1/auth/personas`: Kept for demo personas and UI test logins.
- **Socket.IO Handshake Auth & Room Names (`server/index.js`):**
  - Socket handshake middleware verifies JWT token via `socket.handshake.auth.token` or `Authorization: Bearer <token>`.
  - Unauthorized or malformed tokens trigger a connection rejection (`Authentication error: Invalid or expired token`).
  - Connected authenticated sockets automatically join room `user:<userId>`.
  - Trip scoping joins `trip:<tripId>` (with alias to legacy `<tripId>`).
- **Endpoint Protection (`server/routes/admin.js` & `server/routes/trips.js`):**
  - `GET /api/v1/admin/overview`: Enforces `ADMIN` role check when an auth token is provided (rejects `PASSENGER` with 403 Forbidden).
  - `POST /api/v1/trips/:id/approve-booking`: Host driver only (`requireTripDriver`).
  - `POST /api/v1/trips/:id/decline-booking`: Host driver only (`requireTripDriver`).
  - `POST /api/v1/trips/:id/complete`: Host driver only (`requireTripDriver`).
  - `POST /api/v1/trips/:id/cancel`: Host driver only (`requireTripDriver`).
  - `POST /api/v1/trips/:id/cancel-booking`: Booked passenger or host driver only (`requireBookedPassenger`).
  - `POST /api/v1/trips/:id/rate`: Booked passenger or host driver only.
- **Test Suite (`test/test-auth.js`):**
  - 13 comprehensive test assertions verifying Argon2 hashing, duplicate rejection, login, token rotation, token reuse rejection, OTP dispatch/verification, protected `/me`, 403 on admin route for passenger, 200 on admin route for admin, 403 on non-host trip approval, and Socket.IO handshake auth rejection/acceptance.
  - Added `npm run test:auth`.

---

## Phase 4 — Real-Time at Scale: Redis Adapter, Event Log & Idempotency

### 1. New Deliverables Added
- **`@socket.io/redis-adapter` & `ioredis` Integration (`server/index.js`):**
  - Installed `@socket.io/redis-adapter` and `ioredis`.
  - Configured cluster pub/sub adapter when `env.REDIS_URL` is set, with graceful fallback to in-memory adapter when Redis is offline or not configured.
  - Enabled Socket.IO `connectionStateRecovery` (2-minute disconnect duration) for automatic packet buffering and session recovery.
- **Ordered Distributed Event Log (`server/services/eventLog.js`):**
  - Monotonic sequence numbers (`seq`) assigned to all domain events (`trip:published`, `trip:seat_booked`, `trip:booking_requested`, `trip:booking_approved`, `trip:booking_declined`, `trip:completed`, `trip:cancelled`, `trip:seat_cancelled`, `chat:new_message`).
  - Indexed by stream (`trip:<tripId>`, `user:<userId>`, `global`).
  - Synced to PostgreSQL `event_log` table asynchronously.
- **Catch-up Sync Router (`server/routes/sync.js`):**
  - `GET /api/v1/sync?since=<seq>&streamId=<streamId>&tripId=<tripId>`: Returns all missed events in monotonic order since client's last observed sequence watermark.
  - `GET /api/v1/sync/status`: Returns current latest global sequence watermark.
- **Idempotency Engine (`server/middleware/idempotency.js`):**
  - Captures and inspects `Idempotency-Key` / `X-Idempotency-Key` headers.
  - Caches responses (status, headers, body) with a 24-hour TTL in memory and PostgreSQL `idempotency_keys` table.
  - Automatically replays cached responses on network retries with header `X-Idempotent-Replayed: true` (prevents double bookings or duplicate chat messages).
  - Applied to `POST /api/v1/trips/:id/book`, `POST /api/v1/trips/:id/request-booking`, `POST /api/v1/trips/:id/approve-booking`, and `POST /api/v1/trips/:id/chat`.
- **Sanitized Public vs Participant Events (`server/routes/trips.js`):**
  - `sanitizeTripForPublic(trip)`: Redacts driver phone number (`phoneMasked = '+91 98XXX-X0000'`) and removes detailed passenger lists/identities from public broadcasts.
  - Public `io.emit('trip:updated', sanitizedTrip)` contains only non-identifying capacity and corridor information.
  - Full trip details (`trip:updated:full`) are delivered exclusively to private participant channels: `trip:<tripId>` room and participant `user:<userId>` rooms.
- **Client Offline Queue & Replay Manager (`src/lib/offlineQueue.js`):**
  - Queues mutations in persistent browser storage when offline.
  - Flushes queue with preserved Idempotency Keys upon reconnection (`online` event).
  - Re-syncs missed events via `/api/v1/sync?since=<lastSeenSeq>`.
- **Test Suite (`test/test-realtime-scale.js`):**
  - Tests sequence progression, ordered event sync, booking idempotency (preventing double deduction), chat idempotency (preventing message duplication), and sanitized public vs full participant WebSocket broadcasts.
  - Added `npm run test:scale`.

---

## Phase 5 — Security, Validation & Privacy Hardening

### 1. New Deliverables Added
- **Zod Request Validation Schemas (`server/validators/schemas.js`):**
  - Schema validation across all endpoints: `signupSchema`, `loginSchema`, `refreshSchema`, `otpSendSchema`, `otpVerifySchema`, `publishTripSchema`, `bookSeatSchema`, `requestBookingSchema`, `approveBookingSchema`, `declineBookingSchema`, `cancelBookingSchema`, `rateTripSchema`, `chatMessageSchema`, `publishBroadcastSchema`, `offerBroadcastSchema`, `sosSchema`, and `luggageTagSchema`.
  - Rejects boundary violations (negative seat counts, fares exceeding MV Act cost sharing limits, chat text exceeding 500 chars).
- **Validation Middleware (`server/middleware/validate.js`):**
  - Formats validation issues into the standard `{ success: false, error: 'VALIDATION_ERROR', message: '...', details: [...] }` shape.
- **Strict Content Security Policy (CSP):**
  - Removed `'unsafe-eval'` from Helmet directives in `server/index.js` for strict production-grade CSP compliance.
- **Environment-Driven CORS Allowlist:**
  - Dynamic allowlist parsing from `env.CORS_ORIGIN`, preventing unauthorized cross-origin browser access.
- **Layered Rate Limiting (`server/middleware/rateLimit.js`):**
  - `globalLimiter`: 1000 requests / 15 minutes.
  - `authLimiter`: 60 authentication attempts / 15 minutes.
  - `bookingLimiter`: 60 booking operations / minute.
  - `chatLimiter`: 120 messages / minute.
  - `sosLimiter`: 15 emergency requests / minute.
- **Chat Sanitization & XSS Neutralization (`server/lib/sanitizer.js`):**
  - `sanitizeChatText`: Strips all HTML/XML tags and neutralizes dangerous JavaScript/XSS injection payloads.
- **Privacy Engine: Phone Number Masking & Co-Traveler Reveal (`server/lib/sanitizer.js`):**
  - By default, unauthenticated strangers and unrelated users see masked phone numbers (`+91 98XXX-X0000`) and zero passenger identity lists.
  - Verified host drivers and confirmed booked passengers on the same trip are granted reciprocal access to unmasked contact information for travel coordination.
- **Security Audit Logging (`dbStore.logAudit`):**
  - Structured immutable logging for `BOOKING_CREATED`, `BOOKING_APPROVED`, `BOOKING_DECLINED`, `BOOKING_CANCELLED`, `TRIP_COMPLETED`, `TRIP_CANCELLED`, and `SOS_TRIGGERED`.
- **Test Suite (`test/test-security.js`):**
  - Verifies CSP header absence of `'unsafe-eval'`, Zod rejections on invalid email / boundary / length violations, XSS stripping in chat messages, privacy phone masking with co-traveler reveal, and security audit log generation.
  - Added `npm run test:security`.

