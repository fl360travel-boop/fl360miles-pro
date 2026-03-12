
import React, { useState, useEffect } from 'react';
import { getOrganizations, getOrganizationMembers, getOrgMemberLimit, Organization, TeamMember, inviteMember, removeMember } from '../../services/api';

const Team: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [memberLimit, setMemberLimit] = useState<{ current: number; max: number; planId: string }>({ current: 0, max: 5, planId: 'starter' });

    // Form State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('operador');
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        const loadOrgs = async () => {
            try {
                const orgs = await getOrganizations();
                setOrganizations(orgs);
                if (orgs.length > 0) {
                    setCurrentOrg(orgs[0]);
                    loadMembers(orgs[0].id);
                    loadMemberLimit(orgs[0].id);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Failed to load organizations", error);
                setLoading(false);
            }
        };
        loadOrgs();
    }, []);

    const loadMembers = async (orgId: string) => {
        setLoading(true);
        try {
            const data = await getOrganizationMembers(orgId);
            setMembers(data);
        } catch (error) {
            console.error("Failed to load members", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMemberLimit = async (orgId: string) => {
        try {
            const limit = await getOrgMemberLimit(orgId);
            setMemberLimit(limit);
        } catch (error) {
            console.error("Failed to load member limit", error);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrg) return;

        setInviteStatus('loading');
        try {
            await inviteMember(currentOrg.id, inviteEmail, inviteRole);
            setInviteStatus('success');
            setTimeout(() => {
                setShowInviteModal(false);
                setInviteStatus('idle');
                setInviteEmail('');
            }, 1500);
            loadMembers(currentOrg.id);
            loadMemberLimit(currentOrg.id);
        } catch (error: any) {
            console.error("Invite failed", error);
            setInviteStatus('error');
            alert(error.message);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return;
        try {
            await removeMember(memberId);
            if (currentOrg) {
                loadMembers(currentOrg.id);
                loadMemberLimit(currentOrg.id);
            }
        } catch (error) {
            alert('Erro ao remover membro');
        }
    };

    const isAtLimit = memberLimit.current >= memberLimit.max;
    const isEnterprise = memberLimit.planId === 'enterprise';

    if (loading && !currentOrg) {
        return <div className="text-white p-8">Carregando organização...</div>;
    }

    return (
        <div className="space-y-10 max-w-5xl mx-auto animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
                <div>
                    <h1 className="display-font text-3xl font-bold text-white italic uppercase tracking-tighter">
                        Gestão de Equipe
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest font-bold">
                        {currentOrg ? `${currentOrg.name}` : 'Minha Organização'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Member count badge */}
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                        isAtLimit && !isEnterprise
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                        <span className="material-symbols-outlined text-xs">group</span>
                        {memberLimit.current}/{isEnterprise ? '∞' : memberLimit.max} membros
                    </div>

                    {organizations.length > 1 && (
                        <select
                            className="bg-bg-surface text-slate-400 text-xs rounded-lg px-3 py-2 border border-white/10 outline-none"
                            value={currentOrg?.id}
                            onChange={(e) => {
                                const org = organizations.find(o => o.id === e.target.value);
                                if (org) {
                                    setCurrentOrg(org);
                                    loadMembers(org.id);
                                    loadMemberLimit(org.id);
                                }
                            }}
                        >
                            {organizations.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => isAtLimit && !isEnterprise ? alert(`Limite de ${memberLimit.max} membros atingido! Faça upgrade para o plano White Label para membros ilimitados.`) : setShowInviteModal(true)}
                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                            isAtLimit && !isEnterprise
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-primary-dark text-bg-dark hover:shadow-primary/20'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">{isAtLimit && !isEnterprise ? 'lock' : 'person_add'}</span>
                        {isAtLimit && !isEnterprise ? 'Limite Atingido' : 'Convidar Membro'}
                    </button>
                </div>
            </header>

            {/* Members List */}
            <section className="bg-bg-surface border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-card-dark/50 text-slate-500 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5">
                                <th className="px-8 py-5">Membro</th>
                                <th className="px-8 py-5">Email</th>
                                <th className="px-8 py-5">Cargo (Role)</th>
                                <th className="px-8 py-5">Entrou em</th>
                                <th className="px-8 py-5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {members.map(member => (
                                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar} alt={member.name} className="size-8 rounded-full bg-slate-800" />
                                            <span className="text-white text-xs font-bold">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs text-slate-400 font-medium">{member.email}</td>
                                    <td className="px-8 py-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded tracking-widest border ${member.role === 'admin' || member.role === 'owner' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' :
                                                member.role === 'gestor' ? 'text-primary border-primary/20 bg-primary/10' :
                                                    'text-slate-400 border-slate-400/20 bg-slate-400/10'
                                            }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-[10px] text-slate-500 font-mono">
                                        {new Date(member.joinedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        {member.role !== 'owner' && (
                                            <button
                                                onClick={() => handleRemove(member.id)}
                                                className="text-slate-600 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                                                title="Remover membro"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 text-xs italic">
                                        Nenhum membro encontrado nesta organização.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h2 className="text-xl font-bold text-white mb-1">Convidar para a Equipe</h2>
                        <p className="text-slate-500 text-xs mb-6">Envie um convite por e-mail para adicionar um novo membro.</p>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail do Usuário</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    placeholder="exemplo@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Função (Role)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['admin', 'gestor', 'operador'].map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setInviteRole(r)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${inviteRole === r
                                                    ? 'bg-primary text-bg-dark border-primary'
                                                    : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={inviteStatus === 'loading'}
                                className="w-full bg-emerald-custom hover:bg-emerald-600 text-white font-bold py-3 rounded-xl mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {inviteStatus === 'loading' ? 'Enviando...' : 'Enviar Convite'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
