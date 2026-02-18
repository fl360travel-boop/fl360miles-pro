-- =============================================
-- OPTIMIZE DASHBOARD PERFORMANCE
-- =============================================

-- Função para buscar estatísticas do dashboard de forma otimizada
-- Retorna JSON com tudo que o frontend precisa em UMA query.

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
    audit_period_metrics JSON;
    
    -- Variaveis para logica do grafico
    selected_year INT := EXTRACT(YEAR FROM NOW())::INT;
    
BEGIN
    -- 1. Identificar Organização do Usuário (Assumindo Single Tenant por enquanto ou pegando a primeira)
    -- Melhor: Pegar do contexto de sessão se possível, mas aqui vamos buscar via tabela de membros
    SELECT organization_id INTO current_org_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF current_org_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated or no organization found.';
    END IF;

    -- 2. Calcular Totais ACUMULADOS (Miles, Profit, Economy)
    -- Usando tabelas raw para ser mais rapido do que iterar Clients -> JSON
    
    -- Total Miles (Sum of all programs balance for clients in this org)
    SELECT COALESCE(SUM(p.balance), 0)
    INTO total_miles
    FROM public.programs p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.organization_id = current_org_id;

    -- Total Profit & Economy (From movements)
    SELECT 
        COALESCE(SUM(negotiated_value), 0),
        COALESCE(SUM(economy_generated), 0)
    INTO total_profit, total_economy
    FROM public.movements m
    JOIN public.clients c ON c.id = m.client_id
    WHERE c.organization_id = current_org_id;

    -- Active Clients
    SELECT COUNT(*)
    INTO active_clients
    FROM public.clients
    WHERE organization_id = current_org_id AND status = 'active';

    -- 3. Recent Operations (Last 6)
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

    -- Montar JSON Final
    result := json_build_object(
        'metrics', json_build_object(
            'totalMiles', total_miles,
            'totalProfit', total_profit,
            'totalEconomy', total_economy,
            'activeClients', active_clients
        ),
        'recentOps', COALESCE(recent_ops, '[]'::json),
        'programMetrics', COALESCE(program_metrics, '[]'::json)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
