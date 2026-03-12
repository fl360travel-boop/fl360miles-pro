
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandAssets';
import { useSEO } from '../hooks/useSEO';
import { RevealOnScroll } from '../components/RevealOnScroll';

import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
    useSEO('Gestão de Milhas para Agências', 'O Sistema Operacional que transforma milhas em margem de lucro real.');
    const navigate = useNavigate();
    const { session } = useAuth();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Tension Calculator State
    const [clients, setClients] = useState(10);
    const [lostOpportunity, setLostOpportunity] = useState(1500); // Perda média por cliente
    const [totalLoss, setTotalLoss] = useState(0);

    useEffect(() => {
        setTotalLoss(clients * lostOpportunity);
    }, [clients, lostOpportunity]);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-bg-dark text-white selection:bg-primary selection:text-bg-dark overflow-x-hidden font-sans">
            {/* Navbar Minimalista */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                        <span className="material-symbols-outlined text-primary text-xl">flight_takeoff</span>
                        <span className="text-xl font-bold tracking-tight text-white">
                            FL360<span className="text-primary">MILES</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('levels')} className="text-xs font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Níveis</button>
                        <button onClick={() => scrollToSection('calculator')} className="text-xs font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Custo da Não-Gestão</button>
                        <button onClick={() => scrollToSection('os')} className="text-xs font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Sistema</button>
                    </div>

                    <button
                        onClick={() => session ? navigate('/dashboard') : navigate('/login')}
                        className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-primary hover:text-bg-dark transition-all"
                    >
                        {session ? 'Dashboard' : 'Login'}
                    </button>
                </div>
            </nav>

            {/* 1. HERO - QUEBRA DE PADRÃO (Minimalista & Tensão) */}
            <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-bg-dark to-bg-dark opacity-40"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10 pt-20">
                    <RevealOnScroll delay={200}>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-black text-white mb-10 leading-[1.1] tracking-tight">
                            Enquanto você vende passagens, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">alguém está vendendo margem.</span>
                        </h1>
                    </RevealOnScroll>

                    <RevealOnScroll delay={500}>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-16 font-light leading-relaxed">
                            O mercado de milhas não é tendência.<br />
                            <span className="text-white font-medium">É reposicionamento estratégico.</span>
                        </p>
                    </RevealOnScroll>

                    <RevealOnScroll delay={800}>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => scrollToSection('levels')}
                                className="group relative inline-flex items-center gap-4 px-8 py-4 bg-primary text-bg-dark rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(226,190,106,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                            >
                                <span className="relative z-10">Ver Planos e Preços</span>
                                <span className="material-symbols-outlined text-bg-dark group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                            <button
                                onClick={() => scrollToSection('calculator')}
                                className="group relative inline-flex items-center gap-4 px-8 py-4 bg-transparent border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 overflow-hidden"
                            >
                                <span className="relative z-10">Entender o Impacto</span>
                                <span className="material-symbols-outlined text-primary group-hover:translate-y-1 transition-transform">arrow_downward</span>
                            </button>
                        </div>
                    </RevealOnScroll>
                </div>

                {/* Logos de Autoridade na Dobra */}
                <div className="absolute bottom-10 left-0 right-0 w-full z-20">
                    <RevealOnScroll delay={1000}>
                        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-6">Integrado e otimizado para os maiores players</p>
                            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                                {['livelo', 'latam', 'smiles', 'azul', 'esfera'].map((brand, i) => (
                                    <BrandLogo key={brand} name={brand} className="h-6 md:h-8 w-auto text-white transition-transform hover:scale-110" />
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Mockup do Sistema (Plataforma Tátil) */}
            <section className="relative z-20 -mt-20 md:-mt-32 pb-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll delay={300}>
                        <div className="rounded-2xl border border-white/10 bg-bg-card/90 backdrop-blur-xl p-2 md:p-4 shadow-2xl shadow-primary/5 relative group overflow-hidden">
                            {/* Reflexo */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-xl"></div>
                            <div className="w-full aspect-video bg-[#0B0F19] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                                {/* Imagem Real do Sistema - Insira dashboard-preview.png na pasta public */}
                                <img 
                                    src="/Imagem 4.png" 
                                    alt="Painel de Controle FL360 MOCKUP" 
                                    className="w-full object-cover min-h-[300px] md:min-h-[500px]"
                                    onError={(e) => {
                                        // Fallback se a imagem não for encontrada
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop';
                                    }}
                                />
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 2. MOVIMENTO DE CONSCIÊNCIA (3 NÍVEIS) */}
            <section id="levels" className="py-32 px-6 bg-bg-surface relative border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-24">
                            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Evolução do Mercado</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white">Qual jogo você está jogando?</h2>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {/* Nível 1 */}
                        <RevealOnScroll delay={200} direction="up">
                            <div className="group h-full p-10 rounded-3xl bg-bg-card border border-white/5 hover:border-white/10 transition-all duration-500 opacity-60 hover:opacity-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <span className="text-6xl font-black text-slate-700">01</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-300 mb-6">Agência Tradicional</h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500 border-l-2 border-slate-700 pl-4">Margem limitada pela Cia Aérea</p>
                                    <p className="text-sm text-slate-500 border-l-2 border-slate-700 pl-4">Dependência de comissão fixa</p>
                                    <p className="text-sm text-slate-500 border-l-2 border-slate-700 pl-4">Cliente "leiloeiro" de preço</p>
                                </div>
                                <div className="mt-10 pt-6 border-t border-white/5 text-xs text-red-400 uppercase tracking-widest font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    Risco de Extinção
                                </div>
                            </div>
                        </RevealOnScroll>

                        {/* Nível 2 */}
                        <RevealOnScroll delay={400} direction="up">
                            <div className="group h-full p-10 rounded-3xl bg-bg-card border border-primary/20 hover:border-primary/50 transition-all duration-500 relative overflow-hidden shadow-2xl shadow-black/50 hover:shadow-primary/5">
                                <div className="absolute top-0 right-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity">
                                    <span className="text-6xl font-black text-primary/20">02</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-6">Agência Estratégica</h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-300 border-l-2 border-primary/50 pl-4">Monetiza milhas do cliente</p>
                                    <p className="text-sm text-slate-300 border-l-2 border-primary/50 pl-4">Aumenta ticket médio</p>
                                    <p className="text-sm text-slate-300 border-l-2 border-primary/50 pl-4">Começa a fidelizar</p>
                                </div>
                                <div className="mt-10 pt-6 border-t border-white/5 text-xs text-primary uppercase tracking-widest font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                    Zona de Crescimento
                                </div>
                            </div>
                        </RevealOnScroll>

                        {/* Nível 3 */}
                        <RevealOnScroll delay={600} direction="up">
                            <div className="group h-full p-10 rounded-3xl bg-gradient-to-br from-bg-card to-bg-dark border border-primary/40 hover:border-primary transition-all duration-500 relative overflow-hidden ring-1 ring-primary/20 hover:ring-primary/50 transform hover:-translate-y-2">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="absolute top-0 right-0 p-6">
                                    <span className="text-6xl font-black text-primary/40 group-hover:text-primary transition-colors duration-500">03</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    Agência Estruturada
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary text-bg-dark uppercase tracking-widest">FL360</span>
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <p className="text-sm text-white font-medium border-l-2 border-primary pl-4">Escala com sistema próprio</p>
                                    <p className="text-sm text-white font-medium border-l-2 border-primary pl-4">Automatiza processos manuais</p>
                                    <p className="text-sm text-white font-medium border-l-2 border-primary pl-4">Receita Recorrente Previsível</p>
                                </div>
                                <div className="mt-10 pt-6 border-t border-white/10 text-xs text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    Domínio de Mercado
                                </div>
                                <button onClick={() => navigate('/signup')} className="mt-8 w-full py-4 rounded-xl bg-primary text-bg-dark font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">
                                    Quero estar aqui
                                </button>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* 3. TENSÃO FINANCEIRA (Perda Evitada) */}
            <section id="calculator" className="py-32 px-6 bg-bg-dark relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                                    Quanto custa <span className="text-red-500">não estruturar</span> sua gestão de milhas?
                                </h2>
                                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                                    Não estamos falando do custo do sistema. Estamos falando do dinheiro que você deixa na mesa todos os meses por não ter a infraestrutura para capturar essa margem.
                                </p>
                                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 inline-block mx-auto md:mx-0">
                                    <div className="flex items-center justify-center md:justify-start gap-3 text-red-400 font-bold uppercase tracking-widest text-xs mb-2">
                                        <span className="material-symbols-outlined text-lg">money_off</span>
                                        Dinheiro Perdido / Mês
                                    </div>
                                    <div className="text-3xl md:text-4xl font-black text-white">
                                        R$ {totalLoss.toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-bg-surface p-10 rounded-3xl border border-white/10 shadow-2xl">
                                <div className="space-y-10">
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-slate-500 font-bold text-xs uppercase tracking-widest">Sua Base de Clientes (Ativos)</label>
                                            <span className="text-white font-black text-xl">{clients}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="100"
                                            value={clients}
                                            onChange={(e) => setClients(parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-slate-500 font-bold text-xs uppercase tracking-widest">Oportunidade Perdida / Cliente</label>
                                            <span className="text-white font-black text-xl">R$ {lostOpportunity.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="500" max="5000" step="100"
                                            value={lostOpportunity}
                                            onChange={(e) => setLostOpportunity(parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400"
                                        />
                                        <p className="text-[10px] text-slate-600 mt-3">*Baseado na média de lucro que agências FL360 geram por cliente.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 4. DIAGNÓSTICO ESTRATÉGICO (Inevitabilidade) */}
            <section className="py-24 px-6 bg-bg-dark relative border-t border-white/5">
                <div className="max-w-3xl mx-auto text-center">
                    <RevealOnScroll>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">
                            "Milhas não são produto.<br />
                            <span className="text-primary">São alavancagem.</span>"
                        </h2>
                    </RevealOnScroll>

                    <RevealOnScroll delay={200}>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 md:p-12 text-left mb-12">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Diagnóstico Estratégico</h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-[10px] text-slate-400">1</span>
                                    </div>
                                    <div>
                                        <p className="text-lg text-white font-medium">Sua agência tem receita recorrente previsível?</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-[10px] text-slate-400">2</span>
                                    </div>
                                    <div>
                                        <p className="text-lg text-white font-medium">Você controla sua margem ou depende de comissão?</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-[10px] text-slate-400">3</span>
                                    </div>
                                    <div>
                                        <p className="text-lg text-white font-medium">Sua operação de milhas é automatizada ou manual?</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <p className="text-slate-400 text-sm italic">
                                    <span className="text-red-400 font-bold not-italic">⚠️ Alerta:</span> Se respondeu <strong className="text-white">"não"</strong> para 2 ou mais, você está operando no <strong className="text-white">Modelo Antigo</strong>.
                                </p>
                            </div>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={400}>
                        <p className="text-xl text-slate-300 font-light max-w-2xl mx-auto">
                            Se você ainda não estruturou milhas, <strong className="text-white font-bold">está competindo errado.</strong>
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 5. REPOSICIONAMENTO (OS - 4 Pilares) */}
            <section id="os" className="py-32 px-6 bg-bg-surface relative border-y border-white/5">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-24">
                            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Infraestrutura</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 max-w-3xl mx-auto">Sistema Operacional da Gestão de Milhas</h2>
                            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Não é uma ferramenta. É a espinha dorsal da sua nova vertical de receita.</p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: "Inteligência",
                                icon: "psychology",
                                desc: "AI Advisor que identifica oportunidades ocultas.",
                                detail: "Transforma dados em estratégia."
                            },
                            {
                                title: "Automação",
                                icon: "smart_toy",
                                desc: "Scanner global de disponibilidade e preços.",
                                detail: "Elimina o trabalho manual."
                            },
                            {
                                title: "Controle",
                                icon: "account_balance",
                                desc: "Gestão financeira de ativos e margem real.",
                                detail: "Domínio total do fluxo de caixa."
                            },
                            {
                                title: "Marca",
                                icon: "verified_user",
                                desc: "White Label completo para autoridade.",
                                detail: "Seu cliente vê apenas você."
                            }
                        ].map((item, i) => (
                            <RevealOnScroll key={i} delay={i * 200}>
                                <div className="h-full min-h-[220px] p-8 rounded-2xl bg-bg-card border border-white/5 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-2 flex flex-col">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform shrink-0">
                                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-slate-400 text-sm mb-4 flex-1">{item.desc}</p>
                                    <p className="text-xs text-primary/70 font-medium uppercase tracking-wider mt-auto">{item.detail}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. AUTORIDADE (Movimento) */}
            <section className="py-32 px-6 bg-bg-dark text-center">
                <div className="max-w-4xl mx-auto">
                    <RevealOnScroll>
                        <h2 className="text-3xl font-black text-white mb-12">
                            "Agências pioneiras já migraram para o modelo estruturado."
                        </h2>
                    </RevealOnScroll>

                    <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                        {['livelo', 'latam', 'smiles', 'azul', 'esfera'].map((brand, i) => (
                            <RevealOnScroll key={brand} delay={i * 100}>
                                <BrandLogo name={brand} className="h-8 w-auto text-white" />
                            </RevealOnScroll>
                        ))}
                    </div>

                    <RevealOnScroll delay={300}>
                        <div className="mt-16 mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-8 border border-white/5 bg-white/[0.02] rounded-2xl text-left">
                                <p className="text-slate-300 text-base italic leading-relaxed mb-6">
                                    "A diferença entre minha agência antes e depois do FL360 não é só o lucro. É a paz de espírito de ter controle total sobre uma operação que antes era caos."
                                </p>
                                <div className="text-sm font-bold text-white">Ricardo D.</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">CEO TravelCorp</div>
                            </div>
                            
                            <div className="p-8 border border-white/5 bg-white/[0.02] rounded-2xl text-left">
                                <p className="text-slate-300 text-base italic leading-relaxed mb-6">
                                    "Tínhamos milhares de reais expirando na conta dos clientes sem saber. O sistema mapeou as datas e transformou essa 'perda' em emissões e margem real."
                                </p>
                                <div className="text-sm font-bold text-white">Marcela C.</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Founders Viagens</div>
                            </div>

                            <div className="p-8 border border-white/5 bg-white/[0.02] rounded-2xl text-left">
                                <p className="text-slate-300 text-base italic leading-relaxed mb-6">
                                    "Finalmente abandonei as dezenas de planilhas de clientes. Tudo agora é visual e automático. O fechamento do mês ficou ridículo de tão fácil."
                                </p>
                                <div className="text-sm font-bold text-white">André L.</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Diretor VoeMais</div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* MERCADO - Dados Quantitativos */}
            <section className="py-24 px-6 bg-bg-surface border-t border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Mercado Brasileiro de Milhagem</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">O dinheiro já está circulando.<br /><span className="text-primary">A questão é: quem está capturando?</span></h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Enquanto você lê isso, bilhões em milhas expiram sem gerar margem para nenhuma agência. Isso vai mudar — com ou sem você.</p>
                        </div>
                    </RevealOnScroll>

                    {/* Números de Mercado */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {[
                            { value: "+100 mi", label: "de CPFs cadastrados em programas de fidelidade no Brasil", icon: "monitoring", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
                            { value: "33%", label: "dos pontos emitidos expiram sem ser resgatados — dinheiro que some sem gerar valor", icon: "trending_down", color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5" },
                            { value: "R$ 300-600", label: "de margem adicional por cliente ativo/mês que agências estruturadas capturam — e que a maioria ignora", icon: "savings", color: "text-primary", border: "border-primary/20", bg: "bg-primary/5" },
                        ].map((stat, i) => (
                            <RevealOnScroll key={i} delay={i * 150}>
                                <div className={`p-8 rounded-2xl border ${stat.border} ${stat.bg} text-center group hover:scale-105 transition-transform duration-300`}>
                                    <span className={`material-symbols-outlined text-4xl ${stat.color} mb-4 block`}>{stat.icon}</span>
                                    <div className={`text-4xl md:text-5xl font-black ${stat.color} mb-3`}>{stat.value}</div>
                                    <p className="text-slate-400 text-sm leading-relaxed">{stat.label}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>

                    {/* Textos de Dor com Setas */}
                    <RevealOnScroll delay={200}>
                        <div className="bg-bg-card border border-white/5 rounded-3xl p-10 md:p-14">
                            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-8 text-center">Reconhece algum desses cenários?</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { pain: "Você não sabe exatamente quanto lucrou com milhas no último mês", arrow: true },
                                    { pain: "Seu cliente acumula pontos mas você não tem sistema para gerenciar isso", arrow: true },
                                    { pain: "Você perde negócios para concorrentes que oferecem resgate estruturado", arrow: true },
                                    { pain: "A operação depende de você — se você para, tudo para", arrow: true },
                                    { pain: "Você não tem como escalar sem contratar mais gente", arrow: true },
                                    { pain: "Milhas expiram na carteira dos seus clientes sem você saber", arrow: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all group">
                                        <div className="shrink-0 mt-0.5">
                                            <span className="material-symbols-outlined text-red-400 text-lg group-hover:animate-bounce">arrow_right</span>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed">{item.pain}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                <p className="text-white font-bold text-lg">Se você marcou 2 ou mais — <span className="text-primary">é exatamente para isso que o FL360 existe.</span></p>
                                <button
                                    onClick={() => document.getElementById('levels')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="flex items-center gap-2 px-8 py-4 bg-primary text-bg-dark font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all whitespace-nowrap"
                                >
                                    Ver Solução
                                    <span className="material-symbols-outlined text-base">arrow_downward</span>
                                </button>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 5.5 FAQ - QUEBRA DE OBJEÇÕES */}
            <section className="py-32 px-6 bg-bg-dark relative border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Perguntas Frequentes</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ainda gerenciando na planilha e caderninho?</h2>
                            <p className="text-slate-400 text-lg">Entenda como o FL360 transforma o amadorismo em uma operação elegante e lucrativa.</p>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Por que eu preciso de um sistema se uso planilhas do Excel gratuitamente?",
                                a: "Planilhas dependem de alimentação manual constância. E se você esquecer de atualizar? E se o cliente te ligar no fim de semana perguntando o saldo? Com o FL360, você substitui o amadorismo da planilha por um painel elegante, profissional e sempre atualizado. Você economiza horas de trabalho braçal e eleva a percepção de valor do seu cliente."
                            },
                            {
                                q: "Como o sistema ajuda a não perder milhas expiradas?",
                                a: "O FL360 monitora constantemente as datas de expiração das milhas cadastradas no sistema. Ele funciona como um alarme preditivo, permitindo que você entre em contato com seu cliente antes dos pontos vencerem para sugerir uma emissão, gerando receita onde antes haveria apenas perda."
                            },
                            {
                                q: "A plataforma faz a emissão de passagens aéreas e venda direta de balcão?",
                                a: "Não. Nós somos um Sistema Operacional de Gestão. Não competimos com consolidadores, companhias aéreas ou plataformas de venda de milhas do mercado (ex: MaxMilhas). Nosso foco é 100% no B2B: fornecer a inteligência de negócios para a sua agência organizar, relatar e monetizar a carteira de pontos dos SEUS clientes final de forma elegante."
                            },
                            {
                                q: "Consigo cancelar a qualquer momento?",
                                a: "Sim, sem fidelidade escondida. O modelo é SaaS (Software as a Service) por assinatura mensal. Se a plataforma não gerar no mínimo 5x mais lucro do que custa, você pode cancelar a assinatura direto no painel com um clique."
                            }
                        ].map((faq, i) => (
                            <RevealOnScroll key={i} delay={i * 100}>
                                <div 
                                    className={`border border-white/5 rounded-2xl bg-bg-card overflow-hidden transition-all duration-300 ${openFaq === i ? 'border-primary/30 shadow-[0_0_30px_rgba(226,190,106,0.1)]' : 'hover:border-white/10'}`}
                                >
                                    <button 
                                        onClick={() => toggleFaq(i)}
                                        className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none focus:ring-none"
                                    >
                                        <h3 className={`text-lg md:text-xl font-bold pr-8 transition-colors ${openFaq === i ? 'text-primary' : 'text-slate-300'}`}>
                                            {faq.q}
                                        </h3>
                                        <span className={`material-symbols-outlined shrink-0 text-2xl transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-primary' : 'text-slate-500'}`}>
                                            keyboard_arrow_down
                                        </span>
                                    </button>
                                    
                                    <div 
                                        className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div className="p-6 md:p-8 pt-0 text-slate-400 leading-relaxed border-t border-white/5">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. INVESTIMENTO (Ancoragem) */}
            <section className="py-32 px-6 bg-bg-dark border-t border-white/5 relative">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-20">
                            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Investimento no Negócio</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Escolha seu Nível de Acesso</h2>
                            <p className="text-slate-400">O custo de oportunidade de não começar hoje é muito maior.</p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Start */}
                        <RevealOnScroll delay={200}>
                            <div className="p-8 h-full min-h-[520px] rounded-2xl bg-bg-card border border-white/5 hover:border-white/10 transition-all group flex flex-col">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Nível 1</div>
                                <h3 className="text-xl font-bold text-white mb-2">Plano Estrutura Inicial</h3>
                                <p className="text-slate-400 text-sm mb-6 h-10">Para agências que querem abrir a vertical de milhas com organização.</p>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-sm text-slate-400">R$</span>
                                    <span className="text-4xl font-black text-white">799,99</span>
                                    <span className="text-sm text-slate-400">/mês</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-slate-400"><span className="material-symbols-outlined text-primary text-sm">check</span>Até 20 Clientes</li>
                                    <li className="flex items-center gap-3 text-sm text-slate-400"><span className="material-symbols-outlined text-primary text-sm">check</span>Scanner Award</li>
                                    <li className="flex items-center gap-3 text-sm text-slate-400"><span className="material-symbols-outlined text-primary text-sm">check</span>Relatórios Padrão</li>
                                </ul>
                                <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs hover:bg-white hover:text-bg-dark transition-all">Iniciar Validação</button>
                            </div>
                        </RevealOnScroll>

                        {/* Pro */}
                        <RevealOnScroll delay={400}>
                            <div className="p-8 h-full min-h-[520px] rounded-2xl bg-bg-card border border-primary/30 relative shadow-2xl shadow-primary/5 group transform md:-translate-y-4 flex flex-col overflow-hidden">
                                <div className="absolute top-0 right-0 bg-primary text-bg-dark px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl rounded-tr-2xl">Mais Escolhido</div>
                                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Nível 2</div>
                                <h3 className="text-xl font-bold text-white mb-2">Plano Escala Profissional</h3>
                                <p className="text-slate-300 text-sm mb-6 h-10">Para agências que já vendem milhas e querem previsibilidade.</p>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-sm text-slate-400">R$</span>
                                    <span className="text-4xl font-black text-white">1.299,00</span>
                                    <span className="text-sm text-slate-400">/mês</span>
                                </div>
                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide mb-6">
                                    Recuperação média: 1 a 2 clientes ativos
                                </p>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-sm">check_circle</span>Até 100 Clientes</li>
                                    <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-sm">check_circle</span>AI Advisor Completo</li>
                                    <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-sm">check_circle</span>Múltiplos Usuários</li>
                                </ul>
                                <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl bg-primary text-bg-dark font-bold uppercase text-xs hover:bg-white transition-all shadow-lg shadow-primary/20">Acessar Sistema</button>
                            </div>
                        </RevealOnScroll>

                        {/* Elite */}
                        <RevealOnScroll delay={600}>
                            <div className="p-8 h-full min-h-[520px] rounded-2xl bg-bg-card border border-white/5 hover:border-primary/30 transition-all group flex flex-col">
                                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Nível 3</div>
                                <h3 className="text-xl font-bold text-white mb-2">Plano Marca Própria</h3>
                                <p className="text-slate-400 text-sm mb-6 h-10">Para agências que querem posicionamento e autoridade (White Label).</p>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-sm text-slate-400">R$</span>
                                    <span className="text-4xl font-black text-white">2.399,00</span>
                                    <span className="text-sm text-slate-400">/mês</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-3 text-sm text-slate-400"><span className="material-symbols-outlined text-primary text-sm">check</span>Clientes Ilimitados</li>
                                    <li className="flex items-center gap-3 text-sm text-slate-400"><span className="material-symbols-outlined text-primary text-sm">check</span>White Label Total</li>
                                    <li className="flex items-center gap-3 text-sm text-slate-400"><span className="material-symbols-outlined text-primary text-sm">check</span>API Dedicada</li>
                                </ul>
                                <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs hover:bg-white hover:text-bg-dark transition-all">Falar com Consultor</button>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* 6. ESCASSEZ & POLARIZAÇÃO (CTA FINAL) */}
            <section className="py-32 px-6 relative overflow-hidden flex items-center justify-center min-h-[80vh]">
                <div className="absolute inset-0 bg-bg-card"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-bg-dark to-bg-dark opacity-60"></div>

                <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
                    <RevealOnScroll>
                        <div className="mb-12 flex justify-center w-full">
                            <span className="px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse-glow">
                                Seleção Limitada de Agências
                            </span>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={200}>
                        <div className="w-full flex justify-center">
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-10 leading-tight text-center">
                                Você pode continuar <br />competindo por comissão.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Ou pode estruturar margem.</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={400}>
                        <div className="w-full flex justify-center">
                            <p className="text-xl text-slate-400 mb-16 max-w-2xl text-center font-light">
                                Estamos estruturando um número limitado de novas agências por ciclo para manter nosso padrão estratégico.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={600}>
                        <div className="w-full flex flex-col items-center justify-center gap-6">
                            <button
                                onClick={() => navigate('/signup')}
                                className="bg-primary text-bg-dark text-lg font-black uppercase tracking-[0.15em] px-12 py-6 rounded-none hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(226,190,106,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] min-w-[300px] text-center"
                            >
                                Estruturar Minha Agência Agora
                            </button>
                            <span className="text-xs text-slate-600 uppercase tracking-widest text-center">Acesso Imediato ao Sistema Operacional</span>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Footer Minimalista */}
            <footer className="py-8 border-t border-white/5 bg-bg-dark text-center">
                <div className="flex items-center justify-center gap-4 mb-3">
                    <Link to="/terms" className="text-[10px] text-slate-500 hover:text-primary uppercase tracking-widest transition-colors">Termos de Uso</Link>
                    <span className="text-slate-700">•</span>
                    <Link to="/privacy" className="text-[10px] text-slate-500 hover:text-primary uppercase tracking-widest transition-colors">Política de Privacidade</Link>
                </div>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                    © 2026 FL360 Miles. Infraestrutura para Agências de Elite.
                </p>
            </footer>
        </div>
    );
};

export default Landing;
