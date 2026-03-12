-- =========================================================================
-- SUPABASE SECURITY ADVISOR v2 — CORREÇÃO COMPLETA (10 ERROS)
-- =========================================================================
-- Este script corrige TODOS os problemas detectados pelo Supabase Security Advisor:
--   1. Funções sem SET search_path (mutable search path — CRITICAL)
--   2. Tabelas sem RLS ativado
--   3. Tabelas com RLS mas sem policies
--   4. Políticas excessivamente permissivas (USING true)
-- =========================================================================
-- PODE RODAR QUANTAS VEZES QUISER — É IDEMPOTENTE.
-- =========================================================================

-- =========================================================================
-- PARTE 1: FUNÇÕES COM SEARCH_PATH IMUTÁVEL
-- =========================================================================
-- O Security Advisor marca ERRO quando uma função SECURITY DEFINER
-- não tem "SET search_path TO public". Cada função precisa ser recriada.

-- 1.1 get_user_org_id()
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path TO public;

-- 1.2 is_master_admin()
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND email IN ('fl360travel@gmail.com', 'adriano.moraesnr@gmail.com')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path TO public;

-- 1.3 generate_slug(text)
CREATE OR REPLACE FUNCTION public.generate_slug(name text)
RETURNS text AS $$
DECLARE
    new_slug text;
    safe_name text;
BEGIN
    safe_name := lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
    safe_name := regexp_replace(safe_name, '\s+', '-', 'g');
    new_slug := safe_name || '-' || substring(md5(random()::text) from 1 for 6);
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql
SET search_path TO public;

-- 1.4 handle_new_user_onboarding()
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
BEGIN
    org_name := split_part(NEW.email, '@', 1);
    org_slug := public.generate_slug(org_name);

    INSERT INTO public.user_profiles (user_id, email, role, created_at)
    VALUES (NEW.id, NEW.email, 'owner', NOW())
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.organizations (name, slug, created_at, updated_at)
    VALUES (org_name, org_slug, NOW(), NOW())
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public;

-- 1.5 auto_upgrade_vip_members()
CREATE OR REPLACE FUNCTION public.auto_upgrade_vip_members()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    vip_emails TEXT[] := ARRAY[
        'fl360travel@gmail.com', 
        'demo@fl360travel.com.br', 
        'adriano.moraesnr@gmail.com'
    ];
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;

    IF NEW.role = 'owner' AND user_email = ANY(vip_emails) THEN
        UPDATE public.subscriptions
        SET 
            plan_id = 'elite',
            status = 'active',
            trial_ends_at = '2099-12-31 23:59:59',
            updated_at = NOW()
        WHERE organization_id = NEW.organization_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public;

