
import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { Client, MileageMovement } from '../types';
import { getClients } from '../services/api';

const Operations: React.FC = () => {
  const { searchQuery } = useSearch();
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

  const globalOperations = useMemo(() => {
    const all = clients.flatMap(c => c.history.map(h => ({
      ...h,
      clientName: c.name,
      clientId: c.id
    })));
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clients]);

  const filteredOperations = useMemo(() => {
    if (!searchQuery.trim()) return globalOperations;
    const q = searchQuery.toLowerCase();
    return globalOperations.filter(op =>
      op.clientName?.toLowerCase().includes(q) ||
      op.program.toLowerCase().includes(q) ||
      op.description.toLowerCase().includes(q) ||
      op.id.toLowerCase().includes(q)
    );
  }, [globalOperations, searchQuery]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-700">
      <section>
        <div className="flex items-end justify-between mb-6">
          <h3 className="display-font text-white text-lg font-bold uppercase tracking-widest opacity-80">Ações Rápidas</h3>
          <span className="text-[10px] text-primary uppercase font-bold tracking-[0.2em]">Fluxo Operacional</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Nova Transferência', sub: 'Otimizar Pontuação', icon: 'swap_horiz', path: '/transfer', color: 'primary' },
            { title: 'Nova Venda', sub: 'Liquidez Imediata', icon: 'sell', path: '/sale', color: 'primary' },
            { title: 'Novo Resgate', sub: 'Emissão de Bilhetes', icon: 'loyalty', path: '/redemption', color: 'emerald-custom' },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.path}
              className="group relative overflow-hidden bg-bg-surface border border-white/10 p-8 flex flex-col justify-between aspect-[4/3] rounded-2xl hover:border-primary/50 transition-all shadow-2xl"
            >
              <div className="flex justify-between items-start">
                <span className={`material-symbols-outlined text-${action.color} text-4xl`}>{action.icon}</span>
                <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">north_east</span>
              </div>
              <div>
                <h4 className="text-white text-xl display-font font-bold italic tracking-tighter">{action.title}</h4>
                <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-black">{action.sub}</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <h3 className="display-font text-white text-lg font-bold uppercase tracking-widest opacity-80">Ledger de Operações</h3>
          <div className="flex gap-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Registros Totais: {filteredOperations.length}</span>
          </div>
        </div>

        <div className="space-y-3">
          {filteredOperations.map((op, i) => (
            <Link
              key={i}
              to={`/clients?id=${op.clientId}`}
              className="flex flex-col md:flex-row md:items-center gap-4 bg-bg-surface px-6 py-5 rounded-2xl hover:bg-white/5 border border-white/5 transition-all group animate-in fade-in"
            >
              <div className={`flex items-center justify-center rounded-xl shrink-0 size-14 border border-white/10 bg-card-dark`}>
                <span className={`material-symbols-outlined ${['Venda', 'Resgate'].includes(op.type) ? 'text-red-400' : 'text-emerald-custom'}`}>
                  {op.type === 'Venda' ? 'payments' : op.type === 'Resgate' ? 'airplane_ticket' : 'sync_alt'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-white text-base font-bold truncate group-hover:text-primary transition-colors italic uppercase tracking-tighter">{op.description}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-white/5 bg-white/5 text-slate-400`}>CONCLUÍDO</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase italic">{op.date} • {op.clientName} • {op.program}</p>
                  <p className={`text-sm font-black italic ${['Venda', 'Resgate', 'Transferência'].includes(op.type) ? 'text-red-400' : 'text-emerald-400'}`}>
                    {['Venda', 'Resgate', 'Transferência'].includes(op.type) ? '-' : '+'}{op.amount.toLocaleString()} mi
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {filteredOperations.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-40 italic uppercase tracking-[0.4em] text-[11px] font-black text-slate-500">
              Nenhuma trilha operacional identificada.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Operations;
