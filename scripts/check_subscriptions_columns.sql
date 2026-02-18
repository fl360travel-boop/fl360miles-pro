-- =============================================
-- DIAGNÓSTICO: COLUNAS DA TABELA SUBSCRIPTIONS
-- =============================================
-- O erro diz que 'organization_id' não existe. Vamos ver o que existe.

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';
