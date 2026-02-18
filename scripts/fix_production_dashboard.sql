-- ========================================================
-- FIX SCRIPT: Dashboard Function & Missing Columns
-- Description: Creates the missing RPC function and updates tables
-- ========================================================

-- 1. FIX SUBSCRIPTIONS TABLE
ALTER TABLE IF EXISTS public.subscriptions 
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- 2. CREATE DASHBOARD STATS FUNCTION (RPC)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_total_miles numeric := 0;
    v_total_profit numeric := 0;
    v_total_economy numeric := 0;
    v_active_clients integer := 0;
    v_program_metrics json;
    v_recent_ops json;
    v_chart_data json;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get Organization ID (Assuming single org context for now)
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = v_user_id
    LIMIT 1;

    -- If no org, return empty structure (Safe fallback)
    IF v_org_id IS NULL THEN
        RETURN json_build_object(
            'metrics', json_build_object(
                'totalMiles', 0,
                'totalProfit', 0,
                'totalEconomy', 0,
                'activeClients', 0
            ),
            'programMetrics', '[]'::json,
            'recentOps', '[]'::json,
            'chartData', '[]'::json
        );
    END IF;

    -- Calculate Metrics (Scoped by Organization/RLS)
    -- Total Miles (Sum of all program balances)
    SELECT COALESCE(SUM(balance), 0) INTO v_total_miles
    FROM programs p
    JOIN clients c ON p.client_id = c.id
    WHERE c.organization_id = v_org_id;

    -- Total Profit (Realized from movements)
    SELECT COALESCE(SUM(profit), 0) INTO v_total_profit
    FROM movements m
    JOIN clients c ON m.client_id = c.id
    WHERE c.organization_id = v_org_id;

    -- Active Clients (Status = 'active')
    SELECT COUNT(*) INTO v_active_clients
    FROM clients
    WHERE organization_id = v_org_id AND status = 'active';

    -- Program Breakdown (Top 6 by balance)
    SELECT json_agg(t) INTO v_program_metrics
    FROM (
        SELECT 
            p.name,
            SUM(p.balance) as balance,
            COUNT(DISTINCT p.client_id) as "clientCount"
        FROM programs p
        JOIN clients c ON p.client_id = c.id
        WHERE c.organization_id = v_org_id
        GROUP BY p.name
        ORDER BY SUM(p.balance) DESC
        LIMIT 6
    ) t;

    -- Recent Operations (Last 6 movements)
    SELECT json_agg(t) INTO v_recent_ops
    FROM (
        SELECT 
            m.id,
            m.type,
            m.program,
            m.amount,
            m.date,
            c.name as "clientName",
            c.id as "clientId"
        FROM movements m
        JOIN clients c ON m.client_id = c.id
        WHERE c.organization_id = v_org_id
        ORDER BY m.date DESC, m.created_at DESC
        LIMIT 6
    ) t;

    -- Chart Data (Monthly Growth)
    -- Simplified for MVP: Group by month of movement date
    SELECT json_agg(t) INTO v_chart_data
    FROM (
        SELECT 
            to_char(m.date::date, 'Mon') as n,
            EXTRACT(YEAR FROM m.date::date) as year,
            SUM(m.amount) as v
        FROM movements m
        JOIN clients c ON m.client_id = c.id
        WHERE c.organization_id = v_org_id 
          AND m.type IN ('Compra', 'Bônus', 'Transferência') -- Entry types
          AND m.date >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1, 2
        ORDER BY MIN(m.date) ASC
    ) t;

    RETURN json_build_object(
        'metrics', json_build_object(
            'totalMiles', v_total_miles,
            'totalProfit', v_total_profit,
            'totalEconomy', 0,
            'activeClients', v_active_clients
        ),
        'programMetrics', COALESCE(v_program_metrics, '[]'::json),
        'recentOps', COALESCE(v_recent_ops, '[]'::json),
        'chartData', COALESCE(v_chart_data, '[]'::json)
    );
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats TO service_role;
