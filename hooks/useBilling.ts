
import { useState, useEffect } from 'react';
import { asaasService } from '../services/asaas';
import { useAuth } from '../contexts/AuthContext';

export function useBilling() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [subscription, setSubscription] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Carregar status ao iniciar
    useEffect(() => {
        if (user) {
            loadStatus();
        }
    }, [user]);

    const loadStatus = async () => {
        try {
            const sub = await asaasService.getSubscriptionStatus();
            setSubscription(sub);
        } catch (err) {
            console.error('Erro ao carregar assinatura:', err);
        }
    };

    const subscribe = async (planId: string, cycle: 'MONTHLY' | 'YEARLY', method: 'PIX' | 'BOLETO' | 'CREDIT_CARD') => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await asaasService.createSubscription(planId, method);
            // Recarregar status após criação
            await loadStatus();
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        subscription,
        isLoading,
        error,
        subscribe,
        refresh: loadStatus
    };
}
