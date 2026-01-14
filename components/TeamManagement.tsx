import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface TeamMember {
    id: string;
    email: string;
    name: string | null;
    role: 'admin' | 'advisor' | 'viewer';
    status: 'active' | 'pending' | 'inactive';
    created_at: string;
}

interface TeamManagementProps {
    isOpen: boolean;
    onClose: () => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ isOpen, onClose }) => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [newMember, setNewMember] = useState({ email: '', name: '', role: 'advisor' as const });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadMembers();
        }
    }, [isOpen]);

    const loadMembers = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMembers(data || []);
        } catch (err: any) {
            console.error('Failed to load team members:', err);
            setError('Erro ao carregar membros');
        } finally {
            setIsLoading(false);
        }
    };

    const inviteMember = async () => {
        if (!newMember.email) {
            setError('Email é obrigatório');
            return;
        }

        try {
            setError('');

            // Check if member already exists
            const { data: existing } = await supabase
                .from('team_members')
                .select('id')
                .eq('email', newMember.email.toLowerCase())
                .single();

            if (existing) {
                setError('Este email já está cadastrado');
                return;
            }

            // Add to team_members table
            const { error: insertError } = await supabase
                .from('team_members')
                .insert({
                    email: newMember.email.toLowerCase(),
                    name: newMember.name || null,
                    role: newMember.role,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            setSuccess(`Convite enviado para ${newMember.email}`);
            setNewMember({ email: '', name: '', role: 'advisor' });
            setShowInviteForm(false);
            loadMembers();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao convidar membro');
        }
    };

    const updateMemberRole = async (memberId: string, newRole: TeamMember['role']) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ role: newRole })
                .eq('id', memberId);

            if (error) throw error;
            loadMembers();
        } catch (err: any) {
            setError('Erro ao atualizar role');
        }
    };

    const toggleMemberStatus = async (member: TeamMember) => {
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ status: newStatus })
                .eq('id', member.id);

            if (error) throw error;
            loadMembers();
        } catch (err: any) {
            setError('Erro ao atualizar status');
        }
    };

    const removeMember = async (memberId: string) => {
        if (!confirm('Tem certeza que deseja remover este membro?')) return;

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            loadMembers();
        } catch (err: any) {
            setError('Erro ao remover membro');
        }
    };

    const getRoleBadge = (role: TeamMember['role']) => {
        const styles = {
            admin: 'bg-primary/20 text-primary',
            advisor: 'bg-blue-500/20 text-blue-400',
            viewer: 'bg-slate-500/20 text-slate-400'
        };
        const labels = { admin: 'Admin', advisor: 'Advisor', viewer: 'Viewer' };
        return <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[role]}`}>{labels[role]}</span>;
    };

    const getStatusBadge = (status: TeamMember['status']) => {
        const styles = {
            active: 'bg-emerald-500/20 text-emerald-400',
            pending: 'bg-amber-500/20 text-amber-400',
            inactive: 'bg-red-500/20 text-red-400'
        };
        const labels = { active: 'Ativo', pending: 'Pendente', inactive: 'Inativo' };
        return <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>{labels[status]}</span>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-2xl" onClick={onClose} />

            <div className="relative bg-bg-surface border border-white/10 rounded-[48px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="display-font text-2xl font-bold text-white uppercase italic tracking-widest">Gestão de Equipe</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{members.length} membros cadastrados</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowInviteForm(true)}
                            className="bg-primary hover:bg-primary-dark text-bg-dark px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                        >
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            Convidar Membro
                        </button>
                        <button onClick={onClose} className="size-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mx-10 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mx-10 mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm text-center">
                        {success}
                    </div>
                )}

                {/* Invite Form */}
                {showInviteForm && (
                    <div className="p-10 border-b border-white/5 bg-card-dark/30 animate-in slide-in-from-top duration-300">
                        <div className="flex gap-6 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Email</label>
                                <input
                                    type="email"
                                    value={newMember.email}
                                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                    className="w-full bg-card-dark border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Nome (opcional)</label>
                                <input
                                    type="text"
                                    value={newMember.name}
                                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                    className="w-full bg-card-dark border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Nome do membro"
                                />
                            </div>
                            <div className="w-48 space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Role</label>
                                <select
                                    value={newMember.role}
                                    onChange={e => setNewMember({ ...newMember, role: e.target.value as any })}
                                    className="w-full bg-card-dark border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="advisor">Advisor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                            <button
                                onClick={inviteMember}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Adicionar
                            </button>
                            <button
                                onClick={() => setShowInviteForm(false)}
                                className="px-6 py-4 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Members List */}
                <div className="p-10 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-4xl text-slate-600 animate-spin">sync</span>
                            <p className="text-slate-600 mt-4 text-sm">Carregando membros...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-slate-700">group_off</span>
                            <p className="text-slate-500 mt-4 text-sm">Nenhum membro cadastrado</p>
                            <p className="text-slate-600 text-xs mt-2">Clique em "Convidar Membro" para adicionar</p>
                        </div>
                    ) : (
                        members.map(member => (
                            <div
                                key={member.id}
                                className="bg-card-dark/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                                        {(member.name?.[0] || member.email[0]).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{member.name || member.email.split('@')[0]}</p>
                                        <p className="text-slate-500 text-xs mt-1">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {getRoleBadge(member.role)}
                                    {getStatusBadge(member.status)}
                                    <select
                                        value={member.role}
                                        onChange={e => updateMemberRole(member.id, e.target.value as any)}
                                        className="bg-card-dark border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none cursor-pointer"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="advisor">Advisor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                    <button
                                        onClick={() => toggleMemberStatus(member)}
                                        className={`size-10 rounded-xl flex items-center justify-center transition-all ${member.status === 'active'
                                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'
                                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                            }`}
                                        title={member.status === 'active' ? 'Desativar' : 'Ativar'}
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            {member.status === 'active' ? 'block' : 'check'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => removeMember(member.id)}
                                        className="size-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                        title="Remover"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManagement;
