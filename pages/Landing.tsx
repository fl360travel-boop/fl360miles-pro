
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { DemoBanner } from '../components/DemoBanner';
import { BrandLogo } from '../components/BrandAssets';
import { useSEO } from '../hooks/useSEO';
import { RevealOnScroll } from '../components/RevealOnScroll';

import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
    useSEO('Gestão de Milhas para Agências | FL360 Miles', 'Pare de perder dinheiro com planilhas. Automatize sua operação de milhas, controle clientes e escale seu faturamento com o sistema usado por gestores de elite.');
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = useAuth();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Form Demo
    const [demoForm, setDemoForm] = useState({
        nome: '',
        whatsapp: '',
        email: '',
        agencia: '',
        dificuldade: ''
    });
    const [demoEnviada, setDemoEnviada] = useState(false);

    const handleDemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Send email notification automatically to fl360travel@gmail.com
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'fl360travel@gmail.com',
                    subject: `🎯 Novo Lead: ${demoForm.nome} — ${demoForm.agencia}`,
                    template: 'lead_demo',
                    props: {
                        nome: demoForm.nome,
                        whatsapp: demoForm.whatsapp,
                        email: demoForm.email,
                        agencia: demoForm.agencia,
                        dificuldade: demoForm.dificuldade
                    }
                })
            });
        } catch (err) {
            console.warn('Email send failed, continuing with WhatsApp fallback', err);
        }

        // 2. Also open WhatsApp as fallback (visitor sends message directly)
        const texto = `Olá, me chamo ${demoForm.nome} da empresa ${demoForm.agencia}. Gostaria de agendar uma demonstração do FL360 Miles. Minha principal dor hoje é: ${demoForm.dificuldade}. Email: ${demoForm.email}`;
        const url = `https://wa.me/5511911988279?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');

        setDemoEnviada(true);
    };

    useEffect(() => {
        if (location.hash === '#demo') {
            setTimeout(() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [location]);

    // Loss Calculator
    const [clients, setClients] = useState(15);
    const [avgLossPerClient] = useState(800);
    const [totalLoss, setTotalLoss] = useState(0);
    const [countUp, setCountUp] = useState(0);

    useEffect(() => {
        setTotalLoss(clients * avgLossPerClient);
    }, [clients, avgLossPerClient]);

    // Animated counter for hero stats
    useEffect(() => {
        const target = 216;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                setCountUp(target);
                clearInterval(timer);
            } else {
                setCountUp(Math.floor(current));
            }
        }, 16);
        return () => clearInterval(timer);
    }, []);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#060911] text-white selection:bg-primary selection:text-bg-dark overflow-x-hidden font-sans">

            {/* ─── NAVBAR ──────────────────────────────────────────── */}
            <DemoBanner />
            <nav className="fixed top-[40px] left-0 right-0 z-50 bg-[#060911]/90 backdrop-blur-2xl border-b border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                        <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 border border-white/5 shadow-lg">
                            <img src="/login-logo.png" alt="FL360 MILES" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-sm font-bold text-white/80 tracking-wider hidden md:block">FL360<span className="text-primary">MILES</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('dor')} className="text-[11px] font-semibold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">O Problema</button>
                        <button onClick={() => scrollToSection('solucao')} className="text-[11px] font-semibold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Solução</button>
                        <button onClick={() => scrollToSection('demo')} className="text-[11px] font-semibold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Demonstração</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => session ? navigate('/') : navigate('/login')}
                            className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest hidden md:block"
                        >
                            {session ? 'Dashboard' : 'Login'}
                        </button>
                        <button
                            onClick={() => scrollToSection('demo')}
                            className="bg-primary text-[#060911] text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-white transition-all shadow-[0_0_20px_rgba(226,190,106,0.15)]"
                        >
                            Agendar Agora
                        </button>
                    </div>
                </div>
            </nav>

            {/* ─── HERO — DOR + DINHEIRO + ESCALA ──────────────────── */}
            <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.04] rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <RevealOnScroll delay={100}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Gestores de elite já estão usando</span>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={300}>
                        <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4.2rem] font-black text-white mb-8 leading-[1.08] tracking-tight">
                            Sua operação de milhas merece<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#D4AF37]">tecnologia de elite</span> — não<br />
                            planilhas e improviso
                        </h1>
                    </RevealOnScroll>

                    <RevealOnScroll delay={500}>
                        <p className="text-lg md:text-xl text-slate-400 mb-12 font-normal leading-relaxed max-w-2xl mx-auto">
                            Automatize atendimento, organize clientes e aumente seu lucro<br className="hidden md:block" />
                            <span className="text-white font-semibold"> sem depender de planilhas e WhatsApp.</span>
                        </p>
                    </RevealOnScroll>

                    <RevealOnScroll delay={700}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <button
                                onClick={() => scrollToSection('demo')}
                                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-primary text-[#060911] rounded-xl text-sm font-black uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(226,190,106,0.25)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                            >
                                Solicitar demonstração
                                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                            <button
                                onClick={() => scrollToSection('dor')}
                                className="inline-flex items-center gap-3 px-8 py-5 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
                            >
                                Ver como funciona
                                <span className="material-symbols-outlined text-sm animate-bounce">arrow_downward</span>
                            </button>
                        </div>
                    </RevealOnScroll>

                    {/* Social Proof Metrics */}
                    <RevealOnScroll delay={900}>
                        <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto pt-8 border-t border-white/5">
                            <div className="text-center">
                                <p className="text-2xl md:text-3xl font-black text-white">{countUp}M+</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Milhas Gerenciadas</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl md:text-3xl font-black text-emerald-400">+47%</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Aumento Médio Lucro</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl md:text-3xl font-black text-primary">3x</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Mais Eficiência</p>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── MOCKUP DO SISTEMA ──────────────────────────────── */}
            <section className="relative z-20 pb-24 px-6 -mt-8">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll delay={300}>
                        <div className="rounded-2xl border border-white/[0.06] bg-[#0B0F19]/90 backdrop-blur-xl p-1.5 md:p-3 shadow-[0_20px_80px_-20px_rgba(226,190,106,0.08)] relative group overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-t-xl z-20"></div>
                            <div className="w-full bg-[#0B0F19] rounded-xl border border-white/[0.04] relative overflow-hidden">
                                <img
                                    src="/dashboard-real.png"
                                    alt="Painel FL360 Miles — Sistema de Gestão de Milhas"
                                    className="w-full h-auto object-contain relative z-10"
                                />
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── BLOCO DE DOR REAL ──────────────────────────────── */}
            <section id="dor" className="py-28 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#060911] via-red-950/[0.04] to-[#060911]"></div>
                <div className="max-w-5xl mx-auto relative z-10">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <span className="text-red-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-4 block">Isso é sobre você</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                Se <span className="text-red-400">alguma</span> dessas frases<br />te incomoda — preste atenção.
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        {[
                            { pain: "Você perde clientes porque demora para responder", icon: "schedule" },
                            { pain: "Você esquece follow-up e oportunidades passam", icon: "notification_important" },
                            { pain: "Você calcula emissão manualmente e já errou", icon: "calculate" },
                            { pain: "Você não sabe quanto lucra por cliente", icon: "money_off" },
                            { pain: "Sua operação depende de você o tempo todo", icon: "person_off" },
                            { pain: "Você está travado e não consegue escalar", icon: "block" },
                        ].map((item, i) => (
                            <RevealOnScroll key={i} delay={i * 80}>
                                <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-red-500/10 hover:border-red-500/30 transition-all duration-300 group cursor-default">
                                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                                        <span className="material-symbols-outlined text-red-400 text-xl">{item.icon}</span>
                                    </div>
                                    <p className="text-slate-300 text-[15px] font-medium leading-relaxed">{item.pain}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>

                    <RevealOnScroll delay={500}>
                        <div className="text-center">
                            <p className="text-xl md:text-2xl text-white font-bold mb-2">
                                Se você marcou <span className="text-red-400">2 ou mais</span> — sua operação tem um problema sério.
                            </p>
                            <p className="text-slate-500 text-sm">E o pior: cada dia que passa, você perde mais dinheiro.</p>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── CONSEQUÊNCIA / MEDO / PERDA ────────────────────── */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#060911] to-red-950/[0.06]"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <RevealOnScroll>
                        <div className="p-10 md:p-16 rounded-3xl border border-red-500/15 bg-red-500/[0.03] relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
                            <span className="material-symbols-outlined text-red-400/50 text-6xl mb-6 block">warning</span>
                            <h2 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight">
                                Quem não profissionaliza agora,<br />
                                perde espaço para quem <span className="text-primary">já escalou.</span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                                {[
                                    { stat: "Clientes", desc: "indo para concorrentes" },
                                    { stat: "Lucro", desc: "escorrendo pelo ralo" },
                                    { stat: "Crescimento", desc: "completamente travado" },
                                    { stat: "Operação", desc: "caótica e manual" },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-red-500/[0.06] border border-red-500/10">
                                        <p className="text-lg font-black text-red-400 mb-1">{item.stat}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── CALCULADORA DE PERDA ────────────────────────────── */}
            <section className="py-24 px-6 relative">
                <div className="max-w-5xl mx-auto">
                    <RevealOnScroll>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <span className="text-red-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-4 block">Calculadora de Perda</span>
                                <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                                    Quanto dinheiro você <span className="text-red-400">deixa na mesa</span> todo mês?
                                </h2>
                                <p className="text-slate-400 text-base leading-relaxed mb-8">
                                    Não estamos falando do custo do sistema. Estamos falando do dinheiro que escorre da sua mão por falta de organização, automação e controle.
                                </p>
                                <div className="p-6 rounded-2xl bg-red-500/[0.06] border border-red-500/20">
                                    <div className="text-[11px] text-red-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">trending_down</span>
                                        Sua perda mensal estimada
                                    </div>
                                    <div className="text-4xl md:text-5xl font-black text-white">
                                        R$ {totalLoss.toLocaleString('pt-BR')}
                                        <span className="text-lg text-red-400 ml-2">/mês</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-3">*Baseado na margem média que gestores FL360 capturam por cliente ativo.</p>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/[0.06]">
                                <div className="space-y-10">
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-slate-400 font-semibold text-xs uppercase tracking-widest">Quantos clientes você tem?</label>
                                            <span className="text-white font-black text-2xl">{clients}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="100"
                                            value={clients}
                                            onChange={(e) => setClients(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                                        />
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[10px] text-slate-600">1 cliente</span>
                                            <span className="text-[10px] text-slate-600">100 clientes</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <p className="text-sm text-slate-400 mb-4">Margem média perdida por cliente sem sistema:</p>
                                        <div className="text-3xl font-black text-red-400">R$ {avgLossPerClient.toLocaleString('pt-BR')}/mês</div>
                                    </div>

                                    <button
                                        onClick={() => scrollToSection('demo')}
                                        className="w-full py-4 rounded-xl bg-primary text-[#060911] font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-primary/20"
                                    >
                                        Solicitar demonstração →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── SOLUÇÃO (APRESENTAÇÃO DO SAAS) ─────────────────── */}
            <section id="solucao" className="py-28 px-6 relative border-t border-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/[0.03] to-[#060911]"></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <RevealOnScroll>
                        <div className="text-center mb-20">
                            <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-4 block">A solução existe</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                Tudo em <span className="text-emerald-400">um único sistema,</span><br />
                                feito para quem vive de milhas
                            </h2>
                            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                                O FL360 Miles é o sistema operacional que transforma operações caóticas em máquinas de faturamento previsível.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            { icon: "group", title: "CRM de Milhas", benefit: "Nunca mais perca um cliente", desc: "Controle total da carteira de clientes, milhas por programa, vencimentos e histórico completo." },
                            { icon: "bolt", title: "Cálculo Automatizado", benefit: "Saiba exatamente quanto você ganha", desc: "Economia de emissão, lucro por venda, ROI por cliente — tudo calculado automaticamente." },
                            { icon: "smart_toy", title: "IA Concierge", benefit: "Atenda mais em menos tempo", desc: "Inteligência artificial que analisa voos, compara preços e sugere as melhores estratégias." },
                            { icon: "analytics", title: "Relatórios Prontos", benefit: "Impressione seus clientes", desc: "Relatórios em PDF com a sua marca. Envie no WhatsApp e aumente a percepção de valor." },
                            { icon: "notifications_active", title: "Alertas Inteligentes", benefit: "Nunca mais perca milhas", desc: "Sistema monitora vencimentos e oportunidades. Você é avisado antes de expirar." },
                            { icon: "palette", title: "White Label", benefit: "Sua operação, sua marca", desc: "Logo, cores e domínio personalizados. O cliente vê somente a sua marca." },
                        ].map((item, i) => (
                            <RevealOnScroll key={i} delay={i * 100}>
                                <div className="h-full p-7 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all duration-300 group hover:-translate-y-1">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                            <span className="material-symbols-outlined text-emerald-400 text-xl">{item.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{item.title}</p>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.benefit}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TRANSFORMAÇÃO — ANTES vs DEPOIS ────────────────── */}
            <section className="py-28 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <span className="text-primary text-[11px] font-bold uppercase tracking-[0.25em] mb-4 block">Transformação Real</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                De operação no caos<br />para <span className="text-primary">escala com controle</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ANTES */}
                        <RevealOnScroll delay={200}>
                            <div className="p-8 rounded-3xl border border-red-500/15 bg-red-500/[0.02] relative overflow-hidden h-full">
                                <div className="text-[11px] font-black text-red-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                    Antes do FL360
                                </div>
                                <div className="space-y-5">
                                    {[
                                        "Planilhas manuais que vivem desatualizadas",
                                        "WhatsApp bagunçado e sem controle",
                                        "Esquece follow-up e perde clientes",
                                        "Não sabe seu lucro real por cliente",
                                        "Emissões calculadas na mão (com erros)",
                                        "Crescimento travado — depende 100% de você",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-red-500/40 text-lg mt-0.5 shrink-0">remove_circle</span>
                                            <p className="text-slate-400 text-sm leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </RevealOnScroll>

                        {/* DEPOIS */}
                        <RevealOnScroll delay={400}>
                            <div className="p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.02] relative overflow-hidden h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.04] rounded-full blur-[60px]"></div>
                                <div className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2 relative z-10">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Com o FL360 Miles
                                </div>
                                <div className="space-y-5 relative z-10">
                                    {[
                                        "CRM completo com todos os ativos em tempo real",
                                        "Tudo organizado em um painel profissional",
                                        "Alertas automáticos de vencimento e oportunidades",
                                        "Lucro por cliente, por emissão, por mês — tudo visível",
                                        "Economia calculada automaticamente em cada emissão",
                                        "Escale para 50, 100+ clientes sem contratar mais gente",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-emerald-400 text-lg mt-0.5 shrink-0">check_circle</span>
                                            <p className="text-white text-sm font-medium leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </RevealOnScroll>
                    </div>

                    <RevealOnScroll delay={600}>
                        <div className="text-center mt-12">
                            <button
                                onClick={() => scrollToSection('demo')}
                                className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-[#060911] rounded-xl text-sm font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(226,190,106,0.2)]"
                            >
                                Agendar reunião
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── PROVA SOCIAL / TESTEMUNHOS ──────────────────────── */}
            <section className="py-24 px-6 relative border-t border-white/[0.04]">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <span className="text-primary text-[11px] font-bold uppercase tracking-[0.25em] mb-4 block">Quem usa, aprova</span>
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                Gestores já aumentaram faturamento<br />usando esse modelo
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                quote: "Antes eu perdia horas em planilhas e ainda assim cometia erros. Com o FL360 eu sei exatamente quanto lucro por cliente e minha operação triplicou em 4 meses.",
                                name: "Ricardo D.",
                                role: "CEO TravelCorp",
                                stat: "+210% lucro"
                            },
                            {
                                quote: "Tínhamos milhares de reais em milhas expirando sem saber. O sistema mapeou tudo e transformou 'perda' em emissões e margem real pros clientes.",
                                name: "Marcela C.",
                                role: "Founders Viagens",
                                stat: "R$ 0 milhas expiradas"
                            },
                            {
                                quote: "Finalmente abandonei as planilhas. Tudo é visual e automático. O fechamento do mês ficou ridículo de tão fácil. Meus clientes ficaram impressionados.",
                                name: "André L.",
                                role: "Diretor VoeMais",
                                stat: "+85 clientes"
                            },
                        ].map((item, i) => (
                            <RevealOnScroll key={i} delay={i * 150}>
                                <div className="h-full p-8 rounded-2xl border border-white/[0.05] bg-white/[0.015] relative overflow-hidden group hover:border-primary/20 transition-all">
                                    <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{item.stat}</span>
                                    </div>
                                    <div className="text-primary/30 text-5xl font-black mb-4 leading-none">"</div>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-8 italic">{item.quote}</p>
                                    <div className="mt-auto">
                                        <p className="text-sm font-bold text-white">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{item.role}</p>
                                    </div>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>

                    {/* Brand Logos */}
                    <RevealOnScroll delay={500}>
                        <div className="mt-16 pt-12 border-t border-white/[0.04]">
                            <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] mb-8 text-center font-semibold">Integrado com os maiores programas</p>
                            <div className="flex flex-wrap justify-center gap-8 md:gap-14 opacity-30 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-700">
                                {['livelo', 'latam', 'smiles', 'azul', 'esfera'].map((brand) => (
                                    <BrandLogo key={brand} name={brand} className="h-5 md:h-7 w-auto text-white" />
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── FAQ ────────────────────────────────────────────── */}
            <section className="py-24 px-6 relative border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-14">
                            <h2 className="text-3xl md:text-4xl font-black text-white">Perguntas frequentes</h2>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-3">
                        {[
                            { q: "Preciso mesmo de um sistema se uso planilhas?", a: "Planilhas não escalam. Elas dependem de você alimentar manualmente, são propensas a erros e não impressionam clientes. Com o FL360, cada emissão calcula lucro automaticamente, cada cliente recebe relatórios profissionais, e você ganha horas de volta toda semana." },
                            { q: "O sistema faz a emissão de passagens?", a: "Não. O FL360 é um Sistema Operacional de Gestão. Ele organiza, calcula e monitora sua operação de milhas — não compete com consolidadores ou cias aéreas. Nosso foco é 100% em dar a você controle, inteligência e escala." },
                            { q: "Consigo cancelar a qualquer momento?", a: "Sim, sem fidelidade. O modelo é SaaS por assinatura mensal. Se a plataforma não gerar no mínimo 5x mais lucro do que custa, cancele com um clique no painel." },
                            { q: "Quanto tempo leva para configurar?", a: "Menos de 15 minutos. Crie a conta, cadastre seus clientes e comece a operar. Sem instalação, sem configurações complexas. O sistema é web e funciona em qualquer dispositivo." },
                        ].map((faq, i) => (
                            <RevealOnScroll key={i} delay={i * 80}>
                                <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === i ? 'border-primary/20 bg-primary/[0.02]' : 'border-white/[0.05] bg-white/[0.01] hover:border-white/10'}`}>
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between gap-4 p-6 text-left"
                                    >
                                        <h3 className={`text-base font-bold transition-colors ${openFaq === i ? 'text-primary' : 'text-white'}`}>{faq.q}</h3>
                                        <span className={`material-symbols-outlined shrink-0 text-xl transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-primary' : 'text-slate-600'}`}>
                                            keyboard_arrow_down
                                        </span>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-500 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed">{faq.a}</div>
                                    </div>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── DEMONSTRAÇÃO ────────────────────────────────────────── */}
            <section id="demo" className="py-28 px-6 relative border-t border-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#060911] via-primary/[0.02] to-[#060911]"></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <RevealOnScroll>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            
                            {/* Text Content */}
                            <div>
                                <span className="text-primary text-[11px] font-bold uppercase tracking-[0.25em] mb-4 block">Acesso ao Sistema</span>
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                    Solicite uma demonstração e descubra como <span className="text-primary">escalar sua operação</span> de milhas
                                </h2>
                                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                    Veja na prática como organizar seus atendimentos, automatizar processos e aumentar seu faturamento com um sistema profissional feito para gestores que querem escala.
                                </p>
                                
                                <ul className="space-y-4 mb-8">
                                    {[
                                        "Pare de perder clientes por falta de organização",
                                        "Automatize seu atendimento e ganhe escala",
                                        "Tenha controle total da sua operação de milhas",
                                        "Aumente seu faturamento com previsibilidade"
                                    ].map((bullet, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300">
                                            <span className="material-symbols-outlined text-primary">check_circle</span>
                                            {bullet}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* Form Card */}
                            <div className="bg-[#0B0F19]/90 border border-white/[0.06] p-8 md:p-10 rounded-3xl shadow-[0_20px_80px_-20px_rgba(226,190,106,0.15)] relative overflow-hidden backdrop-blur-xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                                
                                {!demoEnviada ? (
                                    <form onSubmit={handleDemoSubmit} className="space-y-5">
                                        <h3 className="text-xl font-bold text-white mb-6">Agendar demonstração</h3>
                                        
                                        <div>
                                            <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Nome Completo</label>
                                            <input required type="text" value={demoForm.nome} onChange={e => setDemoForm({...demoForm, nome: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600" placeholder="Seu nome completo" />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">WhatsApp</label>
                                                <input required type="tel" value={demoForm.whatsapp} onChange={e => setDemoForm({...demoForm, whatsapp: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600" placeholder="(11) 99999-9999" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">E-mail</label>
                                                <input required type="email" value={demoForm.email} onChange={e => setDemoForm({...demoForm, email: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600" placeholder="seu@email.com" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Nome da Empresa / Agência</label>
                                            <input required type="text" value={demoForm.agencia} onChange={e => setDemoForm({...demoForm, agencia: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600" placeholder="Nome da sua agência" />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Principal dificuldade hoje</label>
                                            <textarea required rows={3} value={demoForm.dificuldade} onChange={e => setDemoForm({...demoForm, dificuldade: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600 resize-none" placeholder="Ex: Desorganização no whatsapp, cálculos de emissão..." />
                                        </div>

                                        <button type="submit" className="w-full mt-4 py-4 rounded-xl bg-primary text-[#060911] font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2">
                                            Agendar demonstração
                                            <span className="material-symbols-outlined text-sm">event_available</span>
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center py-10 space-y-6">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-2">
                                            <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white">Solicitação enviada com sucesso!</h3>
                                        <p className="text-slate-400 text-sm">
                                            Recebemos os seus dados. Se o WhatsApp não abriu automaticamente, fique tranquilo, nossa equipe entrará em contato em breve para agendar a sua demonstração.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── CTA FINAL ──────────────────────────────────────── */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#060911] via-primary/[0.04] to-[#060911]"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.06] rounded-full blur-[150px]"></div>

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <RevealOnScroll>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">
                            Cada dia sem sistema<br />
                            é dinheiro que você <span className="text-red-400">não recupera.</span>
                        </h2>
                    </RevealOnScroll>

                    <RevealOnScroll delay={200}>
                        <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto">
                            Gestores que usam o FL360 estão escalando enquanto você ainda faz conta na planilha.
                            <span className="text-white font-semibold block mt-2">A decisão é sua.</span>
                        </p>
                    </RevealOnScroll>

                    <RevealOnScroll delay={400}>
                        <div className="flex flex-col items-center gap-6">
                            <button
                                onClick={() => scrollToSection('demo')}
                                className="bg-primary text-[#060911] text-base font-black uppercase tracking-[0.15em] px-14 py-6 rounded-xl hover:bg-white transition-all duration-300 shadow-[0_0_50px_rgba(226,190,106,0.25)] hover:shadow-[0_0_70px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                            >
                                Agendar reunião
                            </button>
                            <span className="text-[11px] text-slate-600 uppercase tracking-widest">Solução sob medida para sua operação</span>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ─── FOOTER ─────────────────────────────────────────── */}
            <footer className="py-10 border-t border-white/[0.04] bg-[#060911]">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-md overflow-hidden border border-white/5">
                            <img src="/login-logo.png" alt="FL360" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-[11px] text-slate-600 uppercase tracking-widest">© 2026 FL360 Miles</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/terms" className="text-[11px] text-slate-600 hover:text-primary uppercase tracking-widest transition-colors">Termos</Link>
                        <Link to="/privacy" className="text-[11px] text-slate-600 hover:text-primary uppercase tracking-widest transition-colors">Privacidade</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
