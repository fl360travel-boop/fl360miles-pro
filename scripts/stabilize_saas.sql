-- =============================================
-- SCRIPT DE ESTABILIZAÇÃO FINAL (SaaS + Segurança)
-- =============================================
-- Este script faz a "regularização" definitiva dos dados.
-- 1. Identifica o dono (fl360travel ou adriano.moraesnr)
-- 2. Cria a Organização (Empresa) se não existir
-- 3. Vincula todos os clientes a essa Organização
-- 4. Reativa a segurança (RLS) para proteger os dados
-- =============================================

DO $$
DECLARE
    target_email TEXT;
    target_user_id UUID;
    target_org_id UUID;
    total_clientes INTEGER;
BEGIN
    -- 1. IDENTIFICAR O USUÁRIO (Prioridade: fl360travel, depois adriano)
    SELECT id, email INTO target_user_id, target_email 
    FROM auth.users 
    WHERE email = 'fl360travel@gmail.com';

    IF target_user_id IS NULL THEN
        SELECT id, email INTO target_user_id, target_email
        FROM auth.users 
        WHERE email = 'adriano.moraesnr@gmail.com';
    END IF;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum dos usuários (fl360travel ou adriano) foi encontrado!';
    END IF;

    RAISE NOTICE 'Usuário Principal Identificado: % (ID: %)', target_email, target_user_id;

    -- 2. GARANTIR ORGANIZAÇÃO (TENANT)
    -- Verifica se tabela tenants existe (SaaS Phase 3+)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
        
        -- Busca organização existente
        SELECT id INTO target_org_id FROM public.tenants WHERE user_id = target_user_id LIMIT 1;

        -- Se não existe, cria
        IF target_org_id IS NULL THEN
            INSERT INTO public.tenants (user_id, company_name, plan, plan_status)
            VALUES (target_user_id, 'FL360 Travel', 'professional', 'active')
            RETURNING id INTO target_org_id;
            
            RAISE NOTICE 'Nova Organização Criada: %', target_org_id;
        ELSE
            RAISE NOTICE 'Organização Existente Encontrada: %', target_org_id;
        END IF;

        -- Garante que o usuário é membro (Se tabela organization_members existir)
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') THEN
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (target_org_id, target_user_id, 'owner')
            ON CONFLICT DO NOTHING;
        END IF;

        -- 3. VINCULAR TUDO À ORGANIZAÇÃO E AO USUÁRIO
        RAISE NOTICE 'Vinculando dados...';
        
        -- Clients
        UPDATE public.clients 
        SET user_id = target_user_id, organization_id = target_org_id 
        WHERE user_id IS NULL OR organization_id IS NULL OR user_id != target_user_id;

        -- Programs
        UPDATE public.programs 
        SET user_id = target_user_id, organization_id = target_org_id 
        WHERE user_id IS NULL OR organization_id IS NULL OR user_id != target_user_id;

        -- Cards
        UPDATE public.cards 
        SET user_id = target_user_id, organization_id = target_org_id 
        WHERE user_id IS NULL OR organization_id IS NULL OR user_id != target_user_id;

        -- Movements
        UPDATE public.movements 
        SET user_id = target_user_id, organization_id = target_org_id 
        WHERE user_id IS NULL OR organization_id IS NULL OR user_id != target_user_id;

        -- Economy History
        UPDATE public.economy_history 
        SET user_id = target_user_id, organization_id = target_org_id 
        WHERE user_id IS NULL OR organization_id IS NULL OR user_id != target_user_id;

    ELSE
        -- Fallback: Se não tem SaaS (Tabela Tenants), apenas garante o user_id
        RAISE NOTICE 'Sistema SaaS não detectado (tabela tenants ausente). Vinculando apenas user_id...';
        
        UPDATE public.clients SET user_id = target_user_id WHERE user_id != target_user_id OR user_id IS NULL;
        UPDATE public.programs SET user_id = target_user_id WHERE user_id != target_user_id OR user_id IS NULL;
        UPDATE public.cards SET user_id = target_user_id WHERE user_id != target_user_id OR user_id IS NULL;
        UPDATE public.movements SET user_id = target_user_id WHERE user_id != target_user_id OR user_id IS NULL;
        UPDATE public.economy_history SET user_id = target_user_id WHERE user_id != target_user_id OR user_id IS NULL;
    END IF;

    GET DIAGNOSTICS total_clientes = ROW_COUNT;
    RAISE NOTICE 'Processo concluído. Dados vinculados ao usuário %.', target_email;

END $$;

-- 4. REATIVAR SEGURANÇA (RLS)
-- Agora que todos têm dono, podemos trancar a porta de novo.
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_history ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'SEGURANÇA REATIVADA COM SUCESSO.';
