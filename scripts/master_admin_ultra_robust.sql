-- =============================================
-- MASTER ADMIN FUNCTIONS (ULTRA ROBUST)
-- =============================================

CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND lower(trim(email)) IN ('fl360travel@gmail.com', 'adriano.moraesnr@gmail.com')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-run the main data function to ensure it uses the robust check
CREATE OR REPLACE FUNCTION get_master_admin_data()
RETURNS TABLE (
    org_id UUID,
    company_name VARCHAR(255),
    plan TEXT,
    status TEXT,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE,
    owner_email TEXT
) AS $$
BEGIN
    IF NOT is_master_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Master Admin access required.';
    END IF;

    RETURN QUERY
    SELECT 
        t.id as org_id,
        t.company_name,
        s.plan_id as plan,
        s.status,
        s.trial_ends_at,
        s.current_period_end,
        s.updated_at as last_updated,
        p.email as owner_email
    FROM tenants t
    LEFT JOIN subscriptions s ON s.organization_id = t.id
    LEFT JOIN organization_members om ON om.organization_id = t.id AND om.role = 'owner'
    LEFT JOIN user_profiles p ON p.user_id = om.user_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
