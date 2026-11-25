-- Migration 003: Create Bookings & On-Request Seat Reservations

CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY, -- e.g. BK-101 or UUID
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES users(id),
    passenger_name VARCHAR(120) NOT NULL,
    passenger_phone VARCHAR(30) DEFAULT '+91 97XXX-X1142',
    passenger_avatar TEXT,
    passenger_company VARCHAR(120),
    passenger_rating NUMERIC(3, 2) DEFAULT 5.00,
    
    seats_booked INT NOT NULL DEFAULT 1 CHECK (seats_booked >= 1),
    fare_paid NUMERIC(8, 2) NOT NULL,
    escrow_status VARCHAR(30) DEFAULT 'SECURED_ESCROW' CHECK (escrow_status IN ('SECURED_ESCROW', 'DISBURSED', 'REFUNDED')),
    pass_serial VARCHAR(60),
    
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_name);

-- Unique Constraint: One active booking per passenger
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking_passenger ON bookings (passenger_name) 
WHERE status NOT IN ('COMPLETED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS booking_requests (
    id VARCHAR(50) PRIMARY KEY, -- e.g. REQ-101 or UUID
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES users(id),
    passenger_name VARCHAR(120) NOT NULL,
    passenger_phone VARCHAR(30) DEFAULT '+91 97XXX-X1142',
    passenger_avatar TEXT,
    passenger_company VARCHAR(120),
    passenger_rating NUMERIC(3, 2) DEFAULT 5.00,
    
    seats INT NOT NULL DEFAULT 1,
    fare NUMERIC(8, 2) NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'PENDING_HOST_APPROVAL' CHECK (status IN ('PENDING_HOST_APPROVAL', 'APPROVED', 'DECLINED', 'CANCELLED')),
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_req_trip ON booking_requests(trip_id);
CREATE INDEX IF NOT EXISTS idx_booking_req_pax ON booking_requests(passenger_name);
