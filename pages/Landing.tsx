
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandAssets';
import { useSEO } from '../hooks/useSEO';
import { RevealOnScroll } from '../components/RevealOnScroll';

const Landing: React.FC = () => {
    useSEO('FL360 Margin OS™', 'Infraestrutura Tecnológica Proprietária para Orquestração de Margem.');
    const navigate = useNavigate();

    // Tension Calculator State
    const [clients, setClients] = useState(10);
    const [margin, setMargin] = useState(1500);
    const [revenue, setRevenue] = useState(0);

    useEffect(() => {
        setRevenue(clients * margin);
    }, [clients, margin]);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-bg-dark text-slate-200 selection:bg-primary/30 selection:text-white overflow-x-hidden font-sans">
            {/* Grid Background */}
            <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none z-0"></div>

            {/* Navbar Tech */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-sm">hub</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white font-mono">
                            FL360<span className="text-primary">_OS</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {['Arquitetura', 'Simulação', 'Investimento'].map((item) => (
                            <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-xs font-mono text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
                                {item}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-mono px-6 py-2 rounded transition-all"
                    >
                        Login_
                    </button>
                </div>
            </nav>

            {/* 1. HERO - PROVOCAÇÃO (Tech/Minimal) */}
            <section className="relative min-h-screen flex items-center justify-center px-6 z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <RevealOnScroll>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-mono mb-8 tracking-widest uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            System Operational
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={200}>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
                            Enquanto sua agência vende passagens, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-200 to-primary animate-pulse-glow">outras estão vendendo margem.</span>
                        </h1>
                    </RevealOnScroll>

                    <RevealOnScroll delay={400}>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
                            Infraestrutura Tecnológica Proprietária para <span className="text-white font-medium">Orquestração de Margem</span> em Agências de Viagens.
                        </p>
                    </RevealOnScroll>

                    <RevealOnScroll delay={600}>
                        <button
                            onClick={() => scrollToSection('revelacao')}
                            className="group relative inline-flex items-center gap-4 px-8 py-4 bg-primary text-bg-dark font-mono text-xs font-bold uppercase tracking-widest hover:bg-white transition-all duration-300"
                        >
                            <span>Entender essa mudança</span>
                            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 2. REVELAÇÃO (Modelo Antigo vs Margin OS) */}
            <section id="revelacao" className="py-32 px-6 relative z-10 border-t border-white/5 bg-bg-dark/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-20">
                            <h2 className="text-3xl font-bold text-white mb-4">A Transição de Mercado</h2>
                            <p className="text-slate-400 font-mono text-sm">Detectando padrão de obsolescência...</p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Old Model */}
                        <RevealOnScroll direction="right">
                            <div className="p-10 border border-white/5 rounded-none bg-white/[0.02] grayscale opacity-60">
                                <h3 className="text-xl font-mono text-slate-500 mb-8 border-b border-white/5 pb-4">legacy_model.exe</h3>
                                <ul className="space-y-6">
                                    <li className="flex items-center gap-4 text-slate-500">
                                        <span className="material-symbols-outlined">close</span>
                                        Comissão Aérea (Limitada)
                                    </li>
                                    <li className="flex items-center gap-4 text-slate-500">
                                        <span className="material-symbols-outlined">close</span>
                                        Margem Comprimida
                                    </li>
                                    <li className="flex items-center gap-4 text-slate-500">
                                        <span className="material-symbols-outlined">close</span>
                                        Guerra de Preços
                                    </li>
                                </ul>
                            </div>
                        </RevealOnScroll>

                        {/* New Model */}
                        <RevealOnScroll direction="left" delay={200}>
                            <div className="p-10 border border-primary/30 bg-primary/[0.02] relative">
                                <div className="absolute top-0 right-0 p-2">
                                    <span className="bg-primary text-bg-dark text-[10px] font-mono px-2 py-1 uppercase font-bold">New Standard</span>
                                </div>
                                <h3 className="text-xl font-mono text-primary mb-8 border-b border-primary/20 pb-4">margin_os.sys</h3>
                                <ul className="space-y-6">
                                    <li className="flex items-center gap-4 text-white">
                                        <span className="material-symbols-outlined text-primary">check</span>
                                        Monetização de Ativos (Milhas)
                                    </li>
                                    <li className="flex items-center gap-4 text-white">
                                        <span className="material-symbols-outlined text-primary">check</span>
                                        Receita Previsível (Recorrência)
                                    </li>
                                    <li className="flex items-center gap-4 text-white">
                                        <span className="material-symbols-outlined text-primary">check</span>
                                        Controle Total de Margem
                                    </li>
                                </ul>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* 3. ARQUITETURA (Camadas) */}
            <section id="arquitetura" className="py-32 px-6 relative z-10 bg-bg-surface border-y border-white/5">
                <div className="max-w-5xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-24">
                            <span className="text-primary font-mono text-xs uppercase tracking-widest mb-4 block">System Architecture</span>
                            <h2 className="text-4xl font-bold text-white mb-6">FL360 Margin OS™</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Não é um software. É um ecossistema de camadas integradas projetado para performance.</p>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-primary via-primary/50 to-primary hidden md:block"></div>

                        {[
                            { name: "Layer 1: Engine de Inteligência", desc: "Algoritmos de precificação e busca de disponibilidade global.", icon: "psychology" },
                            { name: "Layer 2: Automação Multi-Conta", desc: "Gerenciamento massivo de ativos sem intervenção manual.", icon: "settings_suggest" },
                            { name: "Layer 3: Data Layer Financeira", desc: "Controle de fluxo de caixa, precificação dinâmica e ROI.", icon: "data_usage" },
                            { name: "Layer 4: Infraestrutura White Label", desc: "Deploy da sua marca sobre nossa tecnologia.", icon: "domain" }
                        ].map((layer, i) => (
                            <RevealOnScroll key={i} delay={i * 150} direction="up">
                                <div className="ml-0 md:ml-16 p-8 bg-bg-card border border-white/5 hover:border-primary/50 transition-all duration-500 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="w-12 h-12 bg-bg-dark border border-white/10 rounded flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary transaction-colors">
                                            <span className="material-symbols-outlined">{layer.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-mono font-bold text-white mb-2 group-hover:text-primary transition-colors">{layer.name}</h3>
                                            <p className="text-slate-400 text-sm">{layer.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. TENSÃO (Terminal Calculator) */}
            <section id="simulação" className="py-32 px-6 bg-bg-dark z-10 relative">
                <div className="max-w-4xl mx-auto">
                    <RevealOnScroll>
                        <div className="border border-white/10 bg-black rounded-lg overflow-hidden font-mono shadow-2xl">
                            <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="ml-4 text-xs text-slate-500">loss_calculator.sh</span>
                            </div>

                            <div className="p-8 md:p-12">
                                <div className="mb-8">
                                    <p className="text-emerald-500 mb-2">$ init_simulation</p>
                                    <h3 className="text-2xl text-white font-bold mb-4">Cálculo de Custo de Oportunidade</h3>
                                    <p className="text-slate-400 text-sm">Analisando base instalada e potencial de margem perdido...</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-widest block mb-2">Base de Clientes Ativos</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range" min="1" max="100" value={clients}
                                                onChange={(e) => setClients(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/20 appearance-none cursor-pointer accent-primary"
                                            />
                                            <span className="text-xl font-bold text-white min-w-[3ch]">{clients}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-widest block mb-2">Potencial de Margem / Cliente</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range" min="500" max="5000" step="100" value={margin}
                                                onChange={(e) => setMargin(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/20 appearance-none cursor-pointer accent-primary"
                                            />
                                            <span className="text-xl font-bold text-white min-w-[6ch]">R${margin}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-8">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Receita Recorrente Perdida Mensalmente</p>
                                    <div className="text-4xl md:text-5xl font-mono font-bold text-red-500">
                                        - R$ {revenue.toLocaleString('pt-BR')}
                                    </div>
                                    <p className="text-xs text-red-400/50 mt-2 font-mono">
                                        * Valor deixado na mesa por falta de sistema.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 5. AUTORIDADE (Movimento) */}
            <section className="py-24 px-6 text-center z-10 relative">
                <RevealOnScroll>
                    <p className="text-lg md:text-xl text-white font-light mb-12">
                        "Agências pioneiras já migraram para o modelo estruturado."
                    </p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                        {['livelo', 'latam', 'smiles', 'azul'].map(brand => (
                            <BrandLogo key={brand} name={brand} className="h-6 w-auto text-white" />
                        ))}
                    </div>
                </RevealOnScroll>
            </section>

            {/* 6. INVESTIMENTO (Tech Pricing) */}
            <section id="investimento" className="py-32 px-6 border-t border-white/5 z-10 relative bg-bg-surface">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-20">
                            <h2 className="text-3xl font-bold text-white mb-4">Access Levels</h2>
                            <p className="text-slate-400 font-mono text-sm">Selecione a capacidade de processamento da sua agência.</p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <RevealOnScroll delay={200}>
                            <div className="p-8 bg-bg-card border border-white/5 flex flex-col h-full hover:border-white/20 transition-all">
                                <h3 className="font-mono text-lg text-white mb-2">Estrutura Inicial</h3>
                                <p className="text-xs text-slate-500 mb-6 h-8">Para abrir vertical com organização.</p>
                                <div className="text-3xl font-mono font-bold text-white mb-8">R$ 799<span className="text-xs text-slate-500 font-sans font-normal">/mês</span></div>
                                <button onClick={() => navigate('/signup')} className="mt-auto w-full py-3 border border-white/10 text-xs font-mono uppercase hover:bg-white hover:text-bg-dark transition-all">
                                    Deploy Level 1
                                </button>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={400}>
                            <div className="p-8 bg-bg-card border border-primary/50 flex flex-col h-full relative shadow-[0_0_30px_rgba(226,190,106,0.1)]">
                                <div className="absolute top-0 right-0 p-2"><span className="text-[10px] bg-primary text-bg-dark font-mono px-2 uppercase font-bold">Recommended</span></div>
                                <h3 className="font-mono text-lg text-primary mb-2">Escala Profissional</h3>
                                <p className="text-xs text-slate-500 mb-6 h-8">Previsibilidade e Recuperação (1-2 clientes).</p>
                                <div className="text-3xl font-mono font-bold text-white mb-8">R$ 1.299<span className="text-xs text-slate-500 font-sans font-normal">/mês</span></div>
                                <button onClick={() => navigate('/signup')} className="mt-auto w-full py-3 bg-primary text-bg-dark text-xs font-mono uppercase hover:bg-white transition-all font-bold">
                                    Deploy Level 2
                                </button>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={600}>
                            <div className="p-8 bg-bg-card border border-white/5 flex flex-col h-full hover:border-white/20 transition-all">
                                <h3 className="font-mono text-lg text-white mb-2">Marca Própria</h3>
                                <p className="text-xs text-slate-500 mb-6 h-8">Posicionamento e Autoridade (White Label).</p>
                                <div className="text-3xl font-mono font-bold text-white mb-8">R$ 2.399<span className="text-xs text-slate-500 font-sans font-normal">/mês</span></div>
                                <button onClick={() => navigate('/signup')} className="mt-auto w-full py-3 border border-white/10 text-xs font-mono uppercase hover:bg-white hover:text-bg-dark transition-all">
                                    Deploy Level 3
                                </button>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* 7. POLARIZAÇÃO (Tech CTA) */}
            <section className="py-32 px-6 relative z-10 flex flex-col items-center justify-center text-center">
                <RevealOnScroll>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 max-w-3xl leading-tight">
                        Você pode continuar competindo por comissão. <br />
                        <span className="text-slate-500">Ou pode estruturar margem.</span>
                    </h2>
                </RevealOnScroll>

                <RevealOnScroll delay={200}>
                    <div className="flex flex-col md:flex-row gap-6">
                        <button onClick={() => navigate('/signup')} className="px-10 py-5 bg-primary text-bg-dark font-mono text-sm font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg hover:shadow-primary/20">
                            Estruturar Minha Agência
                        </button>
                        <button onClick={() => scrollToSection('arquitetura')} className="px-10 py-5 border border-white/10 text-white font-mono text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                            Explorar Arquitetura
                        </button>
                    </div>
                </RevealOnScroll>
            </section>

            <footer className="py-8 border-t border-white/5 bg-bg-dark text-center font-mono text-[10px] text-slate-600 uppercase">
                &copy; 2024 FL360_Margin_OS™. All systems operational.
            </footer>
        </div>
    );
};

export default Landing;
