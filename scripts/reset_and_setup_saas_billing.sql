-- =============================================
-- MASTER RESET: FATURAMENTO SAAS (V3 - FINAL)
-- =============================================
-- REGRAS DE NEGÓCIO:
-- 1. Clientes Antigos (Já existem) -> Grátis para Sempre (Legacy Free)
-- 2. Clientes Novos (SaaS) -> Trial 7 Dias -> Paga Mensal

DO $$
BEGIN
    -- 1. LIMPEZA (Apaga versão antiga)
    DROP TABLE IF EXISTS public.subscriptions CASCADE;
    DROP TABLE IF EXISTS public.subscription_plans CASCADE;

    -- 2. CRIA PLANOS
    CREATE TABLE public.subscription_plans (
        id TEXT PRIMARY KEY, 
        name TEXT NOT NULL, 
        price NUMERIC(10,2) NOT NULL
    );
    INSERT INTO public.subscription_plans VALUES 
    ('starter', 'Iniciante', 97), 
    ('pro', 'Pro', 197), 
    ('elite', 'Elite', 497), 
    ('demo', 'Demo', 0),
    ('legacy', 'Legado (Gratuito)', 0); -- Novo plano para os antigos

    -- 3. CRIA TABELA SAAS
    CREATE TABLE public.subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES public.organizations(id) NOT NULL UNIQUE,
        plan_id TEXT REFERENCES public.subscription_plans(id) DEFAULT 'pro',
        status TEXT NOT NULL DEFAULT 'trial',
        trial_ends_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. AUTOMAÇÃO PARA NOVOS (Trial 7 Dias)
    CREATE OR REPLACE FUNCTION public.handle_new_organization_subscription() RETURNS TRIGGER AS $f$
    BEGIN
        INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
        VALUES (NEW.id, 'pro', 'trial', NOW() + INTERVAL '7 days');
        RETURN NEW;
    END; $f$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_org_created_sub ON public.organizations;
    CREATE TRIGGER on_org_created_sub AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_subscription();

    -- 5. REGRA DE OURO: CLIENTES ANTIGOS = FREE PARA SEMPRE
    -- Insere assinatura 'Legacy' válida até 2099 para todos que JÁ estão no banco
    INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
    SELECT id, 'legacy', 'active', '2099-12-31 23:59:59'
    FROM public.organizations;
    
    RAISE NOTICE '✅ SISTEMA CONFIGURADO!';
    RAISE NOTICE '   - Antigos: Plano Legacy (Grátis até 2099)';
    RAISE NOTICE '   - Novos: Plano Pro (SaaS) com 7 dias grátis';
END $$;
