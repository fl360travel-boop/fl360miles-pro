-- =============================================
-- AUTOMAÇÃO DE ASSINATURAS (TRIAL 7 DIAS)
-- =============================================
-- Sempre que uma empresa nasce, ela ganha 7 dias grátis no plano 'pro'.

-- 1. Função Trigger (Atualizada para 7 dias)
CREATE OR REPLACE FUNCTION public.handle_new_organization_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Cria assinatura Trial
    INSERT INTO public.subscriptions (
        organization_id, 
        plan_id, 
        status, 
        trial_ends_at, 
        created_at
    )
    VALUES (
        NEW.id, 
        'pro', -- Plano padrão
        'trial', 
        NOW() + INTERVAL '7 days', -- MUDANÇA: Agora são 7 dias
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger (Garante que está ativo)
DROP TRIGGER IF EXISTS on_org_created_create_subscription ON public.organizations;
CREATE TRIGGER on_org_created_create_subscription
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization_subscription();


-- 3. EXPLICANDO O "PRESENTE" (BACKFILL)
-- O trigger acima só funciona para QUEM ENTRAR DEPOIS de hoje.
-- E você? E seus clientes antigos? Eles ficariam sem assinatura e seriam bloqueados.
-- O comando abaixo garante que TODO MUNDO QUE JÁ EXISTE ganhe uma assinatura ATIVA de cortesia.
-- Coloquei 30 dias para você testar com calma. Se quiser menos, mude ali onde diz '30 days'.

INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
SELECT id, 'pro', 'active', NOW() + INTERVAL '30 days' 
FROM public.organizations
WHERE id NOT IN (SELECT organization_id FROM public.subscriptions);

RAISE NOTICE '✅ Automação de Trial (7 dias) instalada e contas antigas liberadas (30 dias).';
