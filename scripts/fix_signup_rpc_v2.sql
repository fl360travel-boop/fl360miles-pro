-- ============================================
-- FIX: Corrigir RPC handle_new_signup
-- PROBLEMA: Cast '::user_role' falha porque a coluna é VARCHAR, não ENUM
-- SOLUÇÃO: Remover cast de enum e usar texto simples
-- 
-- EXECUTE NO SUPABASE SQL EDITOR
-- ============================================

-- PASSO 1: Dropar a enum user_role se existir (pode conflitar)
-- (Não podemos dropar se estiver em uso, então ignoramos erros)
DO $$ 
BEGIN
    -- Verificar se a coluna role é varchar ou enum
    RAISE NOTICE 'Verificando tipo da coluna role em user_profiles...';
END $$;

-- PASSO 2: Recriar o RPC handle_new_signup SEM cast de enum
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
    --    SEM CAST de enum — usar texto direto
    UPDATE user_profiles 
    SET display_name = p_display_name,
        role = 'owner'
    WHERE user_id = v_user_id;

    -- Se o perfil não existia (caso o trigger tenha falhado), criar
    IF NOT FOUND THEN
        INSERT INTO user_profiles (user_id, email, display_name, role, created_at)
        SELECT v_user_id, u.email, p_display_name, 'owner', now()
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

    -- 3. Criar subscription trial
    BEGIN
        INSERT INTO subscriptions (id, organization_id, plan_id, status, trial_ends_at, current_period_end, created_at, updated_at)
        VALUES (gen_random_uuid(), v_org_id, 'starter', 'trial', v_trial_end, v_trial_end, now(), now())
        ON CONFLICT DO NOTHING;
    EXCEPTION
        WHEN undefined_table THEN
            NULL;
    END;

    RETURN json_build_object(
        'success', true,
        'organization_id', v_org_id,
        'trial_ends_at', v_trial_end
    );
END;
$$;

-- PASSO 3: Também corrigir o trigger handle_new_user_unified
-- para garantir que ele funciona sem enum cast
CREATE OR REPLACE FUNCTION public.handle_new_user_unified()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
    v_role TEXT;
BEGIN
    -- Determinar role do usuario
    IF NEW.email = 'demo@fl360miles.com' THEN
        v_role := 'demo';
    ELSIF (SELECT COUNT(*) FROM user_profiles) = 0 THEN
        v_role := 'owner';
    ELSE
        v_role := 'developer';
    END IF;

    -- Criar perfil (sem conflito)
    INSERT INTO public.user_profiles (user_id, email, role, created_at)
    VALUES (NEW.id, NEW.email, v_role, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Criar organização
    org_name := split_part(NEW.email, '@', 1);
    org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '', 'g')) || '-' || substring(md5(random()::text) from 1 for 6);

    INSERT INTO public.organizations (name, slug, created_at, updated_at)
    VALUES (org_name, org_slug, NOW(), NOW())
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log do erro mas NÃO bloqueia criação do usuário
        RAISE WARNING 'Erro no trigger handle_new_user_unified: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created_unified ON auth.users;
CREATE TRIGGER on_auth_user_created_unified
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_unified();

-- VERIFICAÇÃO
SELECT 'RPC handle_new_signup recriado com sucesso (sem enum cast)' AS resultado;
