-- =============================================
-- GRANT LIFETIME ACCESS TO OWNER
-- =============================================

DO $$
DECLARE
    owner_org_id UUID;
BEGIN
    -- 1. Encontrar a organização do dono
    SELECT organization_id INTO owner_org_id
    FROM public.organization_members om
    JOIN auth.users u ON om.user_id = u.id
    WHERE u.email = 'fl360travel@gmail.com'
    LIMIT 1;

    IF owner_org_id IS NOT NULL THEN
        -- 2. Atualizar ou Inserir a assinatura como LIFEIME / ENTERPRISE
        INSERT INTO public.subscriptions (
            organization_id,
            plan_id,
            status,
            trial_ends_at,
            current_period_end
        )
        VALUES (
            owner_org_id,
            'enterprise',
            'lifetime',
            NULL,
            '2099-12-31'
        )
        ON CONFLICT (organization_id) DO UPDATE
        SET 
            plan_id = 'enterprise',
            status = 'lifetime',
            trial_ends_at = NULL,
            current_period_end = '2099-12-31',
            updated_at = NOW();

        RAISE NOTICE 'Organização % (%@fl360travel) atualizada para LIFETIME ENTERPRISE.', owner_org_id, 'fl360travel';
    ELSE
        RAISE WARNING 'Organização para fl360travel@gmail.com não encontrada.';
    END IF;
END $$;
