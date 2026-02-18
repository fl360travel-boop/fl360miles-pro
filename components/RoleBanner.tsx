import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const RoleBanner: React.FC = () => {
    const { isDemo, isDeveloper } = usePermissions();

    if (isDemo) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500/90 via-yellow-500/90 to-amber-500/90 backdrop-blur-sm text-black text-center py-2 px-4 shadow-lg shadow-amber-500/20">
                <div className="flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-sm animate-pulse">visibility</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                        Modo Demonstração — Somente Visualização — Dados Fictícios
                    </span>
                    <span className="material-symbols-outlined text-sm animate-pulse">visibility</span>
                </div>
            </div>
        );
    }

    if (isDeveloper) {
        return (
            <div className="fixed top-0 right-4 z-[100] bg-indigo-500/90 backdrop-blur-sm text-white text-center py-1.5 px-5 rounded-b-xl shadow-lg shadow-indigo-500/20">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">code</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Dev Mode</span>
                </div>
            </div>
        );
    }

    // Owner: sem banner — experiência limpa
    return null;
};

export default RoleBanner;
