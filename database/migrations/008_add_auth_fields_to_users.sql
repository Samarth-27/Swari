-- Migration 008: Add Authentication and Credential Fields to Users Table
-- Designed for Argon2 password hashing and token rotation support

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
