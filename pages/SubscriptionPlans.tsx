
import React, { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { useSubscription } from '../hooks/useSubscription';

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 799,
        cycle: 'mês',
        features: ['Até 20 clientes', 'Gestão completa de milhas', 'Dashboard inteligente', 'Suporte por email'],
        recommended: false
    },
    {
        id: 'pro',
        name: 'Profissional',
        price: 1299,
        cycle: 'mês',
        features: ['Até 100 clientes', 'Tudo do Starter', 'AI Concierge (Altitude AI)', 'Relatórios PDF personalizados', 'Suporte prioritário'],
        recommended: true
    },
    {
        id: 'enterprise',
        name: 'White Label',
        price: 2399,
        cycle: 'mês',
        features: ['Clientes ilimitados', 'Tudo do Profissional', 'Plataforma personalizada', 'Sua marca, seu domínio', 'Gerente de conta dedicado'],
        recommended: false
    }
];

const paymentMethods = [
    { id: 'PIX' as const, label: 'PIX', icon: 'qr_code_2' },
    { id: 'BOLETO' as const, label: 'Boleto', icon: 'receipt_long' },
    { id: 'CREDIT_CARD' as const, label: 'Cartão', icon: 'credit_card' },
];

const SubscriptionPlans: React.FC = () => {
    const { subscribe, isLoading, error } = useBilling();
    const { isBlocked, isTrialing, daysLeft, planId: currentPlan } = useSubscription();
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
    const [selectedMethod, setSelectedMethod] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [mobilePhone, setMobilePhone] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleSubscribe = async (planId: string) => {
        if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
            setValidationError('Por favor, informe um CPF ou CNPJ válido.');
            return;
        }
        if (!mobilePhone || mobilePhone.replace(/\D/g, '').length < 10) {
            setValidationError('Por favor, informe um número de celular válido com DDD.');
            return;
        }

        try {
            setValidationError('');
            setSuccessMessage('');
            const result = await subscribe(planId, billingCycle, selectedMethod, cpfCnpj, mobilePhone);
            if (result.paymentLink) {
                setSuccessMessage('Redirecionando para pagamento...');
                setTimeout(() => {
                    window.open(result.paymentLink, '_blank');
                }, 500);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="display-font text-3xl font-bold text-white italic uppercase tracking-tighter mb-3">Planos e Preços</h1>
                <p className="text-slate-400 text-sm">Escolha o plano ideal para escalar sua operação de milhas.</p>

                {/* Billing Toggle */}
                <div className="mt-8 flex items-center justify-center gap-4">
                    <span className={`text-sm font-bold transition-colors ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-slate-500'}`}>Mensal</span>
                    <button
                        onClick={() => setBillingCycle(c => c === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                        className={`relative w-14 h-8 rounded-full border transition-all duration-300 outline-none ${billingCycle === 'YEARLY' ? 'bg-primary/20 border-primary' : 'bg-bg-surface/50 border-white/10 hover:border-primary/50'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-primary transition-all duration-300 ${billingCycle === 'YEARLY' ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className={`text-sm font-bold transition-colors ${billingCycle === 'YEARLY' ? 'text-white' : 'text-slate-500'} flex items-center gap-2`}>
                        Anual
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/10">-10% OFF</span>
                    </span>
                </div>

                {isBlocked && (
                    <div className="mt-4 bg-red-500/10 text-red-400 px-6 py-3 rounded-2xl border border-red-500/20 inline-flex items-center gap-3">
                        <span className="material-symbols-outlined">warning</span>
                        <span className="text-sm font-bold">Seu acesso está bloqueado. Escolha um plano para continuar.</span>
                    </div>
                )}

                {isTrialing && daysLeft > 0 && (
                    <div className="mt-4 bg-indigo-500/10 text-indigo-400 px-6 py-3 rounded-2xl border border-indigo-500/20 inline-flex items-center gap-3">
                        <span className="material-symbols-outlined">timer</span>
                        <span className="text-sm font-bold">{daysLeft} dias restantes no trial gratuito</span>
                    </div>
                )}
            </div>

            {/* Errors */}
            {(error || validationError) && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 border border-red-500/20 flex items-center gap-3">
                    <span className="material-symbols-outlined">error</span>
                    {validationError || error}
                </div>
            )}

            {/* Success */}
            {successMessage && (
                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl mb-8 border border-emerald-500/20 flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    {successMessage}
                </div>
            )}

            {/* Dados do Cliente para o Asaas */}
            <div className="mb-10 max-w-md mx-auto bg-bg-surface/50 p-6 rounded-2xl border border-white/5 shadow-xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Dados Obrigatórios para Faturamento</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wider">CPF / CNPJ <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={cpfCnpj}
                            onChange={(e) => setCpfCnpj(e.target.value)}
                            placeholder="000.000.000-00"
                            className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            maxLength={18}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wider">Celular / WhatsApp <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            value={mobilePhone}
                            onChange={(e) => setMobilePhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            maxLength={15}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Forma de Pagamento</p>
                <div className="flex justify-center gap-3">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${selectedMethod === method.id
                                ? 'bg-primary/10 border-primary text-primary border'
                                : 'bg-bg-surface border border-white/5 text-slate-500 hover:border-primary/30'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{method.icon}</span>
                            {method.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative bg-bg-card border rounded-3xl p-8 flex flex-col ${plan.recommended ? 'border-primary shadow-2xl shadow-primary/10' : 'border-white/5'} ${currentPlan === plan.id ? 'ring-2 ring-emerald-500/30' : ''}`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-bg-dark text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-full">
                                Recomendado
                            </div>
                        )}

                        {currentPlan === plan.id && (
                            <div className="absolute -top-4 right-4 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-full">
                                Plano Atual
                            </div>
                        )}

                        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                        <div className="flex flex-col mb-6 h-16 justify-center">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-4xl font-black text-white">
                                    {(billingCycle === 'YEARLY' ? plan.price * 0.9 : plan.price).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-sm text-slate-400">/mês</span>
                            </div>
                            {billingCycle === 'YEARLY' && (
                                <div className="text-xs text-emerald-400 mt-1 font-bold">
                                    Cobrado R$ {(plan.price * 12 * 0.9).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /ano
                                </div>
                            )}
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={isLoading || currentPlan === plan.id}
                            className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${currentPlan === plan.id
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                                : plan.recommended
                                    ? 'bg-primary text-bg-dark hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-95'
                                    : 'bg-white/5 text-white hover:bg-white/10 active:scale-95'
                                }`}
                        >
                            {currentPlan === plan.id
                                ? '✓ Plano Ativo'
                                : isLoading
                                    ? 'Processando...'
                                    : 'Escolher Plano'
                            }
                        </button>
                    </div>
                ))}
            </div>

            <p className="text-center text-[10px] text-slate-600 mt-8 uppercase tracking-widest">
                Pagamento seguro via Asaas • Cancele quando quiser
            </p>
        </div>
    );
};

export default SubscriptionPlans;
