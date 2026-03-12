-- =============================================
-- FIX RLS: REMOVER VISÃO GLOBAL DO MASTER ADMIN NO APP
-- =============================================
-- O Master Admin estava vendo clientes de todos os usuários porque 
-- as políticas de RLS incluíam "OR public.is_master_admin()".
-- Isso é ruim para o dashboard principal porque mistura os dados da agência dele 
-- com as agências dos clientes.
-- Este script remove o override do Master Admin das tabelas operacionais.

-- 1. CLIENTS
DROP POLICY IF EXISTS "clients_org_select" ON public.clients;
CREATE POLICY "clients_org_select" ON public.clients FOR SELECT
    USING (user_id = auth.uid() OR organization_id = public.get_user_org_id());

-- 2. PROGRAMS
DROP POLICY IF EXISTS "programs_org_select" ON public.programs;
CREATE POLICY "programs_org_select" ON public.programs FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- 3. CARDS
DROP POLICY IF EXISTS "cards_org_select" ON public.cards;
CREATE POLICY "cards_org_select" ON public.cards FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- 4. MOVEMENTS
DROP POLICY IF EXISTS "movements_org_select" ON public.movements;
CREATE POLICY "movements_org_select" ON public.movements FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- 5. ECONOMY_HISTORY
DROP POLICY IF EXISTS "economy_org_select" ON public.economy_history;
CREATE POLICY "economy_org_select" ON public.economy_history FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid() OR organization_id = public.get_user_org_id())
    );

-- As tabelas de ADMINISTRAÇÃO do SaaS como organizations, tenants, subscriptions, 
-- user_profiles mantemos com "OR public.is_master_admin()" porque o painel SaaS
-- que você tem em /#/admin precisa ler todas as organizações.

SELECT 'RLS: Visão vazada de clientes corrigida com sucesso!' AS resultado;
