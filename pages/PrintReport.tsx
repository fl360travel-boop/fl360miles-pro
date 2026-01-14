
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from '../components/BrandAssets';

// Types (simplified for this view, or import if available)
interface PrintData {
    clientName: string;
    clientCpf: string;
    metrics: {
        totalPoints: number;
        totalValue: number;
        totalEconomy: number;
        totalInvested: number;
        lastUpdate: string;
        filteredHistory: any[];
    };
    period: string;
    generatedDate: string;
}

const PrintReport: React.FC = () => {
    const [data, setData] = useState<PrintData | null>(null);

    useEffect(() => {
        // Load data from localStorage
        const storedData = localStorage.getItem('fl360_print_data');
        if (storedData) {
            setData(JSON.parse(storedData));
            // Trigger print automatically after a short delay to ensure render
            setTimeout(() => {
                window.print();
            }, 800);
        }
    }, []);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-slate-500">Carregando relatório...</p>
            </div>
        );
    }

    // Helper for formatting
    const { totalPoints, totalValue, totalEconomy, totalInvested, filteredHistory } = data.metrics;

    const allItems = filteredHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const conciergeItems = allItems.filter((h: any) => h.id.startsWith('CONC-') || h.program === 'Concierge VIP' || h.type === 'Concierge');
    const standardItems = allItems.filter((h: any) => !conciergeItems.includes(h));

    return (
        <div className="w-full max-w-[210mm] mx-auto bg-white min-h-screen p-[10mm] text-slate-900 font-sans">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 border-b-2 border-slate-100 pb-6">
                <div>
                    <BrandLogo name="livelo" className="h-10 text-primary w-auto mb-2" />
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Strategic Wealth Report</p>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-900 mb-1">{data.clientName}</h1>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{data.clientCpf}</p>
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Patrimônio Total</p>
                    <p className="text-xl font-black text-slate-900">{totalPoints.toLocaleString()}</p>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">Milhas/Pontos</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Valor de Mercado</p>
                    <p className="text-xl font-black text-slate-900">R$ {totalValue.toLocaleString()}</p>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">Estimado</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Economia Gerada</p>
                    <p className="text-xl font-black text-slate-900 text-emerald-600">R$ {totalEconomy.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">No Período</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Investimento</p>
                    <p className="text-xl font-black text-slate-900">R$ {totalInvested.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">Realizado</p>
                </div>
            </div>

            {/* TRANSACTION TABLE */}
            <div className="mb-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Detalhamento de Movimentações</h2>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        Período: {data.period}
                    </span>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[15%]">Data</th>
                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[15%]">Tipo</th>
                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[25%]">Programa</th>
                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[20%] text-right">Quantidade</th>
                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-[25%] text-right">Valor/Eco</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {standardItems.map((h: any, i: number) => (
                            <tr key={i} className="break-inside-avoid page-break-inside-avoid">
                                <td className="py-3 px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                    {new Date(h.date).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${['Venda', 'Resgate'].includes(h.type)
                                            ? 'border-red-100 text-red-600'
                                            : 'border-emerald-100 text-emerald-600'
                                        }`}>
                                        {h.type}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-[11px] font-black text-slate-900 uppercase italic">
                                    {h.program}
                                </td>
                                <td className={`py-3 px-2 text-[11px] font-black italic tracking-tight text-right ${['Venda', 'Resgate'].includes(h.type) ? 'text-red-500' : 'text-slate-900'
                                    }`}>
                                    {['Venda', 'Resgate', 'Transferência'].includes(h.type) ? '-' : '+'}{h.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-2 text-right text-[11px] font-black text-slate-900 italic tracking-tight">
                                    {h.negotiatedValue
                                        ? `R$ ${h.negotiatedValue.toLocaleString()}`
                                        : h.economyGenerated
                                            ? `(Eco) R$ ${h.economyGenerated.toLocaleString()}`
                                            : '-'}
                                </td>
                            </tr>
                        ))}

                        {/* CONCIERGE SECTION */}
                        {conciergeItems.length > 0 && (
                            <>
                                <tr className="bg-slate-50 break-inside-avoid">
                                    <td colSpan={5} className="py-4 px-4 custom-concierge-header">
                                        <div className="flex items-center gap-3 justify-center">
                                            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-800">Concierge & Lifestyle Services</span>
                                        </div>
                                    </td>
                                </tr>
                                {conciergeItems.map((h: any, i: number) => (
                                    <tr key={`conc-${i}`} className="break-inside-avoid page-break-inside-avoid border-l-4 border-slate-200 pl-2">
                                        <td className="py-3 px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                            {new Date(h.date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-slate-200 text-slate-600 bg-slate-50">
                                                Lifestyle
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-[11px] font-black text-slate-900 uppercase italic" colSpan={2}>
                                            <span className="block">{h.description || 'Solicitação Concierge'}</span>
                                            <span className="text-[9px] text-slate-500 font-normal normal-case">{h.observation}</span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-[11px] font-black text-slate-900 italic tracking-tight">
                                            {h.negotiatedValue ? `R$ ${h.negotiatedValue.toLocaleString()}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* FOOTER */}
            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between text-[9px] uppercase tracking-widest text-slate-400">
                <p>Documento gerado em {new Date(data.generatedDate).toLocaleString()} por FL360Miles Pro</p>
                <p>Confidencial</p>
            </div>

            <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
          body { 
            background: white; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        }
      `}</style>
        </div>
    );
};

export default PrintReport;
