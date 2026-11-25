-- Migration 005: Create Reciprocal Two-Way Ratings & Reviews Table

CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(120) NOT NULL,
    reviewer_role VARCHAR(20) NOT NULL CHECK (reviewer_role IN ('DRIVER', 'PASSENGER')),
    target_name VARCHAR(120) NOT NULL,
    target_role VARCHAR(20) NOT NULL CHECK (target_role IN ('DRIVER', 'PASSENGER')),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    badge VARCHAR(60),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_name);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_name);
CREATE INDEX IF NOT EXISTS idx_reviews_trip ON reviews(trip_id);
