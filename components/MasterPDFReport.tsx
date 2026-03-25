import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 700 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf', fontWeight: 900 }
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FCFCFD',
        fontFamily: 'Inter',
        color: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 20,
        marginBottom: 30,
    },
    headerLogo: {
        width: 120,
    },
    headerText: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    titleSection: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 900,
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: 400,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        gap: 20,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statLabel: {
        fontSize: 9,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
        fontWeight: 700,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 900,
        color: '#10B981', // Emerald for money
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 900,
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 8,
    },
    table: {
        width: '100%',
        marginBottom: 40,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 700,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tableCell: {
        fontSize: 10,
        color: '#334155',
        fontWeight: 400,
    },
    tableCellBold: {
        fontSize: 10,
        color: '#0F172A',
        fontWeight: 700,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 15,
    },
    footerText: {
        fontSize: 8,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 2,
    }
});

interface MasterPDFReportProps {
    data: {
        period: string;
        generatedDate: string;
        metrics: {
            totalPaid: number;
            totalAgencies: number;
            activeAgencies: number;
            totalMovements: number;
        };
        payments: Array<{
            id: string;
            date: string;
            agencyName: string;
            plan: string;
            amount: number;
            status: string;
        }>;
    }
}

const MasterPDFReport: React.FC<MasterPDFReportProps> = ({ data }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, color: '#10B981' }}>FL360 MILES</Text>
                    <Text style={styles.headerText}>Protocolo SaaS // Uso Administrativo</Text>
                </View>

                <View style={styles.titleSection}>
                    <Text style={styles.title}>Relatório de Faturamento Global</Text>
                    <Text style={styles.subtitle}>Consolidado {data.period} — Gerado em {new Date(data.generatedDate).toLocaleDateString('pt-BR')}</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Faturamento do Período</Text>
                        <Text style={styles.statValue}>R$ {data.metrics.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total de Agências</Text>
                        <Text style={[styles.statValue, { color: '#0F172A' }]}>{data.metrics.totalAgencies}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Transações Pagas</Text>
                        <Text style={[styles.statValue, { color: '#3B82F6' }]}>{data.metrics.totalMovements}</Text>
                    </View>
                </View>

                <View>
                    <Text style={styles.sectionTitle}>Transações Registradas (Por Data de Pagamento)</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeaderRow}>
                            <View style={{ flex: 1 }}><Text style={styles.tableHeaderCell}>Data Pag.</Text></View>
                            <View style={{ flex: 3 }}><Text style={styles.tableHeaderCell}>Agência / Cliente</Text></View>
                            <View style={{ flex: 2 }}><Text style={styles.tableHeaderCell}>Plano/Desc</Text></View>
                            <View style={{ flex: 2, alignItems: 'flex-end' }}><Text style={styles.tableHeaderCell}>Valor Líq.</Text></View>
                        </View>

                        {data.payments.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic' }}>Nenhuma transação encontrada no período.</Text>
                            </View>
                        ) : (
                            data.payments.map((p, i) => (
                                <View key={i} style={styles.tableRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.tableCell}>{new Date(p.date).toLocaleDateString('pt-BR')}</Text>
                                    </View>
                                    <View style={{ flex: 3 }}>
                                        <Text style={styles.tableCellBold}>{p.agencyName.length > 30 ? p.agencyName.substring(0, 30) + '...' : p.agencyName}</Text>
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.tableCell}>{p.plan.length > 20 ? p.plan.substring(0, 20) + '...' : p.plan}</Text>
                                    </View>
                                    <View style={{ flex: 2, alignItems: 'flex-end' }}>
                                        <Text style={[styles.tableCellBold, { color: '#10B981' }]}>R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>FL360 TRAVEL & MILES — DOCUMENTO CONFIDENCIAL DE AUDITORIA</Text>
                </View>
            </Page>
        </Document>
    );
};

export default MasterPDFReport;
