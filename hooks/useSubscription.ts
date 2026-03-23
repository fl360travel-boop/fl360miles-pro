
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useBillingStatus } from './useBillingStatus';

// Limites por plano
const PLAN_LIMITS: Record<string, number> = {
    starter: 20,
    pro: 100,
    enterprise: Infinity, // White Label
    elite: Infinity,      // Legacy mapping if any
    demo: 5,
    legacy: Infinity,
};

export function useSubscription() {
    const { user, subscription, userRole } = useAuth();
    const {
        status: billingStatus,
        remainingDays: billingDays,
        isBypassed: isOwnerBypass,
        loading: billingLoading
    } = useBillingStatus();

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

    // Status computados (Delegados para useBillingStatus)
    const isTrialing = billingStatus === 'TRIAL';
    const isTrialExpired = billingStatus === 'BLOCKED' && !subscription?.lastPaidAt;
    const isActive = billingStatus === 'ACTIVE' || billingStatus === 'DUE_SOON' || billingStatus === 'DUE_TODAY' || billingStatus === 'OVERDUE_WARNING' || isOwnerBypass;

    const isCanceled = subscription?.status === 'canceled' && !isOwnerBypass;
    const isGracePeriodOver = billingStatus === 'BLOCKED' && subscription?.status === 'past_due';

    // BLOQUEADO = Status é BLOCKED no billing (que engloba trial expirado e past_due > 3 dias)
    const isBlocked = billingStatus === 'BLOCKED' && !isOwnerBypass;

    // Demo e owner sem subscription não são bloqueados
    const shouldBlock = isBlocked && userRole !== 'demo';

    // Dias restantes do trial
    const daysLeft = isTrialing ? billingDays : 0;

    // Limites de clientes
    const planId = isOwnerBypass ? 'enterprise' : (subscription?.planId || 'starter');
    const clientLimit = PLAN_LIMITS[planId] ?? 50;
    const canAddClient = isOwnerBypass || (currentClients < clientLimit);
    const clientsRemaining = isOwnerBypass ? Infinity : Math.max(0, clientLimit === Infinity ? Infinity : clientLimit - currentClients);

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
        loading: billingLoading
    };
}
