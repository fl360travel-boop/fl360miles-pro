
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandAssets';
import { useSEO } from '../hooks/useSEO';

const Landing: React.FC = () => {
    useSEO('Gestão de Milhas para Agências', 'Transforme sua agência em uma máquina de lucro com gestão profissional de milhas. Teste grátis por 7 dias.');
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

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
                        <button onClick={() => scrollToSection('transformation')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-widest">O Método</button>
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
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Plataforma usada pelos maiores gestores do Brasil</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Transforme sua Agência em uma <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-200 to-primary animate-gradient bg-300%">Máquina de Lucro</span>
                        <br /> com Gestão Profissional de Milhas
                    </h1>

                    <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-14 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        Pare de deixar dinheiro na mesa. Centralize operações, automatize emissões e escale seu faturamento com o primeiro Sistema Operacional completo para o mercado de milhas.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full md:w-auto bg-primary text-bg-dark text-sm font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                        >
                            <span>Quero Escalar Minha Agência</span>
                            <span className="material-symbols-outlined">rocket_launch</span>
                        </button>
                        <button
                            onClick={() => scrollToSection('opportunity')}
                            className="w-full md:w-auto bg-white/5 text-white border border-white/10 text-sm font-bold uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 decoration-clone backdrop-blur-md"
                        >
                            <span>Ver Como Funciona</span>
                            <span className="material-symbols-outlined">play_circle</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-white/5 bg-white/[0.02]">
                        {[
                            { label: 'Agências Pioneiras', value: '+350' },
                            { label: 'Milhas Gerenciadas', value: '+450 Milhões' },
                            { label: 'Lucro nos Clientes', value: 'R$ 12 Mi' },
                            { label: 'ROI Médio', value: '5x' }
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. OPPORTUNITY */}
            <section id="opportunity" className="py-32 px-6 bg-Bg-dark relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-6">Oportunidade de Mercado</div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
                                Você está deixando <br /><span className="text-red-400">dinheiro na mesa</span> todos os dias.
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                87% das agências de viagens ainda não monetizam milhas corretamente. Elas dependem exclusivamente de comissões baixas em passagens pagantes, enquanto seus concorrentes estão lucrando até 3x mais usando milhas de forma estratégica.
                            </p>
                            <ul className="space-y-6">
                                {[
                                    'Sem controle centralizado das contas dos clientes',
                                    'Perdendo prazos de expiração de milhas',
                                    'Pagando mais caro em emissões por falta de estratégia',
                                    'Sem visibilidade do lucro real da operação'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-slate-300">
                                        <span className="w-6 h-6 rounded-full bg-red-400/10 flex items-center justify-center text-red-400">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-amber-600 rounded-3xl blur-2xl opacity-20"></div>
                            <div className="relative bg-bg-card border border-white/10 rounded-3xl p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-slate-400 text-sm font-medium">Potencial de Lucro Mensal</span>
                                    <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-xs uppercase tracking-wider">+300% ROI</span>
                                </div>
                                <div className="h-64 flex items-end justify-between gap-4">
                                    <div className="w-1/3 bg-white/5 rounded-t-xl h-[30%] relative group">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-slate-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Tradicional</div>
                                    </div>
                                    <div className="w-1/3 bg-white/10 rounded-t-xl h-[50%] relative group">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Amador</div>
                                    </div>
                                    <div className="w-1/3 bg-gradient-to-t from-primary to-amber-500 rounded-t-xl h-[100%] relative shadow-[0_0_30px_rgba(234,179,8,0.3)] group">
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-primary text-lg font-black bg-bg-dark border border-primary px-3 py-1 rounded-lg">FL360</div>
                                    </div>
                                </div>
                                <div className="border-t border-white/10 mt-6 pt-6 flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                                    <span>Agência Comum</span>
                                    <span>Gestor FL360</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. TRANSFORMATION */}
            <section id="transformation" className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">A Evolução da Sua Agência</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Deixe o amadorismo no passado. Entre para a nova era da gestão de milhas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                    {/* Before */}
                    <div className="p-10 rounded-3xl bg-bg-card border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-2xl">
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Antes</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400 mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined">sentiment_stressed</span>
                            O Caos Manual
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Dezenas de planilhas desconectadas',
                                'Medo constante de perder milhas expiradas',
                                'Cálculo manual de lucro e custo',
                                'Clientes inseguros pedindo comprovação',
                                'Horas perdidas cotando em múltiplos sites'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-slate-500 line-through decoration-slate-600/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* After */}
                    <div className="p-10 rounded-3xl bg-bg-card border border-primary/30 relative overflow-hidden shadow-2xl shadow-primary/5 group hover:border-primary/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 bg-primary text-bg-dark rounded-bl-2xl font-black uppercase tracking-widest text-xs">
                            Com FL360
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">verified</span>
                            Controle Total
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Dashboard centralizado Multi-CPF',
                                'Alertas automáticos de expiração e oportunidades',
                                'Cálculo automático de CPM e Margem Real',
                                'Relatórios PDF profissionais com sua marca',
                                'Integração com ferramentas de busca global'
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

            {/* 4. ECOSYSTEM */}
            <section id="ecosystem" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <div className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-6">Sistema Operacional Completo</div>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">4 Pilares de Crescimento</h2>
                        <p className="text-slate-400">Não é apenas uma ferramenta. É o motor do seu negócio.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            {
                                icon: 'psychology',
                                title: 'Inteligência',
                                subtitle: 'AI Advisor',
                                desc: 'Nossa IA analisa o perfil de cada cliente e sugere a melhor estratégia de venda ou emissão.'
                            },
                            {
                                icon: 'smart_toy',
                                title: 'Automação',
                                subtitle: 'Scanner Global',
                                desc: 'Monitore disponibilidade (Award) e preços (Cash) em tempo real, integrado às melhores fontes.'
                            },
                            {
                                icon: 'account_balance',
                                title: 'Financeiro',
                                subtitle: 'Controle de Margem',
                                desc: 'Saiba exatamente quanto pagou no milheiro e quanto lucrou em cada operação.'
                            },
                            {
                                icon: 'verified_user',
                                title: 'Marca Própria',
                                subtitle: 'White Label',
                                desc: 'Sua marca em primeiro lugar. O sistema e os relatórios levam o seu logotipo.'
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
            <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-3xl font-black text-white mb-16">
                        "Gestores comuns trabalham.<br />Gestores FL360 <span className="text-primary">escalam</span>."
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-bg-card rounded-3xl border border-white/5 text-left">
                            <div className="flex gap-1 text-primary mb-4">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                            </div>
                            <p className="text-slate-300 text-sm italic mb-6">"Antes eu demorava 2h para fechar um balanço mensal de um cliente. Hoje o FL360 faz em segundos com o relatório automático."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <div className="text-white font-bold text-sm">Carlos Mendes</div>
                                    <div className="text-slate-500 text-xs">CEO, Mendes Milhas</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-bg-card rounded-3xl border border-white/5 text-left transform md:-translate-y-4 shadow-xl border-primary/20">
                            <div className="flex gap-1 text-primary mb-4">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                            </div>
                            <p className="text-slate-300 text-sm italic mb-6">"O sistema White Label mudou o jogo. Meus clientes acham que eu desenvolvi a plataforma. Autoridade total."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <div className="text-white font-bold text-sm">Ana Paula</div>
                                    <div className="text-slate-500 text-xs">Proprietária, Viaje+</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-bg-card rounded-3xl border border-white/5 text-left">
                            <div className="flex gap-1 text-primary mb-4">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                            </div>
                            <p className="text-slate-300 text-sm italic mb-6">"A integração com Seats.aero dentro da plataforma economiza horas da minha equipe. Fluxo perfeito."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                                <div>
                                    <div className="text-white font-bold text-sm">Roberto D.</div>
                                    <div className="text-slate-500 text-xs">Gestor de Ativos</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 pt-10 border-t border-white/5 flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                        {['livelo', 'latam', 'smiles', 'azul', 'esfera'].map((brand) => (
                            <BrandLogo key={brand} name={brand} className="h-6 w-auto text-white" />
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. PLANS */}
            <section id="plans" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Qual o estágio da sua agência?</h2>
                        <p className="text-slate-400">Escolha o plano ideal para o seu momento de crescimento.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Start */}
                        <div className="p-10 rounded-3xl bg-bg-card border border-white/5 flex flex-col hover:border-white/20 transition-all">
                            <div className="mb-6">
                                <span className="bg-white/5 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Iniciante</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Plano Start</h3>
                            <p className="text-slate-400 text-sm mb-8">Para quem está começando a gerir as primeiras contas.</p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-5xl font-black text-white">97</span>
                                <span className="text-sm text-slate-400">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[
                                    'Gestão de até 20 CPFs',
                                    'Relatórios Básicos',
                                    'Suporte por E-mail',
                                    'Acesso a Cotações Manuais'
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
                                Recomendado
                            </div>
                            <div className="mb-6">
                                <span className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Profissional</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Plano Pro</h3>
                            <p className="text-slate-400 text-sm mb-8">Para agências que buscam escala e automação.</p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-5xl font-black text-white">297</span>
                                <span className="text-sm text-slate-400">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[
                                    'Gestão de até 100 CPFs',
                                    'AI Advisor Completo',
                                    'Scanner Award Integrado',
                                    'Relatórios Personalizados',
                                    'Suporte Prioritário'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white font-medium">
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-5 rounded-2xl bg-primary text-bg-dark font-black uppercase tracking-widest text-xs hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                Testar Grátis por 7 Dias
                            </button>
                        </div>

                        {/* Elite */}
                        <div className="p-10 rounded-3xl bg-bg-card border border-white/5 flex flex-col hover:border-white/20 transition-all">
                            <div className="mb-6">
                                <span className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Consolidada</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Elite White Label</h3>
                            <p className="text-slate-400 text-sm mb-8">Sua marca, seu domínio, seus clientes.</p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-5xl font-black text-white">997</span>
                                <span className="text-sm text-slate-400">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[
                                    'Clientes ILIMITADOS',
                                    'Plataforma White Label Total',
                                    'Domínio Personalizado',
                                    'Gerente de Contas Dedicado',
                                    'API para Integrações'
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

            {/* 7. FAQ / OBJECTIONS */}
            <section className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-white mb-4">Dúvidas Frequentes</h2>
                        <p className="text-slate-400">Tirando o risco da sua decisão.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Funciona para agência pequena?",
                                a: "Sim. O sistema foi desenhado para crescer com você. O plano Start é perfeito para quem tem até 20 contas, eliminando planilhas desde o primeiro dia."
                            },
                            {
                                q: "Preciso já saber vender milhas?",
                                a: "Não necessariamente. O FL360 é uma ferramenta de gestão, mas nosso AI Advisor sugere oportunidades que te ajudam a tomar decisões lucrativas."
                            },
                            {
                                q: "É seguro colocar os dados dos clientes?",
                                a: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos todas as normas da LGPD. Seus dados são isolados e protegidos."
                            },
                            {
                                q: "Posso cancelar se não gostar?",
                                a: "Sim. Oferecemos 7 dias de garantia incondicional no teste, e você pode cancelar a assinatura anual a qualquer momento (cancelando a renovação)."
                            },
                            {
                                q: "Como funciona o White Label?",
                                a: "No plano Elite, configuramos o sistema no seu domínio (ex: sistema.suaagencia.com) com suas cores e logo. Seu cliente vê apenas a sua marca."
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
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                        Ou você profissionaliza agora,<br />
                        ou continuará competindo por <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">margem baixa em passagens.</span>
                    </h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        A decisão é sua: continuar no amadorismo ou construir uma operação escalável e lucrativa com FL360.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-primary text-bg-dark text-lg font-black uppercase tracking-widest px-12 py-6 rounded-2xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 mx-auto"
                    >
                        <span>Começar Teste Estratégico de 7 Dias</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                    <p className="mt-6 text-sm text-slate-500 font-medium">Sem compromisso. Cancele quando quiser.</p>
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
