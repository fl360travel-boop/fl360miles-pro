-- =============================================
-- FL360 MILES: ISOLAMENTO MULTI-TENANT DEFINITIVO
-- =============================================
-- Este script garante que cada organização só vê SEUS dados.
-- É IDEMPOTENTE — pode rodar quantas vezes quiser sem erro.
-- =============================================

-- HELPER FUNCTION: Retorna o organization_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- HELPER FUNCTION: Verifica se o usuário é admin master
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND email IN ('fl360travel@gmail.com', 'adriano.moraesnr@gmail.com')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 1. CLIENTS
-- =============================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
DROP POLICY IF EXISTS "tenant_clients_select" ON public.clients;
DROP POLICY IF EXISTS "tenant_clients_insert" ON public.clients;
DROP POLICY IF EXISTS "tenant_clients_update" ON public.clients;
DROP POLICY IF EXISTS "tenant_clients_delete" ON public.clients;
DROP POLICY IF EXISTS "org_clients_policy" ON public.clients;
DROP POLICY IF EXISTS "Insert Clients Policy" ON public.clients;
DROP POLICY IF EXISTS "Enforce Subscription Insert" ON public.clients;
DROP POLICY IF EXISTS "Enforce Subscription Update" ON public.clients;

-- Users see only their org's clients (or all if master admin)
CREATE POLICY "clients_org_select" ON public.clients FOR SELECT
    USING (user_id = auth.uid() OR organization_id = public.get_user_org_id() OR public.is_master_admin());

CREATE POLICY "clients_org_insert" ON public.clients FOR INSERT
    WITH CHECK (user_id = auth.uid() OR organization_id = public.get_user_org_id());

CREATE POLICY "clients_org_update" ON public.clients FOR UPDATE
    USING (user_id = auth.uid() OR organization_id = public.get_user_org_id());

CREATE POLICY "clients_org_delete" ON public.clients FOR DELETE
    USING (user_id = auth.uid() OR organization_id = public.get_user_org_id());

-- =============================================
-- 2. PROGRAMS
-- =============================================
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_select" ON public.programs;
DROP POLICY IF EXISTS "programs_insert" ON public.programs;
DROP POLICY IF EXISTS "programs_update" ON public.programs;
DROP POLICY IF EXISTS "programs_delete" ON public.programs;
DROP POLICY IF EXISTS "tenant_programs_select" ON public.programs;
DROP POLICY IF EXISTS "tenant_programs_insert" ON public.programs;
DROP POLICY IF EXISTS "tenant_programs_update" ON public.programs;
DROP POLICY IF EXISTS "tenant_programs_delete" ON public.programs;

CREATE POLICY "programs_org_select" ON public.programs FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
        OR public.is_master_admin()
    );

CREATE POLICY "programs_org_insert" ON public.programs FOR INSERT
    WITH CHECK (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

CREATE POLICY "programs_org_update" ON public.programs FOR UPDATE
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

CREATE POLICY "programs_org_delete" ON public.programs FOR DELETE
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- =============================================
-- 3. CARDS
-- =============================================
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cards_select" ON public.cards;
DROP POLICY IF EXISTS "cards_insert" ON public.cards;
DROP POLICY IF EXISTS "cards_update" ON public.cards;
DROP POLICY IF EXISTS "cards_delete" ON public.cards;
DROP POLICY IF EXISTS "tenant_cards_select" ON public.cards;
DROP POLICY IF EXISTS "tenant_cards_insert" ON public.cards;
DROP POLICY IF EXISTS "tenant_cards_update" ON public.cards;
DROP POLICY IF EXISTS "tenant_cards_delete" ON public.cards;

CREATE POLICY "cards_org_select" ON public.cards FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
        OR public.is_master_admin()
    );

CREATE POLICY "cards_org_insert" ON public.cards FOR INSERT
    WITH CHECK (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

CREATE POLICY "cards_org_update" ON public.cards FOR UPDATE
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

CREATE POLICY "cards_org_delete" ON public.cards FOR DELETE
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- =============================================
-- 4. MOVEMENTS
-- =============================================
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movements_select" ON public.movements;
DROP POLICY IF EXISTS "movements_insert" ON public.movements;
DROP POLICY IF EXISTS "movements_update" ON public.movements;
DROP POLICY IF EXISTS "movements_delete" ON public.movements;
DROP POLICY IF EXISTS "tenant_movements_select" ON public.movements;
DROP POLICY IF EXISTS "tenant_movements_insert" ON public.movements;
DROP POLICY IF EXISTS "tenant_movements_update" ON public.movements;
DROP POLICY IF EXISTS "tenant_movements_delete" ON public.movements;

CREATE POLICY "movements_org_select" ON public.movements FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
        OR public.is_master_admin()
    );

