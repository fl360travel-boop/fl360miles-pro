
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Limites por plano
const PLAN_LIMITS: Record<string, number> = {
    starter: 50,
    pro: Infinity,
    elite: Infinity,
    enterprise: Infinity,
    demo: 5,
    legacy: Infinity,
};

export function useSubscription() {
    const { subscription, userRole } = useAuth();
    const [currentClients, setCurrentClients] = useState(0);

    // Buscar contagem de clientes
    useEffect(() => {
        const fetchClientCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('clients')
                    .select('*', { count: 'exact', head: true });

                if (!error && count !== null) {
                    setCurrentClients(count);
                }
            } catch {
                console.warn('Erro ao contar clientes');
            }
        };

        fetchClientCount();
    }, []);

    // Helper: verificar se data já passou
    const isPast = (dateStr: string | null) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    // Helper: horas desde uma data
    const hoursSince = (dateStr: string | null): number => {
        if (!dateStr) return 9999;
        return (Date.now() - new Date(dateStr).getTime()) / (1000 * 3600);
    };

    // Status computados
    const isTrialing = subscription?.status === 'trial' && !isPast(subscription.trialEndsAt);
    const isTrialExpired = subscription?.status === 'trial' && isPast(subscription.trialEndsAt);
    const isActive = subscription?.status === 'active' || subscription?.status === 'lifetime' || subscription?.status === 'legacy';

    const referenceDate = subscription?.currentPeriodEnd || subscription?.updatedAt || null;
    const isGracePeriodOver = subscription?.status === 'past_due' && hoursSince(referenceDate) > 48;
    const isCanceled = subscription?.status === 'canceled';

    // BLOQUEADO = trial expirou OU cancelado OU past_due > 48h
    const isBlocked = isTrialExpired || isCanceled || isGracePeriodOver;

    // Demo e owner sem subscription não são bloqueados
    const shouldBlock = isBlocked && userRole !== 'demo';

    // Dias restantes do trial
    const daysLeft = isTrialing && subscription?.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 3600 * 24)))
        : 0;

    // Limites de clientes
    const planId = subscription?.planId || 'starter';
    const clientLimit = PLAN_LIMITS[planId] ?? 50;
    const canAddClient = currentClients < clientLimit;
    const clientsRemaining = Math.max(0, clientLimit === Infinity ? Infinity : clientLimit - currentClients);

    return {
        // Status
        isBlocked: shouldBlock,
        isTrialing,
        isTrialExpired,
        isActive,
        isCanceled,
        isGracePeriodOver,

        // Trial
        daysLeft,

        // Limites
        canAddClient,
        clientLimit,
        currentClients,
        clientsRemaining,

        // Plano
        planId,
        subscription,
    };
}
