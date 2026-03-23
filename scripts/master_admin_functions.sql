-- =============================================
-- MASTER ADMIN FUNCTIONS
-- Security Definer functions to manage all organizations
-- =============================================

-- 1. Helper to verify if caller is master admin
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT email IN ('fl360travel@gmail.com', 'adriano.moraesnr@gmail.com')
        FROM auth.users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get All Organizations with Subscription Data
-- Bridges the multi-tenant gap by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_master_admin_data()
RETURNS TABLE (
    org_id UUID,
    company_name VARCHAR(255),
    plan TEXT,
    status TEXT,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE,
    owner_email TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    total_paid NUMERIC
) AS $$
BEGIN
    -- Strict security check
    IF NOT is_master_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Master Admin access required.';
    END IF;

    RETURN QUERY
    SELECT 
        o.id as org_id,
        o.company_name,
        s.plan_id as plan,
        s.status,
        s.trial_ends_at,
        s.current_period_end,
        s.updated_at as last_updated,
        p.email as owner_email,
        o.created_at as joined_at,
        0 as total_paid
    FROM organizations o
    LEFT JOIN subscriptions s ON s.organization_id = o.id
    LEFT JOIN organization_members om ON om.organization_id = o.id AND om.role = 'owner'
    LEFT JOIN user_profiles p ON p.user_id = om.user_id
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Toggle Organization Block
-- Manually force status to 'blocked' or 'active'
CREATE OR REPLACE FUNCTION toggle_organization_block(target_org_id UUID, should_block BOOLEAN)
RETURNS VOID AS $$
BEGIN
    -- Strict security check
    IF NOT is_master_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Master Admin access required.';
    END IF;

    UPDATE subscriptions
    SET 
        status = CASE WHEN should_block THEN 'blocked' ELSE 'active' END,
        updated_at = NOW()
    WHERE organization_id = target_org_id;

    -- Optional: Log the action if a master_audit table exists
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
