import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface PowerReportProps {
    data: {
        clientName: string;
        clientCpf: string;
        metrics: {
            totalPoints: number;
            totalValue: number;
            totalEconomy: number;
            totalInvested: number;
            lastUpdate: string;
            filteredHistory: any[];
            lifetimeRoi: number;
            lifetimeSaving: number;
            lifetimeInvested: number;
        };
        period: string;
        generatedDate: string;
        managerAnalysis?: string;
    };
}

const PowerReport: React.FC<PowerReportProps> = ({ data }) => {
    const { totalPoints, totalValue, totalEconomy, totalInvested, filteredHistory, lifetimeRoi, lifetimeSaving, lifetimeInvested } = data.metrics;

    // Sort history by date descending
    const standardItems = [...filteredHistory].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ROI Calculation for Chart
    // Invested vs Return (Value + Liquidated)
    const totalReturn = totalValue + lifetimeRoi; // Current Portfolio Value + Cashout
    const roiPercent = lifetimeInvested > 0 ? ((totalReturn - lifetimeInvested) / lifetimeInvested) * 100 : 0;

    const chartData = {
        labels: ['Investimento', 'Retorno Total'],
        datasets: [
            {
                label: 'Performance Financeira',
                data: [lifetimeInvested, totalReturn],
                backgroundColor: ['#94a3b8', '#E2BE6A'], // Slate-400, Gold
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context: any) => ` R$ ${context.raw.toLocaleString('pt-BR')}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748b', callback: (value: any) => `R$ ${value >= 1000 ? value / 1000 + 'k' : value}` }
            },
            y: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#0f172a', font: { weight: 'bold' } }
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="w-full max-w-[210mm] mx-auto bg-white min-h-[297mm] text-slate-900 font-sans relative flex flex-col" id="printable-report">

            {/* --- PAGE 1: COVER & EXECUTIVE SUMMARY --- */}
            <div className="p-[10mm] flex-1 flex flex-col h-[297mm] relative print:break-after-page">
                {/* Header */}
                <header className="flex justify-between items-start mb-12 border-b-2 border-[#E2BE6A] pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-3xl text-[#E2BE6A]">flight_takeoff</span>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">FL360<span className="text-[#E2BE6A]">MILES</span></h1>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">Wealth Management for Travelers</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-slate-900 italic">{data.clientName}</h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{data.clientCpf}</p>
                        <p className="text-[10px] text-[#E2BE6A] uppercase tracking-widest mt-2 font-bold">Relatório Executivo</p>
                    </div>
                </header>

                {/* Manager's Letter */}
                {data.managerAnalysis && (
                    <div className="mb-12">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-l-4 border-[#E2BE6A] pl-3 h-8">
                            Carta do Gestor
                        </h3>
                        <div className="prose prose-slate max-w-none">
                            <p className="text-sm text-slate-800 leading-relaxed font-serif whitespace-pre-wrap text-justify print:text-black">
                                {data.managerAnalysis}
                            </p>
                        </div>
                    </div>
                )}

                {/* KPI Highlights */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Patrimônio Global</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalPoints.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-[#E2BE6A] font-bold mt-1">Milhas Acumuladas</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Valor de Mercado</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">Liquidez Estimada</p>
                    </div>
                    <div className="p-6 bg-neutral-900 text-white rounded-2xl border border-neutral-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl">trending_up</span>
                        </div>
                        <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold mb-2">ROI Global</p>
                        <p className="text-3xl font-black text-[#E2BE6A] tracking-tighter">
                            {roiPercent > 0 ? '+' : ''}{roiPercent.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-white/60 font-bold mt-1">Rentabilidade sobre Investido</p>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="flex-1 min-h-[200px] mb-8">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-l-4 border-slate-300 pl-3 h-6">
                        Análise de Performance
                    </h3>
                    <div className="h-[200px] w-full">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-4 text-center italic">
                        * O Retorno Total considera o valor de mercado atual das milhas mais todo o lucro já realizado (cash-out) e economias geradas.
                    </p>
                </div>
            </div>

            {/* --- PAGE 2: DETAILED STATEMENT --- */}
            <div className="p-[10mm] min-h-[297mm] flex flex-col relative print:break-before-page">
                <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Extrato Detalhado - {data.period}</p>
                    <p className="text-[10px] text-slate-900 font-bold">{data.clientName}</p>
                </header>

                <div className="mb-12">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-100">
                                <th className="py-3 px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[12%]">Data</th>
                                <th className="py-3 px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[15%]">Operação</th>
                                <th className="py-3 px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[25%]">Programa</th>
                                <th className="py-3 px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[33%]">Detalhes</th>
                                <th className="py-3 px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right w-[15%]">Impacto FIN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standardItems.map((h: any, i: number) => {
                                const isNegative = ['Venda', 'Resgate', 'Transferência'].includes(h.type);
                                const isProfit = h.type === 'Venda' || h.type === 'Inclusão' || h.economyGenerated;

                                return (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-2 text-xs text-slate-600 font-medium tabular-nums">
                                            {new Date(h.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm ${h.type === 'Venda' ? 'bg-emerald-100 text-emerald-700' :
                                                    h.type === 'Resgate' ? 'bg-indigo-100 text-indigo-700' :
                                                        h.type === 'Compra' ? 'bg-slate-100 text-slate-700' :
                                                            'bg-amber-100 text-amber-700'
                                                }`}>
                                                {h.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-2 text-xs font-bold text-slate-800">
                                            {h.program}
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="text-xs text-slate-600">
                                                {isNegative ? '-' : '+'}{h.amount.toLocaleString()} milhas
                                            </div>
                                            {(h.type === 'Resgate' && h.passengers) && (
                                                <div className="text-[9px] text-slate-400 uppercase mt-1">
                                                    {h.passengers} Pax • {h.flightClass}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            {h.negotiatedValue ? (
                                                <span className={`text-xs font-bold ${h.type === 'Compra' ? 'text-red-400' : 'text-emerald-600'}`}>
                                                    {h.type === 'Compra' ? '-' : '+'} R$ {h.negotiatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : h.economyGenerated ? (
                                                <span className="text-xs font-bold text-blue-600">
                                                    (Eco) R$ {h.economyGenerated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 uppercase tracking-widest">
                    <p>Gerado automaticamente por FL360 Wealth Management</p>
                    <p>Página 2</p>
                </div>
            </div>

            <style>
                {`
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        #printable-report { margin: 0; padding: 0; width: 210mm; }
                        @page { size: A4; margin: 0; }
                    }
                `}
            </style>
        </div>
    );
};

export default PowerReport;
