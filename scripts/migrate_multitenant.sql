-- =============================================
-- FL360Miles MULTI-TENANT MIGRATION
-- Combines user_id isolation + RBAC roles
-- Run this in Supabase SQL Editor
-- =============================================
-- 
-- PREREQUISITE: migrate_rbac.sql must have been run first
-- (it creates user_profiles table and get_user_role() function)
--
-- WHAT THIS DOES:
-- 1. Adds user_id to all data tables (clients, programs, cards, movements, economy_history)
-- 2. Creates RLS policies that combine ROLE + TENANT isolation
-- 3. Each user sees ONLY their own data
-- 4. Demo user sees only demo data (sandbox)
-- =============================================

-- =============================================
-- STEP 1: Add user_id columns
-- =============================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE programs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE economy_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- =============================================
-- STEP 2: Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON movements(user_id);
CREATE INDEX IF NOT EXISTS idx_economy_history_user_id ON economy_history(user_id);

-- =============================================
-- STEP 3: Ensure RLS is enabled
-- =============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: Drop ALL old policies (clean slate)
-- =============================================

-- Old open policies
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on programs" ON programs;
DROP POLICY IF EXISTS "Allow all operations on cards" ON cards;
DROP POLICY IF EXISTS "Allow all operations on movements" ON movements;
DROP POLICY IF EXISTS "Allow all operations on economy_history" ON economy_history;
DROP POLICY IF EXISTS "Allow all operations on team_members" ON team_members;

-- Old SaaS policies (from migration_saas.sql)
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
DROP POLICY IF EXISTS "Users can view their own programs" ON programs;
DROP POLICY IF EXISTS "Users can insert their own programs" ON programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON programs;
DROP POLICY IF EXISTS "Users can view their own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON cards;
DROP POLICY IF EXISTS "Users can view their own movements" ON movements;
DROP POLICY IF EXISTS "Users can insert their own movements" ON movements;
DROP POLICY IF EXISTS "Users can update their own movements" ON movements;
DROP POLICY IF EXISTS "Users can delete their own movements" ON movements;
DROP POLICY IF EXISTS "Users can view their own economy history" ON economy_history;
DROP POLICY IF EXISTS "Users can insert their own economy history" ON economy_history;
DROP POLICY IF EXISTS "Users can update their own economy history" ON economy_history;
DROP POLICY IF EXISTS "Users can delete their own economy history" ON economy_history;

-- Old RBAC-only policies (from migrate_rbac.sql)
DROP POLICY IF EXISTS "owner_clients_all" ON clients;
DROP POLICY IF EXISTS "developer_clients_select" ON clients;
DROP POLICY IF EXISTS "developer_clients_insert" ON clients;
DROP POLICY IF EXISTS "developer_clients_update" ON clients;
DROP POLICY IF EXISTS "demo_clients_select" ON clients;
DROP POLICY IF EXISTS "owner_programs_all" ON programs;
DROP POLICY IF EXISTS "developer_programs_select" ON programs;
DROP POLICY IF EXISTS "developer_programs_insert" ON programs;
DROP POLICY IF EXISTS "developer_programs_update" ON programs;
DROP POLICY IF EXISTS "demo_programs_select" ON programs;
DROP POLICY IF EXISTS "owner_cards_all" ON cards;
DROP POLICY IF EXISTS "developer_cards_select" ON cards;
DROP POLICY IF EXISTS "developer_cards_insert" ON cards;
DROP POLICY IF EXISTS "developer_cards_update" ON cards;
DROP POLICY IF EXISTS "demo_cards_select" ON cards;
DROP POLICY IF EXISTS "owner_movements_all" ON movements;
DROP POLICY IF EXISTS "developer_movements_select" ON movements;
DROP POLICY IF EXISTS "developer_movements_insert" ON movements;
DROP POLICY IF EXISTS "developer_movements_update" ON movements;
DROP POLICY IF EXISTS "demo_movements_select" ON movements;
DROP POLICY IF EXISTS "owner_economy_history_all" ON economy_history;
DROP POLICY IF EXISTS "developer_economy_history_select" ON economy_history;
DROP POLICY IF EXISTS "developer_economy_history_insert" ON economy_history;
DROP POLICY IF EXISTS "demo_economy_history_select" ON economy_history;

