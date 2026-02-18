-- =============================================
-- VERIFICACAO DE AMBIENTE: FATURAMENTO
-- =============================================
-- Verifica se a tabela de assinaturas já existe.

SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'subscriptions';

-- Se existir, mostra as colunas para garantir que está atualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';