-- 1.6 handle_new_organization_subscription()
CREATE OR REPLACE FUNCTION public.handle_new_organization_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (
        organization_id, 
        plan_id, 
        status, 
        trial_ends_at, 
        created_at
    )
    VALUES (
        NEW.id, 
        'pro',
        'trial', 
        NOW() + INTERVAL '7 days',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public;

-- 1.7 auto_assign_organization()
CREATE OR REPLACE FUNCTION public.auto_assign_organization()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    IF NEW.organization_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    SELECT organization_id INTO user_org_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF user_org_id IS NOT NULL THEN
        NEW.organization_id := user_org_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public;

-- 1.8 get_dashboard_stats(uuid, text) — já no fix anterior, reforçando
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(org_id uuid, date_filter text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  result json;
  start_date timestamptz;
  end_date timestamptz := now();
BEGIN
  CASE date_filter
    WHEN '7d' THEN start_date := now() - interval '7 days';
    WHEN '15d' THEN start_date := now() - interval '15 days';
    WHEN '30d' THEN start_date := now() - interval '30 days';
    WHEN '60d' THEN start_date := now() - interval '60 days';
    WHEN '90d' THEN start_date := now() - interval '90 days';
    WHEN '12m' THEN start_date := now() - interval '12 months';
    ELSE start_date := now() - interval '30 days';
  END CASE;

  SELECT json_build_object(
    'totalClients', (
      SELECT count(*) FROM clients c 
      WHERE c.organization_id = org_id 
      AND c.created_at >= start_date
    ),
    'activePrograms', (
      SELECT count(DISTINCT p.id) 
      FROM programs p
      JOIN clients c ON p.client_id = c.id
      WHERE c.organization_id = org_id 
      AND p.created_at >= start_date
    ),
    'issuedTickets', (
      SELECT COALESCE(sum(m.quantity), 0)
      FROM movements m
      JOIN programs p ON m.program_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE c.organization_id = org_id
      AND m.type = 'redeem'
      AND m.created_at >= start_date
    ),
    'totalMiles', (
      SELECT COALESCE(sum(balance), 0)
      FROM programs p
      JOIN clients c ON p.client_id = c.id
      WHERE c.organization_id = org_id
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- 1.9 handle_new_user_unified()
CREATE OR REPLACE FUNCTION public.handle_new_user_unified()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO public.user_profiles (user_id, role, display_name)
  VALUES (NEW.id, 'owner', NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name;

  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Organization') || ' Org',
    lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'full_name', 'my-org'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6)
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
  VALUES (new_org_id, 'starter', 'trialing', NOW() + INTERVAL '7 days');

  RETURN NEW;
END;
$function$;

-- 1.10 check_subscription_active(uuid)
CREATE OR REPLACE FUNCTION public.check_subscription_active(org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  v_status text;
  v_trial_ends_at timestamptz;
  v_current_period_end timestamptz;
BEGIN
  SELECT status, trial_ends_at, current_period_end
  INTO v_status, v_trial_ends_at, v_current_period_end
  FROM subscriptions
  WHERE organization_id = org_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_status = 'active' OR v_status = 'lifetime' THEN RETURN TRUE; END IF;
  IF v_status = 'trialing' AND v_trial_ends_at > NOW() THEN RETURN TRUE; END IF;
  IF v_status = 'canceled' AND v_current_period_end > NOW() THEN RETURN TRUE; END IF;

  RETURN FALSE;
END;
$function$;

-- 1.11 add_subscriptions_updated_at()
CREATE OR REPLACE FUNCTION public.add_subscriptions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 1.12 handle_new_user_billing()
CREATE OR REPLACE FUNCTION public.handle_new_user_billing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
BEGIN
  INSERT INTO public.billing_status (user_id, status)
  VALUES (new.id, 'ACTIVE')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$function$;

-- 1.13 handle_new_signup(text, text)
DROP FUNCTION IF EXISTS public.handle_new_signup(text, text);
CREATE OR REPLACE FUNCTION public.handle_new_signup(p_org_name text, p_display_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_slug text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  INSERT INTO public.user_profiles (user_id, display_name, role)
  VALUES (v_user_id, p_display_name, 'owner')
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name, role = 'owner';

  v_slug := lower(regexp_replace(p_org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.organizations (name, slug)
  VALUES (p_org_name, v_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
  VALUES (v_org_id, 'starter', 'trialing', NOW() + INTERVAL '7 days');
END;
$function$;


-- =========================================================================
-- PARTE 2: RLS EM TABELAS FALTANTES
-- =========================================================================

-- 2.1 organizations — precisa RLS + policies
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
        DROP POLICY IF EXISTS "orgs_insert" ON public.organizations;
        DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
        DROP POLICY IF EXISTS "service_role_orgs" ON public.organizations;
        
        -- Usuários podem ver a própria organização
        CREATE POLICY "orgs_select" ON public.organizations FOR SELECT
            USING (id = public.get_user_org_id() OR public.is_master_admin());
        
        -- Service role tem acesso total (necessário para triggers)
        CREATE POLICY "service_role_orgs" ON public.organizations FOR ALL
            USING (auth.role() = 'service_role');
            
        -- Usuários autenticados podem criar (signup)
        CREATE POLICY "orgs_insert" ON public.organizations FOR INSERT
            WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
    END IF;
END $$;

-- 2.2 payment_history — precisa RLS + policies
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_history') THEN
        ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "payment_history_select" ON public.payment_history;
        DROP POLICY IF EXISTS "service_role_payment_history" ON public.payment_history;
        DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
        
        -- Usa EXECUTE para evitar erro de parsing quando coluna não existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'payment_history' AND column_name = 'organization_id'
        ) THEN
            EXECUTE 'CREATE POLICY "payment_history_select" ON public.payment_history FOR SELECT
                USING (
                    organization_id IN (
                        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
                    )
                    OR public.is_master_admin()
                )';
        ELSE
            EXECUTE 'CREATE POLICY "payment_history_select" ON public.payment_history FOR SELECT
                USING (auth.role() = ''authenticated'')';
        END IF;
        
        EXECUTE 'CREATE POLICY "service_role_payment_history" ON public.payment_history FOR ALL
            USING (auth.role() = ''service_role'')';
    END IF;
END $$;

-- 2.3 billing_status — precisa RLS + policies
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_status') THEN
        ALTER TABLE public.billing_status ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "billing_status_select" ON public.billing_status;
        DROP POLICY IF EXISTS "service_role_billing_status" ON public.billing_status;
        
        CREATE POLICY "billing_status_select" ON public.billing_status FOR SELECT
            USING (user_id = auth.uid());
        
        CREATE POLICY "service_role_billing_status" ON public.billing_status FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 2.4 team_members — precisa RLS + policies
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN
        ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
        
        -- Remover política USING (true) se existir
        DROP POLICY IF EXISTS "Allow all operations on team_members" ON public.team_members;
        DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
        DROP POLICY IF EXISTS "service_role_team_members" ON public.team_members;
        
        CREATE POLICY "team_members_select" ON public.team_members FOR SELECT
            USING (auth.role() = 'authenticated');
        
        CREATE POLICY "service_role_team_members" ON public.team_members FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 2.5 subscription_plans — já tem RLS mas precisa garantir
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true); -- Público: necessário para página de preços

DROP POLICY IF EXISTS "Only service role can modify plans" ON public.subscription_plans;
CREATE POLICY "Only service role can modify plans" ON public.subscription_plans
    FOR ALL USING (auth.role() = 'service_role');


-- =========================================================================
-- PARTE 3: REMOVER POLÍTICAS USING (TRUE) PERIGOSAS
-- =========================================================================
-- O Security Advisor marca como ERRO qualquer policy com USING (true) que não
-- seja em tabelas explicitamente públicas. Vamos limpar.

-- 3.1 Remover políticas legadas do supabase-schema.sql original
DROP POLICY IF EXISTS "Allow all operations on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all operations on programs" ON public.programs;
DROP POLICY IF EXISTS "Allow all operations on cards" ON public.cards;
DROP POLICY IF EXISTS "Allow all operations on movements" ON public.movements;
DROP POLICY IF EXISTS "Allow all operations on economy_history" ON public.economy_history;
DROP POLICY IF EXISTS "Allow all operations on team_members" ON public.team_members;


-- =========================================================================
-- PARTE 4: GARANTIR RLS ATIVO EM TODAS TABELAS CORE
-- =========================================================================
-- Redundante mas seguro — garante que nenhuma tabela ficou sem RLS.

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- VERIFICAÇÃO FINAL
-- =========================================================================
-- Lista todas as tabelas public que ainda NÃO têm RLS ativado
-- (deve retornar 0 linhas se tudo estiver correto)

SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;

-- =========================================================================
-- PRONTO! Rode o Security Advisor novamente para confirmar.
-- =========================================================================
