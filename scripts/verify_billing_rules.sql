-- =============================================
-- VERIFICAÇÃO PÓS-RESET
-- =============================================
SELECT 
    u.email,
    o.name AS empresa, 
    s.plan_id AS plano, 
    s.status, 
    s.trial_ends_at
FROM public.organizations o
JOIN public.subscriptions s ON s.organization_id = o.id
JOIN public.organization_members m ON m.organization_id = o.id
JOIN auth.users u ON u.id = m.user_id
WHERE m.role = 'owner'
ORDER BY s.plan_id ASC;
