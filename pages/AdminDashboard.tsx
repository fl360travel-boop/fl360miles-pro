import React, { useEffect, useState } from 'react';
import { asaasService } from '../services/asaas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminAgency {
    org_id: string;
    company_name: string;
    plan: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    last_updated: string | null;
    owner_email: string;
    owner_phone: string | null;
}

const AdminDashboard: React.FC = () => {
    const [agencies, setAgencies] = useState<AdminAgency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await asaasService.getMasterAdminData();
            setAgencies(data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching admin data:', err);
            setError(err.message || 'Falha ao carregar dados do painel master.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleBlock = async (orgId: string, currentStatus: string) => {
        const isBlocked = currentStatus === 'blocked';
        const action = isBlocked ? 'desbloquear' : 'bloquear';

        if (!confirm(`Tem certeza que deseja ${action} esta agência imediatamente?`)) return;

        try {
            await asaasService.toggleBlock(orgId, !isBlocked);
            await fetchData();
        } catch (err: any) {
            alert('Erro ao alterar status: ' + err.message);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'trial': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'past_due': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'blocked': 'bg-red-500/10 text-red-400 border-red-500/20',
            'canceled': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };

        const label: Record<string, string> = {
            'active': 'Ativo',
            'trial': 'Teste',
            'past_due': 'Atrasado',
            'blocked': 'Bloqueado',
            'canceled': 'Cancelado'
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['canceled']}`}>
                {label[status] || status}
            </span>
        );
    };

    const filteredAgencies = agencies.filter(a => {
        const name = (a.company_name || '').toLowerCase();
        const email = (a.owner_email || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    const stats = {
        total: agencies?.length || 0,
        active: (agencies || []).filter(a => a.status === 'active' || a.status === 'trial').length,
        overdue: (agencies || []).filter(a => a.status === 'past_due' || a.status === 'blocked').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
                    <p className="text-slate-500 mt-4 text-sm font-bold uppercase tracking-widest">Carregando dados globais...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
                <div>
                    <h2 className="text-white font-black uppercase italic tracking-tighter">Erro ao carregar painel master</h2>
                    <p className="text-red-400/80 text-sm mt-1">{error}</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="mt-2 px-6 py-2 bg-red-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-red-600 transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    const safeFormat = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Inválido';
            return format(date, 'dd/MM/yy', { locale: ptBR });
        } catch (e) {
            return 'Erro Data';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
                    Painel de Controle Master
                </h1>
                <p className="text-slate-500 text-sm mt-1">Gestão global de agências e assinaturas do FL360 Miles.</p>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-bg-surface border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-6xl">business</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total de Agências</p>
                    <p className="text-3xl font-black text-white">{stats.total}</p>
                </div>
                <div className="bg-bg-surface border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                        <span className="material-symbols-outlined text-6xl">check_circle</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contas Ativas</p>
                    <p className="text-3xl font-black text-emerald-400">{stats.active}</p>
                </div>
                <div className="bg-bg-surface border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-red-500">
                        <span className="material-symbols-outlined text-6xl">emergency_home</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pendências/Bloqueios</p>
                    <p className="text-3xl font-black text-red-400">{stats.overdue}</p>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-bg-surface border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.02]">
                    <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">list_alt</span>
                        Lista de Agências
                    </h2>
                    <div className="relative w-full md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Buscar agência ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-dark border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Agência</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Plano</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Vencimento / Trial</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Contato Rápido</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredAgencies.map((agency) => (
                                <tr key={agency.org_id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{agency.company_name}</span>
                                            <span className="text-[10px] text-slate-500">{agency.owner_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(agency.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{agency.plan || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-slate-400">
                                        {agency.status === 'trial' ? (
                                            <div className="flex items-center gap-1.5 text-blue-400">
                                                <span className="material-symbols-outlined text-sm">timer</span>
                                                Expira {safeFormat(agency.trial_ends_at)}
                                            </div>
                                        ) : (
                                            <span>Prox. Fatura: {safeFormat(agency.current_period_end)}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            {agency.owner_phone && (
                                                <a
                                                    href={`https://wa.me/55${agency.owner_phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                                                    title={`WhatsApp: ${agency.owner_phone}`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">chat</span>
                                                </a>
                                            )}
                                            {agency.owner_email && agency.owner_email !== 'N/A' && (
                                                <a
                                                    href={`mailto:${agency.owner_email}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                                                    title={`Email: ${agency.owner_email}`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">mail</span>
                                                </a>
                                            )}
                                            {!agency.owner_phone && (!agency.owner_email || agency.owner_email === 'N/A') && (
                                                <span className="text-[9px] text-slate-600 italic">Sem contato</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleBlock(agency.org_id, agency.status)}
                                                className={`p-2 rounded-lg transition-all border ${agency.status === 'blocked'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                    }`}
                                                title={agency.status === 'blocked' ? 'Desbloquear' : 'Bloqueio Imediato'}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {agency.status === 'blocked' ? 'lock_open' : 'block'}
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
