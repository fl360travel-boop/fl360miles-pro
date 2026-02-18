-- =============================================
-- MÓDULO DE ASSINATURAS (SAAS BILLING)
-- =============================================
-- Cria a estrutura para cobrar mensalidade das ORGANIZAÇÕES.

-- 1. Tabela de Planos (Para você gerenciar preços)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY, -- ex: 'starter', 'pro', 'elite'
    name TEXT NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB, -- O que o plano dá direito
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Planos Padrão
INSERT INTO public.subscription_plans (id, name, price_monthly, price_yearly) VALUES
('starter', 'Starter (Solo)', 97.90, 979.00),
('pro', 'Pro (Equipes)', 197.90, 1979.00),
('elite', 'Elite (Franquias)', 497.90, 4979.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Assinaturas (Vinculada à EMPRESA, não ao usuário)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.subscription_plans(id),
    status TEXT DEFAULT 'trial', -- trial, active, past_due, canceled
    
    -- Controle de Datas
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Integração Asaas (Gateway de Pagamento)
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    payment_method TEXT, -- BOLETO, PIX, CREDIT_CARD
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Histórico de Pagamentos (Log de auditoria)
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    amount DECIMAL(10,2),
    status TEXT, -- PAID, FAILED, PENDING
    payment_method TEXT,
    asaas_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Segurança (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Quem pode ver a assinatura? Apenas membros da própria organização.
CREATE POLICY "Members see org subscription" ON public.subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

RAISE NOTICE 'Módulo de Assinaturas (SaaS Billing) Instalado!';
