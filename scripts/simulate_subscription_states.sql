-- =============================================
-- SIMULAÇÃO DE ESTADOS DA ASSINATURA
-- =============================================
-- Rode UM bloco por vez para testar o comportamento do site.
-- Substitua 'seu-email@gmail.com' pelo seu email de login se necessário,
-- ou deixe automático para pegar a primeira org que você é dono.

DO $$
DECLARE
    target_org_id UUID;
BEGIN
    -- 1. Pega o ID da sua organização (Assumindo que o usuário logado é o dono)
    -- Ajuste o email abaixo para o usuário que você está usando no front
    SELECT o.id INTO target_org_id
    FROM public.organizations o
    JOIN public.organization_members m ON m.organization_id = o.id
    JOIN auth.users u ON u.id = m.user_id
    WHERE u.email LIKE '%fl360travel%' -- <--- SEU EMAIL AQUI
    LIMIT 1;

    IF target_org_id IS NULL THEN
        RAISE EXCEPTION 'Organização não encontrada para o usuário!';
    END IF;

    -- =================================================================
    -- TESTE 1: MODO TRIAL (Banner AZUL)
    -- =================================================================
    /*
    UPDATE public.subscriptions
    SET status = 'trial',
        trial_ends_at = NOW() + INTERVAL '5 days',
        plan_id = 'pro'
    WHERE organization_id = target_org_id;
    RAISE NOTICE '🔵 Teste 1 Ativado: Modo TRIAL (5 dias restantes). Verifique o Banner AZUL.';
    */

    -- =================================================================
    -- TESTE 2: PERÍODO DE GRAÇA / INADIMPLENTE < 48H (Banner LARANJA)
    -- =================================================================
    /*
    UPDATE public.subscriptions
    SET status = 'past_due',
        current_period_end = NOW() - INTERVAL '10 hours', -- Venceu há 10 horas
        updated_at = NOW() - INTERVAL '10 hours',
        trial_ends_at = NULL
    WHERE organization_id = target_org_id;
    RAISE NOTICE '🟠 Teste 2 Ativado: PERÍODO DE GRAÇA (Venceu há 10h). Verifique o Banner LARANJA.';
    */

    -- =================================================================
    -- TESTE 3: BLOQUEADO / INADIMPLENTE > 48H (Banner VERMELHO)
    -- =================================================================
    /*
    UPDATE public.subscriptions
    SET status = 'past_due',
        current_period_end = NOW() - INTERVAL '50 hours', -- Venceu há 50 horas (>48h)
        updated_at = NOW() - INTERVAL '50 hours',
        trial_ends_at = NULL
    WHERE organization_id = target_org_id;
    RAISE NOTICE '🔴 Teste 3 Ativado: BLOQUEADO (Venceu há 50h). Verifique o Banner VERMELHO e tente salvar algo.';
    */

    -- =================================================================
    -- RESTAURAR: VOLTAR AO NORMAL (VIP/LIFETIME)
    -- =================================================================
    
    UPDATE public.subscriptions
    SET status = 'lifetime',
        plan_id = 'elite',
        trial_ends_at = NULL,
        current_period_end = NULL
    WHERE organization_id = target_org_id;
    RAISE NOTICE '✅ Restaurado: Modo VIP Lifetime. Sem banners.';
    
END $$;
