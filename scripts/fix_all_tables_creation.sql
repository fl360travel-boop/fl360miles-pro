-- =============================================
-- FIX GERAL: LIBERAR CRIAÇÃO EM CASCATA
-- =============================================
-- O erro persiste porque quando cria Cliente, o sistema cria também
-- Programas (Milhas) e Cartões. Precisamos liberar eles também!

DO $$
BEGIN
    -- 1. TABELA PROGRAMS (Livelo, Esfera, etc)
    -- ----------------------------------------
    -- Perdoa falta de ID de usuário
    ALTER TABLE public.programs ALTER COLUMN user_id SET DEFAULT auth.uid();
    -- Perdoa falta de Organização (o trigger preenche)
    ALTER TABLE public.programs ALTER COLUMN organization_id DROP NOT NULL;
    
    -- Libera Inserção
    DROP POLICY IF EXISTS "Insert Programs Policy" ON public.programs;
    CREATE POLICY "Insert Programs Policy" ON public.programs 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


    -- 2. TABELA CARDS (Cartões)
    -- ----------------------------------------
    ALTER TABLE public.cards ALTER COLUMN user_id SET DEFAULT auth.uid();
    ALTER TABLE public.cards ALTER COLUMN organization_id DROP NOT NULL;
    
    DROP POLICY IF EXISTS "Insert Cards Policy" ON public.cards;
    CREATE POLICY "Insert Cards Policy" ON public.cards 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


    -- 3. TABELA MOVEMENTS (Histórico Inicial)
    -- ----------------------------------------
    ALTER TABLE public.movements ALTER COLUMN user_id SET DEFAULT auth.uid();
    ALTER TABLE public.movements ALTER COLUMN organization_id DROP NOT NULL;
    
    DROP POLICY IF EXISTS "Insert Movements Policy" ON public.movements;
    CREATE POLICY "Insert Movements Policy" ON public.movements 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


    RAISE NOTICE '✅ AGORA SIM! Clientes, Programas e Cartões liberados.';
END $$;
