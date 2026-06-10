-- BragMode PostgreSQL Database Schema Setup

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create countries table
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    flag TEXT NOT NULL, -- UTF-8 flag emoji or text representing the flag
    max_founders INTEGER DEFAULT 1000 NOT NULL,
    claimed_founders INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT, -- Can be NULL initially, updated when email is collected before checkout
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    reserved_number INTEGER NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create founder_claims table
CREATE TABLE IF NOT EXISTS founder_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    founder_number INTEGER NOT NULL,
    world_cup_winner TEXT,
    golden_boot TEXT,
    dark_horse TEXT,
    biggest_flop TEXT,
    hot_take TEXT,
    payment_status TEXT NOT NULL, -- e.g., 'succeeded', 'failed'
    dodo_payment_id TEXT NOT NULL,
    claim_hash TEXT NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- DATABASE CONSTRAINTS
    CONSTRAINT unique_country_founder UNIQUE (country_id, founder_number),
    CONSTRAINT unique_dodo_payment UNIQUE (dodo_payment_id),
    CONSTRAINT unique_claim_hash UNIQUE (claim_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_country_session ON reservations(country_id, session_id);
CREATE INDEX IF NOT EXISTS idx_claims_country_number ON founder_claims(country_id, founder_number);

-- Store procedure / Function to safely reserve a founder number
CREATE OR REPLACE FUNCTION reserve_founder_number(
    p_country_id UUID,
    p_session_id TEXT
) RETURNS TABLE (
    reserved_number INT,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_max_founders INT;
    v_number INT;
    v_expires TIMESTAMP WITH TIME ZONE;
    v_existing_id UUID;
    v_existing_number INT;
    v_existing_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Delete expired reservations first to clean up
    DELETE FROM reservations WHERE reservations.expires_at < NOW();

    -- Get max_founders for the country
    SELECT max_founders INTO v_max_founders FROM countries WHERE id = p_country_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Country not found';
    END IF;

    -- Check if there is already an active reservation for this session and country
    SELECT id, reservations.reserved_number, reservations.expires_at 
    INTO v_existing_id, v_existing_number, v_existing_expires
    FROM reservations 
    WHERE country_id = p_country_id AND session_id = p_session_id AND reservations.expires_at >= NOW()
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Re-use existing reservation, extend it by another 15 minutes
        v_expires := NOW() + INTERVAL '15 minutes';
        UPDATE reservations SET expires_at = v_expires WHERE id = v_existing_id;
        RETURN QUERY SELECT v_existing_number, v_expires;
        RETURN;
    END IF;

    -- Find the next available number: the smallest positive integer between 1 and v_max_founders
    -- which is not in founder_claims AND not in active reservations.
    SELECT MIN(n) INTO v_number
    FROM generate_series(1, v_max_founders) n
    WHERE NOT EXISTS (
        SELECT 1 FROM founder_claims 
        WHERE founder_claims.country_id = p_country_id AND founder_claims.founder_number = n AND founder_claims.payment_status = 'succeeded'
    ) AND NOT EXISTS (
        SELECT 1 FROM reservations 
        WHERE reservations.country_id = p_country_id AND reservations.reserved_number = n AND reservations.expires_at >= NOW()
    );

    IF v_number IS NULL THEN
        RAISE EXCEPTION 'No founder numbers available for this country';
    END IF;

    v_expires := NOW() + INTERVAL '15 minutes';

    -- Insert new reservation
    INSERT INTO reservations (
        id,
        email,
        country_id,
        reserved_number,
        expires_at,
        session_id,
        created_at
    ) VALUES (
        gen_random_uuid(),
        NULL, -- Will be filled when email is collected before checkout
        p_country_id,
        v_number,
        v_expires,
        p_session_id,
        NOW()
    );

    RETURN QUERY SELECT v_number, v_expires;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment claimed_founders count in countries when a claim is successful
CREATE OR REPLACE FUNCTION update_claimed_founders_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'succeeded' THEN
        UPDATE countries 
        SET claimed_founders = claimed_founders + 1
        WHERE id = NEW.country_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_claimed_founders_count
AFTER INSERT ON founder_claims
FOR EACH ROW
EXECUTE FUNCTION update_claimed_founders_count();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_claims ENABLE ROW LEVEL SECURITY;

-- Allow public read access to countries
DROP POLICY IF EXISTS select_countries ON countries;
CREATE POLICY select_countries ON countries 
    FOR SELECT TO public 
    USING (true);

-- Allow public read access to reservations (needed for client-side checks)
-- Write access is restricted to the backend (via service role key)
DROP POLICY IF EXISTS select_reservations ON reservations;
CREATE POLICY select_reservations ON reservations 
    FOR SELECT TO public 
    USING (true);

-- Note: founder_claims table has RLS enabled with NO public policies. 
-- Only backend service-role requests (supabaseAdmin) can access it.
