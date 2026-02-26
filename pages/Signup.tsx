
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { asaasService } from '../services/asaas';

const ADMIN_EMAILS = ['fl360travel@gmail.com', 'adriano.moraesnr@gmail.com'];

const plans = [
    { id: 'starter', name: 'Starter', price: 799.99 },
    { id: 'pro', name: 'Profissional', price: 1299 },
    { id: 'enterprise', name: 'White Label', price: 2399 },
];

const Signup: React.FC = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [advisorName, setAdvisorName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [mobilePhone, setMobilePhone] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('starter');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [step, setStep] = useState(1); // 1 = dados pessoais, 2 = plano + pagamento

    const isAdmin = ADMIN_EMAILS.includes(email.trim().toLowerCase());

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyName.trim()) { setError('Nome da empresa é obrigatório'); return; }
        if (!advisorName.trim()) { setError('Seu nome é obrigatório'); return; }
        if (password !== confirmPassword) { setError('As senhas não coincidem'); return; }
        if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }

        setError('');

        // Admins skip to direct creation
        if (isAdmin) {
            handleFinalSubmit();
        } else {
            setStep(2);
        }
    };

    const handleFinalSubmit = async () => {
        if (!isAdmin) {
            if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
                setError('Por favor, informe um CPF ou CNPJ válido.');
                return;
            }
            if (!mobilePhone || mobilePhone.replace(/\D/g, '').length < 10) {
                setError('Por favor, informe um celular válido com DDD.');
                return;
            }
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // 1. Criar conta no Supabase Auth
            const { error: signUpError } = await signUp(email, password);
            if (signUpError) {
                setError(signUpError.message);
                setIsLoading(false);
                return;
            }

            // 2. Aguardar sessão
            await new Promise(r => setTimeout(r, 1500));

            // 3. Chamar RPC para criar organização + perfil + trial
            const { error: rpcError } = await supabase.rpc('handle_new_signup', {
                p_org_name: companyName.trim(),
                p_display_name: advisorName.trim()
            });

            if (rpcError) {
                console.error('Erro no RPC. Acionando modo de contingência Frontend:', rpcError);

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('user_profiles').update({
                        display_name: advisorName.trim(),
                        role: 'owner'
                    }).eq('user_id', user.id);

                    const slug = companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
                    const { data: orgData } = await supabase.from('organizations').insert({
                        name: companyName.trim(),
                        slug: slug
                    }).select().single();

                    if (orgData) {
                        await supabase.from('organization_members').insert({
                            organization_id: orgData.id,
                            user_id: user.id,
                            role: 'owner'
                        });
                    }
                }
            }

            // 4. Se for ADMIN, pular pagamento e ir direto
            if (isAdmin) {
                setSuccessMessage('🎉 Conta administrativa criada! Acesso vitalício ativado. Redirecionando...');
                setTimeout(() => window.location.href = '/', 2500);
                return;
            }

            // 5. Se NÃO for admin, criar assinatura com trial de 7 dias
            setSuccessMessage('Conta criada! Configurando seu plano com 7 dias grátis...');

            try {
                const result = await asaasService.createSubscription(
                    selectedPlan,
                    'MONTHLY',
                    'CREDIT_CARD',
                    cpfCnpj,
                    mobilePhone,
                    7 // trialDays
                );

                if (result.paymentLink) {
                    setSuccessMessage('✅ Plano ativado! Redirecionando para configurar seu cartão de crédito...');
                    setTimeout(() => {
                        window.open(result.paymentLink, '_blank');
                        window.location.href = '/';
                    }, 2000);
                } else {
                    setSuccessMessage('✅ Plano ativado! Acessando o sistema...');
                    setTimeout(() => window.location.href = '/', 2500);
                }
            } catch (subError: any) {
                console.error('Erro ao criar assinatura:', subError);
                // Não bloquear a conta se o pagamento falhar — o trial local já foi criado
                setSuccessMessage('Conta criada! Configure seu plano em "Meu Plano". Redirecionando...');
                setTimeout(() => window.location.href = '/', 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-bg-dark flex items-center justify-center p-6 overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/login-bg.png)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-bg-dark/95 via-bg-dark/80 to-bg-dark/95" />

            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 size-[800px] bg-primary/10 rounded-full -mr-96 -mt-96 blur-[150px]"></div>
            <div className="absolute bottom-0 left-0 size-[600px] bg-primary/10 rounded-full -ml-64 -mb-64 blur-[120px]"></div>

            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-1000">
                <div className="text-center mb-8">
                    <img src="/login-logo.png" alt="FL360 Miles Logo" className="w-40 mx-auto mb-4 object-contain drop-shadow-2xl" />
                    <h2 className="text-2xl font-bold text-white mb-2">Crie sua conta</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
                        {step === 1 ? 'Dados da sua empresa' : 'Escolha seu plano'}
                    </p>
                </div>

                <div className="bg-bg-surface/95 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
                    {step === 1 ? (
                        <form onSubmit={handleStep1} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                        Sua Empresa
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="FL360 Travel"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                        Seu Nome
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={advisorName}
                                        onChange={e => setAdvisorName(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="João Silva"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                    Email Profissional
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                    placeholder="voce@empresa.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Senha</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Confirmar</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-[11px] font-medium text-center bg-red-500/10 p-3 rounded-xl">{error}</p>
                            )}

                            {successMessage && (
                                <div className="text-green-400 text-[11px] font-medium text-center bg-green-500/10 p-3 rounded-xl">
                                    {successMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] group disabled:opacity-50 mt-4"
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <>
                                        {isAdmin ? 'CRIAR CONTA ADMIN' : 'CONTINUAR'}
                                        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </>
                                )}
                            </button>

                            <p className="text-center text-[9px] text-slate-500 mt-2">
                                7 dias grátis • Cartão de crédito necessário • Cancele quando quiser
                            </p>

                            <div className="text-center mt-6">
                                <Link
                                    to="/"
                                    className="text-slate-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                                >
                                    Já tem uma conta? Faça Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        /* STEP 2: Plan Selection + Billing Info */
                        <div className="space-y-5">
                            <button onClick={() => { setStep(1); setError(''); }} className="text-slate-500 hover:text-white text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar
                            </button>

                            {/* Plan Selector */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Escolha seu Plano</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {plans.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`p-3 rounded-xl border text-center transition-all ${selectedPlan === plan.id
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-white/5 bg-bg-card text-slate-400 hover:border-primary/30'
                                                }`}
                                        >
                                            <p className="text-[11px] font-black uppercase tracking-wider">{plan.name}</p>
                                            <p className="text-lg font-black mt-1">R$ {plan.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                                            <p className="text-[9px] text-slate-500">/mês</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CPF + Phone */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 px-1">CPF / CNPJ <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={cpfCnpj}
                                        onChange={(e) => setCpfCnpj(e.target.value)}
                                        placeholder="000.000.000-00"
                                        className="w-full bg-bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        maxLength={18}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 px-1">Celular / WhatsApp <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        value={mobilePhone}
                                        onChange={(e) => setMobilePhone(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                        className="w-full bg-bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-[11px] font-medium text-center bg-red-500/10 p-3 rounded-xl">{error}</p>
                            )}

                            {successMessage && (
                                <div className="text-green-400 text-[11px] font-medium text-center bg-green-500/10 p-3 rounded-xl">
                                    {successMessage}
                                </div>
                            )}

                            <button
                                onClick={handleFinalSubmit}
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] group disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">credit_card</span>
                                        INICIAR 7 DIAS GRÁTIS
                                    </>
                                )}
                            </button>

                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                                <p className="text-[9px] text-primary font-bold uppercase tracking-widest">
                                    ✨ Você não será cobrado agora
                                </p>
                                <p className="text-[9px] text-slate-500 mt-1">
                                    A cobrança de R$ {plans.find(p => p.id === selectedPlan)?.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês será feita apenas após os 7 dias gratuitos.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-8">
                    FL360 Miles Systems <br />
                    <span className="opacity-50">Secure Enrollment Portal</span>
                </p>
            </div>
        </div>
    );
};

export default Signup;
