-- SQL Migration to add branding columns to tenants table

-- 1. Add branding columns
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#E2BE6A';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#B8952E';

-- 2. Update existing tenants with default values if necessary (though DEFAULT handles it for new ones)
UPDATE tenants SET primary_color = '#E2BE6A' WHERE primary_color IS NULL;
UPDATE tenants SET secondary_color = '#B8952E' WHERE secondary_color IS NULL;

-- 3. (Optional) Comment on columns for documentation
COMMENT ON COLUMN tenants.company_logo IS 'URL of the tenant logo for white labeling';
COMMENT ON COLUMN tenants.primary_color IS 'Primary brand color in hex format';
COMMENT ON COLUMN tenants.secondary_color IS 'Secondary brand color in hex format';
