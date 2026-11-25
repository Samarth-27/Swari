-- Swari Production Database Schema
-- Target: PostgreSQL 16+ with PostGIS Extension & UUID-OSSP
-- Designed for High-Throughput Geospatial Indexing & MV Act 1988 Compliance

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- -------------------------------------------------------------
-- 1. USERS & IDENTITY VERIFICATION (SWARI SHIELD)
-- -------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    avatar_url TEXT,
    gender VARCHAR(15) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED')),
    
    -- Trust & Verification Metrics
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_aadhaar_verified BOOLEAN DEFAULT FALSE,
    aadhaar_masked_hash VARCHAR(64), -- SHA-256 tokenized; never store raw 12 digits
    digilocker_verification_id VARCHAR(100),
    is_corporate_verified BOOLEAN DEFAULT FALSE,
    corporate_email VARCHAR(160),
    corporate_domain VARCHAR(100),
    
    -- Safety & Ratings
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_trips_taken INT DEFAULT 0,
    total_trips_hosted INT DEFAULT 0,
    safety_strike_count INT DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    
    -- Preferences
    women_only_preferred BOOLEAN DEFAULT FALSE,
    chattiness VARCHAR(40) DEFAULT 'FRIENDLY_CONVERSATIONAL',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_aadhaar_hash ON users(aadhaar_masked_hash);

-- -------------------------------------------------------------
-- 2. DRIVER CREDENTIALS & VEHICLE REGISTRY (PARIVAHAN SEWA)
-- -------------------------------------------------------------
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(60) NOT NULL,
    color VARCHAR(30) NOT NULL,
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC_EV', 'HYBRID')),
    max_passenger_capacity INT NOT NULL CHECK (max_passenger_capacity BETWEEN 1 AND 4), -- Prevents commercial bus overcrowding
    
    -- Parivahan Legal Compliance
    driving_license_no VARCHAR(40) NOT NULL,
    dl_valid_till DATE NOT NULL,
    is_rc_verified BOOLEAN DEFAULT FALSE,
    rc_fitness_valid_till DATE,
    insurance_policy_no VARCHAR(80),
    insurance_valid_till DATE NOT NULL,
    is_private_whiteboard BOOLEAN DEFAULT TRUE, -- Strictly enforces non-commercial private vehicle status
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_plate ON vehicles(license_plate);

-- -------------------------------------------------------------
-- 3. TRIPS & HIGHWAY CORRIDORS (POSTGIS LINESTRING)
-- -------------------------------------------------------------
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    corridor_code VARCHAR(30) NOT NULL, -- e.g. 'BLR-MAA', 'DEL-CHD'
    
    origin_name TEXT NOT NULL,
    origin_location GEOMETRY(Point, 4326) NOT NULL,
    destination_name TEXT NOT NULL,
    destination_location GEOMETRY(Point, 4326) NOT NULL,
    
    -- Complete Highway Route Corridor (LineString with spatial index)
    route_polyline GEOMETRY(LineString, 4326) NOT NULL,
    total_distance_km NUMERIC(6, 2) NOT NULL,
    estimated_duration_minutes INT NOT NULL,
    
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    available_seats INT NOT NULL CHECK (available_seats >= 0),
    base_seat_price NUMERIC(8, 2) NOT NULL, -- Subject to legal fuel cap
    
    -- Features
    women_only BOOLEAN DEFAULT FALSE,
    allow_smoking BOOLEAN DEFAULT FALSE,
    allow_pets BOOLEAN DEFAULT FALSE,
    
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE_IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Geospatial GIST Indexes for Corridor Searching
CREATE INDEX idx_trips_origin_geom ON trips USING GIST(origin_location);
CREATE INDEX idx_trips_dest_geom ON trips USING GIST(destination_location);
CREATE INDEX idx_trips_route_geom ON trips USING GIST(route_polyline);
CREATE INDEX idx_trips_departure ON trips(departure_time);
CREATE INDEX idx_trips_corridor ON trips(corridor_code);