-- =============================================
-- STEP 5: New UNIFIED policies (RBAC + Tenant)
-- Each user sees ONLY their own data
-- Owner: full CRUD on own data
-- Developer (tenant): full CRUD on own data  
-- Demo: read-only on own sandbox data
-- =============================================

-- CLIENTS
CREATE POLICY "tenant_clients_select" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tenant_clients_insert" ON clients
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_clients_update" ON clients
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_clients_delete" ON clients
    FOR DELETE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

-- PROGRAMS
CREATE POLICY "tenant_programs_select" ON programs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tenant_programs_insert" ON programs
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_programs_update" ON programs
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_programs_delete" ON programs
    FOR DELETE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

-- CARDS
CREATE POLICY "tenant_cards_select" ON cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tenant_cards_insert" ON cards
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_cards_update" ON cards
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_cards_delete" ON cards
    FOR DELETE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

-- MOVEMENTS
CREATE POLICY "tenant_movements_select" ON movements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tenant_movements_insert" ON movements
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_movements_update" ON movements
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_movements_delete" ON movements
    FOR DELETE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

-- ECONOMY HISTORY
CREATE POLICY "tenant_economy_history_select" ON economy_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tenant_economy_history_insert" ON economy_history
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_economy_history_update" ON economy_history
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

CREATE POLICY "tenant_economy_history_delete" ON economy_history
    FOR DELETE USING (
        auth.uid() = user_id 
        AND get_user_role() IN ('owner', 'developer')
    );

-- TEAM MEMBERS (keep simple — owner sees all, others see themselves)
DROP POLICY IF EXISTS "owner_team_members_all" ON team_members;
DROP POLICY IF EXISTS "developer_team_members_select" ON team_members;
DROP POLICY IF EXISTS "demo_team_members_select" ON team_members;

CREATE POLICY "tenant_team_members_all" ON team_members
    FOR ALL USING (get_user_role() = 'owner');

CREATE POLICY "tenant_team_members_select" ON team_members
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- STEP 6: Migrate existing data to owner
-- =============================================
-- IMPORTANT: Replace 'YOUR_OWNER_UUID' with your actual UUID from
-- Supabase Auth > Users. You can find it next to your email.
-- 
-- Run these one at a time AFTER replacing the UUID:
--
-- UPDATE clients SET user_id = 'YOUR_OWNER_UUID' WHERE user_id IS NULL;
-- UPDATE programs SET user_id = 'YOUR_OWNER_UUID' WHERE user_id IS NULL;
-- UPDATE cards SET user_id = 'YOUR_OWNER_UUID' WHERE user_id IS NULL;
-- UPDATE movements SET user_id = 'YOUR_OWNER_UUID' WHERE user_id IS NULL;
-- UPDATE economy_history SET user_id = 'YOUR_OWNER_UUID' WHERE user_id IS NULL;

-- =============================================
-- STEP 7 (Optional): Enforce NOT NULL after migration
-- Only run AFTER step 6 is complete!
-- =============================================
--
-- ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE programs ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE cards ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE movements ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE economy_history ALTER COLUMN user_id SET NOT NULL;

-- =============================================
-- STEP 8: Create tenants table (for future phases)
-- =============================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    company_logo TEXT,
    plan VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'professional', 'enterprise')),
    plan_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'trial', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    max_clients INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);

CREATE POLICY "tenant_own_data" ON tenants
    FOR ALL USING (auth.uid() = user_id);

-- Auto-create tenant on signup
CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tenants (user_id, company_name, plan, plan_status)
    VALUES (
        NEW.id,
        split_part(NEW.email, '@', 1),
        'trial',
        'trial'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create if trigger doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
CREATE TRIGGER on_auth_user_created_tenant
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_tenant();

-- Trigger for tenants updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONE! 
-- Next steps:
-- 1. Replace YOUR_OWNER_UUID in Step 6 and run those UPDATEs
-- 2. Run Step 7 to enforce NOT NULL
-- 3. Test with 2 different accounts
-- =============================================
