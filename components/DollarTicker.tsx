import React, { useEffect, useState, useRef } from 'react';
import { getDollarRate, ExchangeRate } from '../services/finance';

const REFRESH_INTERVAL = 10 * 1000; // 10 segundos — tempo real

const DollarTicker: React.FC = () => {
    const [rate, setRate] = useState<ExchangeRate | null>(null);
    const [loading, setLoading] = useState(true);
    const [flash, setFlash] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const prevBid = useRef<string | null>(null);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const data = await getDollarRate();
                if (data) {
                    // Flash se o valor mudou
                    if (prevBid.current && prevBid.current !== data.bid) {
                        setFlash(true);
                        setTimeout(() => setFlash(false), 1500);
                    }
                    prevBid.current = data.bid;
                    setRate(data);
                    setLastUpdate(new Date());
                }
            } catch (error) {
                console.error("Error loading dollar rate", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRate();
        const interval = setInterval(fetchRate, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="animate-pulse h-6 w-20 bg-white/10 rounded"></div>;
    if (!rate) return null;

    const isPositive = parseFloat(rate.pctChange) >= 0;
    const value = parseFloat(rate.bid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const timeStr = lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

    return (
        <div className={`flex items-center gap-3 bg-black/20 backdrop-blur-sm border px-4 py-2 rounded-xl hover:bg-black/40 transition-all shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)] ${flash ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-white/5 border-emerald-500/20'}`}>
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 relative">
                <span className="material-symbols-outlined text-emerald-400 text-lg">attach_money</span>
                {/* Live pulse indicator */}
                <span className="absolute -top-1 -right-1 flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
                </span>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dólar PTAX</p>
                    <span className="text-[7px] text-slate-600 font-bold uppercase tracking-wider">LIVE</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-black tracking-tighter transition-colors duration-500 ${flash ? 'text-emerald-300' : 'text-white'}`}>{value}</span>
                    <span className={`text-[9px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'} flex items-center`}>
                        {isPositive ? '▲' : '▼'} {rate.pctChange}%
                    </span>
                </div>
                {timeStr && <p className="text-[7px] text-slate-600 font-bold mt-0.5">{timeStr}</p>}
            </div>
        </div>
    );
};

export default DollarTicker;
