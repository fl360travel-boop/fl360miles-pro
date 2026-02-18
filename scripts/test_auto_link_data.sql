-- =============================================
-- TESTE DE VINCULO DE DADOS (DATA OWNERSHIP) - V2 (CORRIGIDO)
-- =============================================
-- Este script simula um usuário (que tem empresa) criando um Cliente.
-- O objetivo é ver se o campo 'organization_id' é preenchido sozinho.

DO $$
DECLARE
    -- Variáveis de teste
    test_user_id UUID := gen_random_uuid();
    test_org_id UUID;
    test_client_id UUID;
    
    -- Variáveis de verificação
    check_org_id UUID;
BEGIN
    -- 1. PREPARAR AMBIENTE (Cria Usuário + Org Fakes)
    -- Simulando um usuário que acabou de fazer onboarding
    INSERT INTO auth.users (id, email, created_at, updated_at, aud, role)
    VALUES (test_user_id, 'tester_link@robot.com', NOW(), NOW(), 'authenticated', 'authenticated');

    INSERT INTO public.organizations (name, slug, created_at, updated_at)
    VALUES ('Empresa Teste Link', 'empresa-teste-link-' || floor(random()*1000)::text, NOW(), NOW())
    RETURNING id INTO test_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
    VALUES (test_org_id, test_user_id, 'owner', NOW());

    RAISE NOTICE 'Ambiente Preparado. User: %, Org: %', test_user_id, test_org_id;

    -- 2. SIMULAR CENA (Usuário está logado e cria um Client)
    -- Simulamos o JWT Session
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    -- Agora inserimos um cliente SEM organization_id (como o front faz)
    -- CORRECAO: Adicionado campo 'email' que é obrigatório
    INSERT INTO public.clients (name, email, start_date, management_fee, billing_cycle, management_level, payment_method, status, avatar, user_id)
    VALUES ('Cliente Teste Link', 'cliente_teste_' || floor(random()*1000)::text || '@teste.com', NOW(), 100, 'Mensal', 'Standard', 'Cartão', 'active', '1', test_user_id)
    RETURNING id INTO test_client_id;

    -- 3. VERIFICAR SE O GATILHO FUNCIONOU
    SELECT organization_id INTO check_org_id
    FROM public.clients 
    WHERE id = test_client_id;

    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'RESULTADO DO TESTE DE VINCULO:';
    RAISE NOTICE 'Cliente Criado ID: %', test_client_id;
    RAISE NOTICE 'Org ID Esperada:   %', test_org_id;
    RAISE NOTICE 'Org ID Gravada:    %', check_org_id;
    RAISE NOTICE '---------------------------------------------------';

    IF check_org_id = test_org_id THEN
        RAISE NOTICE '✅ SUCESSO! O cliente foi vinculado automaticamente à empresa.';
    ELSE
        RAISE NOTICE '❌ FALHA! O cliente ficou sem empresa (NULL) ou com empresa errada.';
    END IF;

    -- 4. LIMPEZA
    DELETE FROM public.clients WHERE id = test_client_id;
    DELETE FROM public.organization_members WHERE user_id = test_user_id;
    DELETE FROM public.organizations WHERE id = test_org_id;
    DELETE FROM auth.users WHERE id = test_user_id;

END $$;
