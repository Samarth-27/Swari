-- Migration 009: Event Log for Ordered Synchronization and Idempotency Records
-- Supports per-user and per-trip sequence numbers and replay-safe requests

CREATE TABLE IF NOT EXISTS event_log (
    id SERIAL PRIMARY KEY,
    seq BIGSERIAL UNIQUE NOT NULL,
    stream_id VARCHAR(100) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    trip_id VARCHAR(100),
    user_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_log_stream_seq ON event_log(stream_id, seq);
CREATE INDEX IF NOT EXISTS idx_event_log_trip ON event_log(trip_id);
CREATE INDEX IF NOT EXISTS idx_event_log_user ON event_log(user_id);
CREATE INDEX IF NOT EXISTS idx_event_log_seq ON event_log(seq);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    response_headers JSONB,
    response_body JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
