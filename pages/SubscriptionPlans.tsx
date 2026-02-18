
import React from 'react';
import { useBilling } from '../hooks/useBilling';

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 97,
        features: ['Até 50 clientes', 'Gestão básica', 'Suporte por email'],
        recommended: false
    },
    {
        id: 'pro',
        name: 'Profissional',
        price: 197,
        features: ['Clientes ilimitados', 'Gestão avançada', 'Suporte prioritário', 'Relatórios PDF'],
        recommended: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 497,
        features: ['Tudo do Pro', 'API dedicada', 'Gerente de conta', 'Whitelabel'],
        recommended: false
    }
];

const SubscriptionPlans: React.FC = () => {
    const { subscribe, isLoading, error } = useBilling();

    const handleSubscribe = async (planId: string) => {
        try {
            // Por enquanto hardcoded mensal e PIX para teste
            const result = await subscribe(planId, 'MONTHLY', 'PIX');
            if (result.paymentLink) {
                window.location.href = result.paymentLink;
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Planos e Preços</h1>
            <p className="text-slate-400 mb-8">Escolha o plano ideal para escalar sua operação de milhas.</p>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 border border-red-500/20">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative bg-bg-card border rounded-3xl p-8 flex flex-col ${plan.recommended ? 'border-primary shadow-2xl shadow-primary/10' : 'border-white/5'}`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-bg-dark text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-full">
                                Recomendado
                            </div>
                        )}

                        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-sm text-slate-400">R$</span>
                            <span className="text-4xl font-black text-white">{plan.price}</span>
                            <span className="text-sm text-slate-400">/mês</span>
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
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${plan.recommended
                                    ? 'bg-primary text-bg-dark hover:bg-primary-dark shadow-lg shadow-primary/20'
                                    : 'bg-white/5 text-white hover:bg-white/10'
                                }`}
                        >
                            {isLoading ? 'Processando...' : 'Escolher Plano'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionPlans;
