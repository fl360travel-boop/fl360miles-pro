import React from 'react';
import { Link } from 'react-router-dom';

interface ClientLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    planId: string;
    limit: number;
    current: number;
}

const ClientLimitModal: React.FC<ClientLimitModalProps> = ({ isOpen, onClose, planId, limit, current }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-bg-surface border border-primary/20 rounded-[40px] p-8 md:p-12 shadow-2xl max-w-lg w-full text-center animate-in zoom-in-95 duration-500">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary/20 shadow-[0_0_40px_-10px_rgba(226,190,106,0.3)]">
                    <span className="material-symbols-outlined text-primary text-5xl">diamond</span>
                </div>

                <h2 className="display-font text-3xl font-bold text-white italic uppercase tracking-tighter mb-4 leading-none">
                    Limite de Clientes Atingido
                </h2>

                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Seu plano atual permite gerenciar até <strong className="text-white">{limit}</strong> clientes simultâneos.
                    Atualmente você já atingiu esta capacidade. Expanda sua operação para cadastrar novas contas.
                </p>

                <div className="flex flex-col gap-4">
                    <Link
                        to="/plans"
                        className="w-full bg-[#E2BE6A] hover:bg-[#B8952E] text-[#0A0D11] px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-[#E2BE6A]/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                        <span className="material-symbols-outlined">workspace_premium</span>
                        FAZER UPGRADE AGORA
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors py-2 block"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientLimitModal;
