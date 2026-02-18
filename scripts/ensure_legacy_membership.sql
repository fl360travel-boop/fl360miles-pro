-- =============================================
-- GARANTIA DA CONTA LEGADA (AUTO-FIX)
-- =============================================
-- Este script verifica se 'fl360travel@gmail.com' tem uma Organização.
-- SE NÃO TIVER, ele cria a organização e vincula na hora.
-- Isso é crucial para que os triggers novos funcionem para você.

DO $$
DECLARE
    legacy_email TEXT := 'fl360travel@gmail.com';
    legacy_user_id UUID;
    org_id UUID;
    member_check UUID;
BEGIN
    -- 1. Pega o ID do usuário oficial
    SELECT id INTO legacy_user_id FROM auth.users WHERE email = legacy_email;

    IF legacy_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Usuário % não encontrado no Auth. Verifique o e-mail.', legacy_email;
        RETURN;
    END IF;

    -- 2. Verifica se ele já é membro de alguma organização
    SELECT organization_id INTO member_check 
    FROM public.organization_members 
    WHERE user_id = legacy_user_id 
    LIMIT 1;

    IF member_check IS NOT NULL THEN
        RAISE NOTICE '✅ TUDO CERTO! O usuário já pertence à organização ID: %', member_check;
        
        -- Opcional: Atualizar Organization ID nos dados antigos se estiver NULL
        UPDATE public.clients SET organization_id = member_check WHERE user_id = legacy_user_id AND organization_id IS NULL;
        UPDATE public.programs SET organization_id = member_check WHERE organization_id IS NULL AND client_id IN (SELECT id FROM clients WHERE user_id = legacy_user_id);
        UPDATE public.cards SET organization_id = member_check WHERE organization_id IS NULL AND client_id IN (SELECT id FROM clients WHERE user_id = legacy_user_id);
        
        RAISE NOTICE '   (Também garanti que clientes antigos tenham esse ID)';
        RETURN;
    END IF;

    -- 3. Se chegou aqui, ele NÃO tem organização. Vamos corrigir.
    RAISE NOTICE '⚠️ Usuário não tem organização. Criando agora...';

    -- Tenta achar uma organização existente com nome parecido ou cria nova
    INSERT INTO public.organizations (name, slug, created_at, updated_at)
    VALUES ('FL360 Travel Official', 'fl360-travel-official', NOW(), NOW())
    ON CONFLICT DO NOTHING; -- Se slug já existir, não faz nada (mas precisamos pegar o ID)
    
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'fl360-travel-official';
    
    -- Se falhou em pegar ID pelo slug (caso conflito de nome mas não slug), tenta criar outra
    IF org_id IS NULL THEN
        INSERT INTO public.organizations (name, slug, created_at, updated_at)
        VALUES ('FL360 Travel Official', 'fl360-travel-official-' || floor(random()*1000)::text, NOW(), NOW())
        RETURNING id INTO org_id;
    END IF;

    -- 4. Vincula o usuário como DONO
    INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
    VALUES (org_id, legacy_user_id, 'owner', NOW());

    -- 5. Atualiza todos os dados órfãos dele para essa nova organização
    UPDATE public.clients SET organization_id = org_id WHERE user_id = legacy_user_id;

    RAISE NOTICE '✅ CORRIGIDO! Organização criada/vinculada: %', org_id;
    RAISE NOTICE '   Agora você pode criar clientes sem problemas.';

END $$;
