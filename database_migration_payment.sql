-- Flutterwave Payment Integration - Database Migration
-- Run this in Supabase SQL Editor

-- Add payment columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Update existing bookings to have default payment status
UPDATE bookings
SET payment_status = 'pending'
WHERE payment_status IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('payment_reference', 'payment_status', 'metadata');
