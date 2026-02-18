-- =============================================
-- ACERTO DE CONFIGURAÇÃO (CLIENTES) - FIX DO FIX
-- =============================================
-- Corrige a tabela 'clients' para aceitar criação sem ID explícito.

DO $$
BEGIN
    -- 1. Garante que 'user_id' venha preenchido automaticamente
    ALTER TABLE public.clients ALTER COLUMN user_id SET DEFAULT auth.uid();
    
    -- 2. Garante que 'organization_id' possa começar NULL (antes do trigger preencher)
    ALTER TABLE public.clients ALTER COLUMN organization_id DROP NOT NULL;
    
    -- 3. Libera a INSERÇÃO para qualquer usuário logado
    DROP POLICY IF EXISTS "Insert Clients Policy" ON public.clients;
    CREATE POLICY "Insert Clients Policy" ON public.clients 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE '✅ Tabela Clients corrigida e políticas atualizadas!';
END $$;
