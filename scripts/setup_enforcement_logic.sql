-- =============================================
-- ENFORCEMENT (BLOQUEIO DE INADIMPLENTES)
-- =============================================
-- Se a assinatura não estiver ativa ou trial válido, BLOQUEIA a escrita.

-- 1. Função de Checagem (Booleana)
CREATE OR REPLACE FUNCTION public.check_subscription_active(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sub_record public.subscriptions%ROWTYPE;
BEGIN
    -- Busca a assinatura
    SELECT * INTO sub_record 
    FROM public.subscriptions 
    WHERE organization_id = org_id;

    -- Se não existir, bloqueia
    IF sub_record IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Regra 1: Se for VIP (Lifetime/Elite/Legacy) -> LIBERADO
    IF sub_record.plan_id IN ('elite', 'legacy', 'demo') OR sub_record.status = 'lifetime' THEN
        RETURN TRUE;
    END IF;

    -- Regra 2: Se for Trial Válido -> LIBERADO
    IF sub_record.status = 'trial' AND sub_record.trial_ends_at > NOW() THEN
        RETURN TRUE;
    END IF;

    -- Regra 3: Se for Active (Pago) -> LIBERADO
    IF sub_record.status = 'active' THEN
        RETURN TRUE;
    END IF;

    -- Qualquer outra coisa (cancelado, past_due, trial vencido) -> BLOQUEADO
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. APLICAÇÃO NAS TABELAS (RLS DE INSERT/UPDATE)
-- Só permite criar/editar se a função acima retornar TRUE.

-- Clientes
DROP POLICY IF EXISTS "Enforce Subscription Insert" ON public.clients;
CREATE POLICY "Enforce Subscription Insert" ON public.clients 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    public.check_subscription_active(organization_id)
);

DROP POLICY IF EXISTS "Enforce Subscription Update" ON public.clients;
CREATE POLICY "Enforce Subscription Update" ON public.clients 
FOR UPDATE USING (
    public.check_subscription_active(organization_id)
);

-- Programas (Milhas)
DROP POLICY IF EXISTS "Enforce Subscription Insert" ON public.programs;
CREATE POLICY "Enforce Subscription Insert" ON public.programs 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    public.check_subscription_active(organization_id)
);

-- Cartões
DROP POLICY IF EXISTS "Enforce Subscription Insert" ON public.cards;
CREATE POLICY "Enforce Subscription Insert" ON public.cards 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    public.check_subscription_active(organization_id)
);

RAISE NOTICE '⛔ Bloqueio de Inadimplência Ativo! (VIPs e Trial Válido continuam operando)';
