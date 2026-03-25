-- Add phone column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
