-- SQL Migration to add redirect_url column to tenants table
-- This allows specific subdomains to redirect to external landing pages

-- 1. Add redirect_url column
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS redirect_url TEXT;

-- 2. Comment on column
COMMENT ON COLUMN tenants.redirect_url IS 'External URL to redirect to when this subdomain is accessed (optional)';
