-- Migration 004: Create Persistent Real-Time Chat Messages Table

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    sender VARCHAR(30) NOT NULL CHECK (sender IN ('passenger', 'driver', 'system', 'admin')),
    sender_name VARCHAR(120) NOT NULL,
    text TEXT NOT NULL,
    type VARCHAR(40) DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'BOOKING_DECLINED')),
    passenger_name VARCHAR(120),
    request_details JSONB,
    time_display VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_trip_time ON chat_messages(trip_id, created_at ASC);
