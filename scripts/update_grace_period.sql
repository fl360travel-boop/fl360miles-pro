-- =============================================
-- ATUALIZAÇÃO: PERÍODO DE GRAÇA (48H) - CORRIGIDO
-- =============================================

CREATE OR REPLACE FUNCTION public.check_subscription_active(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sub_record public.subscriptions%ROWTYPE;
    reference_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Busca a assinatura
    SELECT * INTO sub_record 
    FROM public.subscriptions 
    WHERE organization_id = org_id;

    -- Se não existir, bloqueia
    IF sub_record IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Regra 1: VIPs e Legacy -> LIBERADO
    IF sub_record.plan_id IN ('elite', 'legacy', 'demo') OR sub_record.status = 'lifetime' THEN
        RETURN TRUE;
    END IF;

    -- Regra 2: Trial ou Ativo -> LIBERADO
    IF sub_record.status IN ('trial', 'active') THEN
        IF sub_record.status = 'trial' AND sub_record.trial_ends_at < NOW() THEN
             RETURN FALSE; -- Trial expirado
        END IF;
        RETURN TRUE;
    END IF;

    -- Regra 3: Inadimplente (past_due) com GRAÇA DE 48H
    IF sub_record.status = 'past_due' THEN
        reference_date := COALESCE(sub_record.current_period_end, sub_record.updated_at);
        -- Se passou menos de 48h do vencimento -> LIBERADO
        IF reference_date > (NOW() - INTERVAL '48 hours') THEN
            RETURN TRUE; 
        END IF;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✅ Atualizado: Inadimplente tem 48h de carência antes do bloqueio.';
END $$;