CREATE POLICY "movements_org_insert" ON public.movements FOR INSERT
    WITH CHECK (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

CREATE POLICY "movements_org_update" ON public.movements FOR UPDATE
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

CREATE POLICY "movements_org_delete" ON public.movements FOR DELETE
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- =============================================
-- 5. ECONOMY_HISTORY
-- =============================================
ALTER TABLE public.economy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_history FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "economy_history_select" ON public.economy_history;
DROP POLICY IF EXISTS "economy_history_insert" ON public.economy_history;
DROP POLICY IF EXISTS "economy_history_update" ON public.economy_history;
DROP POLICY IF EXISTS "economy_history_delete" ON public.economy_history;

CREATE POLICY "economy_org_select" ON public.economy_history FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
        OR public.is_master_admin()
    );

CREATE POLICY "economy_org_insert" ON public.economy_history FOR INSERT
    WITH CHECK (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

CREATE POLICY "economy_org_update" ON public.economy_history FOR UPDATE
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- =============================================
-- 6. ALERTS
-- =============================================
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts' AND table_schema = 'public') THEN
        ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.alerts FORCE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "alerts_org_select" ON public.alerts;
        DROP POLICY IF EXISTS "alerts_org_insert" ON public.alerts;
        DROP POLICY IF EXISTS "alerts_org_update" ON public.alerts;
        DROP POLICY IF EXISTS "alerts_org_delete" ON public.alerts;
        
        CREATE POLICY "alerts_org_select" ON public.alerts FOR SELECT
            USING (organization_id = public.get_user_org_id() OR public.is_master_admin());
        CREATE POLICY "alerts_org_insert" ON public.alerts FOR INSERT
            WITH CHECK (organization_id = public.get_user_org_id());
        CREATE POLICY "alerts_org_update" ON public.alerts FOR UPDATE
            USING (organization_id = public.get_user_org_id());
        CREATE POLICY "alerts_org_delete" ON public.alerts FOR DELETE
            USING (organization_id = public.get_user_org_id());
    END IF;
END $$;

-- =============================================
-- 7. USER_PROFILES (users see their own)
-- =============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.user_profiles;

CREATE POLICY "profiles_own_select" ON public.user_profiles FOR SELECT
    USING (user_id = auth.uid() OR public.is_master_admin() 
           OR user_id IN (SELECT om.user_id FROM organization_members om WHERE om.organization_id = public.get_user_org_id()));

CREATE POLICY "profiles_own_update" ON public.user_profiles FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "profiles_own_insert" ON public.user_profiles FOR INSERT
    WITH CHECK (user_id = auth.uid() OR public.is_master_admin());

-- =============================================
-- 8. ORGANIZATION_MEMBERS
-- =============================================
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own" ON public.organization_members;
DROP POLICY IF EXISTS "members_select" ON public.organization_members;
DROP POLICY IF EXISTS "members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "members_delete" ON public.organization_members;

CREATE POLICY "members_org_select" ON public.organization_members FOR SELECT
    USING (organization_id = public.get_user_org_id() OR user_id = auth.uid() OR public.is_master_admin());

CREATE POLICY "members_org_insert" ON public.organization_members FOR INSERT
    WITH CHECK (organization_id = public.get_user_org_id() OR public.is_master_admin());

CREATE POLICY "members_org_delete" ON public.organization_members FOR DELETE
    USING (organization_id = public.get_user_org_id() OR public.is_master_admin());

-- =============================================
-- 9. TENANTS (for white label)
-- =============================================
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
        ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
        DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
        
        -- Anyone can read tenants (needed for subdomain lookup on login page)
        CREATE POLICY "tenants_public_select" ON public.tenants FOR SELECT
            USING (true);
        
        -- Only org members can update their own tenant
        CREATE POLICY "tenants_org_update" ON public.tenants FOR UPDATE
            USING (id = public.get_user_org_id() OR public.is_master_admin());
    END IF;
END $$;

-- =============================================
-- 10. SUBSCRIPTIONS
-- =============================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Members see org subscription" ON public.subscriptions;

CREATE POLICY "subs_org_select" ON public.subscriptions FOR SELECT
    USING (organization_id = public.get_user_org_id() OR public.is_master_admin());

-- =============================================
-- DONE!
-- =============================================
SELECT 'RLS MULTI-TENANT CONFIGURADO COM SUCESSO!' AS resultado;
