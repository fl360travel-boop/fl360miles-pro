-- ============================================
-- RPC: handle_new_signup
-- Called AFTER signup to update the auto-created org and profile
-- with the proper company name and advisor name.
-- 
-- NOTE: The trigger handle_new_user_unified already creates:
-- - user_profiles (with email-based name, developer role)
-- - organizations (with email prefix as name)
-- - organization_members (as owner)
-- 
-- This RPC just updates those records with the real info.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_signup(
    p_org_name TEXT,
    p_display_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_slug TEXT;
    v_trial_end TIMESTAMPTZ;
BEGIN
    -- Pegar o user_id do contexto de autenticação
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Trial de 14 dias
    v_trial_end := now() + interval '14 days';

    -- 1. Atualizar o perfil que o trigger já criou
    UPDATE user_profiles 
    SET display_name = p_display_name,
        role = 'owner'::user_role
    WHERE user_id = v_user_id;

    -- Se o perfil não existia (caso o trigger tenha falhado), criar
    IF NOT FOUND THEN
        INSERT INTO user_profiles (user_id, email, display_name, role, created_at)
        SELECT v_user_id, u.email, p_display_name, 'owner'::user_role, now()
        FROM auth.users u WHERE u.id = v_user_id;
    END IF;

    -- 2. Buscar a org que o trigger já criou
    SELECT om.organization_id INTO v_org_id
    FROM organization_members om
    WHERE om.user_id = v_user_id
    LIMIT 1;

    -- Se o trigger já criou uma org, atualizar o nome
    IF v_org_id IS NOT NULL THEN
        UPDATE organizations 
        SET name = p_org_name,
            slug = lower(regexp_replace(p_org_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 6)
        WHERE id = v_org_id;
    ELSE
        -- Se não existe org, criar tudo do zero
        v_slug := lower(regexp_replace(p_org_name, '[^a-zA-Z0-9]', '-', 'g'));
        v_slug := regexp_replace(v_slug, '-+', '-', 'g');
        v_slug := trim(both '-' from v_slug);
        v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

        INSERT INTO organizations (id, name, slug, created_at)
        VALUES (gen_random_uuid(), p_org_name, v_slug, now())
        RETURNING id INTO v_org_id;

        INSERT INTO organization_members (id, user_id, organization_id, role, created_at)
        VALUES (gen_random_uuid(), v_user_id, v_org_id, 'owner', now());
    END IF;

    -- 3. Criar/atualizar subscription trial (se não existir memberships table separada)
    -- Check if subscriptions table exists and insert
    BEGIN
        INSERT INTO subscriptions (id, organization_id, plan_id, status, trial_ends_at, current_period_end, created_at, updated_at)
        VALUES (gen_random_uuid(), v_org_id, 'starter', 'trial', v_trial_end, v_trial_end, now(), now())
        ON CONFLICT DO NOTHING;
    EXCEPTION
        WHEN undefined_table THEN
            -- subscriptions table doesn't exist yet, skip
            NULL;
    END;

    RETURN json_build_object(
        'success', true,
        'organization_id', v_org_id,
        'trial_ends_at', v_trial_end
    );
END;
$$;
