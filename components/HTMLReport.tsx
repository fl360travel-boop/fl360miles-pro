import React from 'react';

interface HTMLReportProps {
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
        };
        period: string;
        generatedDate: string;
    };
}

const HTMLReport: React.FC<HTMLReportProps> = ({ data }) => {
    const { totalPoints, totalValue, totalEconomy, totalInvested, filteredHistory } = data.metrics;
    const standardItems = filteredHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="w-full max-w-[210mm] mx-auto bg-white p-[10mm] min-h-[297mm] text-slate-900 font-sans relative" id="printable-report">
            {/* HEADER */}
            <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-[#E2BE6A] mb-1">FL360MILES</h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Strategic Wealth Report</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black text-slate-900">{data.clientName}</h2>
                    <p className="text-xs text-slate-500 uppercase mt-1">{data.clientCpf}</p>
                </div>
            </header>

            {/* METRICS GRID */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Patrimônio Total</p>
                    <p className="text-xl font-black text-slate-900">{totalPoints.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Milhas/Pontos</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Valor de Mercado</p>
                    <p className="text-xl font-black text-slate-900">R$ {totalValue.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Estimado</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Economia Gerada</p>
                    <p className="text-xl font-black text-emerald-600">R$ {totalEconomy.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">No Período</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Investimento</p>
                    <p className="text-xl font-black text-slate-900">R$ {totalInvested.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Realizado</p>
                </div>
            </div>

            {/* TABLE */}
            <div className="mb-12">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Detalhamento de Movimentações</h3>
                <div className="w-full">
                    {/* Header */}
                    <div className="flex border-b border-slate-200 bg-slate-50 py-2 px-2">
                        <div className="w-[15%] text-[10px] font-bold text-slate-500 uppercase">Data</div>
                        <div className="w-[15%] text-[10px] font-bold text-slate-500 uppercase">Tipo</div>
                        <div className="w-[30%] text-[10px] font-bold text-slate-500 uppercase">Programa</div>
                        <div className="w-[20%] text-[10px] font-bold text-slate-500 uppercase text-right">Quantidade</div>
                        <div className="w-[20%] text-[10px] font-bold text-slate-500 uppercase text-right">Valor/Eco</div>
                    </div>

                    {/* Rows */}
                    {standardItems.map((h: any, i: number) => {
                        const isNegative = ['Venda', 'Resgate', 'Transferência'].includes(h.type);
                        return (
                            <div key={i} className="flex border-b border-slate-100 py-3 px-2 items-center hover:bg-slate-50/50">
                                <div className="w-[15%] text-xs text-slate-600 font-medium">{new Date(h.date).toLocaleDateString()}</div>
                                <div className={`w-[15%] text-xs font-black ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>{h.type}</div>
                                <div className="w-[30%] text-xs font-bold text-slate-800">
                                    {h.program}
                                    {h.type === 'Resgate' && (h.flightClass || h.passengers) && (
                                        <div className="text-[9px] font-normal text-slate-500 uppercase mt-0.5 tracking-wide">
                                            {h.airline && <>{h.airline} • </>}{h.flightClass || 'Classe N/A'} • {h.passengers || 1} Pax
                                        </div>
                                    )}
                                </div>
                                <div className={`w-[20%] text-xs font-medium text-right ${isNegative ? 'text-red-500' : 'text-slate-600'}`}>
                                    {isNegative ? '-' : '+'}{h.amount.toLocaleString()}
                                </div>
                                <div className="w-[20%] text-xs text-slate-500 font-medium text-right">
                                    {h.negotiatedValue
                                        ? `R$ ${h.negotiatedValue.toLocaleString()}`
                                        : h.economyGenerated
                                            ? `(Eco) R$ ${h.economyGenerated.toLocaleString()}`
                                            : '-'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER */}
            <footer className="fixed bottom-0 left-0 right-0 p-[10mm] border-t border-slate-100 bg-white flex justify-between items-center print:static print:mt-10">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Gerado em {new Date(data.generatedDate).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Confidencial - FL360Miles Pro
                </p>
            </footer>
        </div>
    );
};

export default HTMLReport;
