import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillingStatus } from '../hooks/useBillingStatus';

/**
 * BillingBlockedScreen — Full-screen overlay that blocks ALL access
 * when user is in BLOCKED status (> 3 days overdue).
 *
 * Only "Pagar agora" button is available, directing to /plans.
 */
const BillingBlockedScreen: React.FC = () => {
    const { status, isBypassed, loading } = useBillingStatus();
    const navigate = useNavigate();

    // Don't render anything if bypassed, still loading, or not blocked
    if (isBypassed || loading || status !== 'BLOCKED') return null;

    const handlePayNow = () => {
        console.log('[Analytics] blocked_user', { action: 'pay_clicked' });
        navigate('/plans');
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-bg-dark/95 backdrop-blur-lg p-6">
            {/* Animated background effect */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative bg-bg-surface/80 backdrop-blur-xl border border-red-500/20 max-w-lg w-full rounded-3xl p-10 shadow-2xl shadow-red-500/10 text-center animate-in zoom-in-95 duration-700">
                {/* Lock icon */}
                <div className="size-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-8 ring-4 ring-red-500/5">
                    <span className="material-symbols-outlined text-4xl animate-pulse">lock</span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
                    Acesso Bloqueado
                </h2>

                {/* Message */}
                <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm mx-auto">
                    Seu acesso foi bloqueado por inadimplência.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
                    Regularize o pagamento para reativar sua conta.
                </p>

                {/* Divider */}
                <div className="w-16 h-px bg-red-500/20 mx-auto mb-10" />

                {/* Pay button */}
                <button
                    onClick={handlePayNow}
                    className="w-full max-w-xs mx-auto block bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs active:scale-95"
                >
                    Pagar agora
                </button>

                {/* Footer info */}
                <p className="text-[10px] text-slate-600 mt-8 uppercase tracking-widest">
                    Pagamento seguro via Asaas
                </p>
            </div>
        </div>
    );
};

export default BillingBlockedScreen;
