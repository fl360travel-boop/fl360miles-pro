import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' }, // Regular
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyAZ9hjp-Ek-_EeA.woff', fontWeight: 700 }, // Bold
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyDAZ9hjp-Ek-_EeA.woff', fontWeight: 900 }  // Black
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        paddingBottom: 80, // Added space for fixed footer
        fontFamily: 'Inter'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 20
    },
    brand: {
        fontSize: 24,
        fontWeight: 900,
        color: '#E2BE6A',
        marginBottom: 4
    },
    subBrand: {
        fontSize: 8,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    clientName: {
        fontSize: 18,
        fontWeight: 900,
        color: '#0F172A',
        textAlign: 'right'
    },
    clientCpf: {
        fontSize: 10,
        color: '#64748B',
        textAlign: 'right',
        marginTop: 4,
        textTransform: 'uppercase'
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    metricCard: {
        width: '23%',
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    metricLabel: {
        fontSize: 8,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        fontWeight: 700
    },
    metricValue: {
        fontSize: 14,
        fontWeight: 900,
        color: '#0F172A'
    },
    metricSub: {
        fontSize: 8,
        color: '#059669', // Emerald
        marginTop: 4,
        fontWeight: 700
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 900,
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 10
    },
    table: {
        width: '100%',
        marginTop: 10
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingVertical: 8,
        alignItems: 'center'
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 8,
        backgroundColor: '#F8FAFC'
    },
    colDate: { width: '15%', fontSize: 8, color: '#64748B', fontWeight: 700 },
    colType: { width: '15%', fontSize: 8, color: '#64748B', fontWeight: 700 },
    colProgram: { width: '25%', fontSize: 8, color: '#64748B', fontWeight: 700 },
    colAmount: { width: '20%', fontSize: 8, color: '#64748B', fontWeight: 700, textAlign: 'right' },
    colValue: { width: '25%', fontSize: 8, color: '#64748B', fontWeight: 700, textAlign: 'right' },

    cellText: { fontSize: 9, color: '#334155', fontWeight: 500 },
    cellBold: { fontSize: 9, color: '#0F172A', fontWeight: 900 },

    negative: { color: '#EF4444' }, // Red
    positive: { color: '#059669' }, // Green

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    footerText: {
        fontSize: 8,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1
    }
});

interface PDFReportProps {
    data: {
        clientName: string;
        clientCpf: string;
        metrics: {
            totalPoints: number;
            totalValue: number;
            totalEconomy: number;
            totalInvested: number;
            lastUpdate: string;

            programs: any[];
            filteredHistory: any[];
        };
        period: string;
        generatedDate: string;
    };
}

const PDFReport: React.FC<PDFReportProps> = ({ data }) => {
    const { totalPoints, totalValue, totalEconomy, totalInvested, filteredHistory } = data.metrics;
    const standardItems = filteredHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>FL360MILES</Text>
                        <Text style={styles.subBrand}>Strategic Wealth Report</Text>
                    </View>
                    <View>
                        <Text style={styles.clientName}>{data.clientName}</Text>
                        <Text style={styles.clientCpf}>{data.clientCpf}</Text>
                    </View>
                </View>

                {/* METRICS */}
                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Patrimônio Total</Text>
                        <Text style={styles.metricValue}>{totalPoints.toLocaleString()}</Text>
                        <Text style={styles.metricSub}>Milhas/Pontos</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Valor de Mercado</Text>
                        <Text style={styles.metricValue}>R$ {totalValue.toLocaleString()}</Text>
                        <Text style={styles.metricSub}>Estimado</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Economia Gerada</Text>
                        <Text style={[styles.metricValue, { color: '#059669' }]}>R$ {totalEconomy.toLocaleString()}</Text>
                        <Text style={styles.metricLabel}>No Período</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Investimento</Text>
                        <Text style={styles.metricValue}>R$ {totalInvested.toLocaleString()}</Text>
                        <Text style={styles.metricLabel}>Realizado</Text>
                    </View>
                </View>


                {/* PROGRAMS / ASSETS */}
                <Text style={styles.sectionTitle}>Carteira de Ativos (Programas)</Text>
                <View style={[styles.table, { marginBottom: 20 }]}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colProgram, { width: '70%' }]}>PROGRAMA</Text>
                        <Text style={[styles.colAmount, { width: '30%' }]}>SALDO ATUAL</Text>
                    </View>
                    {data.metrics.programs.map((p: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.colProgram, styles.cellBold, { width: '70%' }]}>{p.name}</Text>
                            <Text style={[styles.colAmount, styles.cellText, { width: '30%' }]}>{p.balance.toLocaleString()} milhas</Text>
                        </View>
                    ))}
                </View>

                {/* TABLE */}
                <Text style={styles.sectionTitle}>Detalhamento de Movimentações</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDate}>DATA</Text>
                        <Text style={styles.colType}>TIPO</Text>
                        <Text style={styles.colProgram}>PROGRAMA</Text>
                        <Text style={styles.colAmount}>QUANTIDADE</Text>
                        <Text style={styles.colValue}>VALOR/ECO</Text>
                    </View>

                    {standardItems.map((h: any, i: number) => {
                        const isNegative = ['Venda', 'Resgate', 'Transferência'].includes(h.type);

                        // Fallback Profit Calculation
                        let profitVal = h.profit;
                        if (!profitVal && h.type === 'Venda' && h.negotiatedValue && h.amount) {
                            const estCpm = h.cpm || 15;
                            profitVal = h.negotiatedValue - ((h.amount / 1000) * estCpm);
                        }

                        return (
                            <View key={i} style={styles.tableRow} wrap={false}>
                                <Text style={[styles.colDate, styles.cellText]}>{new Date(h.date).toLocaleDateString()}</Text>
                                <Text style={[styles.colType, styles.cellBold, isNegative ? styles.negative : styles.positive]}>{h.type}</Text>
                                <Text style={[styles.colProgram, styles.cellBold]}>{h.program}</Text>
                                <Text style={[styles.colAmount, styles.cellText, isNegative ? styles.negative : {}]}>
                                    {isNegative ? '-' : '+'}{h.amount.toLocaleString()}
                                </Text>
                                <Text style={[styles.colValue, styles.cellText]}>
                                    {h.negotiatedValue
                                        ? `R$ ${h.negotiatedValue.toLocaleString()}` + (profitVal ? `\n(Lucro: R$ ${profitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })})` : '')
                                        : h.economyGenerated
                                            ? `(Eco) R$ ${h.economyGenerated.toLocaleString()}`
                                            : '-'}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* FOOTER */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Gerado em {new Date(data.generatedDate).toLocaleString()}</Text>
                    <Text style={styles.footerText}>Confidencial - FL360Miles Pro</Text>
                </View>
            </Page>
        </Document>
    );
};

export default PDFReport;
