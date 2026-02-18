-- =============================================
-- DIAGNÓSTICO PROFUNDO (V2)
-- =============================================
-- Este script vai nos dizer ONDE estão os clientes.
-- Copie e rode no SQL Editor. Verifique a aba Results/Messages.

DO $$
DECLARE
    meu_id UUID;
    meu_email TEXT;
    
    total_absoluto INTEGER;
    meus_clientes INTEGER;
    clientes_sem_dono INTEGER;
    clientes_outros_donos INTEGER;
    
    tem_tabela_tenants BOOLEAN;
    tem_tabela_org_members BOOLEAN;
BEGIN
    -- 1. Seus Dados
    meu_id := auth.uid();
    SELECT email INTO meu_email FROM auth.users WHERE id = meu_id;

    -- 2. Checagem de Estrutura
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') INTO tem_tabela_tenants;
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') INTO tem_tabela_org_members;

    -- 3. Contagem de Clientes
    SELECT count(*) INTO total_absoluto FROM public.clients;
    SELECT count(*) INTO meus_clientes FROM public.clients WHERE user_id = meu_id;
    SELECT count(*) INTO clientes_sem_dono FROM public.clients WHERE user_id IS NULL;
    SELECT count(*) INTO clientes_outros_donos FROM public.clients WHERE user_id IS NOT NULL AND user_id != meu_id;

    -- 4. Exibir Relatório
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'RELATÓRIO DE PROPRIEDADE DE DADOS';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'VOCÊ: % (ID: %)', meu_email, meu_id;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'TOTAL DE CLIENTES NO BANCO: %', total_absoluto;
    RAISE NOTICE ' - Seus: %', meus_clientes;
    RAISE NOTICE ' - Sem Dono (NULL): %', clientes_sem_dono;
    RAISE NOTICE ' - De Outros Usuários: %', clientes_outros_donos;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'ESTRUTURA DO BANCO:';
    RAISE NOTICE ' - Tabela Tenants (SaaS)? %', CASE WHEN tem_tabela_tenants THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE ' - Tabela Org Members? %', CASE WHEN tem_tabela_org_members THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE '==================================================';

    IF clientes_outros_donos > 0 THEN
        RAISE NOTICE 'ALERTA: Existem % clientes vinculados a OUTRO ID. Precisamos "roubá-los" para você.', clientes_outros_donos;
    END IF;

    IF total_absoluto = 0 THEN
        RAISE NOTICE 'PERIGO: O banco de clientes está VAZIO (0 registros).';
    END IF;

END $$;
