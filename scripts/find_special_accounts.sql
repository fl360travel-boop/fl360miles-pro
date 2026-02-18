-- =============================================
-- BUSCA DE CONTAS ESPECIAIS
-- =============================================
-- Localiza a conta ME (fl360travel) e a conta DEMO para dar isenção.

SELECT 
    u.email,
    u.id as user_id,
    o.id as organization_id,
    o.name as organization_name
FROM auth.users u
JOIN public.organization_members m ON m.user_id = u.id
JOIN public.organizations o ON o.id = m.organization_id
WHERE u.email LIKE '%fl360travel%' 
   OR u.email LIKE '%demo%'
   OR u.email LIKE '%teste%';
