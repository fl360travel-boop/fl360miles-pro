-- =============================================
-- DIAGNÓSTICO DE TABELAS
-- =============================================
-- Vamos descobrir qual o nome correto da tabela de empresas/organizações.

DO $$
DECLARE
    tem_tenants BOOLEAN;
    tem_organizations BOOLEAN;
    fk_constraint TEXT;
BEGIN
    -- 1. Verificar existência das tabelas
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') INTO tem_tenants;
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') INTO tem_organizations;

    -- 2. Tentar descobrir o nome da constraint da tabela clients
    -- (Consulta simplificada para depuração via RAISE NOTICE)
    
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'DIAGNÓSTICO DE TABELAS';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tabela TENANTS existe? %', CASE WHEN tem_tenants THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE 'Tabela ORGANIZATIONS existe? %', CASE WHEN tem_organizations THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE '==================================================';

    IF tem_organizations THEN
        RAISE NOTICE 'CONCLUSÃO: O banco usa a tabela ORGANIZATIONS.';
    ELSIF tem_tenants THEN
        RAISE NOTICE 'CONCLUSÃO: O banco usa a tabela TENANTS.';
    ELSE
        RAISE NOTICE 'ALERTA: Nenhuma das tabelas de organização foi encontrada!';
    END IF;
END $$;
