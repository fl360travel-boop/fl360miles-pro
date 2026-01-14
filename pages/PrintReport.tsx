
import React, { useEffect, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import PDFReport from '../components/PDFReport';

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

const PrintReportPage: React.FC = () => {
    const [data, setData] = useState<PrintData | null>(null);

    useEffect(() => {
        // Load data from localStorage
        const storedData = localStorage.getItem('fl360_print_data');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
    }, []);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg-dark text-white">
                <p className="animate-pulse">Gerando PDF de Alta Fidelidade...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-bg-dark flex flex-col">
            <div className="p-4 bg-bg-surface border-b border-white/10 flex justify-between items-center text-white">
                <h1 className="font-bold">Visualizador de Relatório</h1>
                <p className="text-xs text-slate-400">Renderizado via React-PDF Engine</p>
            </div>
            <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                <PDFReport data={data} />
            </PDFViewer>
        </div>
    );
};

export default PrintReportPage;
