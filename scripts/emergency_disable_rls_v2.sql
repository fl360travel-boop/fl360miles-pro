-- =============================================
-- SCRIPT DE EMERGÊNCIA V2 (DESATIVAR TUDO)
-- =============================================
-- Seus dados ESTÃO no banco, mas a 'fechadura' (RLS) não está abrindo.
-- Vamos remover a fechadura novamente para você trabalhar.

DO $$
DECLARE
    total INTEGER;
    meu_email TEXT;
BEGIN
    SELECT count(*) INTO total FROM public.clients;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'TOTAL DE CLIENTES NO BANCO: %', total;
    RAISE NOTICE 'Desativando segurança para liberar acesso...';
    RAISE NOTICE '=========================================';
END $$;

-- DESATIVAR SEGURANÇA (RLS)
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

RAISE NOTICE 'ACESSO LIBERADO.';
