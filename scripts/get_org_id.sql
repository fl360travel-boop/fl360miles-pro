SELECT o.id 
FROM public.organizations o
JOIN public.organization_members m ON m.organization_id = o.id
JOIN auth.users u ON u.id = m.user_id
WHERE u.email LIKE '%fl360travel%';
