-- =============================================
-- CREATE ALERTS TABLE (Multi-tenant)
-- =============================================

-- 1. Create the alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    program VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    expiration_date DATE NOT NULL,
    observation TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON public.alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON public.alerts(client_id);

-- 3. Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Organization-based)
DROP POLICY IF EXISTS "org_alerts_policy" ON public.alerts;

CREATE POLICY "org_alerts_policy" ON public.alerts
    FOR ALL USING (
        organization_id IN (SELECT get_user_orgs())
    )
    WITH CHECK (
        organization_id IN (SELECT get_user_orgs())
    );

-- 5. Link to auto-assign trigger (from trigger_auto_link_org.sql)
DROP TRIGGER IF EXISTS on_alert_created_link_org ON public.alerts;
CREATE TRIGGER on_alert_created_link_org
    BEFORE INSERT ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_organization();

-- 6. Updated_at Trigger
DROP TRIGGER IF EXISTS update_alerts_updated_at ON public.alerts;
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Validation Message
DO $$
BEGIN
    RAISE NOTICE 'Tabela public.alerts criada com sucesso e isolamento por organização ativado!';
END $$;
