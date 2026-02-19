import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HTMLReport from '../components/HTMLReport'; // Keep for specific legacy needs if any, or remove
import PowerReport from '../components/PowerReport';

// Types
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
    managerAnalysis?: string; // New field
}

const PrintReportPage: React.FC = () => {
    const [data, setData] = useState<PrintData | null>(null);

    useEffect(() => {
        // Load data from localStorage
        const storedData = localStorage.getItem('fl360_print_data');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A0D11] text-white">
                <p className="animate-pulse">Carregando dados do relatório...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1c2229] print:bg-white text-slate-900 overflow-auto">
            {/* Nav Bar - Hidden on Print */}
            <div className="sticky top-0 z-50 bg-[#16191E] border-b border-white/10 px-6 py-4 flex justify-between items-center print:hidden">
                <div className="flex items-center gap-4">
                    <Link to="/clients" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar
                    </Link>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <h1 className="text-white font-bold text-lg">Visualização de Impressão</h1>
                </div>

                <button
                    onClick={handlePrint}
                    className="bg-[#E2BE6A] hover:bg-[#B8952E] text-black px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">print</span>
                    Imprimir / Salvar PDF
                </button>
            </div>

            {/* Preview Area */}
            <div className="p-8 print:p-0 flex justify-center">
                <div className="shadow-2xl print:shadow-none pointer-events-none print:pointer-events-auto origin-top transition-transform">
                    <PowerReport data={data} />
                </div>
            </div>

            <style>
                {`
                    @media print {
                        body { background: white; }
                        @page { size: A4; margin: 0; }
                    }
                `}
            </style>
        </div>
    );
};

export default PrintReportPage;
