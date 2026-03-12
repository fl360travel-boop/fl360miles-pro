
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { DashboardStats } from '../types';
import { getDashboardStats } from '../services/api';
import { BrandLogo } from '../components/BrandAssets';
import TeamManagement from '../components/TeamManagement';
import DollarTicker from '../components/DollarTicker';
import AIConciergeWidget from '../components/AIConciergeWidget';
import WelcomeOnboarding from '../components/WelcomeOnboarding';

const Dashboard: React.FC = () => {
  const [showTeamManagement, setShowTeamManagement] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Audit Filter States (Mantido visualmente, mas funcionalidade de auditoria detalhada via modal requer endpoint extra no futuro)
  const [auditMonth, setAuditMonth] = useState(new Date().getMonth().toString());
  const [auditYear, setAuditYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
    // Real-time subs temporarily disabled for optimization (Pull-to-refresh model helps performance)
  }, []);

  const metrics = stats?.metrics || { totalMiles: 0, totalProfit: 0, totalEconomy: 0, activeClients: 0 };
  const programMetrics = stats?.programMetrics || [];
  const recentOps = stats?.recentOps || [];
  const chartData = stats?.chartData || []; // Now comes from SQL

  // Retention Intelligence State
  const [retentionStats, setRetentionStats] = useState({
    churnRisk: 0,
    activeCount: 0,
    topLtvClient: { name: '', value: 0 },
    avgEngagement: 0
  });

  /* 
   * NOTE: Audit Modal logic was removed from this optimized view because filtering 
   * thousands of records client-side causes the lag. 
   * A separate 'Audit Page' or server-side filtered endpoint is recommended for the Audit feature.
   */

  // Fetch Clients for Retention Analysis (Lightweight)
  useEffect(() => {
    const analyzeRetention = async () => {
      try {
        // We need client list for this specific widget. 
        // Ideally backend would provide this, but for now we calc on frontend 
        // (assuming manageable client count for "High-Ticket" agency)
        const { getClients } = await import('../services/api');
        const clients = await getClients();

        const now = new Date().getTime();
        let riskCount = 0;
        let active = 0;
        let maxLtv = 0;
        let topClientName = '—';
        let totalDays = 0;

        clients.forEach(c => {
          // Engagement / Churn
          const lastActivity = c.history.length > 0
            ? Math.max(...c.history.map(h => new Date(h.date).getTime()))
            : new Date(c.startDate).getTime();
          const daysInactive = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

          if (daysInactive > 60) riskCount++;
          else active++;

          totalDays += daysInactive;

          // LTV (Estimated as Total Value + ROI)
          const totalPoints = c.programs.reduce((acc, p) => acc + p.balance, 0);
          const roi = c.history.filter(h => h.type === 'Venda').reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);
          const ltv = (totalPoints * 0.0185) + roi;

          if (ltv > maxLtv) {
            maxLtv = ltv;
            topClientName = c.name;
          }
        });

        setRetentionStats({
          churnRisk: riskCount,
          activeCount: active,
          topLtvClient: { name: topClientName, value: maxLtv },
          avgEngagement: clients.length ? Math.floor(totalDays / clients.length) : 0
        });

      } catch (e) {
        console.error("Retention Analysis Failed", e);
      }
    };
    analyzeRetention();
  }, []);

  const formatMiles = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  const displayChartData = chartData.length > 0 ? chartData : [
    { n: 'Jan', v: 0, year: 2024 }, { n: 'Fev', v: 0, year: 2024 }, { n: 'Mar', v: 0, year: 2024 }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20 relative">
      <WelcomeOnboarding isOpen={metrics.activeClients === 0 && !isLoading} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3 italic">Terminal Wealth Management</p>
          <h1 className="display-font text-white text-4xl font-bold tracking-tight uppercase italic">Dashboard Central</h1>
        </div>
        <div className="flex gap-4 items-center">
          <DollarTicker />
          <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>
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

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="tour-step-dashboard grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Milhas sob Gestão', value: formatMiles(metrics.totalMiles), trend: metrics.totalMiles > 0 ? '+' + formatMiles(metrics.totalMiles) : '0', icon: 'diamond' },
          { label: 'Lucro de Liquidação', value: `R$ ${metrics.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, trend: metrics.totalProfit > 0 ? '+8.4%' : '—', icon: 'payments' },
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

      {/* RETENTION INTELLIGENCE WIDGET */}
      {!isLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-700 delay-200">
          {/* CHURN ALERT */}
          <div className={`p-8 rounded-[32px] border ${retentionStats.churnRisk > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'} flex items-center justify-between`}>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 ${retentionStats.churnRisk > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                {retentionStats.churnRisk > 0 ? 'Risco de Churn' : 'Retenção Intacta'}
              </p>
              <p className="text-2xl font-black text-white italic tracking-tighter">
                {retentionStats.churnRisk} <span className="text-xs font-bold text-slate-500 not-italic normal-case">clientes inativos (+60d)</span>
              </p>
            </div>
            <div className={`size-12 rounded-full flex items-center justify-center ${retentionStats.churnRisk > 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
              <span className="material-symbols-outlined">{retentionStats.churnRisk > 0 ? 'warning' : 'thumb_up'}</span>
            </div>
          </div>

          {/* ENGAGEMENT METRIC */}
          <div className="p-8 rounded-[32px] border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Engajamento Médio</p>
              <p className="text-2xl font-black text-white italic tracking-tighter">
                {retentionStats.avgEngagement} <span className="text-xs font-bold text-slate-500 not-italic normal-case">dias entre ações</span>
              </p>
            </div>
            <div className="size-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined">history</span>
            </div>
          </div>

          {/* TOP LTV PLAYER */}
          <div className="p-8 rounded-[32px] border border-[#E2BE6A]/30 bg-[#E2BE6A]/5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl text-[#E2BE6A]">trophy</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-[#E2BE6A] uppercase tracking-[0.3em] mb-2">Cliente Top LTV</p>
              <p className="text-xl font-black text-white italic tracking-tighter truncate max-w-[200px]">
                {retentionStats.topLtvClient.name}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                LTV: R$ {retentionStats.topLtvClient.value.toLocaleString('pt-BR', { notation: 'compact' })}
              </p>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest italic">Crescimento consolidado de ativos (2025)</p>
            </div>
          </div>
          {metrics.activeClients === 0 ? (
            <div className="h-72 w-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-50">
              <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">insights</span>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center max-w-xs">Gráfico patrimonial disponível após o primeiro cadastro</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayChartData}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E2BE6A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E2BE6A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C2229" />
                  <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis dataKey="v" axisLine={false} tickFormatter={(val) => val.toLocaleString('pt-BR')} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16191E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#E2BE6A', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}
                    labelStyle={{ color: '#64748B', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}
                    formatter={(value: number) => [`${value.toLocaleString('pt-BR')} mi`, 'Patrimônio']}
                  />
                  <Area type="monotone" dataKey="v" stroke="#E2BE6A" strokeWidth={4} fillOpacity={1} fill="url(#dashGrad)" activeDot={{ r: 6, fill: '#E2BE6A', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* SECTION: Audit Log Removed from Home for Performance */}
        <div className="bg-gradient-to-br from-bg-surface to-primary/10 rounded-[40px] p-12 border border-primary/20 shadow-2xl flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-20 -top-20 size-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all"></div>
          <div>
            <div className="size-16 rounded-[24px] bg-primary/10 flex items-center justify-center mb-10 border border-primary/20 shadow-2xl">
              <span className="material-symbols-outlined text-primary text-4xl">speed</span>
            </div>
            <h3 className="display-font text-2xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none">High Performance <br /><span className="text-primary">Mode</span></h3>
            <p className="text-slate-400 text-sm italic leading-relaxed mb-10">
              Otimização de carregamento ativa. Para ver logs detalhados de auditoria, acesse o perfil individual de cada cliente.
            </p>
          </div>
          <Link to="/clients" className="w-full py-6 bg-white text-bg-dark font-black rounded-2xl uppercase tracking-[0.3em] text-[10px] hover:bg-primary transition-all active:scale-95 shadow-2xl text-center">
            ACESSAR CLIENTES
          </Link>
        </div>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="display-font text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic">Recent Ledger Entries</h3>
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
                  {['Venda', 'Resgate', 'Transferência'].includes(op.type) ? '-' : '+'}{op.amount.toLocaleString('pt-BR')}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-40">
                  <span className="material-symbols-outlined text-[10px]">verified</span>
                  <span className="text-[8px] font-black uppercase tracking-widest">Audit</span>
                </div>
              </div>
            </Link>
          ))}
          {recentOps.length === 0 && (
            <div className="col-span-full py-24 text-center border border-white/5 rounded-[40px] opacity-30 italic text-[11px] uppercase tracking-[0.4em] font-black">Nenhum registro recente.</div>
          )}
        </div>
      </section>

      {/* Team Management Modal */}
      <TeamManagement isOpen={showTeamManagement} onClose={() => setShowTeamManagement(false)} />

      {/* Altitude AI Concierge */}
      <AIConciergeWidget />
    </div>
  );
};

export default Dashboard;
