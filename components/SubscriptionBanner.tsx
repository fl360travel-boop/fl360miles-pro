import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const SubscriptionBanner: React.FC = () => {
    const { subscription, isOwner, isDeveloper, isDemo } = useAuth();
    const location = useLocation();

    // 0. BYPASS TOTAL: Dono, Dev e Demo não veem banners de bloqueio ou trial
    const isBypassed = isOwner || isDeveloper || isDemo;

    // Se o usuário está na página de planos ou é um usuário bypassado, não mostramos nada
    if (location.pathname === '/plans' || isBypassed) {
        return null;
    }

    // Fallback: If there is no subscription row, treat it as trial
    const effectiveSub = subscription || {
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

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
