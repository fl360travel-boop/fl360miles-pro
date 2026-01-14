import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import PDFReport from '../components/PDFReport';

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
}

const PrintReportPage: React.FC = () => {
    const [data, setData] = useState<PrintData | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Load data from localStorage
        const storedData = localStorage.getItem('fl360_print_data');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
    }, []);

    if (!isClient || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A0D11] text-white">
                <p className="animate-pulse">Gerando PDF Oficial...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#1c2229] flex flex-col">
            {/* Nav Bar */}
            <div className="bg-[#16191E] border-b border-white/10 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/clients" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar
                    </Link>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <h1 className="text-white font-bold text-lg">FL360 Wealth Report (PDF)</h1>
                </div>
            </div>

            {/* PDF Viewer & Fallback */}
            <div className="flex-1 w-full bg-[#525659] relative flex flex-col items-center justify-center">
                <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} className="absolute inset-0">
                    <PDFReport data={data} />
                </PDFViewer>

                {/* Fallback for Safari/Mobile in case viewer fails to show */}
                <div className="absolute bottom-8 z-10 opacity-0 hover:opacity-100 transition-opacity bg-black/80 p-4 rounded-xl">
                    <p className="text-white text-xs mb-2 text-center">Caso não visualize o PDF:</p>
                    {/* Using standard browser print/save if viewer fails */}
                </div>
            </div>
        </div>
    );
};

export default PrintReportPage;