-- -------------------------------------------------------------
-- 4. SEGMENT SEAT INVENTORY (INTERVAL GRAPH)
-- -------------------------------------------------------------
CREATE TABLE trip_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    segment_origin_idx INT NOT NULL,
    segment_dest_idx INT NOT NULL,
    segment_origin_name TEXT NOT NULL,
    segment_dest_name TEXT NOT NULL,
    segment_distance_km NUMERIC(6, 2) NOT NULL,
    available_capacity INT NOT NULL,
    segment_price NUMERIC(8, 2) NOT NULL,
    
    CONSTRAINT uq_trip_segment UNIQUE (trip_id, segment_origin_idx, segment_dest_idx)
);

CREATE INDEX idx_segments_trip ON trip_segments(trip_id);

-- -------------------------------------------------------------
-- 5. REVERSE MARKETPLACE: PASSENGER REQUEST BROADCASTS
-- -------------------------------------------------------------
CREATE TABLE passenger_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    corridor_code VARCHAR(30),
    
    origin_name TEXT NOT NULL,
    origin_point GEOMETRY(Point, 4326) NOT NULL,
    destination_name TEXT NOT NULL,
    destination_point GEOMETRY(Point, 4326) NOT NULL,
    
    travel_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    travel_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    seats_needed INT NOT NULL DEFAULT 1,
    
    -- User's Proposed Budget (INR)
    proposed_budget_inr NUMERIC(8, 2) NOT NULL,
    luggage_description TEXT,
    notes TEXT,
    
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MATCHED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_broadcasts_origin_geom ON passenger_broadcasts USING GIST(origin_point);
CREATE INDEX idx_broadcasts_dest_geom ON passenger_broadcasts USING GIST(destination_point);
CREATE INDEX idx_broadcasts_status ON passenger_broadcasts(status);

-- -------------------------------------------------------------
-- 6. DRIVER CAR OFFERS / BIDDING ON BROADCASTS
-- -------------------------------------------------------------
CREATE TABLE driver_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID NOT NULL REFERENCES passenger_broadcasts(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    
    offered_fare_inr NUMERIC(8, 2) NOT NULL,
    estimated_pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_notes TEXT,
    
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offers_broadcast ON driver_offers(broadcast_id);
CREATE INDEX idx_offers_driver ON driver_offers(driver_id);

-- -------------------------------------------------------------
-- 7. BOOKINGS & SAFEPAY ESCROW
-- -------------------------------------------------------------
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(15) UNIQUE NOT NULL, -- e.g. 'SWARI-84920'
    trip_id UUID REFERENCES trips(id),
    passenger_id UUID NOT NULL REFERENCES users(id),
    seats_booked INT NOT NULL DEFAULT 1,
    total_amount_inr NUMERIC(8, 2) NOT NULL,
    
    -- SafePay Escrow State
    escrow_status VARCHAR(30) DEFAULT 'HELD_IN_ESCROW' CHECK (escrow_status IN (
        'HELD_IN_ESCROW', 'DISBURSED_TO_DRIVER', 'REFUNDED_PASSENGER', 'DISPUTED'
    )),
    
    payment_gateway_ref VARCHAR(120),
    pickup_otp VARCHAR(6) NOT NULL, -- Passenger provides to driver at pickup
    dropoff_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_passenger ON bookings(passenger_id);

-- -------------------------------------------------------------
-- 8. REAL-TIME SATELLITE TELEMETRY LOGS (TIMESCALE / HISTORICAL)
-- -------------------------------------------------------------
CREATE TABLE telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_location GEOMETRY(Point, 4326) NOT NULL,
    speed_kmph NUMERIC(5, 2) NOT NULL,
    bearing_degrees NUMERIC(5, 2),
    distance_remaining_km NUMERIC(6, 2),
    eta_minutes INT,
    battery_or_fuel_level INT
);

CREATE INDEX idx_telemetry_trip_time ON telemetry_logs(trip_id, recorded_at DESC);
