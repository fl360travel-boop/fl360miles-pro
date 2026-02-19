
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
    async createSubscription(planId: string, billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' = 'PIX'): Promise<SubscriptionResponse> {
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
                billingType,
                userEmail: session.user.email,
                userName: profile?.display_name || session.user.email,
                organizationId: membership.organization_id,
                userId: session.user.id,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao criar assinatura');
        }

        return await response.json();
    },

    /**
     * Busca o status da assinatura atual do banco local
     */
    async getSubscriptionStatus() {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .single();

        if (error) return null;
        return data;
    }
};
