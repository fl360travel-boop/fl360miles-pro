import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface WelcomeOnboardingProps {
    isOpen: boolean;
}

const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ isOpen }) => {
    const { userProfile, signOut } = useAuth();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur Intenso */}
            <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-xl transition-opacity animate-in fade-in duration-1000" />

            {/* Modal de Onboarding */}
            <div className="relative bg-bg-surface border border-[#E2BE6A]/20 rounded-[40px] p-10 md:p-16 shadow-2xl max-w-2xl w-full text-center animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">

                {/* Efeito Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-[#E2BE6A]/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="size-28 bg-gradient-to-br from-[#E2BE6A]/20 to-transparent rounded-full flex items-center justify-center mx-auto mb-8 border border-[#E2BE6A]/30 shadow-[0_0_60px_-15px_rgba(226,190,106,0.5)]">
                    <span className="material-symbols-outlined text-[#E2BE6A] text-6xl">travel_explore</span>
                </div>

                <p className="text-[#E2BE6A] text-[10px] font-black uppercase tracking-[0.4em] mb-4 italic">
                    Configuração Inicial Concluída
                </p>

                <h1 className="display-font text-4xl md:text-5xl font-bold text-white italic uppercase tracking-tighter mb-6 leading-none">
                    Bem-vindo à<br /><span className="text-[#E2BE6A]">Elite Operacional</span>
                </h1>

                <p className="text-slate-400 text-sm md:text-base mb-12 max-w-xl mx-auto leading-relaxed">
                    Olá, <strong>{userProfile?.display_name?.split(' ')[0] || 'Gestor'}</strong>. Sua plataforma FL360 Miles está pronta.
                    O próximo passo para destrancar o poder da nossa inteligência de dados é centralizar os ativos da sua primeira conta.
                </p>

                <div className="flex flex-col gap-4 max-w-sm mx-auto">
                    <Link
                        to="/onboarding"
                        className="w-full bg-[#E2BE6A] hover:bg-[#B8952E] text-[#0A0D11] px-8 py-5 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase transition-all shadow-2xl shadow-[#E2BE6A]/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        CADASTRAR PRIMEIRO CLIENTE
                    </Link>

                    <button
                        type="button"
                        onClick={async () => {
                            await signOut();
                            window.location.href = '/login';
                        }}
                        className="w-full bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-3 active:scale-95 mt-3"
                    >
                        <span className="material-symbols-outlined text-sm">login</span>
                        JÁ SOU CLIENTE? FAZER LOGIN
                    </button>

                    <div className="flex items-center justify-center mt-6 opacity-60">
                        <span className="material-symbols-outlined text-xs mr-2 text-slate-500">lock</span>
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Painel bloqueado até o 1º cadastro</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeOnboarding;
