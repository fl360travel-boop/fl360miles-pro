-- =============================================
-- INSPECAO DE SEGURANCA (RLS)
-- =============================================
-- Vamos ver EXATAMENTE quais regras de segurança estão ativas na tabela Clients.

SELECT 
    policyname,
    cmd as operation,
    qual as condition_using,
    with_check as condition_check
FROM pg_policies 
WHERE tablename = 'clients';
