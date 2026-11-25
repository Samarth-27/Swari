-- Migration 001: Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'PASSENGER' CHECK (role IN ('PASSENGER', 'DRIVER', 'ADMIN')),
    
    -- Verification status (MOCK provider reference - never store raw 12-digit Aadhaar)
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_aadhaar_verified BOOLEAN DEFAULT FALSE,
    aadhaar_masked VARCHAR(20) DEFAULT 'XXXX-XXXX-4412',
    aadhaar_provider_ref VARCHAR(100), -- Tokenized provider verification reference
    is_dl_verified BOOLEAN DEFAULT FALSE,
    dl_number VARCHAR(50),
    dl_provider_ref VARCHAR(100),
    is_corporate_verified BOOLEAN DEFAULT FALSE,
    company_name VARCHAR(120),
    
    -- Reputation & SafePay Escrow
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_trips_taken INT DEFAULT 0,
    total_trips_hosted INT DEFAULT 0,
    safepay_balance_inr NUMERIC(10, 2) DEFAULT 1250.00,
    is_banned BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
