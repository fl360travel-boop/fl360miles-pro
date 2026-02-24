-- =============================================
-- DEFINITIVE FIX FOR OWNER ACCOUNT (fl360travel@gmail.com)
-- =============================================

DO $$
DECLARE
    target_user_id UUID;
    target_org_id UUID;
BEGIN
    -- 1. Localizar o ID do usuário
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'fl360travel@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário fl360travel@gmail.com não encontrado!';
    END IF;

    -- 2. Garantir que o perfil está como 'owner'
    INSERT INTO public.user_profiles (user_id, email, role, display_name)
    VALUES (target_user_id, 'fl360travel@gmail.com', 'owner', 'Adriano (Dono)')
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'owner', display_name = 'Adriano (Dono)';

    -- 3. Localizar ou criar uma organização para o dono
    SELECT organization_id INTO target_org_id 
    FROM public.organization_members 
    WHERE user_id = target_user_id 
    LIMIT 1;

    IF target_org_id IS NULL THEN
        -- Tenta achar por slug
        SELECT id INTO target_org_id FROM public.organizations WHERE slug LIKE 'fl360travel%' LIMIT 1;
        
        IF target_org_id IS NULL THEN
            INSERT INTO public.organizations (name, slug)
            VALUES ('FL360 Travel', 'fl360travel-hq')
            RETURNING id INTO target_org_id;
        END IF;

        -- Vincula o usuário como owner da org
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (target_org_id, target_user_id, 'owner')
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';
    END IF;

    -- 4. Garantir assinatura LIFETIME ENTERPRISE
    INSERT INTO public.subscriptions (
        organization_id,
        plan_id,
        status,
        current_period_end,
        trial_ends_at
    )
    VALUES (
        target_org_id,
        'enterprise',
        'lifetime',
        '2099-12-31',
        NULL
    )
    ON CONFLICT (organization_id) DO UPDATE
    SET 
        plan_id = 'enterprise',
        status = 'lifetime',
        current_period_end = '2099-12-31',
        trial_ends_at = NULL,
        updated_at = NOW();

    RAISE NOTICE 'Conta fl360travel@gmail.com atualizada com sucesso para OWNER LIFETIME.';
END $$;
