-- =============================================
-- SUPER DIAGNÓSTICO: CRIAÇÃO COMPLETA
-- =============================================
-- Vamos simular EXATAMENTE o que o site faz (Criar Cliente -> Criar Programa)
-- para achar onde está estourando o erro.

DO $$
DECLARE
    target_email TEXT := 'fl360travel@gmail.com';
    test_user_id UUID;
    test_client_id UUID;
    test_org_id UUID;
BEGIN
    -- 1. IDENTIFICA USUARIO
    SELECT id INTO test_user_id FROM auth.users WHERE email = target_email;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario fl360travel@gmail.com nao encontrado!';
    END IF;

    -- 2. VERIFICA SE TEM ORGANIZAÇÃO (Crucial)
    SELECT organization_id INTO test_org_id 
    FROM public.organization_members 
    WHERE user_id = test_user_id LIMIT 1;
    
    RAISE NOTICE 'Diagnostico Inicial:';
    RAISE NOTICE ' User ID: %', test_user_id;
    RAISE NOTICE ' Org ID:  %', COALESCE(test_org_id::text, 'NULL (⚠️ PERIGO!)');
    
    -- SIMULA SESSÃO
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);

    -- 3. TENTA CRIAR CLIENTE (Sem user_id, confiando no default)
    BEGIN
        INSERT INTO public.clients (name, email, start_date, management_fee, billing_cycle, management_level, payment_method, status, avatar)
        VALUES ('Cliente Debug Teste', 'debug@teste.com', NOW(), 0, 'Mensal', 'Standard', 'Cartão', 'active', '1')
        RETURNING id INTO test_client_id;
        
        RAISE NOTICE '✅ INSERT CLIENTE: SUCESSO! ID: %', test_client_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ INSERT CLIENTE: FALHOU!';
        RAISE NOTICE '   Erro: %', SQLERRM;
        RETURN; -- Para por aqui
    END;

    -- 4. TENTA CRIAR PROGRAMA (Filho)
    BEGIN
        INSERT INTO public.programs (client_id, name, balance, icon)
        VALUES (test_client_id, 'Livelo Teste', 1000, 'diamond');
        
        RAISE NOTICE '✅ INSERT PROGRAMA: SUCESSO!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ INSERT PROGRAMA: FALHOU!';
        RAISE NOTICE '   Erro: %', SQLERRM;
    END;

    -- 5. LIMPEZA
    DELETE FROM public.clients WHERE id = test_client_id;
    RAISE NOTICE 'Limpeza concluida.';

END $$;
