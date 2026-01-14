
import React, { useState, useEffect, useMemo } from 'react';
import { ExpirationAlert, Client } from '../types';
import { getClients } from '../services/api';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);
  const [editingAlert, setEditingAlert] = useState<ExpirationAlert | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'pending' | 'new' | 'resolved'>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // New alert form
  const [newAlert, setNewAlert] = useState({
    clientId: '',
    program: '',
    amount: '',
    date: '',
    obs: ''
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
      } catch (error) {
        console.error('Failed to load clients:', error);
      }
    };
    loadClients();

    const storedAlerts = localStorage.getItem('executive_miles_alerts');
    if (storedAlerts) {
      setAlerts(JSON.parse(storedAlerts));
    } else {
      const initialAlerts: ExpirationAlert[] = [
        {
          id: '1',
          clientName: 'Ricardo Oliveira',
          program: 'Azul Fidelidade',
          amount: 45000,
          expirationDate: '2025-05-12',
          observation: 'Vencimento de bônus de transferência estratégica realizado via Esfera.',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      setAlerts(initialAlerts);
      localStorage.setItem('executive_miles_alerts', JSON.stringify(initialAlerts));
    }
  }, []);

  const saveAlerts = (list: ExpirationAlert[]) => {
    setAlerts(list);
    localStorage.setItem('executive_miles_alerts', JSON.stringify(list));
  };

  const handleAddAlert = () => {
    const client = clients.find(c => c.id === newAlert.clientId);
    if (!client || !newAlert.program || !newAlert.amount) {
      alert("Preencha todos os campos fundamentais do protocolo.");
      return;
    }

    if (editingAlert) {
      const updated = alerts.map(a => a.id === editingAlert.id ? {
        ...a,
        clientName: client.name,
        program: newAlert.program,
        amount: Number(newAlert.amount),
        expirationDate: newAlert.date,
        observation: newAlert.obs
      } : a);
      saveAlerts(updated);
    } else {
      const alert: ExpirationAlert = {
        id: Date.now().toString(),
        clientName: client.name,
        program: newAlert.program,
        amount: Number(newAlert.amount),
        expirationDate: newAlert.date,
        observation: newAlert.obs,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      saveAlerts([alert, ...alerts]);
    }

    setShowNewAlert(false);
    setEditingAlert(null);
    setNewAlert({ clientId: '', program: '', amount: '', date: '', obs: '' });
  };

  const requestDelete = (id: string) => {
    setAlertToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (alertToDelete) {
      saveAlerts(alerts.filter(a => a.id !== alertToDelete));
      setShowConfirmDelete(false);
      setAlertToDelete(null);
    }
  };

  const editAlert = (alert: ExpirationAlert) => {
    const client = clients.find(c => c.name === alert.clientName);
    setNewAlert({
      clientId: client?.id || '',
      program: alert.program,
      amount: alert.amount.toString(),
      date: alert.expirationDate,
      obs: alert.observation
    });
    setEditingAlert(alert);
    setShowNewAlert(true);
  };

  const resolveAlert = (id: string) => {
    setResolvingId(id);
    setTimeout(() => {
      saveAlerts(alerts.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));
      setResolvingId(null);
    }, 600);
  };

  const filteredAlerts = useMemo(() => {
    const now = new Date();
    return alerts.filter(a => {
      if (filterType === 'all') return true;
      if (filterType === 'pending') return a.status === 'pending';
      if (filterType === 'resolved') return a.status === 'resolved';
      if (filterType === 'new') {
        if (!a.createdAt) return false;
        const createdDate = new Date(a.createdAt);
        const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        return diffHours < 48 && a.status === 'pending'; // Criados nas últimas 48h
      }
      if (filterType === 'critical') {
        const diff = new Date(a.expirationDate).getTime() - now.getTime();
        return diff < 15 * 24 * 60 * 60 * 1000 && a.status === 'pending'; // Vencimento em menos de 15 dias
      }
      return true;
    });
  }, [alerts, filterType]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="display-font text-white text-3xl font-bold tracking-tight uppercase italic">Monitor de Vencimentos</h1>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold italic">Auditoria Preventiva de Expiração • Protocolo FL360</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center bg-bg-surface border border-white/5 rounded-2xl p-1 shadow-2xl overflow-x-auto custom-scrollbar">
            {(['all', 'new', 'pending', 'critical', 'resolved'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === t ? 'bg-primary text-bg-dark shadow-lg shadow-primary/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                {t === 'all' ? 'Ver Todos' : t === 'pending' ? 'Pendentes' : t === 'critical' ? 'Críticos' : t === 'new' ? 'Novos' : 'Encerrados'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditingAlert(null); setShowNewAlert(true); }}
            className="bg-primary hover:bg-primary-dark text-bg-dark px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-sm font-black">notification_add</span>
            NOVO PROTOCOLO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`group bg-bg-surface border border-white/5 p-8 rounded-[32px] shadow-2xl transition-all duration-500 hover:border-primary/40 flex flex-col relative overflow-hidden ${alert.status === 'resolved' ? 'opacity-50 grayscale hover:grayscale-0' : ''} ${resolvingId === alert.id ? 'scale-95 opacity-0 rotate-1' : 'scale-100 opacity-100'}`}
          >
            {/* Status Indicator */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-1.5 bg-primary rounded-full animate-pulse"></span>
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] italic">{alert.program}</p>
                </div>
                <h4 className="text-white font-bold text-xl italic uppercase tracking-tighter leading-none">{alert.clientName}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editAlert(alert)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-all hover:bg-primary/10" title="Ajustar Monitoramento">
                  <span className="material-symbols-outlined text-base">edit_note</span>
                </button>
                <button onClick={() => requestDelete(alert.id)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all hover:bg-red-500/10" title="Desativar">
                  <span className="material-symbols-outlined text-base">delete_outline</span>
                </button>
              </div>
            </div>

            <div className="mb-10 relative z-10">
              <p className="display-font text-5xl font-black text-white italic tracking-tighter leading-none group-hover:text-primary transition-colors">{alert.amount.toLocaleString()} <span className="text-[12px] opacity-40 uppercase ml-1">mi</span></p>

              {/* Cronograma de Vencimento Clicável */}
              <button
                onClick={() => editAlert(alert)}
                className={`mt-6 flex items-center gap-3 p-4 rounded-2xl border border-white/5 w-full text-left transition-all hover:bg-white/5 hover:border-white/10 ${new Date(alert.expirationDate).getTime() - Date.now() < 15 * 24 * 60 * 60 * 1000 && alert.status === 'pending' ? 'bg-red-500/5 border-red-500/20' : 'bg-card-dark'}`}
              >
                <div className={`size-10 rounded-xl flex items-center justify-center ${new Date(alert.expirationDate).getTime() - Date.now() < 15 * 24 * 60 * 60 * 1000 && alert.status === 'pending' ? 'bg-red-500/20 text-red-400' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Cronograma de Vencimento</p>
                  <p className={`text-sm font-black italic tracking-tighter ${new Date(alert.expirationDate).getTime() - Date.now() < 15 * 24 * 60 * 60 * 1000 && alert.status === 'pending' ? 'text-red-400' : 'text-white'}`}>
                    {new Date(alert.expirationDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-700 ml-auto group-hover:text-primary transition-colors">arrow_right_alt</span>
              </button>
            </div>

            {alert.observation && (
              <div className="mb-8 p-5 rounded-2xl bg-card-dark/30 border border-white/5 text-[10px] text-slate-400 italic leading-relaxed">
                "{alert.observation}"
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-white/5 relative z-10">
              <button
                onClick={() => resolveAlert(alert.id)}
                disabled={alert.status === 'resolved' || resolvingId === alert.id}
                className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${alert.status === 'resolved' ? 'bg-white/5 text-slate-600 border border-transparent' : 'bg-card-dark border border-white/10 text-slate-400 hover:bg-primary hover:text-bg-dark hover:border-primary active:scale-95 shadow-xl hover:shadow-primary/20'}`}
              >
                {resolvingId === alert.id ? (
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                ) : alert.status === 'resolved' ? (
                  <>
                    <span className="material-symbols-outlined text-sm font-black">task_alt</span>
                    CONCLUÍDO
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-black">verified_user</span>
                    ENCERRAR PROTOCOLO ELITE
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
        {filteredAlerts.length === 0 && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[48px] opacity-40">
            <span className="material-symbols-outlined text-6xl text-slate-800 mb-6">notifications_off</span>
            <p className="display-font italic uppercase tracking-[0.4em] text-[11px] font-black text-slate-500">Nenhum monitoramento identificado para este filtro</p>
          </div>
        )}
      </div>

      {/* MODAL NOVO ALERTA / EDIÇÃO */}
      {showNewAlert && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-xl" onClick={() => setShowNewAlert(false)}></div>
          <div className="relative bg-bg-surface border border-white/10 p-10 md:p-14 rounded-[48px] w-full max-w-3xl shadow-2xl space-y-12 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

            <div className="flex justify-between items-start">
              <div>
                <h3 className="display-font text-3xl font-bold text-white italic uppercase tracking-widest">{editingAlert ? 'Ajustar Protocolo' : 'Novo Alerta Estratégico'}</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-3 italic border-l-2 border-primary pl-4">Auditoria de Vencimento de Ativos</p>
              </div>
              <button onClick={() => setShowNewAlert(false)} className="size-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:rotate-90"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Titular Designado</label>
                <div className="relative">
                  <select className="w-full bg-card-dark border border-white/5 rounded-2xl py-5 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none italic appearance-none cursor-pointer" value={newAlert.clientId} onChange={e => setNewAlert({ ...newAlert, clientId: e.target.value })}>
                    <option value="">Selecionar titular do ativo...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-primary pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Programa / Natureza do Ativo</label>
                <input className="w-full bg-card-dark border border-white/5 rounded-2xl py-5 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none italic font-bold" value={newAlert.program} onChange={e => setNewAlert({ ...newAlert, program: e.target.value })} placeholder="Ex: LATAM Pass Platinum" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Volume de Milhas em Risco</label>
                <div className="relative">
                  <input type="number" className="w-full bg-card-dark border border-white/5 rounded-2xl py-5 px-6 text-2xl font-black text-white focus:ring-1 focus:ring-primary outline-none italic pr-16" value={newAlert.amount} onChange={e => setNewAlert({ ...newAlert, amount: e.target.value })} placeholder="0" />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">Milhas</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Data de Expiração (Validade)</label>
                <input type="date" className="w-full bg-card-dark border border-white/5 rounded-2xl py-5 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none h-[64px]" value={newAlert.date} onChange={e => setNewAlert({ ...newAlert, date: e.target.value })} />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Observações Críticas & Estratégia</label>
                <textarea
                  className="w-full bg-card-dark border border-white/5 rounded-[24px] py-5 px-6 text-sm text-slate-300 focus:ring-1 focus:ring-primary outline-none italic min-h-[120px] leading-relaxed"
                  value={newAlert.obs}
                  onChange={e => setNewAlert({ ...newAlert, obs: e.target.value })}
                  placeholder="Descreva a origem das milhas, bônus vinculados ou estratégias de resgate imediato..."
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 pt-4">
              <button onClick={() => setShowNewAlert(false)} className="flex-1 py-5 text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] hover:text-white transition-all order-2 md:order-1">CANCELAR ALTERAÇÕES</button>
              <button onClick={handleAddAlert} className="flex-1 bg-primary text-bg-dark font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all order-1 md:order-2">
                {editingAlert ? 'CONFIRMAR AJUSTE DE PROTOCOLO' : 'OFICIALIZAR MONITORAMENTO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-2xl" onClick={() => setShowConfirmDelete(false)}></div>
          <div className="relative bg-bg-surface border border-red-500/20 p-12 rounded-[48px] w-full max-w-md shadow-2xl text-center space-y-10">
            <div className="size-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-2xl shadow-red-500/10">
              <span className="material-symbols-outlined text-red-500 text-5xl font-light">delete_sweep</span>
            </div>
            <div>
              <h3 className="display-font text-2xl font-bold text-white uppercase italic tracking-widest mb-4">Remover Registro?</h3>
              <p className="text-slate-500 text-sm italic leading-relaxed px-4">Este monitoramento será permanentemente expurgado do terminal de auditoria. Esta operação é irreversível.</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={confirmDelete} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-red-600/30 transition-all active:scale-95">
                EXCLUIR PERMANENTEMENTE
              </button>
              <button onClick={() => setShowConfirmDelete(false)} className="w-full py-2 text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] hover:text-white transition-all">
                MANTER MONITORAMENTO ATIVO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
