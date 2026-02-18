-- =============================================
-- DIAGNÓSTICO DE SEGURANÇA (RLS)
-- =============================================
-- Este script verifica QUAIS regras de segurança estão ativas
-- e se as funções necessárias existem.

DO $$
DECLARE
    tem_funcao_orgs BOOLEAN;
    politicas TEXT;
    meu_id UUID;
BEGIN
    -- 1. Identificar Usuário
    SELECT id INTO meu_id FROM auth.users WHERE email = 'fl360travel@gmail.com';

    -- 2. Verificar se a função 'get_user_orgs' existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_user_orgs'
    ) INTO tem_funcao_orgs;

    -- 3. Exibir Relatório
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'DIAGNÓSTICO RLS (SEGURANÇA)';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Usuário Teste: %', meu_id;
    RAISE NOTICE 'Função get_user_orgs existe? %', CASE WHEN tem_funcao_orgs THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'POLÍTICAS ATIVAS NA TABELA CLIENTS:';
    
    FOR politicas IN 
        SELECT policyname || ' (' || cmd || '): ' || qual
        FROM pg_policies 
        WHERE tablename = 'clients'
    LOOP
        RAISE NOTICE '- %', politicas;
    END LOOP;
    
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'TESTE DE MEMBROS (Organization Members):';
    PERFORM count(*) FROM public.organization_members WHERE user_id = meu_id;
    GET DIAGNOSTICS politicas = ROW_COUNT; -- reutilizando variavel
    RAISE NOTICE 'Você é membro de % organizações.', politicas;
    
    RAISE NOTICE '==================================================';

END $$;
