-- =============================================
-- SOLUÇÃO DEFINITIVA DE SEGURANÇA V3 (CORREÇÃO DE SYNTAX)
-- =============================================
-- Versão sem mensagens complexas para evitar erro de compilação.
-- =============================================

DO $$
DECLARE
    tbl text;
    pol record;
    has_org_col boolean;
BEGIN
    RAISE NOTICE 'Iniciando Correção RLS V3...';

    -- 1. RECRIA FUNÇÕES
    CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS TEXT AS $func$ 
    DECLARE r TEXT; BEGIN SELECT role INTO r FROM public.user_profiles WHERE user_id = auth.uid(); RETURN COALESCE(r, 'member'); END; $func$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE OR REPLACE FUNCTION public.get_user_orgs() RETURNS SETOF UUID AS $func$ 
    BEGIN RETURN QUERY SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid(); END; $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2. LOOP DINÂMICO
    FOREACH tbl IN ARRAY ARRAY['clients', 'programs', 'cards', 'movements', 'economy_history']
    LOOP
        RAISE NOTICE 'Processando tabela: %', tbl;
        
        -- Limpa políticas velhas
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
        END LOOP;
        
        -- Ativa RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        -- Verifica Coluna
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tbl 
            AND column_name = 'organization_id'
        ) INTO has_org_col;

        -- Cria Política Certa
        IF has_org_col THEN
            EXECUTE format('CREATE POLICY "unified_access_%I" ON public.%I FOR ALL USING (auth.uid() = user_id OR (organization_id IS NOT NULL AND organization_id IN (SELECT public.get_user_orgs())))', tbl, tbl);
            RAISE NOTICE ' >> Politica HIBRIDA aplicada.';
        ELSE
            EXECUTE format('CREATE POLICY "unified_access_%I" ON public.%I FOR ALL USING (auth.uid() = user_id)', tbl, tbl);
            RAISE NOTICE ' >> Politica SIMPLES aplicada.';
        END IF;

    END LOOP;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'SUCESSO TOTAL! SEGURANÇA REATIVADA.';
    RAISE NOTICE '==================================================';
END $$;
