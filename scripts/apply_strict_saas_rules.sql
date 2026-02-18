-- =============================================
-- REGRAS RÍGIDAS SAAS: VIPs vs TRIAL
-- =============================================

DO $$
DECLARE
    -- Lista de E-mails VIP (Acesso Vitalício)
    vip_emails TEXT[] := ARRAY[
        'fl360travel@gmail.com', 
        'demo@fl360travel.com.br', 
        'adriano.moraesnr@gmail.com'
    ];
BEGIN
    -- 1. EVERYONE ELSE (SaaS) -> TRIAL 7 DIAS
    -- Reinicia o trial de todo mundo que NÃO é VIP para começar hoje.
    UPDATE public.subscriptions s
    SET 
        plan_id = 'pro',
        status = 'trial',
        trial_ends_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
    FROM public.organization_members m
    JOIN auth.users u ON u.id = m.user_id
    WHERE s.organization_id = m.organization_id
    AND m.role = 'owner'
    AND u.email != ALL(vip_emails);

    -- 2. VIPs (Lifetime) -> ELITE
    -- Garante que os 3 e-mails tenham acesso vitalício e ilimitado.
    UPDATE public.subscriptions s
    SET 
        plan_id = 'elite',
        status = 'life_time', -- Status especial que nunca expira
        trial_ends_at = '2099-12-31 23:59:59',
        updated_at = NOW()
    FROM public.organization_members m
    JOIN auth.users u ON u.id = m.user_id
    WHERE s.organization_id = m.organization_id
    AND m.role = 'owner'
    AND u.email = ANY(vip_emails);

    RAISE NOTICE '✅ Regras Aplicadas!';
    RAISE NOTICE '   - VIPs (Adriano, Demo, FL360): Vitalício (Elite)';
    RAISE NOTICE '   - Demais (SaaS): Trial resetado para 7 dias a partir de hoje.';

END $$;
