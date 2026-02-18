-- =============================================
-- VERIFICACAO DE CONTA LEGADA (FL360TRAVEL)
-- =============================================
-- O trigger novo 'auto_assign_organization' depende de 'organization_members'.
-- Precisamos garantir que a conta OFICIAL (fl360travel@gmail.com) tem esse vinculo.

SELECT 
    u.email,
    o.name as organization_name,
    m.role
FROM auth.users u
LEFT JOIN public.organization_members m ON m.user_id = u.id
LEFT JOIN public.organizations o ON o.id = m.organization_id
WHERE u.email = 'fl360travel@gmail.com';
