
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandAssets';
import { useSEO } from '../hooks/useSEO';

const Landing: React.FC = () => {
    useSEO('Gestão de Milhas para Agências', 'Transforme milhas em receita recorrente e escale sua agência com o FL360.');
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Business Simulator State
    const [clients, setClients] = useState(10);
    const [avgProfit, setAvgProfit] = useState(1500); // Lucro médio por cliente em milhas (conservador)
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);

    useEffect(() => {
        setMonthlyRevenue(clients * avgProfit);
    }, [clients, avgProfit]);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-bg-dark text-white selection:bg-primary selection:text-bg-dark overflow-x-hidden font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-xl">flight_takeoff</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">
                            FL360<span className="text-primary">MILES</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        <button onClick={() => scrollToSection('simulator')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Simulador</button>
                        <button onClick={() => scrollToSection('ecosystem')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Ecossistema</button>
                        <button onClick={() => scrollToSection('plans')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Planos</button>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-xs font-bold text-white hover:text-primary transition-colors uppercase tracking-widest"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-primary text-bg-dark text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </nav>

            {/* 1. HERO SECTION */}
            <section className="relative pt-48 pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary/10 rounded-full blur-[150px] -z-10 opacity-30"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></span>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Nova Vertical de Receita para Agências</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Transforme Milhas em <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-200 to-primary animate-gradient bg-300%">Receita Recorrente</span>
                        <br /> para Sua Agência
                    </h1>

                    <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-14 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        Enquanto a maioria vende passagem por comissão, os gestores FL360 controlam a margem e o lucro. Não deixe dinheiro na mesa.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full md:w-auto bg-primary text-bg-dark text-sm font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                        >
                            <span>Quero transformar minha agência agora</span>
                            <span className="material-symbols-outlined">rocket_launch</span>
                        </button>
                    </div>

                    {/* New Strategic Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-y border-white/5 bg-white/[0.02]">
                        {[
                            { value: 'Nova Receita', desc: 'Agências adicionam de R$ 5k a R$ 30k/mês de lucro recorrente.' },
                            { value: 'Margem Controlada', desc: 'A única vertical onde você define sua margem de lucro real.' },
                            { value: 'Fidelização', desc: 'Cliente que lucra com você não compra passagem em outro lugar.' }
                        ].map((stat, i) => (
                            <div key={i} className="px-6">
                                <div className="text-xl font-black text-white mb-2 uppercase tracking-wide">{stat.value}</div>
                                <div className="text-sm font-medium text-slate-400">{stat.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. REVENUE SIMULATOR (NEW) */}
            <section id="simulator" className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
                                Quanto sua agência poderia <span className="text-emerald-400">faturar</span> com gestão de milhas?
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Faça uma simulação rápida. Com apenas 10 clientes recorrentes, você já cria uma nova fonte de receita previsível e escalável, sem aumentar sua equipe operacional.
                            </p>
                            <div className="flex items-center gap-4 text-emerald-400 font-bold bg-emerald-400/10 px-6 py-4 rounded-xl inline-flex border border-emerald-400/20">
                                <span className="material-symbols-outlined">trending_up</span>
                                <span>Resultado Mensal Recorrente</span>
                            </div>
                        </div>

                        <div className="bg-bg-card border border-white/10 rounded-3xl p-10 shadow-2xl shadow-primary/5">
                            <div className="mb-10">
                                <div className="flex justify-between mb-4">
                                    <label className="text-slate-400 font-bold text-sm uppercase tracking-wider">Clientes Ativos</label>
                                    <span className="text-white font-black text-xl">{clients}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="100"
                                    value={clients}
                                    onChange={(e) => setClients(parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-slate-600 mt-2 font-bold uppercase">
                                    <span>1 Cliente</span>
                                    <span>100 Clientes</span>
                                </div>
                            </div>

                            <div className="mb-12">
                                <div className="flex justify-between mb-4">
                                    <label className="text-slate-400 font-bold text-sm uppercase tracking-wider">Lucro Médio / Cliente</label>
                                    <span className="text-white font-black text-xl">R$ {avgProfit.toLocaleString('pt-BR')}</span>
                                </div>
                                <input
                                    type="range"
                                    min="500" max="5000" step="100"
                                    value={avgProfit}
                                    onChange={(e) => setAvgProfit(parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-slate-600 mt-2 font-bold uppercase">
                                    <span>Conservador (R$ 500)</span>
                                    <span>Agressivo (R$ 5.000)</span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-bg-dark to-black border border-white/10 p-8 rounded-2xl text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Potencial de Lucro Mensal</p>
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">
                                    R$ {monthlyRevenue.toLocaleString('pt-BR')}
                                </div>
                                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Nova Receita no Caixa</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. TRANSFORMATION (Refined Copy) */}
            <section id="transformation" className="py-32 px-6 bg-Bg-dark">
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">O Mercado Está Mudando</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">As agências que dominam gestão de milhas deixaram de ser "tiradoras de pedido" para se tornarem consultorias estratégicas de alto valor.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                    {/* Before */}
                    <div className="p-10 rounded-3xl bg-bg-card border border-white/5 relative overflow-hidden group opacity-70 hover:opacity-100 transition-opacity">
                        <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-2xl">
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Modelo Tradicional</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400 mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined">money_off</span>
                            Guerra por Preço
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Margens espremidas pelas cias aéreas',
                                'Cliente "leiloeiro" que só quer preço',
                                'Dependência de comissão fixa',
                                'Sem barreira de entrada (commodity)',
                                'Baixa fidelização'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* After */}
                    <div className="p-10 rounded-3xl bg-bg-card border border-primary/30 relative overflow-hidden shadow-2xl shadow-primary/5 group hover:border-primary/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 bg-primary text-bg-dark rounded-bl-2xl font-black uppercase tracking-widest text-xs">
                            Modelo FL360
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">attach_money</span>
                            Receita Recorrente
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Controle total da margem de lucro',
                                'Receita previsível todo mês (Fee + %)',
                                'Cliente fidelizado pelo resultado',
                                'Diferencial competitivo real',
                                'Alta barreira de saída'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-white font-medium">
                                    <span className="material-symbols-outlined text-primary">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* 4. ECOSYSTEM (Refined Copy) */}
            <section id="ecosystem" className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <div className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-6">Infraestrutura Estratégica</div>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Não é Software. É Inteligência.</h2>
                        <p className="text-slate-400">Automatizamos o operacional para você focar no relacionamento e na estratégia.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            {
                                icon: 'psychology',
                                title: 'Consultoria',
                                subtitle: 'AI Advisor',
                                desc: 'Identifica oportunidades de lucro ocultas na carteira do cliente, gerando valor imediato.'
                            },
                            {
                                icon: 'smart_toy',
                                title: 'Operacional',
                                subtitle: 'Scanner Award',
                                desc: 'Encontra disponibilidade de assentos exclusivos, permitindo vender passagens com margens de 40-70%.'
                            },
                            {
                                icon: 'account_balance',
                                title: 'Financeiro',
                                subtitle: 'Gestão de Ativos',
                                desc: 'Controle total do custo médio (CPM) e fluxo de caixa, garantindo que nunca haja prejuízo.'
                            },
                            {
                                icon: 'verified_user',
                                title: 'Posicionamento',
                                subtitle: 'White Label',
                                desc: 'Entregue uma experiência premium com sua marca, elevando a percepção de valor do seu serviço.'
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-bg-card border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-bg-dark transition-colors">
                                    <span className="material-symbols-outlined text-3xl text-primary group-hover:text-bg-dark transition-colors">{item.icon}</span>
                                </div>
                                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{item.title}</div>
                                <h3 className="text-2xl font-bold text-white mb-4">{item.subtitle}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. SOCIAL PROOF */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-3xl font-black text-white mb-16">
                        "Enquanto agências comuns vendem passagens,<br />nós vendemos <span className="text-primary">inteligência financeira</span>."
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-bg-card rounded-3xl border border-white/5 text-left">
                            <div className="flex gap-1 text-primary mb-4">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                            </div>
                            <p className="text-slate-300 text-sm italic mb-6">"Adicionei R$ 15k de receita recorrente no primeiro mês oferecendo gestão de milhas para meus clientes corporativos."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <div className="text-white font-bold text-sm">Ricardo S.</div>
                                    <div className="text-slate-500 text-xs">Proprietário de Agência</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-bg-card rounded-3xl border border-white/5 text-left transform md:-translate-y-4 shadow-xl border-primary/20">
                            <div className="flex gap-1 text-primary mb-4">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                            </div>
                            <p className="text-slate-300 text-sm italic mb-6">"A margem que tenho hoje controlando o custo da milha é impossível de conseguir na venda tradicional. O FL360 viabilizou isso."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <div className="text-white font-bold text-sm">Camila T.</div>
                                    <div className="text-slate-500 text-xs">Gestora de Viagens</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-bg-card rounded-3xl border border-white/5 text-left">
                            <div className="flex gap-1 text-primary mb-4">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                            </div>
                            <p className="text-slate-300 text-sm italic mb-6">"O cliente se sente num Private Bank. O relatório White Label dá um peso enorme para a minha consultoria."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <div className="text-white font-bold text-sm">André M.</div>
                                    <div className="text-slate-500 text-xs">Consultor Elite</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. PLANS (High Ticket) */}
            <section id="plans" className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Investimento Estratégico</h2>
                        <p className="text-slate-400">Escolha o nível de infraestrutura ideal para o seu crescimento.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Start */}
                        <div className="p-10 rounded-3xl bg-bg-card border border-white/5 flex flex-col hover:border-white/20 transition-all">
                            <div className="mb-6">
                                <span className="bg-white/5 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Entrada</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Plano Start</h3>
                            <p className="text-slate-400 text-sm mb-8">Para validar a nova vertical na sua agência.</p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-5xl font-black text-white">799</span>
                                <span className="text-sm text-slate-400">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[
                                    'Gestão de até 20 Clientes',
                                    'Relatórios Padrão',
                                    'Acesso ao Scanner Award',
                                    'Dashboard Financeiro'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                        <span className="material-symbols-outlined text-slate-500 text-lg">check</span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-5 rounded-2xl bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                                Começar Agora
                            </button>
                        </div>

                        {/* Pro */}
                        <div className="relative p-10 rounded-3xl bg-bg-card border border-primary/50 flex flex-col shadow-2xl shadow-primary/10 transform md:-translate-y-4 z-10">
                            <div className="absolute top-0 right-0 bg-primary text-bg-dark px-6 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-widest">
                                Mais Escolhido
                            </div>
                            <div className="mb-6">
                                <span className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Escala</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Plano Pro</h3>
                            <p className="text-slate-400 text-sm mb-8">Infraestrutura completa para crescer.</p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-5xl font-black text-white">1.299</span>
                                <span className="text-sm text-slate-400">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[
                                    'Gestão de até 100 Clientes',
                                    'AI Advisor Estratégico',
                                    'Relatórios Personalizáveis',
                                    'Múltiplos Usuários',
                                    'Suporte Prioritário'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white font-medium">
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-5 rounded-2xl bg-primary text-bg-dark font-black uppercase tracking-widest text-xs hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                Quero transformar minha agência
                            </button>
                        </div>

                        {/* Elite */}
                        <div className="p-10 rounded-3xl bg-bg-card border border-white/5 flex flex-col hover:border-white/20 transition-all">
                            <div className="mb-6">
                                <span className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Autoridade</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Elite White Label</h3>
                            <p className="text-slate-400 text-sm mb-8">Sua marca, seu domínio, seus clientes.</p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-5xl font-black text-white">2.399</span>
                                <span className="text-sm text-slate-400">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[
                                    'Clientes ILIMITADOS',
                                    'White Label Completo',
                                    'Domínio Próprio',
                                    'API Dedicada',
                                    'Onboarding Exclusivo'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                        <span className="material-symbols-outlined text-slate-500 text-lg">check</span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-5 rounded-2xl bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                                Falar com Consultor
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. FAQ (Strategic) */}
            <section className="py-32 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-white mb-4">Dúvidas Estratégicas</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Preciso contratar mais funcionários?",
                                a: "Não. O FL360 foi desenhado justamente para automatizar o operacional. Um único gestor consegue cuidar de dezenas de contas com nossa tecnologia, permitindo você escalar sem aumentar o custo fixo."
                            },
                            {
                                q: "Não entendo nada de milhas. O sistema ajuda?",
                                a: "O FL360 não é um curso, é uma ferramenta de gestão. Porém, nosso 'AI Advisor' sugere oportunidades. Se você tem zero conhecimento, recomendamos iniciar no plano Start para validar."
                            },
                            {
                                q: "Como funciona o White Label na prática?",
                                a: "Nós configuramos o sistema em um subdomínio seu (ex: app.suaagencia.com.br). Removemos todas as menções à FL360. Seu cliente acessa sua área de login, vê sua logo e recebe relatórios com sua marca."
                            },
                            {
                                q: "Existe fidelidade contratual?",
                                a: "Nossos planos são mensais recorrentes. Você pode cancelar a qualquer momento sem multa, apenas perdendo o acesso ao final do ciclo pago. Acreditamos na retenção pelo resultado."
                            }
                        ].map((item, i) => (
                            <div key={i} className="border border-white/5 rounded-2xl bg-bg-card overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <span className="font-bold text-white text-lg">{item.q}</span>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>
                                {openFaq === i && (
                                    <div className="p-6 pt-0 text-slate-400 text-base leading-relaxed border-t border-white/5">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. FINAL CTA */}
            <section className="py-32 px-6 relative overflow-hidden bg-bg-dark">
                <div className="absolute inset-0 bg-primary/5"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                        Gestão de milhas não é <br />complemento.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">É posicionamento estratégico.</span>
                    </h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        Comece hoje a construir a vertical mais lucrativa da sua agência.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-primary text-bg-dark text-lg font-black uppercase tracking-widest px-12 py-6 rounded-2xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 mx-auto"
                    >
                        <span>Quero transformar minha agência agora</span>
                        <span className="material-symbols-outlined">rocket_launch</span>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-bg-card">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-sm">flight_takeoff</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white/50">
                            FL360<span className="text-primary/50">MILES</span>
                        </span>
                    </div>

                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link to="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
                        <a href="mailto:contato@fl360miles.com" className="hover:text-white transition-colors">Contato</a>
                    </div>

                    <p className="text-xs text-slate-600">
                        © 2024 FL360 Miles. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
