-- =============================================
-- SCRIPT DE ESTABILIZAÇÃO V2 (CORREÇÃO DE SCHEMA)
-- =============================================
-- Este script resolve o erro de tabela inexistente e colunas erradas.
-- 1. Cria a tabela de 'membros' que estava faltando.
-- 2. Cria a Organização corretamente (usando name e slug).
-- 3. Vincula tudo e reativa a segurança.
-- =============================================

DO $$
DECLARE
    target_email TEXT;
    target_user_id UUID;
    target_org_id UUID;
BEGIN
    -- 1. IDENTIFICAR O USUÁRIO (Adriano ou FL360)
    SELECT id, email INTO target_user_id, target_email FROM auth.users WHERE email = 'fl360travel@gmail.com';
    IF target_user_id IS NULL THEN
        SELECT id, email INTO target_user_id, target_email FROM auth.users WHERE email = 'adriano.moraesnr@gmail.com';
    END IF;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado!';
    END IF;

    RAISE NOTICE 'Usuário Alvo: %', target_email;

    -- 2. CRIAR TABELA DE MEMBROS (Se faltar)
    -- O erro anterior disse que ela não existe, então vamos criar.
    CREATE TABLE IF NOT EXISTS public.organization_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, user_id)
    );
    
    -- Ativar RLS na tabela de membros para segurança futura
    ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
    
    -- Política básica: Membros podem ver sua própria participação
    DROP POLICY IF EXISTS "Members can view own membership" ON public.organization_members;
    CREATE POLICY "Members can view own membership" ON public.organization_members
        FOR SELECT USING (auth.uid() = user_id);

    -- 3. GARANTIR A ORGANIZAÇÃO (Tabela: organizations)
    -- Colunas confirmadas: id, name, slug
    
    SELECT id INTO target_org_id FROM public.organizations WHERE slug = 'fl360-travel' LIMIT 1;

    IF target_org_id IS NULL THEN
        INSERT INTO public.organizations (name, slug)
        VALUES ('FL360 Travel', 'fl360-travel')
        RETURNING id INTO target_org_id;
        
        RAISE NOTICE 'Organização Criada: %', target_org_id;
    ELSE
        RAISE NOTICE 'Organização Existente: %', target_org_id;
    END IF;

    -- 4. VINCULAR USUÁRIO À ORGANIZAÇÃO
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (target_org_id, target_user_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 5. VINCULAR DADOS (CLIENTES, ETC)
    -- Agora sabemos que a FK é para 'organizations'
    
    UPDATE public.clients SET user_id = target_user_id, organization_id = target_org_id;
    UPDATE public.programs SET user_id = target_user_id, organization_id = target_org_id;
    UPDATE public.cards SET user_id = target_user_id, organization_id = target_org_id;
    UPDATE public.movements SET user_id = target_user_id, organization_id = target_org_id;
    UPDATE public.economy_history SET user_id = target_user_id, organization_id = target_org_id;

    RAISE NOTICE ' Dados regularizados com sucesso!';

END $$;

-- 6. REATIVAR SEGURANÇA (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_history ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'PROCESSO FINALIZADO: SISTEMA ESTÁVEL E SEGURO.';
