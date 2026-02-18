
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, MileageMovement } from '../types';
import { getClients } from '../services/api';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

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
  }, []);

  const globalHistory = useMemo(() => {
    const all = clients.flatMap(c => c.history.map(h => ({ ...h, clientName: c.name, clientId: c.id })));
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clients]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const opsToday = globalHistory.filter(h => h.date === today).length;
    const totalVolume = globalHistory.reduce((acc, h) => acc + h.amount, 0);
    return { opsToday, totalVolume };
  }, [globalHistory]);

  const filteredMovements = globalHistory.filter(m => {
    const matchesType = filterType === 'Todos' || m.type === filterType;
    const q = searchTerm.toLowerCase();
    const matchesSearch = m.clientName?.toLowerCase().includes(q) ||
      m.program.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const handleRowClick = (clientId: string) => {
    // Redireciona para a página de clientes passando o ID para o sistema abrir o modal
    navigate(`/clients?id=${clientId}`);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <h1 className="display-font text-3xl font-bold text-white italic uppercase tracking-tighter">Audit Log Global</h1>
          <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest font-bold">Terminal de Integridade e Auditoria de Patrimônio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-custom/10 text-emerald-custom px-4 py-2 rounded-full border border-emerald-custom/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-custom/5">
            <span className="size-1.5 bg-emerald-custom rounded-full animate-pulse"></span>
            Compliance Ativo
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-white/10 transition-all">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Total de Registros</p>
          <h3 className="display-font text-3xl font-black text-white italic">{globalHistory.length}</h3>
        </div>
        <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/20 transition-all">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Volume Acumulado</p>
          <h3 className="display-font text-3xl font-black text-primary italic">{stats.totalVolume.toLocaleString('pt-BR')} <span className="text-xs opacity-40 uppercase">milhas</span></h3>
        </div>
        <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-emerald-custom/20 transition-all">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Atualizações Hoje</p>
          <h3 className="display-font text-3xl font-black text-emerald-custom italic">{stats.opsToday}</h3>
        </div>
      </section>

      <section className="bg-bg-surface border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0">
            <h3 className="display-font text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">Filtrar Fluxo</h3>
            <div className="flex gap-2">
              {['Todos', 'Venda', 'Compra', 'Transferência', 'Resgate'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filterType === t ? 'bg-primary border-primary text-bg-dark' : 'bg-transparent border-white/10 text-slate-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="relative group min-w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="Buscar por titular ou ativo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-card-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[11px] text-white focus:ring-1 focus:ring-primary w-full outline-none italic"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-card-dark/50 text-slate-500 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5">
                <th className="px-8 py-5">Data Operação</th>
                <th className="px-8 py-5">Titular do Ativo</th>
                <th className="px-8 py-5">Natureza</th>
                <th className="px-8 py-5">Programa / Ativo</th>
                <th className="px-8 py-5 text-right">Quantidade</th>
                <th className="px-8 py-5">Verificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMovements.map(m => (
                <tr
                  key={m.id}
                  onClick={() => m.clientId && handleRowClick(m.clientId)}
                  className="hover:bg-primary/5 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-primary"
                >
                  <td className="px-8 py-5 text-[10px] text-slate-500 font-bold italic">{m.date}</td>
                  <td className="px-8 py-5">
                    <p className="text-white text-xs font-black uppercase tracking-tighter group-hover:text-primary transition-colors">{m.clientName}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest ${['Venda', 'Resgate', 'Transferência'].includes(m.type) ? 'text-red-400 bg-red-400/10' : 'text-emerald-custom bg-emerald-custom/10'}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs text-slate-400 font-bold italic">{m.program}</td>
                  <td className={`px-8 py-5 text-right text-sm font-black italic ${['Venda', 'Resgate', 'Transferência'].includes(m.type) ? 'text-red-400' : 'text-emerald-400'}`}>
                    {['Venda', 'Resgate', 'Transferência'].includes(m.type) ? '-' : '+'}{m.amount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-emerald-custom text-sm">verified</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Auditado</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <span className="material-symbols-outlined text-slate-800 text-5xl mb-4">search_off</span>
                    <p className="text-slate-600 italic uppercase tracking-[0.4em] text-[10px] font-black">Nenhum registro localizado no terminal</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Settings;
