import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const DemoBanner: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleDemoClick = () => {
        if (location.pathname === '/') {
            document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate('/#demo');
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-primary to-[#D4AF37] text-[#060911] px-4 h-[40px] py-2 flex items-center justify-center gap-4 shadow-[0_4px_20px_rgba(226,190,106,0.2)]">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest">
                Solicite uma demonstração
            </span>
            <button 
                onClick={handleDemoClick}
                className="bg-[#060911] text-primary text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-md hover:bg-white hover:text-[#060911] transition-colors shadow-sm"
            >
                Agendar agora
            </button>
        </div>
    );
};
