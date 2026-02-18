-- =============================================
-- DIAGNOSTICO: ONDE ESTA O CLIENTE NOVO?
-- =============================================
-- Vamos caçar o último cliente criado e ver por que ele não aparece.

DO $$
DECLARE
    last_client_id UUID;
    last_client_name TEXT;
    last_client_org UUID;
    last_client_user UUID;
    user_email TEXT;
    user_org_id UUID;
BEGIN
    -- 1. Quem é o usuário dono do email fl360travel?
    SELECT id, email INTO last_client_user, user_email 
    FROM auth.users 
    WHERE email = 'fl360travel@gmail.com';

    RAISE NOTICE 'Diagnostico para Usuario: % (%)', user_email, last_client_user;

    -- 2. Qual a organização DELE?
    SELECT organization_id INTO user_org_id
    FROM public.organization_members
    WHERE user_id = last_client_user
    LIMIT 1;

    RAISE NOTICE 'Organizacao do Usuario: %', COALESCE(user_org_id::text, 'SEM ORGANIZACAO!');

    -- 3. Qual o último cliente que ele criou?
    SELECT id, name, organization_id INTO last_client_id, last_client_name, last_client_org
    FROM public.clients
    WHERE user_id = last_client_user
    ORDER BY created_at DESC
    LIMIT 1;

    IF last_client_id IS NULL THEN
        RAISE NOTICE '❌ Nenhum cliente encontrado para este usuario recente.';
    ELSE
        RAISE NOTICE '---------------------------------------------------';
        RAISE NOTICE 'Último Cliente Criado: % (ID: %)', last_client_name, last_client_id;
        RAISE NOTICE 'Organization ID do Cliente: %', COALESCE(last_client_org::text, 'NULL (ESTÁ ÓRFÃO!)');
        RAISE NOTICE '---------------------------------------------------';

        -- ANALISE DO PROBLEMA
        IF last_client_org IS NULL THEN
             RAISE NOTICE '❌ PROBLEMA IDENTIFICADO: O cliente foi criado mas ficou SEM EMPRESA.';
             RAISE NOTICE '   Isso significa que o Trigger falhou ou o usuario nao tinha empresa na hora.';
             
             -- TENTATIVA DE AUTO-CORRECAO
             IF user_org_id IS NOT NULL THEN
                UPDATE public.clients SET organization_id = user_org_id WHERE id = last_client_id;
                RAISE NOTICE '✅ CORRECAO APLICADA AGORA! O cliente foi vinculado. Tente recarregar a pagina.';
             END IF;
             
        ELSIF last_client_org != user_org_id THEN
             RAISE NOTICE '❌ CONFLITO: O cliente é da empresa A mas o usuário é da empresa B.';
        ELSE
             RAISE NOTICE '✅ DADOS PARECEM CERTOS. Se não aparece, é culpa do RLS (Policy).';
        END IF;
    END IF;

END $$;
