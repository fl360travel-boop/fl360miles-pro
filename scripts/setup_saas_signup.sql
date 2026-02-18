-- ============================================
-- RPC: handle_new_signup
-- Chamada após o signup para criar tudo que o novo usuário precisa
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

    -- Gerar slug a partir do nome da organização
    v_slug := lower(regexp_replace(p_org_name, '[^a-zA-Z0-9]', '-', 'g'));
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    -- Adicionar sufixo único
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

    -- Trial de 14 dias
    v_trial_end := now() + interval '14 days';

    -- 1. Criar organização
    INSERT INTO organizations (id, name, slug, created_at)
    VALUES (gen_random_uuid(), p_org_name, v_slug, now())
    RETURNING id INTO v_org_id;

    -- 2. Criar membership (vincular user → org como owner)
    INSERT INTO memberships (id, user_id, organization_id, role, created_at)
    VALUES (gen_random_uuid(), v_user_id, v_org_id, 'owner', now());

    -- 3. Criar/atualizar perfil do usuário
    INSERT INTO user_profiles (user_id, display_name, role, created_at)
    VALUES (v_user_id, p_display_name, 'owner', now())
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role = 'owner';

    -- 4. Criar subscription trial
    INSERT INTO subscriptions (id, organization_id, plan_id, status, trial_ends_at, current_period_end, created_at, updated_at)
    VALUES (gen_random_uuid(), v_org_id, 'starter', 'trial', v_trial_end, v_trial_end, now(), now());

    RETURN json_build_object(
        'success', true,
        'organization_id', v_org_id,
        'trial_ends_at', v_trial_end
    );
END;
$$;
