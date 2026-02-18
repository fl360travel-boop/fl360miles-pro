import React, { useEffect, useState } from 'react';
import { getDollarRate, ExchangeRate } from '../services/finance';

const DollarTicker: React.FC = () => {
    const [rate, setRate] = useState<ExchangeRate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const data = await getDollarRate();
                setRate(data);
            } catch (error) {
                console.error("Error loading dollar rate", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRate();
        // Update every 5 minutes
        const interval = setInterval(fetchRate, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="animate-pulse h-6 w-20 bg-white/10 rounded"></div>;
    if (!rate) return null;

    const isPositive = parseFloat(rate.pctChange) >= 0;
    const value = parseFloat(rate.bid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm border border-white/5 px-4 py-2 rounded-xl hover:bg-black/40 transition-all border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]">
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-400 text-lg">attach_money</span>
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Dólar PTAX</p>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white tracking-tighter">{value}</span>
                    <span className={`text-[9px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'} flex items-center`}>
                        {isPositive ? '▲' : '▼'} {rate.pctChange}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DollarTicker;
