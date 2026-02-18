-- =========================================================
-- SUPER FIX: RESTAURAÇÃO COMPLETA DE ACESSO
-- =========================================================
-- Este script resolve DOIS problemas possíveis:
-- 1. Falta de vínculo com o USUÁRIO (user_id)
-- 2. Falta de vínculo com a ORGANIZAÇÃO (organization_id)
--    (necessário se você rodou as atualizações de Multi-tenant/SaaS)
-- =========================================================

DO $$
DECLARE
    advisor_email TEXT := 'fl360travel@gmail.com';
    advisor_id UUID;
    meu_org_id UUID;
BEGIN
    -- 1. Identificar o ID do Advisor
    SELECT id INTO advisor_id FROM auth.users WHERE email = advisor_email;

    IF advisor_id IS NULL THEN
        RAISE EXCEPTION 'ERRO: Usuário % não encontrado no Supabase Auth.', advisor_email;
    END IF;

    RAISE NOTICE 'Usuário encontrado: % (ID: %)', advisor_email, advisor_id;

    -- 2. GARANTIR que os clientes pertençam ao Advisor (Fix Básico)
    UPDATE public.clients SET user_id = advisor_id WHERE user_id IS NULL;
    
    -- Atualizar tabelas filhas baseando-se no cliente
    UPDATE public.programs p SET user_id = advisor_id 
    FROM public.clients c WHERE p.client_id = c.id AND c.user_id = advisor_id AND (p.user_id IS NULL OR p.user_id != advisor_id);
    
    UPDATE public.cards cd SET user_id = advisor_id 
    FROM public.clients c WHERE cd.client_id = c.id AND c.user_id = advisor_id AND (cd.user_id IS NULL OR cd.user_id != advisor_id);
    
    UPDATE public.movements m SET user_id = advisor_id 
    FROM public.clients c WHERE m.client_id = c.id AND c.user_id = advisor_id AND (m.user_id IS NULL OR m.user_id != advisor_id);

    UPDATE public.economy_history eh SET user_id = advisor_id 
    FROM public.clients c WHERE eh.client_id = c.id AND c.user_id = advisor_id AND (eh.user_id IS NULL OR eh.user_id != advisor_id);

    RAISE NOTICE 'Passo 1 (Vínculo de Usuário) concluído.';

    -- 3. VERIFICAR SE O SISTEMA DE ORGANIZAÇÕES ESTÁ ATIVO (SaaS)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
        RAISE NOTICE 'Sistema de Organizações detectado. Iniciando correção de Tenant...';

        -- Tentar achar a organização do Advisor
        SELECT id INTO meu_org_id FROM public.tenants WHERE user_id = advisor_id LIMIT 1;

        -- Se não tiver organização, cria uma agora
        IF meu_org_id IS NULL THEN
            INSERT INTO public.tenants (user_id, company_name, plan, plan_status)
            VALUES (advisor_id, 'FL360 Travel', 'professional', 'active')
            RETURNING id INTO meu_org_id;
            
            -- Adiciona o Advisor como membro dono da organização
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (meu_org_id, advisor_id, 'owner')
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Organização criada automaticamente: %', meu_org_id;
        ELSE
            RAISE NOTICE 'Organização existente encontrada: %', meu_org_id;
        END IF;

        -- 4. VINCULAR TUDO À ORGANIZAÇÃO
        -- (Isso é CRÍTICO se RLS estiver checando organization_id)
        
        UPDATE public.clients 
        SET organization_id = meu_org_id 
        WHERE organization_id IS NULL AND user_id = advisor_id;

        UPDATE public.programs 
        SET organization_id = meu_org_id 
        WHERE organization_id IS NULL AND user_id = advisor_id;

        UPDATE public.cards 
        SET organization_id = meu_org_id 
        WHERE organization_id IS NULL AND user_id = advisor_id;

        UPDATE public.movements 
        SET organization_id = meu_org_id 
        WHERE organization_id IS NULL AND user_id = advisor_id;

        UPDATE public.economy_history 
        SET organization_id = meu_org_id 
        WHERE organization_id IS NULL AND user_id = advisor_id;

        RAISE NOTICE 'Passo 2 (Vínculo de Organização) concluído com sucesso!';
    ELSE
        RAISE NOTICE 'Sistema de Organizações NÃO detectado. Apenas o vínculo de usuário foi necessário.';
    END IF;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'CORREÇÃO TOTAL FINALIZADA. PODE TESTAR O SISTEMA.';
    RAISE NOTICE '==================================================';

END $$;
