
import React, { useState, useEffect, useMemo } from 'react';
import { Client, MileageMovement } from '../types';
import { useSearch } from '../contexts/SearchContext';
import { getClients } from '../services/api';

type CardType = 'profit' | 'miles' | 'economy' | 'audit';

const StrategicSummary: React.FC = () => {
  const { searchQuery } = useSearch();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDetail, setIsExportingDetail] = useState(false);
  const [activeDetail, setActiveDetail] = useState<CardType | null>(null);

  // Modal Filters
  const [modalProgramFilter, setModalProgramFilter] = useState('all');

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

  const searchFilteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.cpf && c.cpf.includes(q)) ||
      c.programs.some(p => p.name.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  const stats = useMemo(() => {
    let targetClients = searchFilteredClients;
    if (selectedClientId !== 'all') {
      targetClients = targetClients.filter(c => c.id === selectedClientId);
    }

    let totalProfit = 0;
    let totalMiles = 0;
    let totalEconomy = 0;
    let movementsCount = 0;
    const allMovements: (MileageMovement & { clientName: string })[] = [];

    targetClients.forEach(c => {
      c.history.forEach(h => {
        const hDate = new Date(h.date);
        const now = new Date();
        let isInPeriod = false;

        if (period === 'month') {
          isInPeriod = hDate.getMonth() === now.getMonth() && hDate.getFullYear() === now.getFullYear();
        } else if (period === 'quarter') {
          const quarter = Math.floor(now.getMonth() / 3);
          const hQuarter = Math.floor(hDate.getMonth() / 3);
          isInPeriod = quarter === hQuarter && hDate.getFullYear() === now.getFullYear();
        } else {
          isInPeriod = hDate.getFullYear() === now.getFullYear();
        }

        if (isInPeriod) {
          movementsCount++;
          if (h.type === 'Venda') totalProfit += (h.negotiatedValue || 0);
          if (h.type === 'Resgate') totalEconomy += (h.economyGenerated || 0);
          totalMiles += h.amount;
          allMovements.push({ ...h, clientName: c.name });
        }
      });
    });

    return { totalProfit, totalMiles, totalEconomy, movementsCount, clientCount: targetClients.length, allMovements };
  }, [selectedClientId, searchFilteredClients, period]);

  const detailData = useMemo(() => {
    if (!activeDetail) return [];
    let data = stats.allMovements;

    if (activeDetail === 'profit') data = data.filter(m => m.type === 'Venda');
    if (activeDetail === 'economy') data = data.filter(m => m.type === 'Resgate' && (m.economyGenerated || 0) > 0);

    if (modalProgramFilter !== 'all') {
      data = data.filter(m => m.program === modalProgramFilter);
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeDetail, stats.allMovements, modalProgramFilter]);

  const programs = useMemo(() => {
    const pSet = new Set<string>();
    stats.allMovements.forEach(m => pSet.add(m.program));
    return Array.from(pSet);
  }, [stats.allMovements]);

  const handleExportGlobal = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 1200);
  };

  const handleExportDetail = () => {
    setIsExportingDetail(true);
    setTimeout(() => {
      setIsExportingDetail(false);
      window.print();
    }, 1000);
  };

  const getCardTitle = (type: CardType) => {
    switch (type) {
      case 'profit': return 'Liquidez Realizada';
      case 'miles': return 'Ativos Gerenciados';
      case 'economy': return 'Economia Concierge';
      case 'audit': return 'Trilha de Auditoria';
      default: return '';
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10 print:hidden">
        <div>
          <h1 className="display-font text-3xl font-bold tracking-[0.1em] text-white italic uppercase leading-none">Intelligence Center</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mt-3">Strategic Asset Audit Terminal</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-bg-surface border border-white/10 rounded-xl py-3 px-6 text-[11px] font-black uppercase text-white focus:ring-1 focus:ring-primary outline-none italic min-w-[260px] appearance-none cursor-pointer"
            >
              <option value="all">Base Consolidada ({searchFilteredClients.length})</option>
              {searchFilteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none text-sm">filter_list</span>
          </div>

          <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-xl border border-white/10 shadow-2xl">
            {['month', 'quarter', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-bg-dark' : 'text-slate-500 hover:text-white'}`}
              >
                {p === 'month' ? 'Mensal' : p === 'quarter' ? 'Tri' : 'Anual'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        {[
          { id: 'profit' as CardType, label: 'Lucro de Liquidação', value: `R$ ${stats.totalProfit.toLocaleString()}`, trend: '+14.2%', sub: 'Efetividade Patrimonial' },
          { id: 'miles' as CardType, label: 'Ativos Gerenciados', value: `${(stats.totalMiles / 1000).toFixed(0)}k`, trend: '+28.5%', sub: 'Volume Consolidado' },
          { id: 'economy' as CardType, label: 'Economia Concierge', value: `R$ ${stats.totalEconomy.toLocaleString()}`, trend: '+9.4%', sub: 'Saving em Emissões' },
          { id: 'audit' as CardType, label: 'Escopo de Auditoria', value: stats.movementsCount, trend: 'Protocolo Elite', sub: `${stats.clientCount} Titulares Filtrados` }
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => { setActiveDetail(card.id); setModalProgramFilter('all'); }}
            className="bg-bg-surface p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-primary/40 hover:scale-[1.02] hover:shadow-[0_0_35px_-5px_rgba(226,190,106,0.15)] transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[180px]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="absolute top-0 left-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity duration-500">
              <span className="material-symbols-outlined text-4xl text-primary">analytics</span>
            </div>

            <div className="relative z-10 flex flex-col pt-2">
              <p className="display-font text-3xl font-black tracking-tighter italic text-white leading-none group-hover:text-primary transition-colors duration-500">{card.value}</p>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-3">{card.label}</p>
            </div>

            <div className="flex flex-col items-end border-t border-white/5 pt-4 relative z-10 mt-8">
              <span className="text-primary text-[10px] font-black tracking-[0.2em]">{card.trend}</span>
              <span className="text-[9px] text-slate-600 font-bold uppercase italic tracking-widest mt-1.5 truncate max-w-full">{card.sub}</span>
            </div>
          </div>
        ))}
      </section>

      {/* PREMIUM MODAL DETAIL */}
      {activeDetail && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300 print:relative print:p-0 print:z-auto print:bg-white">
          <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-xl print:hidden" onClick={() => setActiveDetail(null)}></div>
          <div className="relative bg-bg-surface border border-white/10 p-10 md:p-14 rounded-[48px] w-full max-w-4xl shadow-2xl space-y-10 overflow-hidden animate-in zoom-in-95 duration-500 max-h-[85vh] flex flex-col print:bg-white print:border-none print:shadow-none print:max-h-none print:w-full print:p-12 print:text-slate-900">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary print:hidden"></div>

            <div className="flex justify-between items-start shrink-0">
              <div className="print:text-slate-900">
                {/* Breadcrumb Visual Premium */}
                <nav className="flex items-center gap-2 mb-4 print:hidden">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resumo</span>
                  <span className="material-symbols-outlined text-[10px] text-slate-700">chevron_right</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{getCardTitle(activeDetail)}</span>
                  <span className="material-symbols-outlined text-[10px] text-slate-700">chevron_right</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Detalhes</span>
                </nav>

                <div className="hidden print:flex items-center gap-3 mb-8">
                  <div className="size-8 bg-black rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg font-bold">diamond</span>
                  </div>
                  <span className="display-font text-xs font-bold tracking-[0.4em] uppercase italic text-black">FL360MILES</span>
                </div>
                <h3 className="display-font text-3xl font-bold text-white italic uppercase tracking-widest print:text-slate-900 print:text-2xl">
                  {activeDetail === 'profit' ? 'Detalhamento de Liquidez' :
                    activeDetail === 'miles' ? 'Extrato de Ativos' :
                      activeDetail === 'economy' ? 'Auditoria de Savings' :
                        'Trilha de Auditoria'}
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-3 italic border-l-2 border-primary pl-4 print:text-slate-400">Audit Period: {period.toUpperCase()}</p>
              </div>
              <div className="flex gap-4 print:hidden">
                <button
                  onClick={handleExportDetail}
                  disabled={isExportingDetail}
                  className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-bg-dark transition-all shadow-xl group"
                  title="Exportar Detalhamento PDF"
                >
                  {isExportingDetail ? <span className="material-symbols-outlined animate-spin text-xl">sync</span> : <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">picture_as_pdf</span>}
                </button>
                <button onClick={() => setActiveDetail(null)} className="size-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:rotate-90">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Modal Internal Filters */}
            <div className="flex flex-wrap items-center gap-6 shrink-0 bg-card-dark/30 p-6 rounded-3xl border border-white/5 print:bg-slate-50 print:border-slate-100 print:p-6 print:rounded-2xl">
              <div className="space-y-2 print:hidden">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Filtro por Programa</label>
                <select
                  value={modalProgramFilter}
                  onChange={(e) => setModalProgramFilter(e.target.value)}
                  className="bg-bg-dark border border-white/10 rounded-xl py-2 px-4 text-[10px] font-bold text-white uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary appearance-none min-w-[180px] cursor-pointer print:hidden"
                >
                  <option value="all">TODOS OS PROGRAMAS</option>
                  {programs.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="ml-auto flex items-center gap-10">
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic mb-1 print:text-slate-400">Total de Registros</p>
                  <p className="text-white font-black text-lg italic tracking-tighter print:text-slate-900">{detailData.length}</p>
                </div>
                {activeDetail === 'profit' && (
                  <div className="text-right border-l border-white/10 pl-10 print:border-slate-200">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic mb-1 print:text-slate-400">Volume Consolidado</p>
                    <p className="text-primary font-black text-lg italic tracking-tighter">R$ {detailData.reduce((acc, curr) => acc + (curr.negotiatedValue || 0), 0).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 print:overflow-visible print:pr-0">
              <div className="space-y-4 print:space-y-3">
                {detailData.map((m, idx) => (
                  <div key={idx} className="bg-card-dark/40 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/20 transition-all print:bg-white print:border-b print:border-slate-100 print:rounded-none print:px-0 print:py-4 print:flex-row">
                    <div className="flex items-center gap-6 flex-1">
                      <div className={`size-12 rounded-xl flex items-center justify-center print:hidden ${m.type === 'Venda' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined">{m.type === 'Venda' ? 'payments' : 'sync'}</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest print:text-[8px] print:text-slate-400">{m.date} • {m.clientName}</p>
                        <h5 className="text-white font-black text-sm uppercase italic tracking-tighter mt-1 group-hover:text-primary transition-colors print:text-slate-900 print:text-xs">{m.program} - {m.type}</h5>
                        {m.observation && <p className="text-[9px] text-slate-600 italic mt-2 line-clamp-1 print:text-slate-400">"{m.observation}"</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black italic tracking-tighter print:text-sm ${m.type === 'Venda' || m.type === 'Resgate' ? 'text-white print:text-slate-900' : 'text-primary'}`}>
                        {activeDetail === 'profit' ? `R$ ${m.negotiatedValue?.toLocaleString()}` : activeDetail === 'economy' ? `R$ ${m.economyGenerated?.toLocaleString()}` : `${m.amount.toLocaleString()} mi`}
                      </p>
                      <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest print:text-[7px]">Protocolo Auditado</span>
                    </div>
                  </div>
                ))}
                {detailData.length === 0 && (
                  <div className="py-20 text-center opacity-30 italic uppercase text-[10px] tracking-widest">Nenhum registro encontrado para este filtro de período.</div>
                )}
              </div>
            </div>

            <footer className="hidden print:block pt-16 text-center border-t border-slate-100 mt-12 opacity-40 shrink-0">
              <p className="display-font text-[8px] tracking-[0.8em] uppercase text-slate-400 italic">Audit Log Ver. 3.4 — Adriano Moraes Wealth Advisor</p>
            </footer>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-bg-surface via-bg-surface to-primary/5 border border-primary/20 rounded-[40px] p-16 flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl print:hidden relative overflow-hidden">
        <div className="absolute top-0 right-0 size-80 bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
        <div className="space-y-6 text-center md:text-left relative z-10">
          <h2 className="serif-font text-5xl italic text-white leading-tight uppercase tracking-tighter">Strategic Wealth <br /><span className="text-primary italic">Analytics Terminal</span></h2>
          <p className="text-slate-400 text-base max-w-xl italic leading-relaxed font-light">
            Sincronize o terminal e gere relatórios auditados de performance individual ou consolidada para prestação de contas de alto nível.
          </p>
        </div>
        <button
          onClick={handleExportGlobal}
          disabled={isExporting}
          className="bg-primary hover:bg-primary-dark text-bg-dark px-16 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-2xl shadow-primary/30 flex items-center gap-4 active:scale-95 disabled:opacity-50 relative z-10 group"
        >
          {isExporting ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined group-hover:scale-110 transition-transform">print_connect</span>}
          {isExporting ? 'PROCESSANDO AUDITORIA...' : 'GERAR WEALTH REPORT GLOBAL'}
        </button>
      </div>

      {/* Audit Trail Preview */}
      <section className="space-y-6 print:hidden">
        <h3 className="display-font text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic px-2">Recent Trail — Protocol Ver. 3.4</h3>
        <div className="bg-bg-surface border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
          <div className="grid grid-cols-4 px-10 py-5 bg-card-dark/30 text-[9px] font-black text-slate-600 uppercase tracking-widest">
            <span>Data</span>
            <span>Titular</span>
            <span>Ativo</span>
            <span className="text-right">Volume</span>
          </div>
          <div className="divide-y divide-white/5">
            {clients.flatMap(c => c.history.map(h => ({ ...h, clientName: c.name }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((h, i) => (
              <div key={i} className="grid grid-cols-4 px-10 py-6 hover:bg-white/5 transition-colors items-center italic cursor-default">
                <span className="text-[10px] text-slate-500 font-bold">{h.date}</span>
                <span className="text-xs font-black text-white uppercase tracking-tighter">{h.clientName}</span>
                <span className="text-xs text-primary font-bold">{h.program}</span>
                <span className="text-right text-sm font-black text-white">{h.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="hidden print:block pt-32 text-center border-t border-slate-100 mt-20 opacity-40">
        <p className="display-font text-[10px] tracking-[1.2em] uppercase text-slate-400 italic mb-12">FL360MILES Asset Protocol — Adriano Moraes Wealth Advisor</p>
      </footer>
    </div>
  );
};

export default StrategicSummary;
