-- =============================================
-- FIX: Corrigir triggers quebrados que impedem criação de usuários
-- Execute isso no Supabase SQL Editor
-- =============================================

-- PASSO 1: Remover TODOS os triggers conflitantes do auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_onboarding ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;

-- PASSO 2: Criar a função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Garantir que as tabelas necessárias existem
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'developer', 'demo')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    slug VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 4: Criar UM ÚNICO trigger unificado que faz tudo
CREATE OR REPLACE FUNCTION public.handle_new_user_unified()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
    user_role TEXT;
BEGIN
    -- Determinar role do usuario
    IF NEW.email = 'demo@fl360miles.com' THEN
        user_role := 'demo';
    ELSIF (SELECT COUNT(*) FROM user_profiles) = 0 THEN
        user_role := 'owner';
    ELSE
        user_role := 'developer';
    END IF;

    -- Criar perfil (sem conflito)
    INSERT INTO public.user_profiles (user_id, email, role, created_at)
    VALUES (NEW.id, NEW.email, user_role, NOW())
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

-- PASSO 5: Criar o trigger único
CREATE TRIGGER on_auth_user_created_unified
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_unified();

-- PRONTO! Agora tente criar o usuário demo novamente:
-- Email: demo@fl360miles.com
-- Senha: demo360
