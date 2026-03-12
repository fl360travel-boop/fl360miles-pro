-- SQL Migration to add subdomain column to tenants table

-- 1. Add subdomain column
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- 2. Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

-- 3. Comment on column
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain prefix for the organization (e.g., "empresa" for empresa.fl360miles.com)';
