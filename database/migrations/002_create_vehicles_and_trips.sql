-- Migration 002: Create Vehicles & Trips Tables

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_plate VARCHAR(25) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(60) NOT NULL,
    color VARCHAR(30) NOT NULL,
    fuel_type VARCHAR(20) DEFAULT 'PETROL' CHECK (fuel_type IN ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC_EV', 'HYBRID')),
    max_passenger_capacity INT NOT NULL DEFAULT 3 CHECK (max_passenger_capacity BETWEEN 1 AND 6),
    is_ac_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(license_plate);

CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(50) PRIMARY KEY, -- e.g. RIDE-101 or UUID
    driver_id UUID REFERENCES users(id),
    driver_name VARCHAR(120) NOT NULL,
    driver_avatar TEXT,
    driver_rating NUMERIC(3, 2) DEFAULT 5.00,
    driver_phone_masked VARCHAR(30),
    
    vehicle_id UUID REFERENCES vehicles(id),
    vehicle_plate VARCHAR(25) NOT NULL,
    vehicle_make VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(60) NOT NULL,
    vehicle_color VARCHAR(30) DEFAULT 'Daytona Grey',
    vehicle_fuel_type VARCHAR(20) DEFAULT 'PETROL',
    vehicle_ac BOOLEAN DEFAULT TRUE,
    
    route_id VARCHAR(30) NOT NULL, -- e.g. 'BLR-MAA', 'DEL-CHD', 'MUM-PUN'
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time VARCHAR(60) NOT NULL,
    
    total_seats INT NOT NULL DEFAULT 3,
    seats_available INT NOT NULL CHECK (seats_available >= 0),
    price_per_seat NUMERIC(8, 2) NOT NULL,
    
    women_only BOOLEAN DEFAULT FALSE,
    booking_mode VARCHAR(20) DEFAULT 'INSTANT' CHECK (booking_mode IN ('INSTANT', 'ON_REQUEST')),
    is_two_way_trip BOOLEAN DEFAULT FALSE,
    return_leg JSONB,
    
    status VARCHAR(30) DEFAULT 'ACTIVE_AVAILABLE' CHECK (status IN ('ACTIVE_AVAILABLE', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_driver_plate ON trips(vehicle_plate);

-- Unique Constraint: Exactly one active trip per driver (by driver_id if present, or driver_name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_trip_driver ON trips (driver_name) 
WHERE status NOT IN ('COMPLETED', 'CANCELLED');
