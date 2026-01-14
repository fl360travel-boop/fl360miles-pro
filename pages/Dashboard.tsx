
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { Client } from '../types';
import { getClients, subscribeToClients, subscribeToPrograms, subscribeToAllMovements } from '../services/api';
import { BrandLogo } from '../components/BrandAssets';
import TeamManagement from '../components/TeamManagement';

const Dashboard: React.FC = () => {
  const [showGlobalReport, setShowGlobalReport] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Audit Filter States
  const [auditMonth, setAuditMonth] = useState(new Date().getMonth().toString());
  const [auditYear, setAuditYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const data = await getClients();
        setClients(data);
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();

    // Real-time subscription para atualizações automáticas
    const clientsSub = subscribeToClients(() => {
      console.log('📡 Clients updated');
      loadClients();
    });

    const programsSub = subscribeToPrograms(() => {
      console.log('📡 Programs updated');
      loadClients();
    });

    const movementsSub = subscribeToAllMovements(() => {
      console.log('📡 Movements updated');
      loadClients();
    });

    return () => {
      clientsSub();
      programsSub();
      movementsSub();
    };
  }, []);

  const metrics = useMemo(() => {
    const totalMiles = clients.reduce((acc, client) =>
      acc + client.programs.reduce((pAcc, p) => pAcc + p.balance, 0), 0);

    const totalProfit = clients.reduce((acc, client) =>
      acc + client.history.reduce((hAcc, h) => hAcc + (h.negotiatedValue || 0), 0), 0);

    const totalEconomy = clients.reduce((acc, client) =>
      acc + client.history.reduce((hAcc, h) => hAcc + (h.economyGenerated || 0), 0), 0);

    return {
      totalMiles,
      totalProfit,
      totalEconomy,
      activeClients: clients.length
    };
  }, [clients]);

  // Calcular métricas por programa
  const programMetrics = useMemo(() => {
    const programMap = new Map<string, { balance: number; clientCount: number }>();

    clients.forEach(client => {
      client.programs.forEach(program => {
        // Normalize name: TRIM and UPPERCASE
        const normalizedName = program.name.trim().toUpperCase();

        const existing = programMap.get(normalizedName) || { balance: 0, clientCount: 0 };
        programMap.set(normalizedName, {
          balance: existing.balance + Number(program.balance),
          clientCount: existing.clientCount + 1
        });
      });
    });

    return Array.from(programMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.balance - a.balance);
  }, [clients]);

  const recentOps = useMemo(() => {
    const allOps = clients.flatMap(c => c.history.map(h => ({ ...h, clientName: c.name, clientId: c.id })));
    return allOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [clients]);

  const birthdaysToday = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    return clients.filter(c => {
      if (!c.birthDate) return false;
      const bDate = new Date(c.birthDate);
      return (bDate.getUTCDate() === todayDay && (bDate.getUTCMonth() + 1) === todayMonth);
    });
  }, [clients]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredAuditLogs = useMemo(() => {
    const allOps = clients.flatMap(c => c.history.map(h => ({ ...h, clientName: c.name, clientId: c.id })));

    // Filter by selected month/year
    return allOps.filter(op => {
      const d = new Date(op.date);
      // Adjust date to match local month/year correctly
      // (Using simple string parsing to avoid timezone shifts on the day, but month is reliable if created correctly)
      const opDate = new Date(op.date);
      // Need precise match? Let's use getUTCMonth if dates are stored as YYYY-MM-DD UTC
      // But displaying assumes local. Let's match based on constructing a date from the parts.
      const [y, m, day] = op.date.split('-').map(Number);
      return y === Number(auditYear) && (m - 1) === Number(auditMonth);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clients, auditMonth, auditYear]);

  // Totais do período
  const auditPeriodMetrics = useMemo(() => {
    const periodVolume = filteredAuditLogs.reduce((acc, op) => acc + op.amount, 0);
    // Rough logic: selling/resgate generates money (profit), inclusion generates cost? 
    // Or just sum the fields we have: negotiatedValue + economyGenerated
    const periodLiquidity = filteredAuditLogs.reduce((acc, op) => acc + (op.negotiatedValue || 0), 0);
    const periodEconomy = filteredAuditLogs.reduce((acc, op) => acc + (op.economyGenerated || 0), 0);
    return { periodVolume, periodLiquidity, periodEconomy };
  }, [filteredAuditLogs]);

  // Dados do gráfico baseados em movimentações reais (Evolução Patrimonial)
  const chartData = useMemo(() => {
    // 1. Calcular saldo total ATUAL de todos os clientes
    const currentTotalBalance = clients.reduce((acc, client) =>
      acc + client.programs.reduce((pAcc, p) => pAcc + p.balance, 0), 0);

    // 2. Coletar todo histórico plano
    const allHistory = clients.flatMap(c => c.history).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const monthlyData = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Começamos do "final" (hoje/futuro) e vamos voltando para reconstruir os saldos passados
    // Mas para o gráfico, queremos mostrar a evolução do Ano Selecionado (Jan -> Dez)

    // Estratégia: Calcular o saldo no FINAL de cada mês do ano selecionado.
    // Para isso, precisamos do saldo em 31/Dez do ano selecionado e ir voltando?
    // Ou: Calcular saldo inicial do sistema (assumindo 0 ou baseado no first input) e ir somando?
    // Melhor: Working Backwards do Current Balance é mais seguro se o histórico estiver incompleto, mas assume que Current é a verdade.

    let runningBalance = currentTotalBalance;
    const now = new Date();

    // Filtrar movimentos que aconteceram DEPOIS do ano selecionado (futuros em relação ao gráfico)
    // Se estou em 2026 e seleciono 2025: preciso subtrair tudo de 2026 para chegar em Dez/2025.
    const futureMovements = allHistory.filter(h => new Date(h.date).getFullYear() > selectedYear);

    futureMovements.forEach(h => {
      const factor = ['Venda', 'Resgate', 'Transferência'].includes(h.type) ? -1 : 1;
      // Se o movimento ADICIONOU saldo (Ex: Inclusão), para voltar ao passado, subtraímos.
      // Se REMOVEU (Ex: Resgate), para voltar, somamos.
      runningBalance -= (h.amount * factor);
    });

    // Agora `runningBalance` é o saldo em 31/Dez do ano selecionado (ou hoje, se for o ano atual).

    // Vamos iterar os meses de Dezembro até Janeiro do ano selecionado
    for (let m = 11; m >= 0; m--) {
      // Movimentos deste mês específico
      const movementsInMonth = allHistory.filter(h => {
        const d = new Date(h.date);
        return d.getFullYear() === selectedYear && d.getMonth() === m;
      });

      // O `runningBalance` atual representa o saldo no FINAL deste mês `m`.
      // Salvamos este ponto para o gráfico.
      monthlyData.unshift({
        n: monthNames[m],
        v: runningBalance,
        year: selectedYear
      });

      // Agora "desfazemos" os movimentos deste mês para chegar no saldo do mês anterior (m-1)
      movementsInMonth.forEach(h => {
        const factor = ['Venda', 'Resgate', 'Transferência'].includes(h.type) ? -1 : 1;
        runningBalance -= (h.amount * factor);
      });
    }

    return monthlyData;
  }, [clients, selectedYear]);

  const formatMiles = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toLocaleString();
  };

  const getProgramIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('livelo')) return 'loyalty';
    if (lower.includes('latam')) return 'flight';
    if (lower.includes('smiles')) return 'flight_takeoff';
    if (lower.includes('esfera')) return 'credit_card';
    if (lower.includes('azul')) return 'airplane_ticket';
    return 'stars';
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3 italic">Terminal Wealth Management</p>
          <h1 className="display-font text-white text-4xl font-bold tracking-tight uppercase italic">Dashboard Central</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowTeamManagement(true)}
            className="bg-bg-surface hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center gap-3 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">group</span> Equipe
          </button>
          <Link to="/onboarding" className="bg-primary hover:bg-primary-dark text-bg-dark px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all">
            <span className="material-symbols-outlined">add_circle</span> NOVO TITULAR
          </Link>
        </div>
      </div>

      {/* CELEBRAÇÕES ELITE - ANIVERSARIANTES */}
      {birthdaysToday.length > 0 && (
        <div className="bg-gradient-to-r from-primary/15 via-bg-surface to-transparent border border-primary/30 rounded-[32px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_0_50px_-12px_rgba(226,190,106,0.15)] animate-in slide-in-from-top duration-1000">
          <div className="flex items-center gap-8">
            <div className="size-20 rounded-[24px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
              <span className="material-symbols-outlined text-bg-dark text-5xl font-black">celebration</span>
            </div>
            <div className="space-y-2">
              <h3 className="display-font text-white text-2xl font-bold italic uppercase tracking-widest leading-none">Celebrações Elite</h3>
              <p className="text-slate-400 text-sm italic">Hoje é o aniversário de <span className="text-primary font-black uppercase tracking-tighter">{birthdaysToday.map(b => b.name).join(' & ')}</span>.</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-emerald-custom uppercase tracking-widest">Momento de Atenção Advisor</span>
              </div>
            </div>
          </div>
          <Link to={`/clients?id=${birthdaysToday[0].id}`} className="bg-white/5 hover:bg-primary text-primary hover:text-bg-dark px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 border border-primary/20">
            ACESSAR DOSSIÊ
          </Link>
        </div>
      )}

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Milhas sob Gestão', value: formatMiles(metrics.totalMiles), trend: metrics.totalMiles > 0 ? '+' + formatMiles(metrics.totalMiles) : '0', icon: 'diamond' },
          { label: 'Lucro de Liquidação', value: `R$ ${(metrics.totalProfit / 1000).toFixed(1)}k`, trend: metrics.totalProfit > 0 ? '+8.4%' : '—', icon: 'payments' },
          { label: 'Volume de Auditoria', value: recentOps.length.toString(), trend: recentOps.length > 0 ? 'Ativo' : 'Vazio', icon: 'security' },
          { label: 'Titulares Elite', value: metrics.activeClients.toString(), trend: metrics.activeClients > 0 ? 'VIP' : '—', icon: 'verified' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-surface p-8 rounded-[32px] border border-white/5 shadow-2xl hover:border-primary/20 transition-all group flex flex-col justify-between h-[180px]">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-primary text-3xl opacity-20 group-hover:opacity-100 transition-opacity">{stat.icon}</span>
              <span className="text-emerald-custom text-[10px] font-black tracking-widest uppercase italic">{stat.trend}</span>
            </div>
            <div>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <h3 className="serif-font text-3xl font-black text-white italic tracking-tighter group-hover:text-primary transition-colors">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* BREAKDOWN POR PROGRAMA */}
      {programMetrics.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="display-font text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic">Patrimônio por Programa</h3>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{programMetrics.length} programas ativos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {programMetrics.map((program, i) => (
              <div key={i} className="bg-bg-surface p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all text-primary group-hover:text-bg-dark">
                    <BrandLogo name={program.name} className="size-6" />
                  </div>
                </div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">{program.name}</p>
                <p className="text-xl font-black text-white italic tracking-tighter">{formatMiles(program.balance)}</p>
                <p className="text-[9px] text-slate-600 font-bold mt-2">{program.clientCount} {program.clientCount === 1 ? 'cliente' : 'clientes'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-bg-surface rounded-[40px] p-10 border border-white/5 shadow-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="display-font text-xs font-black uppercase tracking-[0.4em] text-white italic leading-relaxed">Evolução Patrimonial</h3>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest italic">Crescimento consolidado de ativos ({selectedYear})</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-black/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10 outline-none hover:border-primary/50 cursor-pointer appearance-none"
              >
                {Array.from({ length: 12 }, (_, i) => 2024 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl">
                <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E2BE6A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E2BE6A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C2229" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis dataKey="v" axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#16191E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#E2BE6A', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}
                  labelStyle={{ color: '#64748B', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}
                  formatter={(value: number) => [`${value.toLocaleString()} mi`, 'Patrimônio']}
                />
                <Area type="monotone" dataKey="v" stroke="#E2BE6A" strokeWidth={4} fillOpacity={1} fill="url(#dashGrad)" activeDot={{ r: 6, fill: '#E2BE6A', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-bg-surface to-primary/10 rounded-[40px] p-12 border border-primary/20 shadow-2xl flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-20 -top-20 size-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all"></div>
          <div>
            <div className="size-16 rounded-[24px] bg-primary/10 flex items-center justify-center mb-10 border border-primary/20 shadow-2xl">
              <span className="material-symbols-outlined text-primary text-4xl">security</span>
            </div>
            <h3 className="display-font text-2xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none">Internal <br /><span className="text-primary">Audit Log</span></h3>
            <p className="text-slate-400 text-sm italic leading-relaxed mb-10">
              Auditamos rigorosamente cada movimentação de ativo para garantir 100% de conformidade patrimonial.
            </p>
          </div>
          <button
            onClick={() => setShowGlobalReport(true)}
            className="w-full py-6 bg-white text-bg-dark font-black rounded-2xl uppercase tracking-[0.3em] text-[10px] hover:bg-primary transition-all active:scale-95 shadow-2xl"
          >
            GERAR AUDITORIA GLOBAL
          </button>
        </div>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="display-font text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic">Recent Ledger Entries</h3>
          <Link to="/settings" className="text-primary text-[10px] font-black hover:underline uppercase tracking-widest italic">Ver Histórico Completo</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentOps.map((op, i) => (
            <Link key={i} to={`/clients?id=${op.clientId}`} className="bg-bg-surface p-6 rounded-3xl border border-white/5 flex items-center justify-between hover:border-primary/20 transition-all group shadow-xl">
              <div className="flex items-center gap-6">
                <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-white/5 group-hover:bg-primary group-hover:text-bg-dark transition-all">
                  <span className="material-symbols-outlined text-2xl">
                    {op.type === 'Venda' ? 'payments' : op.type === 'Resgate' ? 'airplane_ticket' : 'sync'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-black text-white italic uppercase tracking-tighter leading-none">{op.type} {op.program}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black mt-2">{op.clientName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-black italic tracking-tighter ${['Venda', 'Resgate', 'Transferência'].includes(op.type) ? 'text-red-400' : 'text-emerald-400'}`}>
                  {['Venda', 'Resgate', 'Transferência'].includes(op.type) ? '-' : '+'}{op.amount.toLocaleString()}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-40">
                  <span className="material-symbols-outlined text-[10px]">verified</span>
                  <span className="text-[8px] font-black uppercase tracking-widest">Audit</span>
                </div>
              </div>
            </Link>
          ))}
          {recentOps.length === 0 && (
            <div className="col-span-full py-24 text-center border border-white/5 rounded-[40px] opacity-30 italic text-[11px] uppercase tracking-[0.4em] font-black">Nenhum registro no terminal.</div>
          )}
        </div>
      </section>

      {/* MODAL GLOBAL AUDIT */}
      {showGlobalReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 animate-in fade-in duration-300 print:relative print:p-0">
          <div className="absolute inset-0 bg-bg-dark/98 backdrop-blur-2xl print:hidden" onClick={() => setShowGlobalReport(false)}></div>
          <div className="relative w-full max-w-6xl bg-white text-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col custom-scrollbar print:bg-white animate-in zoom-in duration-300 print:shadow-none print:overflow-visible">
            <div className="bg-black p-20 text-white flex justify-between items-center relative overflow-hidden print:p-12">
              <div className="absolute top-0 right-0 size-[500px] bg-primary/10 rounded-full -mr-64 -mt-64 blur-[120px] print:hidden"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <span className="display-font text-2xl font-bold tracking-[0.5em] uppercase italic">FL360<span className="text-primary">MILES</span></span>
                </div>
                <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none print:text-4xl">Strategic Wealth<br />Analytics Terminal</h2>
                <p className="text-primary text-[10px] font-bold uppercase tracking-[0.8em] mt-8 opacity-90">Consolidado de Ativos Patrimoniais</p>
              </div>
              <div className="text-right relative z-10 flex flex-col items-end">
                <div className="flex gap-2 mb-4 print:hidden animate-in fade-in slide-in-from-right-8">
                  <select
                    value={auditMonth}
                    onChange={(e) => setAuditMonth(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:border-primary/50 cursor-pointer hover:bg-white/20 transition-all appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i} className="text-bg-dark">{new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</option>
                    ))}
                  </select>
                  <select
                    value={auditYear}
                    onChange={(e) => setAuditYear(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:border-primary/50 cursor-pointer hover:bg-white/20 transition-all appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => 2024 + i).map(year => (
                      <option key={year} value={year} className="text-bg-dark">{year}</option>
                    ))}
                  </select>
                </div>
                <p className="text-4xl font-black italic uppercase tracking-tighter print:text-3xl">
                  {new Date(Number(auditYear), Number(auditMonth)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
                <div className="w-20 h-1 bg-primary ml-auto mt-6 mb-4"></div>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest italic">Adriano Moraes Wealth Advisor</p>
              </div>
            </div>

            <div className="flex-1 p-24 space-y-20 print:p-16">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-slate-50 p-10 rounded-[32px] border-l-[10px] border-black shadow-inner">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Volume Movimentado</p>
                  <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{auditPeriodMetrics.periodVolume.toLocaleString()} <span className="text-xs opacity-40 uppercase">mi</span></p>
                </div>
                <div className="bg-slate-50 p-10 rounded-[32px] border-l-[10px] border-primary shadow-inner">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Liquidez Gerada</p>
                  <p className="text-4xl font-black text-emerald-600 italic tracking-tighter leading-none">R$ {auditPeriodMetrics.periodLiquidity.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-10 rounded-[32px] border-l-[10px] border-indigo-500 shadow-inner">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Economia Gerada</p>
                  <p className="text-4xl font-black text-indigo-600 italic tracking-tighter leading-none">R$ {auditPeriodMetrics.periodEconomy.toLocaleString()}</p>
                </div>
              </section>

              {/* Breakdown por programa no relatório */}
              {programMetrics.length > 0 && (
                <section className="pt-10">
                  <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] border-b-2 border-slate-100 pb-4 mb-8">Distribuição por Programa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {programMetrics.map((program, idx) => (
                      <div key={idx} className="bg-slate-50 p-8 rounded-2xl border-l-4 border-slate-300">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{program.name}</p>
                        <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{program.balance.toLocaleString()} mi</p>
                        <p className="text-[9px] text-slate-400 mt-1">{program.clientCount} clientes</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="pt-20">
                <div className="flex items-center gap-6 mb-12">
                  <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] border-b-2 border-slate-100 flex-1 pb-4">Audit Trail Summary</h3>
                </div>
                <div className="space-y-6">
                  {filteredAuditLogs.map((op, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-6 print:break-inside-avoid">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{op.date} • {op.clientName}</p>
                        <p className="text-sm font-black italic uppercase tracking-tighter">{op.type} {op.program}</p>
                      </div>
                      <p className={`text-xl font-black italic tracking-tighter ${['Venda', 'Resgate'].includes(op.type) ? 'text-red-500' : 'text-emerald-600'}`}>
                        {op.amount.toLocaleString()} mi
                      </p>
                    </div>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <p className="text-center text-slate-400 text-xs uppercase tracking-widest font-black italic opacity-50 py-10">Nenhum registro encontrado neste período.</p>
                  )}
                </div>
              </section>

              <div className="pt-40 text-center opacity-40">
                <p className="display-font text-slate-400 text-[11px] tracking-[1.2em] uppercase italic">FL360MILES TERMINAL ANALYTICS — CONFIDENTIAL DOCUMENT — v2.0</p>
              </div>
            </div>

            <div className="p-12 bg-slate-50 border-t border-slate-200 flex justify-end gap-6 print:hidden">
              <button onClick={() => setShowGlobalReport(false)} className="px-10 py-5 text-slate-500 font-black uppercase text-[10px] tracking-widest italic hover:text-black">CANCELAR</button>
              <button onClick={() => window.print()} className="bg-black text-white px-20 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95">IMPRIMIR AUDITORIA OFICIAL</button>
            </div>
          </div>
        </div>
      )}

      {/* Team Management Modal */}
      <TeamManagement isOpen={showTeamManagement} onClose={() => setShowTeamManagement(false)} />
    </div>
  );
};

export default Dashboard;
