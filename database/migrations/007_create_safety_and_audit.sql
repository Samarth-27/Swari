-- Migration 007: Create Safety Telemetry (SOS, Luggage) and Audit Log Tables

-- MOCK interface tables for emergency dispatch & insurance tracking
CREATE TABLE IF NOT EXISTS sos_alerts (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(30) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    erss_112_dispatched BOOLEAN DEFAULT TRUE,
    police_ref VARCHAR(80), -- MOCK provider tokenized reference
    status VARCHAR(30) DEFAULT 'DISPATCHED' CHECK (status IN ('DISPATCHED', 'RESOLVED', 'FALSE_ALARM')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sos_trip ON sos_alerts(trip_id);

CREATE TABLE IF NOT EXISTS luggage_tags (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    bag_count INT NOT NULL DEFAULT 1,
    description TEXT,
    photo_hash VARCHAR(100),
    insurance_cover_inr NUMERIC(10, 2) DEFAULT 25000.00,
    insurance_policy_ref VARCHAR(80), -- MOCK provider reference
    status VARCHAR(30) DEFAULT 'SEALED' CHECK (status IN ('SEALED', 'DELIVERED', 'CLAIMED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_luggage_trip ON luggage_tags(trip_id);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(60) NOT NULL, -- e.g. 'BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_CANCELLED', 'SOS_TRIGGERED'
    entity_type VARCHAR(40) NOT NULL, -- e.g. 'TRIP', 'BOOKING', 'BROADCAST', 'SOS'
    entity_id VARCHAR(60) NOT NULL,
    actor_id VARCHAR(60),
    actor_role VARCHAR(30),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
