import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const SubscriptionBanner: React.FC = () => {
    const { subscription } = useAuth();

    // Fallback: If there is no subscription row (e.g. old accounts before the Asaas integration), treat it as expired.
    const effectiveSub = subscription || {
        status: 'canceled',
        trialEndsAt: null,
        currentPeriodEnd: null,
        updatedAt: null
    };

    // Helper: Check if date is in the past
    const isPast = (dateStr: string | null) => dateStr && new Date(dateStr) < new Date();

    // Helper: Calculate hours since a date
    const hoursSince = (dateStr: string | null) => {
        if (!dateStr) return 9999; // Assume long time if no date
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        return diff / (1000 * 3600);
    };

    // 1. BLOCKED STATE (Red)
    const referenceDate = effectiveSub.currentPeriodEnd || effectiveSub.updatedAt;
    const isGracePeriodOver = effectiveSub.status === 'past_due' && hoursSince(referenceDate) > 48;
    const isTrialExpired = effectiveSub.status === 'trial' && isPast(effectiveSub.trialEndsAt);

    if (effectiveSub.status === 'canceled' || isTrialExpired || isGracePeriodOver) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-dark/80 backdrop-blur-sm p-6">
                <div className="bg-bg-surface border border-red-500/20 max-w-md w-full rounded-3xl p-8 shadow-2xl shadow-red-500/10 text-center animate-in zoom-in-95 duration-500">
                    <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl">block</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Acesso Interrompido</h3>
                    <p className="text-slate-400 text-sm mb-8">
                        {effectiveSub.status === 'trial'
                            ? 'O seu período de degustação gratuita chegou ao fim.'
                            : 'Identificamos uma pendência no pagamento da sua assinatura.'}
                        {' '}Para retomar o uso de todas as ferramentas, por favor, regularize seu plano.
                    </p>
                    <Link to="/plans" className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs">
                        Regularizar Acesso
                    </Link>
                </div>
            </div>
        );
    }

    // 2. GRACE PERIOD WARNING (Orange)
    if (effectiveSub.status === 'past_due') {
        const hoursLeft = 48 - Math.floor(hoursSince(referenceDate));
        return (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom flex flex-col items-end pointer-events-none">
                <div className="bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-md border border-white/20 text-white p-4 rounded-2xl shadow-2xl shadow-orange-500/20 flex flex-col gap-3 pointer-events-auto max-w-sm">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
                        <div className="flex-1">
                            <p className="font-bold text-sm">Fatura Pendente</p>
                            <p className="text-xs opacity-90 leading-relaxed mt-1">
                                Para evitar a interrupção de acesso em <b>{hoursLeft > 0 ? hoursLeft : 0}h</b>, por favor regularize sua assinatura.
                            </p>
                        </div>
                    </div>
                    <Link to="/plans" className="bg-white/20 hover:bg-white text-white hover:text-orange-600 px-4 py-2 rounded-xl font-bold transition-all text-xs text-center uppercase tracking-widest border border-white/20">
                        Regularizar Agora
                    </Link>
                </div>
            </div>
        );
    }

    // 3. TRIAL COUNTDOWN (Elegant Floating Pill)
    if (effectiveSub.status === 'trial' && effectiveSub.trialEndsAt) {
        const daysLeft = Math.ceil((new Date(effectiveSub.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

        if (daysLeft > 0) {
            return (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-700 fade-in pointer-events-none w-auto max-w-full px-4">
                    <div className="bg-bg-surface/80 backdrop-blur-xl border border-primary/20 p-1.5 pl-4 rounded-full shadow-2xl shadow-primary/10 flex items-center gap-4 pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </div>
                            <span className="text-[11px] text-white">
                                <span className="text-slate-400">Modo Trial:</span> <b>{daysLeft} dias restantes</b>
                            </span>
                        </div>
                        <Link
                            to="/plans"
                            className="bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary hover:to-primary-dark text-primary hover:text-bg-dark border border-primary/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                        >
                            Fazer Upgrade
                        </Link>
                    </div>
                </div>
            );
        }
    }

    return null;
};

export default SubscriptionBanner;
