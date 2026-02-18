-- =============================================
-- DIAGNÓSTICO PROFUNDO: TABELAS E GATILHOS
-- =============================================
-- Verifica se as colunas são OBRIGATÓRIAS (NOT NULL)
-- e se os gatilhos (triggers) estão ativos.

SELECT 
    table_name, 
    column_name, 
    is_nullable, 
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('clients', 'programs', 'cards') 
AND column_name IN ('id', 'created_at', 'organization_id', 'user_id', 'name', 'email');

-- Verifica se o gatilho 'auto_assign_organization' existe
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_string LIKE '%auto_assign_organization%';
