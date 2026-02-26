
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

    // Step 1: Account data
    const [companyName, setCompanyName] = useState('');
    const [advisorName, setAdvisorName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 2: Plan + Payment
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [mobilePhone, setMobilePhone] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('starter');
    const [postalCode, setPostalCode] = useState('');
    const [addressNumber, setAddressNumber] = useState('');

    // Credit Card
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [cardExpiry, setCardExpiry] = useState(''); // MM/AA
    const [cardCvv, setCardCvv] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [step, setStep] = useState(1);

    const isAdmin = ADMIN_EMAILS.includes(email.trim().toLowerCase());

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) { setError('Nome da empresa é obrigatório'); return; }
        if (!advisorName.trim()) { setError('Seu nome é obrigatório'); return; }
        if (password !== confirmPassword) { setError('As senhas não coincidem'); return; }
        if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
        setError('');

        if (isAdmin) {
            handleFinalSubmit();
        } else {
            setCardHolder(advisorName.trim());
            setStep(2);
        }
    };

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const handleFinalSubmit = async () => {
        if (!isAdmin) {
            if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
                setError('Informe um CPF ou CNPJ válido.'); return;
            }
            if (!mobilePhone || mobilePhone.replace(/\D/g, '').length < 10) {
                setError('Informe um celular válido com DDD.'); return;
            }
            if (!cardNumber || cardNumber.replace(/\D/g, '').length < 13) {
                setError('Número do cartão inválido.'); return;
            }
            if (!cardHolder.trim()) {
                setError('Nome impresso no cartão é obrigatório.'); return;
            }
            const expiryParts = cardExpiry.split('/');
            if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
                setError('Validade do cartão inválida. Use MM/AA.'); return;
            }
            if (!cardCvv || cardCvv.length < 3) {
                setError('CVV inválido.'); return;
            }
            if (!postalCode || postalCode.replace(/\D/g, '').length < 8) {
                setError('CEP inválido.'); return;
            }
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // 1. Criar conta no Supabase Auth
            setSuccessMessage('Criando sua conta...');
            const { error: signUpError } = await signUp(email, password);
            if (signUpError) { setError(signUpError.message); setIsLoading(false); return; }

            // 2. Aguardar sessão
            await new Promise(r => setTimeout(r, 1500));

            // 3. Criar organização + perfil
            setSuccessMessage('Configurando sua organização...');
            const { error: rpcError } = await supabase.rpc('handle_new_signup', {
                p_org_name: companyName.trim(),
                p_display_name: advisorName.trim()
            });

            if (rpcError) {
                console.error('Erro no RPC. Modo contingência:', rpcError);
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('user_profiles').update({
                        display_name: advisorName.trim(), role: 'owner'
                    }).eq('user_id', user.id);

                    const slug = companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
                    const { data: orgData } = await supabase.from('organizations').insert({
                        name: companyName.trim(), slug
                    }).select().single();

                    if (orgData) {
                        await supabase.from('organization_members').insert({
                            organization_id: orgData.id, user_id: user.id, role: 'owner'
                        });
                    }
                }
            }

            // 4. Admin bypass
            if (isAdmin) {
                setSuccessMessage('🎉 Conta administrativa criada! Acesso vitalício ativado.');
                setTimeout(() => window.location.href = '/', 2500);
                return;
            }

            // 5. Criar assinatura com cartão de crédito + trial 7 dias
            setSuccessMessage('Validando seu cartão de crédito...');
            const expiryParts = cardExpiry.split('/');

            try {
                const result = await asaasService.createSubscription(
                    selectedPlan,
                    'MONTHLY',
                    'CREDIT_CARD',
                    cpfCnpj,
                    mobilePhone,
                    7, // trialDays
                    {
                        holderName: cardHolder.trim(),
                        number: cardNumber.replace(/\D/g, ''),
                        expiryMonth: expiryParts[0],
                        expiryYear: '20' + expiryParts[1],
                        ccv: cardCvv,
                    },
                    {
                        name: cardHolder.trim(),
                        email: email.trim(),
                        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
                        postalCode: postalCode.replace(/\D/g, ''),
                        addressNumber: addressNumber || 'S/N',
                        phone: mobilePhone.replace(/\D/g, ''),
                        mobilePhone: mobilePhone.replace(/\D/g, ''),
                    }
                );

                setSuccessMessage('✅ Cartão validado! Seus 7 dias grátis começam agora. Entrando no sistema...');
                setTimeout(() => window.location.href = '/', 3000);
            } catch (subError: any) {
                console.error('Erro ao criar assinatura:', subError);
                setError(subError.message || 'Erro ao validar cartão. Verifique os dados e tente novamente.');
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-bg-dark flex items-center justify-center p-6 overflow-y-auto">
            {/* Background */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/login-bg.png)' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-bg-dark/95 via-bg-dark/80 to-bg-dark/95" />
            <div className="absolute top-0 right-0 size-[800px] bg-primary/10 rounded-full -mr-96 -mt-96 blur-[150px]" />
            <div className="absolute bottom-0 left-0 size-[600px] bg-primary/10 rounded-full -ml-64 -mb-64 blur-[120px]" />

            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-1000 my-8">
                <div className="text-center mb-6">
                    <img src="/login-logo.png" alt="FL360 Miles" className="w-36 mx-auto mb-3 object-contain drop-shadow-2xl" />
                    <h2 className="text-2xl font-bold text-white mb-1">Crie sua conta</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
                        {step === 1 ? 'Dados da sua empresa' : 'Plano e Pagamento'}
                    </p>
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`h-1 w-12 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
                        <div className={`h-1 w-12 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
                    </div>
                </div>

                <div className="bg-bg-surface/95 backdrop-blur-3xl border border-white/10 p-7 rounded-[32px] shadow-2xl">
                    {step === 1 ? (
                        <form onSubmit={handleStep1} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Sua Empresa</label>
                                    <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="FL360 Travel" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Seu Nome</label>
                                    <input type="text" required value={advisorName} onChange={e => setAdvisorName(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="João Silva" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Profissional</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-bg-card border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                    placeholder="voce@empresa.com" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Senha</label>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="••••••••" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Confirmar</label>
                                    <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-xl py-2.5 px-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="••••••••" />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-[11px] font-medium text-center bg-red-500/10 p-3 rounded-xl">{error}</p>}
                            {successMessage && <div className="text-green-400 text-[11px] font-medium text-center bg-green-500/10 p-3 rounded-xl">{successMessage}</div>}

                            <button type="submit" disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-3.5 rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] group disabled:opacity-50 mt-3">
                                {isLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : (
                                    <>{isAdmin ? 'CRIAR CONTA ADMIN' : 'CONTINUAR'}<span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span></>
                                )}
                            </button>

                            <p className="text-center text-[9px] text-slate-500 mt-2">
                                {isAdmin ? 'Acesso vitalício • Sem cobrança' : '7 dias grátis • Cartão de crédito necessário'}
                            </p>

                            <div className="text-center mt-4">
                                <Link to="/" className="text-slate-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors">
                                    Já tem uma conta? Faça Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <button onClick={() => { setStep(1); setError(''); }} className="text-slate-500 hover:text-white text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar
                            </button>

                            {/* Plan Selector */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">Escolha seu Plano</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {plans.map(plan => (
                                        <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                                            className={`p-2.5 rounded-xl border text-center transition-all ${selectedPlan === plan.id
                                                ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-bg-card text-slate-400 hover:border-primary/30'}`}>
                                            <p className="text-[10px] font-black uppercase tracking-wider">{plan.name}</p>
                                            <p className="text-base font-black mt-0.5">R$ {plan.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                                            <p className="text-[8px] text-slate-500">/mês</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CPF + Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 px-1">CPF/CNPJ <span className="text-red-500">*</span></label>
                                    <input type="text" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" maxLength={18}
                                        className="w-full bg-bg-card border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 px-1">Celular <span className="text-red-500">*</span></label>
                                    <input type="tel" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} placeholder="(11) 99999-9999" maxLength={15}
                                        className="w-full bg-bg-card border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                                </div>
                            </div>

                            {/* Credit Card Section */}
                            <div className="border border-primary/20 bg-primary/5 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-primary text-lg">credit_card</span>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Cartão de Crédito</p>
                                    <span className="material-symbols-outlined text-emerald-400 text-sm ml-auto">lock</span>
                                </div>

                                <div>
                                    <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 px-1">Número do Cartão</label>
                                    <input type="text" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="0000 0000 0000 0000" maxLength={19}
                                        className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all tracking-wider font-mono" />
                                </div>

                                <div>
                                    <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 px-1">Nome Impresso no Cartão</label>
                                    <input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                        placeholder="JOAO DA SILVA" maxLength={50}
                                        className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase" />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 px-1">Validade</label>
                                        <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                            placeholder="MM/AA" maxLength={5}
                                            className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 px-1">CVV</label>
                                        <input type="text" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="123" maxLength={4}
                                            className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 px-1">CEP</label>
                                        <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                            placeholder="00000-000" maxLength={9}
                                            className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center font-mono" />
                                    </div>
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-[11px] font-medium text-center bg-red-500/10 p-3 rounded-xl">{error}</p>}
                            {successMessage && <div className="text-green-400 text-[11px] font-medium text-center bg-green-500/10 p-3 rounded-xl animate-pulse">{successMessage}</div>}

                            <button onClick={handleFinalSubmit} disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-3.5 rounded-2xl text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] group disabled:opacity-50">
                                {isLoading ? (
                                    <><span className="material-symbols-outlined animate-spin text-lg">sync</span> Processando...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-lg">shield</span> INICIAR 7 DIAS GRÁTIS</>
                                )}
                            </button>

                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center">
                                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                                    ✨ Cobrança somente após os 7 dias
                                </p>
                                <p className="text-[9px] text-slate-500 mt-0.5">
                                    R$ {plans.find(p => p.id === selectedPlan)?.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês • Seu cartão será validado agora mas cobrado apenas no 8º dia.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                    FL360 Miles Systems<br />
                    <span className="opacity-50">Secure Enrollment Portal</span>
                </p>
            </div>
        </div>
    );
};

export default Signup;
