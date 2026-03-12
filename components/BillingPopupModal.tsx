import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillingStatus, BillingStatusType } from '../hooks/useBillingStatus';

const BillingPopupModal: React.FC = () => {
    const {
        status,
        showPopup,
        popupCopy,
        remainingDays: days,
        snoozeToday,
        markPopupShown,
        isBypassed,
        loading,
    } = useBillingStatus();

    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [animateOut, setAnimateOut] = useState(false);

    useEffect(() => {
        if (showPopup && !loading && !isBypassed) {
            setVisible(true);
            markPopupShown();
        }
    }, [showPopup, loading, isBypassed]);

    if (!visible || isBypassed) return null;

    const close = () => {
        setAnimateOut(true);
        setTimeout(() => {
            setVisible(false);
            setAnimateOut(false);
        }, 300);
    };

    const handlePayNow = () => {
        console.log('[Analytics] pay_clicked', { status });
        close();
        navigate('/plans');
    };

    const handleRemindLater = () => {
        console.log('[Analytics] snooze_clicked (remind later)', { status });
        close();
    };

    const handleDontShowToday = async () => {
        await snoozeToday();
        close();
    };

    // Determine visual style based on status
    const getStatusStyle = (s: BillingStatusType) => {
        switch (s) {
            case 'DUE_SOON':
                return {
                    icon: 'schedule',
                    gradient: 'from-amber-500/90 to-orange-500/90',
                    shadow: 'shadow-amber-500/20',
                    iconBg: 'bg-amber-500/15',
                    iconColor: 'text-amber-400',
                    btnPrimary: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30',
                };
            case 'DUE_TODAY':
                return {
                    icon: 'notifications_active',
                    gradient: 'from-orange-500/90 to-red-500/90',
                    shadow: 'shadow-orange-500/20',
                    iconBg: 'bg-orange-500/15',
                    iconColor: 'text-orange-400',
                    btnPrimary: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30',
                };
            case 'OVERDUE_WARNING':
                return {
                    icon: 'warning',
                    gradient: 'from-red-500/90 to-red-700/90',
                    shadow: 'shadow-red-500/20',
                    iconBg: 'bg-red-500/15',
                    iconColor: 'text-red-400',
                    btnPrimary: 'bg-red-600 hover:bg-red-700 shadow-red-600/30',
                };
            case 'TRIAL':
                return {
                    icon: 'info',
                    gradient: 'from-blue-500/90 to-indigo-500/90',
                    shadow: 'shadow-blue-500/20',
                    iconBg: 'bg-blue-500/15',
                    iconColor: 'text-blue-400',
                    btnPrimary: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30',
                };
            default:
                return {
                    icon: 'info',
                    gradient: 'from-slate-500/90 to-slate-700/90',
                    shadow: 'shadow-slate-500/20',
                    iconBg: 'bg-slate-500/15',
                    iconColor: 'text-slate-400',
                    btnPrimary: 'bg-slate-500 hover:bg-slate-600 shadow-slate-500/30',
                };
        }
    };

    const style = getStatusStyle(status);

    const getTitle = (s: BillingStatusType) => {
        switch (s) {
            case 'TRIAL': return 'Degustação Grátis';
            case 'DUE_SOON': return 'Lembrete de Pagamento';
            case 'DUE_TODAY': return 'Vencimento Hoje';
            case 'OVERDUE_WARNING': return 'Pagamento em Atraso';
            default: return 'Aviso';
        }
    };

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleRemindLater} />

            {/* Modal */}
            <div className={`relative bg-bg-surface/95 backdrop-blur-xl border border-white/10 max-w-md w-full rounded-3xl p-8 ${style.shadow} shadow-2xl transition-all duration-500 ${animateOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-in zoom-in-95'}`}>
                {/* Icon */}
                <div className={`size-16 rounded-2xl ${style.iconBg} flex items-center justify-center ${style.iconColor} mx-auto mb-6`}>
                    <span className="material-symbols-outlined text-3xl">{style.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white text-center mb-3">
                    {getTitle(status)}
                </h3>

                {/* Body */}
                <p className="text-slate-300 text-sm text-center leading-relaxed mb-8">
                    {popupCopy}
                </p>

                {/* Progress indicator for DUE_SOON */}
                {status === 'DUE_SOON' && days >= 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                            <span>Vencimento</span>
                            <span>{days} {days === 1 ? 'dia' : 'dias'}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.max(10, ((5 - days) / 5) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* OVERDUE countdown */}
                {status === 'OVERDUE_WARNING' && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                        <span className="text-3xl font-black text-red-400">{Math.max(0, 3 + days)}</span>
                        <p className="text-[10px] text-red-400/70 font-bold uppercase tracking-widest mt-1">
                            {(3 + days) === 1 ? 'dia restante' : 'dias restantes'} antes do bloqueio
                        </p>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handlePayNow}
                        className={`w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${style.btnPrimary}`}
                    >
                        Pagar agora
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRemindLater}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                        >
                            Lembrar depois
                        </button>
                        <button
                            onClick={handleDontShowToday}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                        >
                            Não mostrar hoje
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingPopupModal;
