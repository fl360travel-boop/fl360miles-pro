-- =============================================
-- UPGRADE DE SCHEMA (SAAS V2)
-- =============================================
-- O erro anterior aconteceu porque as tabelas de Cartões e Milhas
-- ainda eram do modelo antigo (sem organização).
-- Vamos atualizar tudo agora para o padrão SaaS.

DO $$
BEGIN
    -- 1. TABELA PROGRAMS (MILHAS)
    -- ---------------------------
    -- Adiciona coluna organization_id se não existir
    BEGIN
        ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    -- Ajusta user_id para ser automático
    ALTER TABLE public.programs ALTER COLUMN user_id SET DEFAULT auth.uid();
    
    -- Recria Políticas de Segurança (RLS)
    DROP POLICY IF EXISTS "Programs Policy" ON public.programs;
    DROP POLICY IF EXISTS "Insert Programs Policy" ON public.programs;
    
    -- Leitura: Vê se for dono OU se for da mesma organização
    CREATE POLICY "Programs Visibility" ON public.programs FOR SELECT USING (
        auth.uid() = user_id OR 
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );
    -- Escrita: Livre para autenticados (o trigger vai preencher a org)
    CREATE POLICY "Programs Insert" ON public.programs FOR INSERT WITH CHECK (auth.role() = 'authenticated');


    -- 2. TABELA CARDS (CARTÕES)
    -- -------------------------
    BEGIN
        ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    ALTER TABLE public.cards ALTER COLUMN user_id SET DEFAULT auth.uid();

    DROP POLICY IF EXISTS "Cards Policy" ON public.cards;
    DROP POLICY IF EXISTS "Insert Cards Policy" ON public.cards;

    CREATE POLICY "Cards Visibility" ON public.cards FOR SELECT USING (
        auth.uid() = user_id OR 
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );
    CREATE POLICY "Cards Insert" ON public.cards FOR INSERT WITH CHECK (auth.role() = 'authenticated');


    -- 3. TABELA MOVEMENTS (EXTRATO)
    -- -----------------------------
    BEGIN
        ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    ALTER TABLE public.movements ALTER COLUMN user_id SET DEFAULT auth.uid();

    DROP POLICY IF EXISTS "Movements Policy" ON public.movements;
    DROP POLICY IF EXISTS "Insert Movements Policy" ON public.movements;

    CREATE POLICY "Movements Visibility" ON public.movements FOR SELECT USING (
        auth.uid() = user_id OR 
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );
    CREATE POLICY "Movements Insert" ON public.movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    RAISE NOTICE '✅ UPGRADE CONCLUÍDO! Tabelas Cards, Programs e Movements agora são SaaS.';
END $$;
