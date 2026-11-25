# Swari (सवारी) Production Operations Runbook

This runbook outlines operational procedures, emergency incident responses, database maintenance, backup/restore routines, and deployment guidelines for Swari platform operations.

---

## 1. System Architecture Overview

Swari runs as a high-availability, containerized real-time carpooling platform:
- **Reverse Proxy**: NGINX with sticky upstream sessions and WebSocket upgrade support.
- **Application Cluster**: Express 5 + Socket.IO with `@socket.io/redis-adapter` for multi-instance scaling.
- **Relational Storage**: PostgreSQL 16 with ACID transactions and row-level locks (`SELECT ... FOR UPDATE`).
- **Real-Time Synchronization**: Event Log with monotonic sequence numbers (`/api/v1/sync?since=<seq>`) and client offline queueing.
- **Telemetry & Cache**: Redis 7 with AOF persistence.
- **Monitoring**: Prometheus `/metrics` and structured JSON logs via Pino.

---

## 2. Routine Maintenance & Backup Procedures

### 2.1 Automated PostgreSQL Backup
Run daily scheduled logical backups using `pg_dump`:

```bash
# Automated Daily Logical Backup
pg_dump -h localhost -U swari_admin -d swari_production -Fc -f /backups/swari_backup_$(date +%Y%m%d_%H%M%S).dump

# Encrypt backup archive with GPG
gpg --symmetric --cipher-algo AES256 /backups/swari_backup_$(date +%Y%m%d_%H%M%S).dump
```

### 2.2 PostgreSQL Database Restoration Procedure
In the event of database corruption or hardware failover:

```bash
# 1. Terminate active connections
psql -U swari_admin -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'swari_production' AND pid <> pg_backend_pid();"

# 2. Re-create empty target database
dropdb -U swari_admin swari_production
createdb -U swari_admin swari_production

# 3. Restore custom-format dump
pg_restore -U swari_admin -d swari_production --verbose --clean --no-acl --no-owner /backups/swari_backup_YYYYMMDD_HHMMSS.dump

# 4. Verify integrity and run migrations
node database/migrate.js
```

### 2.3 Redis State Recovery
Redis is configured with Append-Only File (`AOF`) persistence:
- Data directory: `/var/lib/redis` or Docker volume `swari-redis-volume`.
- To verify AOF integrity: `redis-check-aof --fix /data/appendonly.aof`.
- On cold start, Redis automatically replays `appendonly.aof` to reconstruct session state and telemetry coordinates.

---

## 3. Production Deployment & Rollout

### 3.1 Docker Compose Deployment
```bash
# 1. Pull latest verified release
git pull origin main

# 2. Build multi-stage container
docker-compose build --no-cache swari-app

# 3. Run database migrations before container swap
docker-compose run --rm swari-app npm run db:migrate

# 4. Zero-downtime rolling restart
docker-compose up -d --no-deps --build swari-app
```

### 3.2 Post-Deployment Health Check
```bash
# Verify system liveness probe
curl -f http://localhost:8000/health

# Verify storage readiness probe
curl -f http://localhost:8000/ready

# Verify Prometheus metrics emission
curl -f http://localhost:8000/metrics | grep swari_
```

---

## 4. Incident Response Protocols

### 4.1 SOS Emergency Alert Triggered (`POST /api/v1/safety/sos`)
1. **Automated Action**:
   - The system transitions the trip DFA to `EMERGENCY_HALT`.
   - Real-time alert dispatched over WebSocket to Operations HQ (`admin_hq` persona).
   - Structured audit log entry `SOS_TRIGGERED` generated with GPS coordinates.
   - Dispatched to Simulated Police ERSS 112 Interface (MOCK).
2. **Operator Action**:
   - Open Swari Operations HQ Dashboard (`/dashboard`).
   - Locate the vehicle telemetry on the live corridor map.
   - Verify passenger and driver profiles and initiate emergency tele-contact.

### 4.2 Redis Cluster Outage
- **Symptoms**: Redis connection refused warnings in Pino logs.
- **Failover Mechanism**:
  - The application automatically degrades to in-memory Socket.IO state and the in-memory SQLite/JSON event log without crashing.
  - Client connections remain active on the local Node instance.
- **Resolution**:
  - Restart Redis service: `docker-compose restart swari-redis`.
  - Re-verify adapter reconnect in server logs: `Socket.IO Redis Adapter configured successfully`.

### 4.3 High Seat Concurrency / Lock Contention
- **Symptoms**: Increased latency on `POST /api/v1/trips/:id/book`.
- **Diagnostics**: Inspect OS Dijkstra Mutex metrics at `GET /api/v1/cs-metrics/overview`.
- **Mechanism**:
  - Seat booking acquires an OS Semaphore permit and executes pessimistic locking (`SELECT ... FOR UPDATE`).
  - Idempotency keys prevent double booking on client retry.
  - Transactions auto-rollback on timeout.

---

## 5. Statutory Legal Model

> [!IMPORTANT]
> **Legal Model Notice:**
> Swari operates strictly on a **"cost-sharing model designed to align with Motor Vehicles Act rules; needs legal review per state"**.
> All published fares are capped by statutory cost-ceilings (`calculateLegalPriceCeiling`) covering fuel and highway tolls divided by standard occupancy (4). Commercial surge pricing and profit-taking are prohibited under platform code constraints.
