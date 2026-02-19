
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo, CardSkin } from '../components/BrandAssets';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const scrollToPlans = () => {
        document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-bg-dark text-white selection:bg-primary selection:text-bg-dark overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-lg">flight_takeoff</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            FL360<span className="text-primary">MILES</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Funcionalidades</button>
                        <button onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Planos</button>
                        <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">FAQ</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-bold text-white hover:text-primary transition-colors px-4 py-2"
                        >
                            ENTRAR
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-primary text-bg-dark text-sm font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-30"></div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Nova Versão 2.0 Disponível</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Escale sua Gestão de <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-200 to-primary animate-gradient bg-300%">Milhas Aéreas</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        A plataforma definitiva para gestores de milhas. Controle múltiplos CPFs, automatize cotações e maximize seus lucros com inteligência artificial.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full md:w-auto bg-primary text-bg-dark text-base font-black uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <span>Testar Grátis por 7 Dias</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                        <button
                            onClick={scrollToPlans}
                            className="w-full md:w-auto bg-white/5 text-white border border-white/10 text-base font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                            Ver Planos
                        </button>
                    </div>

                    {/* Dashboard Preview Overlay */}
                    <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/10 shadow-2xl shadow-primary/10 bg-bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent z-10 h-full w-full"></div>
                        <img
                            src="https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?q=80&w=2960&auto=format&fit=crop"
                            alt="Dashboard Preview"
                            className="w-full h-auto opacity-80"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-8 z-20 flex justify-center pb-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                                <div className="bg-bg-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-left">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <span className="material-symbols-outlined text-primary">group</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">Gestão Multi-CPF</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">+100</p>
                                    <p className="text-xs text-slate-500">Contas gerenciadas simultaneamente</p>
                                </div>
                                <div className="bg-bg-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-left">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <span className="material-symbols-outlined text-primary">trending_up</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">Lucro no Piloto Automático</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">R$ 45k</p>
                                    <p className="text-xs text-slate-500">Média mensal dos nossos usuários Pro</p>
                                </div>
                                <div className="bg-bg-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-left">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <span className="material-symbols-outlined text-primary">smart_toy</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">IA Concierge</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">24/7</p>
                                    <p className="text-xs text-slate-500">Análise de oportunidades em tempo real</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-10 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
                        Plataforma de escolha dos maiores gestores do Brasil
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {['livelo', 'latam', 'smiles', 'azul', 'esfera'].map((brand) => (
                            <BrandLogo key={brand} name={brand} className="h-8 w-auto text-white" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Tudo o que você precisa</h2>
                        <p className="text-slate-400">Um ecossistema completo para profissionalizar sua operação de milhas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: 'hub',
                                title: 'Centralização Total',
                                desc: 'Esqueça planilhas. Gerencie programas, cartões e milhas de todos os seus clientes em um único lugar.'
                            },
                            {
                                icon: 'psychology',
                                title: 'Inteligência Artificial',
                                desc: 'Nosso AI Concierge analisa seu portfólio e sugere as melhores estratégias de venda e emissão.'
                            },
                            {
                                icon: 'payments',
                                title: 'Controle Financeiro',
                                desc: 'Calculamos automaticamente o custo médio do milheiro (CPM) e o lucro real de cada operação.'
                            },
                            {
                                icon: 'security',
                                title: 'Segurança Máxima',
                                desc: 'Seus dados são criptografados. Implementamos backups diários e proteção avançada.'
                            },
                            {
                                icon: 'description',
                                title: 'Relatórios Automáticos',
                                desc: 'Gere PDFs profissionais com sua marca para enviar aos clientes com um clique.'
                            },
                            {
                                icon: 'rocket_launch',
                                title: 'White Label',
                                desc: 'Personalize a plataforma com sua logo e cores. Seus clientes veem a SUA marca.'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-bg-card border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-bg-dark transition-colors">
                                    <span className="material-symbols-outlined text-primary text-2xl group-hover:text-bg-dark transition-colors">{feature.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="plans" className="py-24 px-6 bg-white/[0.02] border-y border-white/5 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Planos Escaláveis</h2>
                        <p className="text-slate-400">Comece pequeno e cresça sem limites. Cancele quando quiser.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Starter */}
                        <div className="p-8 rounded-3xl bg-bg-card border border-white/5 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-4xl font-black text-white">799</span>
                                <span className="text-sm text-slate-400">/ano</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Até 20 clientes
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Gestão completa
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Suporte por email
                                </li>
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl bg-white/5 text-white border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                Começar Grátis
                            </button>
                        </div>

                        {/* Pro */}
                        <div className="relative p-8 rounded-3xl bg-bg-card border border-primary/50 shadow-2xl shadow-primary/10 flex flex-col scale-105 z-10">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-bg-dark text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-full">
                                Mais Popular
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Profissional</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-4xl font-black text-white">1.299</span>
                                <span className="text-sm text-slate-400">/ano</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Até 100 clientes
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Tudo do Starter
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    AI Concierge
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Suporte Prioritário
                                </li>
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl bg-primary text-bg-dark text-[11px] font-black uppercase tracking-widest hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all">
                                Começar Teste Grátis
                            </button>
                        </div>

                        {/* White Label */}
                        <div className="p-8 rounded-3xl bg-bg-card border border-white/5 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">White Label</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-sm text-slate-400">R$</span>
                                <span className="text-4xl font-black text-white">2.399</span>
                                <span className="text-sm text-slate-400">/ano</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Clientes Ilimitados
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Plataforma Personalizada
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Seu Domínio e Marca
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                    Gerente Dedicado
                                </li>
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl bg-white/5 text-white border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                Falar com Consultor
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-white mb-4">Perguntas Frequentes</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { q: "Posso testar antes de comprar?", a: "Sim! Oferecemos 7 dias de teste grátis com acesso total a todas as funcionalidades do plano Starter." },
                        { q: "O pagamento é seguro?", a: "Sim. Nossos pagamentos são processados pelo Asaas, uma das maiores e mais seguras plataformas de pagamento do Brasil." },
                        { q: "Posso cancelar a qualquer momento?", a: "Sim. Você pode cancelar sua assinatura a qualquer momento através do painel de controle." },
                        { q: "Como funciona o White Label?", a: "No plano White Label, configuramos o sistema no seu domínio (ex: sistema.suaempresa.com.br) com suas cores e logo." }
                    ].map((item, i) => (
                        <div key={i} className="border border-white/5 rounded-2xl bg-bg-card overflow-hidden">
                            <button
                                onClick={() => toggleFaq(i)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
                            >
                                <span className="font-bold text-white">{item.q}</span>
                                <span className={`material-symbols-outlined text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>
                            {openFaq === i && (
                                <div className="p-6 pt-0 text-slate-400 text-sm leading-relaxed border-t border-white/5">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-bg-card">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center opacity-80">
                            <span className="material-symbols-outlined text-white text-lg">flight_takeoff</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white/50">
                            FL360<span className="text-primary/50">MILES</span>
                        </span>
                    </div>

                    <div className="flex gap-8 text-sm text-slate-500">
                        <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors">Contato</a>
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
