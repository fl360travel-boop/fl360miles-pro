-- =============================================
-- DIAGNÓSTICO FINAL: TABELAS FILHAS
-- =============================================
-- Verifica TODAS as colunas que são NOT NULL nas tabelas filhas.

SELECT 
    table_name, 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('programs', 'cards', 'movements') 
AND is_nullable = 'NO'
ORDER BY table_name, column_name;
