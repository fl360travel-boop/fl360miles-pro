-- =============================================
-- AUTOMACAO DE ONBOARDING v3 (CORREÇÃO DE EMAIL)
-- =============================================

-- 1. Função: Gerar Slug Único (Nome de URL)
CREATE OR REPLACE FUNCTION public.generate_slug(name text)
RETURNS text AS $$
DECLARE
    new_slug text;
    safe_name text;
BEGIN
    safe_name := lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
    safe_name := regexp_replace(safe_name, '\s+', '-', 'g');
    
    new_slug := safe_name || '-' || substring(md5(random()::text) from 1 for 6);
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- 2. Função Mestra: Handler de Novo Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
BEGIN
    org_name := split_part(NEW.email, '@', 1);
    org_slug := public.generate_slug(org_name);

    -- CORREÇÃO: Adicionado campo 'email' que é obrigatório
    INSERT INTO public.user_profiles (user_id, email, role, created_at)
    VALUES (NEW.id, NEW.email, 'owner', NOW())
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.organizations (name, slug, created_at, updated_at)
    VALUES (org_name, org_slug, NOW(), NOW())
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger: Dispara quando cria usuário no Auth
DROP TRIGGER IF EXISTS on_auth_user_created_onboarding ON auth.users;

CREATE TRIGGER on_auth_user_created_onboarding
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_onboarding();

DO $$ 
BEGIN 
    RAISE NOTICE 'Automação de Onboarding Atualizada (v3) com Sucesso!'; 
END $$;
