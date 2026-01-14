import React from 'react';

type BrandName = 'livelo' | 'latam' | 'latam pass' | 'smiles' | 'azul' | 'tudoazul' | 'iberia' | 'aa' | 'aadvantage' | 'esfera' | 'tap' | 'miles&go' | 'qatar' | 'bradesco' | 'santander' | 'itau' | 'caixa' | 'c6' | 'inter';

interface BrandLogoProps {
    name: string;
    className?: string; // Para tamanhos e cores (fill-current é recomendado)
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ name, className = "w-6 h-6" }) => {
    const n = name.toLowerCase().trim();

    // Mapeamento de Logos (SVG Paths simplificados/vetorizados para ficarem elegantes em monocromático)

    // LATAM
    if (n.includes('latam')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M12.8 2C12.8 2 16.5 7.5 17.9 9.6C19.3 11.7 15.5 12.5 14.5 12.7C13.5 12.9 8.5 2 8.5 2L12.8 2Z" />
                <path d="M7 6.5C7 6.5 11 12.5 12.5 14.7C14 16.9 10 17.5 9 17.7C8 17.9 2 6.5 2 6.5L7 6.5Z" />
                <path d="M17.5 14C17.5 14 19.5 17 20.2 18.1C20.9 19.2 18.5 19.8 17.8 19.9C17.1 20 13 14 13 14L17.5 14Z" />
            </svg>
        );
    }

    // SMILES (Sorriso estilizado)
    if (n.includes('smiles')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 16.5C15.5 17.5 13.5 18 12 18C10.5 18 8.5 17.5 7.5 16.5C7.3 16.3 7.3 16 7.5 15.8C7.7 15.6 8 15.6 8.2 15.8C9 16.4 10.5 17 12 17C13.5 17 15 16.4 15.8 15.8C16 15.6 16.3 15.6 16.5 15.8C16.7 16 16.7 16.3 16.5 16.5ZM9 11C8.17 11 7.5 10.33 7.5 9.5C7.5 8.67 8.17 8 9 8C9.83 8 10.5 8.67 10.5 9.5C10.5 10.33 9.83 11 9 11ZM15 11C14.17 11 13.5 10.33 13.5 9.5C13.5 8.67 14.17 8 15 8C15.83 8 16.5 8.67 16.5 9.5C16.5 10.33 15.83 11 15 11Z" />
            </svg>
        );
    }

    // IBERIA (Simulação da cauda/asa)
    if (n.includes('iberia')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M4 12C4 12 7 9 10 9C13 9 18 12 18 12V14C18 14 13 11 10 11C7 11 4 14 4 14V12Z" />
                <path d="M6 16C6 16 8 15 10 15C12 15 16 16 16 16V17C16 17 12 16 10 16C8 16 6 17 6 17V16Z" />
                <path d="M19 8C19 8 16 6 13 6C10 6 7 8 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    // AZUL (Mapa estilizado ou U)
    if (n.includes('azul')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M3 12L5 8H9L7 12H3Z" />
                <path d="M8 12L10 8H14L12 12H8Z" />
                <path d="M13 12L15 8H19L17 12H13Z" />
                <path d="M16 16H8L6 20H18L16 16Z" />
            </svg>
        );
    }

    // AA - American Airlines (Águia estilizada)
    if (n.includes('american') || n.includes('aa')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M12 2L2 22H22L12 2ZM12 6L17 17H7L12 6Z" />
                <path d="M12 9L14 14H10L12 9Z" />
            </svg>
        );
    }

    // LIVELO (L estilizado / Gotas)
    if (n.includes('livelo')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M14.5 9C14.5 11.5 12.5 13.5 10 13.5C7.5 13.5 5.5 11.5 5.5 9C5.5 6.5 7.5 4.5 10 4.5C12.5 4.5 14.5 6.5 14.5 9Z" opacity="0.5" />
                <path d="M18.5 15C18.5 17.5 16.5 19.5 14 19.5C11.5 19.5 9.5 17.5 9.5 15C9.5 12.5 11.5 10.5 14 10.5C16.5 10.5 18.5 12.5 18.5 15Z" />
            </svg>
        );
    }

    // ESFERA (Círculos conectados)
    if (n.includes('esfera')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <circle cx="8" cy="12" r="5" fillOpacity="0.7" />
                <circle cx="16" cy="12" r="5" fillOpacity="0.7" />
            </svg>
        );
    }

    // TAP
    if (n.includes('tap')) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M4 10V14H6V12H8V14H10V10H4Z" />
                <path d="M12 10L10 14H12L13 12L14 14H16L14 10H12Z" />
                <path d="M17 10V14H19V12H21C21 11 20 10 19 10H17Z" />
            </svg>
        );
    }

    // DEFAULT CLEAN ICON (High-Ticket Minimalist)
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7V17" />
            <path d="M7 12H17" />
        </svg>
    );
};

export const CardSkin: React.FC<{ bank: string; name: string; className?: string }> = ({ bank, name, className = "" }) => {
    const isBlack = name.toLowerCase().includes('black') || name.toLowerCase().includes('infinite') || name.toLowerCase().includes('nanquim');

    return (
        <div className={`relative overflow-hidden rounded-xl border border-white/10 shadow-xl flex flex-col justify-between p-4 ${className} ${isBlack ? 'bg-zinc-900' : 'bg-slate-800'}`}>
            {/* Texture */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>

            <div className="flex justify-between items-start relative z-10">
                <div className="w-8 h-5 rounded bg-amber-200/80 bg-[linear-gradient(45deg,_transparent_25%,_rgba(0,0,0,0.3)_25%,_rgba(0,0,0,0.3)_50%,_transparent_50%,_transparent_75%,_rgba(0,0,0,0.3)_75%,_rgba(0,0,0,0.3)_100%)] bg-[length:4px_4px]"></div>
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{bank}</span>
            </div>

            <div className="relative z-10 mt-4">
                <p className="text-[10px] text-white/90 font-mono tracking-widest">•••• •••• •••• 8829</p>
                <div className="flex justify-between items-end mt-2">
                    <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">{name}</p>
                    <div className="flex -space-x-1">
                        <div className="size-3 rounded-full bg-white/20"></div>
                        <div className="size-3 rounded-full bg-white/40"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
