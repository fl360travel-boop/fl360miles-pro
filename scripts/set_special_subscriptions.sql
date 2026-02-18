-- =============================================
-- REGRAS ESPECIAIS: LIFETIME & DEMO (CORRIGIDO)
-- =============================================

DO $$
BEGIN
    -- 1. CONTA MÃE (fl360travel) -> LIFETIME / ELITE
    -- Atualiza para 'active' com validade até 2099
    UPDATE public.subscriptions
    SET 
        plan_id = 'elite',
        status = 'active',
        trial_ends_at = '2099-12-31 23:59:59',
        updated_at = NOW()
    WHERE organization_id = 'a9ddcb38-ab6e-46ac-8e8b-70cade98f1b3';

    -- Confirma se atualizou (ou insere se não existir)
    INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
    VALUES ('a9ddcb38-ab6e-46ac-8e8b-70cade98f1b3', 'elite', 'active', '2099-12-31 23:59:59')
    ON CONFLICT (organization_id) DO UPDATE 
    SET plan_id = 'elite', status = 'active', trial_ends_at = '2099-12-31 23:59:59';


    -- 2. CONTA DEMO (Busca por nome genérico se não achou e-mail)
    -- Tenta achar qualquer organização que tenha "Demo" no nome e aplica regra Free/Trial Longo
    UPDATE public.subscriptions
    SET 
        plan_id = 'demo',
        status = 'active',
        trial_ends_at = '2030-12-31 23:59:59'
    WHERE organization_id IN (
        SELECT id FROM public.organizations WHERE name ILIKE '%Demo%' OR slug ILIKE '%demo%'
    );

    RAISE NOTICE '✅ Regras Especiais e Sintaxe Corrigidas!';
END $$;
