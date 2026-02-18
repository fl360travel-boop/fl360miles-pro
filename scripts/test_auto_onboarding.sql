-- =============================================
-- TESTE AUTOMATIZADO DE ONBOARDING
-- =============================================
-- Este script simula o que o Supabase faz quando alguém se cadastra.
-- Ele insere um usuário "falso" e verifica se a Organização foi criada sozinha.

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid(); 
    test_email TEXT;
    org_count INTEGER;
    member_count INTEGER;
    profile_count INTEGER;
BEGIN
    test_email := 'robot_test_' || floor(random()*1000)::text || '@fl360test.com';

    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'INICIANDO SIMULAÇÃO DE CADASTRO: %', test_email;
    RAISE NOTICE '---------------------------------------------------';

    -- 1. SIMULAR CADASTRO (Inserir na tabela auth.users)
    -- Isso deve disparar o gatinho "handle_new_user_onboarding"
    INSERT INTO auth.users (id, email, created_at, updated_at, aud, role)
    VALUES (new_user_id, test_email, NOW(), NOW(), 'authenticated', 'authenticated');

    RAISE NOTICE '>> Usuário inserido em Auth.';

    -- 2. VERIFICAR RESULTADOS (O Trigger funcionou?)
    
    -- Checa Organização
    SELECT count(*) INTO org_count FROM public.organizations 
    WHERE name LIKE 'robot-test-%';

    -- Checa Membro
    SELECT count(*) INTO member_count FROM public.organization_members 
    WHERE user_id = new_user_id;

    -- Checa Perfil
    SELECT count(*) INTO profile_count FROM public.user_profiles 
    WHERE user_id = new_user_id;

    -- 3. RELATÓRIO FINAL
    RAISE NOTICE 'RESULTADOS DA AUTOMAÇÃO:';
    RAISE NOTICE 'Organizações Criadas: % (Esperado: 1)', org_count;
    RAISE NOTICE 'Vínculos de Membro:   % (Esperado: 1)', member_count;
    RAISE NOTICE 'Perfis de Usuário:    % (Esperado: 1)', profile_count;

    IF org_count >= 1 AND member_count >= 1 THEN
        RAISE NOTICE '✅ SUCESSO! O sistema cria empresas automaticamente.';
    ELSE
        RAISE NOTICE '❌ FALHA! A automação não rodou como esperado.';
    END IF;

    -- 4. LIMPEZA (Para não deixar lixo no banco)
    DELETE FROM auth.users WHERE id = new_user_id;
    DELETE FROM public.organizations WHERE name LIKE 'robot-test-%';
    
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'Teste finalizado e dados de teste removidos.';
    RAISE NOTICE '---------------------------------------------------';

END $$;
