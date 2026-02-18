
import { supabase } from '../services/supabase';
import { SubscriptionResponse } from '../types/asaas';

// URL da sua Edge Function (em produção)
// Em desenvolvimento, você pode mockar ou usar tunnel
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

export const asaasService = {
    /**
     * Cria uma assinatura para o usuário atual
     * @param planId 'starter' | 'pro' | 'enterprise'
     * @param cycle 'MONTHLY' | 'YEARLY'
     * @param billingType 'PIX' | 'BOLETO' | 'CREDIT_CARD'
     */
    async createSubscription(planId: string, cycle: 'MONTHLY' | 'YEARLY', billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'): Promise<SubscriptionResponse> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        const response = await fetch(`${EDGE_FUNCTION_URL}/create-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ planId, cycle, billingType }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar assinatura');
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
