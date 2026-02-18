-- =============================================
-- OPTIMIZE DASHBOARD PERFORMANCE V2
-- =============================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    current_org_id UUID;
    result JSON;
    total_miles NUMERIC := 0;
    total_profit NUMERIC := 0;
    total_economy NUMERIC := 0;
    active_clients INT := 0;
    recent_ops JSON;
    program_metrics JSON;
    chart_data JSON;
    
    -- Para o gráfico (Ano Atual)
    selected_year INT := EXTRACT(YEAR FROM NOW())::INT;
    
BEGIN
    -- 1. Identificar Organização
    SELECT organization_id INTO current_org_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF current_org_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated or no organization found.';
    END IF;

    -- 2. Totais
    SELECT COALESCE(SUM(p.balance), 0) INTO total_miles
    FROM public.programs p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.organization_id = current_org_id;

    SELECT 
        COALESCE(SUM(negotiated_value), 0),
        COALESCE(SUM(economy_generated), 0)
    INTO total_profit, total_economy
    FROM public.movements m
    JOIN public.clients c ON c.id = m.client_id
    WHERE c.organization_id = current_org_id;

    SELECT COUNT(*) INTO active_clients
    FROM public.clients
    WHERE organization_id = current_org_id AND status = 'active';

    -- 3. Recent Operations
    SELECT json_agg(t) INTO recent_ops
    FROM (
        SELECT 
            m.id,
            m.date,
            m.type,
            m.program,
            m.amount,
            c.name as "clientName",
            c.id as "clientId"
        FROM public.movements m
        JOIN public.clients c ON c.id = m.client_id
        WHERE c.organization_id = current_org_id
        ORDER BY m.date DESC
        LIMIT 6
    ) t;

    -- 4. Program Breakdown
    SELECT json_agg(t) INTO program_metrics
    FROM (
        SELECT 
            UPPER(TRIM(p.name)) as name,
            SUM(p.balance) as balance,
            COUNT(DISTINCT p.client_id) as "clientCount"
        FROM public.programs p
        JOIN public.clients c ON c.id = p.client_id
        WHERE c.organization_id = current_org_id
        GROUP BY UPPER(TRIM(p.name))
        ORDER BY balance DESC
    ) t;

    -- 5. Chart Data (Simplificado: Movimentação por Mês no Ano Atual)
    -- Nota: Calcular "Saldo no tempo" via SQL requer window functions complexas. 
    -- Para performance V1, vamos mostrar "Volume Movimentado" ou manter o calculo cumulativo simplificado.
    -- Aqui faremos: Saldo Acumulado Mês a Mês (Estimativa)
    
    SELECT json_agg(t) INTO chart_data
    FROM (
        WITH monthly_moves AS (
            SELECT 
                EXTRACT(MONTH FROM m.date)::INT as month_num,
                SUM(CASE 
                    WHEN m.type IN ('Venda', 'Resgate', 'Transferência') THEN -m.amount 
                    ELSE m.amount 
                END) as net_change
            FROM public.movements m
            JOIN public.clients c ON c.id = m.client_id
            WHERE c.organization_id = current_org_id
              AND EXTRACT(YEAR FROM m.date) = selected_year
            GROUP BY 1
        )
        SELECT 
            TO_CHAR(TO_DATE(mm.month_num::text, 'MM'), 'Mon') as n,
            SUM(mm.net_change) OVER (ORDER BY mm.month_num) as v, -- Saldo acumulado DO ANO (delta)
            selected_year as year
        FROM monthly_moves mm
        ORDER BY mm.month_num
    ) t;

    -- Montar JSON Final
    result := json_build_object(
        'metrics', json_build_object(
            'totalMiles', total_miles,
            'totalProfit', total_profit,
            'totalEconomy', total_economy,
            'activeClients', active_clients
        ),
        'recentOps', COALESCE(recent_ops, '[]'::json),
        'programMetrics', COALESCE(program_metrics, '[]'::json),
        'chartData', COALESCE(chart_data, '[]'::json)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
