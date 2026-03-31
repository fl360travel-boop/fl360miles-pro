-- =============================================
-- CORRECAO: get_master_admin_data
-- Atualiza a funcao para retornar todos os campos
-- que o frontend MasterAgencyData espera:
-- org_id, company_name, plan, status,
-- trial_ends_at, current_period_end, last_updated,
-- owner_email, owner_phone, joined_at, total_paid
-- =============================================

-- Drop the old function first to avoid return type conflict
DROP FUNCTION IF EXISTS get_master_admin_data();

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
    owner_phone TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    total_paid NUMERIC
) AS $$
BEGIN
    IF NOT is_master_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Master Admin access required.';
    END IF;

    RETURN QUERY
    SELECT 
        t.id as org_id,
        t.company_name,
        COALESCE(s.plan_id, 'starter') as plan,
        COALESCE(s.status, 'active') as status,
        s.trial_ends_at,
        s.current_period_end,
        s.updated_at as last_updated,
        COALESCE(p.email, 'N/A') as owner_email,
        p.phone as owner_phone,
        t.created_at as joined_at,
        CAST(0 AS NUMERIC) as total_paid
    FROM tenants t
    LEFT JOIN subscriptions s ON s.organization_id = t.id
    LEFT JOIN organization_members om ON om.organization_id = t.id AND om.role = 'owner'
    LEFT JOIN user_profiles p ON p.user_id = om.user_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
