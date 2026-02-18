import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const SubscriptionBanner: React.FC = () => {
    const { subscription, isOwner } = useAuth();

    if (!isOwner || !subscription) return null;

    // Helper: Check if date is in the past
    const isPast = (dateStr: string | null) => dateStr && new Date(dateStr) < new Date();

    // Helper: Calculate hours since a date
    const hoursSince = (dateStr: string | null) => {
        if (!dateStr) return 9999; // Assume long time if no date
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        return diff / (1000 * 3600);
    };

    // 1. BLOCKED STATE (Red)
    // - Canceled
    // - Trial Expired
    // - Past Due > 48 Hours
    const referenceDate = subscription.currentPeriodEnd || subscription.updatedAt;
    const isGracePeriodOver = subscription.status === 'past_due' && hoursSince(referenceDate) > 48;
    const isTrialExpired = subscription.status === 'trial' && isPast(subscription.trialEndsAt);

    if (subscription.status === 'canceled' || isTrialExpired || isGracePeriodOver) {
        return (
            <div className="bg-red-600 text-white px-4 py-3 shadow-lg z-50 relative animate-in slide-in-from-top duration-300">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl">block</span>
                        <div>
                            <p className="font-bold">Acesso Bloqueado</p>
                            <p className="text-sm opacity-90">
                                {subscription.status === 'trial' ? 'Seu período de teste expirou.' : 'Sua assinatura está vencida há mais de 48h.'}
                                {' '}Atualize seu plano para continuar.
                            </p>
                        </div>
                    </div>
                    <Link to="/plans" className="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-red-50 transition-colors">
                        Regularizar Agora
                    </Link>
                </div>
            </div>
        );
    }

    // 2. GRACE PERIOD WARNING (Orange)
    // - Past Due but < 48 Hours
    if (subscription.status === 'past_due') {
        const hoursLeft = 48 - Math.floor(hoursSince(referenceDate));
        return (
            <div className="bg-orange-500 text-white px-4 py-3 shadow-lg z-50 relative animate-in slide-in-from-top duration-300">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl">warning</span>
                        <div>
                            <p className="font-bold">Pagamento Pendente</p>
                            <p className="text-sm opacity-90">
                                Seu acesso será bloqueado em <b>{hoursLeft > 0 ? hoursLeft : 0} horas</b>. Regularize para evitar interrupções.
                            </p>
                        </div>
                    </div>
                    <Link to="/plans" className="bg-white text-orange-600 px-4 py-2 rounded font-bold hover:bg-orange-50 transition-colors">
                        Pagar Agora
                    </Link>
                </div>
            </div>
        );
    }

    // 3. TRIAL COUNTDOWN (Blue/Indigo)
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
        const daysLeft = Math.ceil((new Date(subscription.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

        if (daysLeft > 0) {
            return (
                <div className="bg-indigo-600 text-white px-4 py-2 shadow-sm z-40 relative">
                    <div className="container mx-auto flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">timer</span>
                            <span>
                                <b>Modo de Teste:</b> Você tem <b>{daysLeft} dias</b> restantes no seu período gratuito.
                            </span>
                        </div>
                        <Link to="/plans" className="underline hover:text-indigo-200">
                            Assinar Agora
                        </Link>
                    </div>
                </div>
            );
        }
    }

    return null;
};

export default SubscriptionBanner;
