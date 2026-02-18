-- =============================================
-- SCRIPT DE ESTABILIZAÇÃO V3 (FINAL E ROBUSTO)
-- =============================================
-- Este script se adapta ao seu banco de dados.
-- Ele verifica linha a linha se a coluna 'organization_id' existe.
-- Se existir, ele preenche. Se não existir, ele atualiza só o usuário.
-- NENHUM ERRO VAI IMPEDIR A EXECUÇÃO.
-- =============================================

DO $$
DECLARE
    target_email TEXT;
    target_user_id UUID;
    target_org_id UUID;
    
    -- Variáveis para lógica dinâmica
    tbl text;
    has_org_col boolean;
    query text;
BEGIN
    -- 1. IDENTIFICAR O USUÁRIO
    SELECT id, email INTO target_user_id, target_email FROM auth.users WHERE email = 'fl360travel@gmail.com';
    IF target_user_id IS NULL THEN
        SELECT id, email INTO target_user_id, target_email FROM auth.users WHERE email = 'adriano.moraesnr@gmail.com';
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado!';
    END IF;

    RAISE NOTICE 'Usuário Alvo: %', target_email;

    -- 2. GARANTIR ORGANIZAÇÃO E LINK
    -- (Lógica de organizações e membros - Igual V2)
    CREATE TABLE IF NOT EXISTS public.organization_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, user_id)
    );
    ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Members view own" ON public.organization_members;
    CREATE POLICY "Members view own" ON public.organization_members FOR SELECT USING (auth.uid() = user_id);

    SELECT id INTO target_org_id FROM public.organizations WHERE slug = 'fl360-travel' LIMIT 1;
    IF target_org_id IS NULL THEN
        INSERT INTO public.organizations (name, slug) VALUES ('FL360 Travel', 'fl360-travel') RETURNING id INTO target_org_id;
    END IF;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (target_org_id, target_user_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 3. ATUALIZAÇÃO BLINDADA (DYNAMIC SQL)
    -- Para cada tabela, verificamos se organization_id existe antes de atualizar
    
    FOREACH tbl IN ARRAY ARRAY['clients', 'programs', 'cards', 'movements', 'economy_history']
    LOOP
        -- Checa se a coluna organization_id existe na tabela atual
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tbl 
            AND column_name = 'organization_id'
        ) INTO has_org_col;
        
        IF has_org_col THEN
            -- Se tem a coluna, atualiza user_id E organization_id
            query := format('UPDATE public.%I SET user_id = %L, organization_id = %L', tbl, target_user_id, target_org_id);
            RAISE NOTICE 'Tabela %: Atualizando User + Org (Coluna encontrada)', tbl;
        ELSE
            -- Se NÃO tem a coluna, atualiza SÓ user_id
            query := format('UPDATE public.%I SET user_id = %L', tbl, target_user_id);
            RAISE NOTICE 'Tabela %: Atualizando Apenas User (organization_id não existe)', tbl;
        END IF;

        -- Executa a query montada
        EXECUTE query;
    END LOOP;

    RAISE NOTICE '=========================================';
    RAISE NOTICE 'SUCESSO! DADOS REGULARIZADOS.';
    RAISE NOTICE '=========================================';

END $$;

-- 4. REATIVAR SEGURANÇA (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_history ENABLE ROW LEVEL SECURITY;
