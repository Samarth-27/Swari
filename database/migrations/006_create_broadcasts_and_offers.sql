-- Migration 006: Create Passenger Broadcasts & Driver Offers

CREATE TABLE IF NOT EXISTS broadcasts (
    id VARCHAR(50) PRIMARY KEY,
    route_id VARCHAR(30) NOT NULL,
    passenger_name VARCHAR(120) NOT NULL,
    passenger_avatar TEXT,
    passenger_rating NUMERIC(3, 2) DEFAULT 5.00,
    passenger_trips INT DEFAULT 0,
    passenger_company VARCHAR(120),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    desired_time VARCHAR(80) NOT NULL,
    seats_needed INT DEFAULT 1,
    budget_in_rupees NUMERIC(8, 2) NOT NULL,
    luggage VARCHAR(120),
    notes TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MATCHED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_route ON broadcasts(route_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);

CREATE TABLE IF NOT EXISTS driver_offers (
    id VARCHAR(50) PRIMARY KEY,
    broadcast_id VARCHAR(50) NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
    driver_name VARCHAR(120) NOT NULL,
    car VARCHAR(100) NOT NULL,
    offered_fare NUMERIC(8, 2) NOT NULL,
    pickup_estimate VARCHAR(80) NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offers_broadcast ON driver_offers(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_offers_driver ON driver_offers(driver_name);
