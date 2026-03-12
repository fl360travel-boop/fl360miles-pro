
import { supabase } from '../services/supabase';
import { SubscriptionResponse } from '../types/asaas';

// Netlify Functions endpoint
const API_URL = '/api';

export const asaasService = {
    /**
     * Cria uma assinatura anual para o usuário atual
     * @param planId 'starter' | 'pro' | 'enterprise'
     * @param billingType 'PIX' | 'BOLETO' | 'CREDIT_CARD'
     */
    async createSubscription(
        planId: string,
        cycle: 'MONTHLY' | 'YEARLY',
        billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' = 'PIX',
        cpfCnpj: string,
        mobilePhone: string,
        trialDays?: number,
        creditCard?: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string },
        creditCardHolderInfo?: { name: string; email: string; cpfCnpj: string; postalCode: string; addressNumber: string; phone: string; mobilePhone: string }
    ): Promise<SubscriptionResponse> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        // Buscar dados da organização do usuário
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .limit(1)
            .single();

        if (!membership) throw new Error('Organização não encontrada');

        // Buscar nome do usuário
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, email')
            .eq('user_id', session.user.id)
            .single();

        const response = await fetch(`${API_URL}/create-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planId,
                cycle,
                billingType,
                userEmail: session.user.email,
                userName: profile?.display_name || session.user.email,
                cpfCnpj,
                mobilePhone,
                organizationId: membership.organization_id,
                userId: session.user.id,
                ...(trialDays ? { trialDays } : {}),
                ...(creditCard ? { creditCard } : {}),
                ...(creditCardHolderInfo ? { creditCardHolderInfo } : {}),
            }),
        });

        if (!response.ok) {
            let errorText = 'Erro ao criar assinatura';
            try {
                const errorData = await response.json();
                errorText = errorData.error || errorText;
            } catch {
                // If not JSON, use the status text or a default
                errorText = `Erro ${response.status}: ${response.statusText || 'Resposta inválida do servidor'}`;
            }
            throw new Error(errorText);
        }

        try {
            return await response.json();
        } catch {
            throw new Error('O servidor retornou uma resposta inválida (não JSON). Verifique se as dependências do backend estão rodando.');
        }
    },

    async getSubscriptionStatus() {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Master Admin: Get all organizations data
     */
    async getMasterAdminData() {
        // Try RPC first, fallback to direct query
        try {
            const { data, error } = await supabase.rpc('get_master_admin_data');
            if (!error && data) return data;
            console.warn('RPC get_master_admin_data failed:', error?.message);
        } catch (rpcErr) {
            console.warn('RPC get_master_admin_data threw:', rpcErr);
        }

        // Fallback: direct query matching the SQL structure (tenants + subscriptions + organization_members)
        try {
            // 1. Get all tenants with their subscriptions
            const { data: tenants, error: tenErr } = await supabase
                .from('tenants')
                .select('id, company_name');

            if (tenErr) throw tenErr;
            if (!tenants || tenants.length === 0) return [];

            const tenantIds = tenants.map(t => t.id);

            // 2. Get subscriptions for these orgs
            const { data: subs, error: subsErr } = await supabase
                .from('subscriptions')
                .select('id, organization_id, plan_id, status, trial_ends_at, current_period_end, updated_at')
                .in('organization_id', tenantIds);

            if (subsErr) console.warn('Error fetching subscriptions:', subsErr.message);

            // 3. Get organization owners (members with role 'owner')
            const { data: members } = await supabase
                .from('organization_members')
                .select('organization_id, user_id, role')
                .in('organization_id', tenantIds);

            // 4. Get user profiles for owner emails
            const ownerUserIds = (members || [])
                .filter(m => m.role === 'owner')
                .map(m => m.user_id);
            
            let profiles: any[] = [];
            if (ownerUserIds.length > 0) {
                const { data: profData } = await supabase
                    .from('user_profiles')
                    .select('user_id, email, display_name, phone')
                    .in('user_id', ownerUserIds);
                profiles = profData || [];
            }

            // 5. Build results
            return tenants.map(tenant => {
                const sub = (subs || []).find(s => s.organization_id === tenant.id);
                const ownerMember = (members || []).find(m => m.organization_id === tenant.id && m.role === 'owner');
                const ownerProfile = ownerMember 
                    ? profiles.find(p => p.user_id === ownerMember.user_id)
                    : null;

                return {
                    org_id: tenant.id,
                    company_name: tenant.company_name || 'Sem Nome',
                    plan: sub?.plan_id || 'starter',
                    status: sub?.status || 'active',
                    trial_ends_at: sub?.trial_ends_at || null,
                    current_period_end: sub?.current_period_end || null,
                    last_updated: sub?.updated_at || null,
                    owner_email: ownerProfile?.email || 'N/A',
                    owner_phone: ownerProfile?.phone || null
                };
            });
        } catch (fallbackErr) {
            console.error('Fallback query also failed:', fallbackErr);
            throw fallbackErr;
        }
    },

    /**
     * Master Admin: Toggle organization block
     */
    async toggleBlock(orgId: string, shouldBlock: boolean) {
        const { error } = await supabase.rpc('toggle_organization_block', {
            target_org_id: orgId,
            should_block: shouldBlock
        });
        if (error) throw error;
        return true;
    }
};
