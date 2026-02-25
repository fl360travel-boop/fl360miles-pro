-- =========================================================================
-- SUPABASE SECURITY ADVISOR FIXES
-- 1. Enable RLS on critical tables
-- 2. Restrict overly permissive policies (remove USING true for public access)
-- 3. Set search_path = public on all functions (Immutable Search Path)
-- =========================================================================

-- -------------------------------------------------------------------------
-- PART 1: Enable RLS & strict policies for core tables
-- -------------------------------------------------------------------------

-- 1.1 subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their organization subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role has full access to subscriptions" ON public.subscriptions;
CREATE POLICY "Service role has full access to subscriptions"
    ON public.subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');


-- 1.2 subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans"
    ON public.subscription_plans
    FOR SELECT
    USING (true); -- Publicly readable so signup/pricing page works

DROP POLICY IF EXISTS "Only service role can modify plans" ON public.subscription_plans;
CREATE POLICY "Only service role can modify plans"
    ON public.subscription_plans
    FOR ALL
    USING (auth.role() = 'service_role');


-- 1.3 organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members
    FOR SELECT
    USING (
        organization_id IN (
            -- Subquery para pegar as orgs que o usuário pertence, sem recursão infinita
            SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role has full access to organization_members" ON public.organization_members;
CREATE POLICY "Service role has full access to organization_members"
    ON public.organization_members
    FOR ALL
    USING (auth.role() = 'service_role');


-- -------------------------------------------------------------------------
-- PART 2: Fix Overly Permissive Policies (USING true)
-- -------------------------------------------------------------------------

-- 2.1 payment_events
DROP POLICY IF EXISTS "Service role full access on payment_events" ON public.payment_events;
CREATE POLICY "Service role full access on payment_events"
    ON public.payment_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- 2.2 audit_events
-- Keep the user select policy, restrict the ALL policy to service_role
DROP POLICY IF EXISTS "Service role full access on audit_events" ON public.audit_events;
CREATE POLICY "Service role full access on audit_events"
    ON public.audit_events
    FOR ALL
    USING (auth.role() = 'service_role');



-- 2.4 user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (user_id = auth.uid());
    
DROP POLICY IF EXISTS "Service role has full access to user_profiles" ON public.user_profiles;
CREATE POLICY "Service role has full access to user_profiles"
    ON public.user_profiles
    FOR ALL
    USING (auth.role() = 'service_role');


-- -------------------------------------------------------------------------
-- PART 3: Fix Function Search Path Mutable (Add SET search_path = public)
-- -------------------------------------------------------------------------

-- For each function, we redefine it safely adding the SET search_path.
-- We must match the exact signature.

-- 1. get_dashboard_stats(uuid, text)
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
  -- Definir o intervalo de datas baseado no filtro
  CASE date_filter
    WHEN '7d' THEN start_date := now() - interval '7 days';
    WHEN '15d' THEN start_date := now() - interval '15 days';
    WHEN '30d' THEN start_date := now() - interval '30 days';
    WHEN '60d' THEN start_date := now() - interval '60 days';
    WHEN '90d' THEN start_date := now() - interval '90 days';
    WHEN '12m' THEN start_date := now() - interval '12 months';
    ELSE start_date := now() - interval '30 days'; -- Default
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

-- 2. handle_new_user_unified()
CREATE OR REPLACE FUNCTION public.handle_new_user_unified()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  new_org_id uuid;
BEGIN
  -- Insert into user_profiles
  INSERT INTO public.user_profiles (user_id, role, display_name)
  VALUES (NEW.id, 'owner', NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name;

  -- Create default organization if logic requires it via standard auth flow
  -- (Assuming fallback org creation here for normal signups not going through RPC)
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Organization') || ' Org',
    lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'full_name', 'my-org'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6)
  )
  RETURNING id INTO new_org_id;

  -- Create membership
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- Create subscription trial
  INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
  VALUES (new_org_id, 'starter', 'trialing', NOW() + INTERVAL '7 days');

  RETURN NEW;
END;
$function$;


-- 3. check_subscription_active(uuid)
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

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_status = 'active' OR v_status = 'lifetime' THEN
    RETURN TRUE;
  END IF;

  IF v_status = 'trialing' AND v_trial_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;

  IF v_status = 'canceled' AND v_current_period_end > NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$;


-- 4. add_subscriptions_updated_at()
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


-- 5. handle_new_user_billing()
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


-- 6. handle_new_signup(text, text)
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
  -- Pegar o ID do usuário que chamou a função (autenticado)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  -- 1. Atualizar ou inserir Profile com o nome fornecido
  INSERT INTO public.user_profiles (user_id, display_name, role)
  VALUES (v_user_id, p_display_name, 'owner')
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name, role = 'owner';

  -- 2. Gerar slug único para a organização
  v_slug := lower(regexp_replace(p_org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

  -- 3. Criar a Organização
  INSERT INTO public.organizations (name, slug)
  VALUES (p_org_name, v_slug)
  RETURNING id INTO v_org_id;

  -- 4. Vincular usuário como Owner da Organização
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  -- 5. Criar Assinatura Trial (7 dias) vinculada à Organização
  INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
  VALUES (v_org_id, 'starter', 'trialing', NOW() + INTERVAL '7 days');

END;
$function$;
