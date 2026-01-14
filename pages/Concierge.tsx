
import React, { useState, useEffect } from 'react';
import { Client, MileageMovement } from '../types';
import { getClients, updateClient } from '../services/api';

type ConciergeCategory = 'Vôos' | 'Hospedagem' | 'Locação' | 'Seguros' | 'Experiências' | 'Manual';

const Concierge: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConciergeCategory>('Vôos');
  const [peopleCount, setPeopleCount] = useState('1');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form fields
  const [route, setRoute] = useState('');
  const [hotel, setHotel] = useState('');
  const [additionalObs, setAdditionalObs] = useState('');

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

  const handleConfirmRequest = async () => {
    if (!selectedClientId) {
      alert('Por favor, selecione o titular para esta solicitação.');
      return;
    }

    setIsProcessing(true);

    const movement: MileageMovement = {
      id: `CONC-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Resgate',
      program: 'Concierge VIP',
      amount: 0,
      description: `Solicitação Concierge: ${activeTab} - ${route || hotel || 'Serviço Premium'}`,
      observation: `[CONCIERGE] Atendimento para ${peopleCount} pax. Detalhes: ${additionalObs}`,
    };

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    try {
      await updateClient(selectedClientId, {
        history: [movement, ...client.history]
      });

      setTimeout(() => {
        setIsProcessing(false);
        alert('Solicitação protocolada com sucesso. O consultor de concierge entrará em contato em instantes.');
        setRoute('');
        setHotel('');
        setAdditionalObs('');
      }, 1000);
    } catch (error) {
      setIsProcessing(false);
      alert('Erro ao processar solicitação.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 animate-in fade-in duration-700">
      <div className="flex gap-10 border-b border-white/10 mb-12 overflow-x-auto pb-0.5 custom-scrollbar">
        {(['Vôos', 'Hospedagem', 'Locação', 'Seguros', 'Experiências', 'Manual'] as ConciergeCategory[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-3">Serviços Exclusivos</p>
            <h1 className="display-font text-4xl font-bold italic text-white leading-none">
              Reserva {activeTab}
            </h1>
            <div className="w-20 h-1 bg-primary mt-6"></div>
          </div>

          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <label className="text-slate-500 text-[9px] font-bold uppercase tracking-widest px-1">Quantidade de Membros</label>
              <div className="flex items-center bg-bg-card border border-white/10 rounded-xl px-4 py-2">
                <button onClick={() => setPeopleCount(Math.max(1, parseInt(peopleCount) - 1).toString())} className="text-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <input
                  type="number"
                  className="bg-transparent border-none text-center w-12 text-sm text-white focus:ring-0 font-bold"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                />
                <button onClick={() => setPeopleCount((parseInt(peopleCount) + 1).toString())} className="text-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-white/5 rounded-3xl p-10 shadow-2xl space-y-10">
          <div className="max-w-md space-y-3">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Titular Designado</label>
            <div className="relative">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-bg-card border border-white/10 rounded-xl py-4 px-6 text-sm text-white appearance-none outline-none focus:ring-1 focus:ring-primary italic"
              >
                <option value="">Selecione o membro...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="pt-10 border-t border-white/10">
            {activeTab === 'Vôos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Origem / Destino</label>
                  <input className="w-full bg-bg-card border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary italic" value={route} onChange={e => setRoute(e.target.value)} placeholder="Ex: GRU -> LHR" />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Classe Requerida</label>
                  <select className="w-full bg-bg-card border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none italic">
                    <option>First Class (Padrão Elite)</option>
                    <option>Business Class</option>
                    <option>Premium Economy</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'Hospedagem' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Resort / Hotel</label>
                  <input className="w-full bg-bg-card border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary italic" value={hotel} onChange={e => setHotel(e.target.value)} placeholder="Ex: Aman Tokyo" />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Datas Preferenciais</label>
                  <input className="w-full bg-bg-card border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary" placeholder="Julho / 2024" />
                </div>
              </div>
            )}

            <div className="mt-10 space-y-4">
              <label className="text-slate-300 text-[10px] font-bold uppercase tracking-widest px-1">Briefing do Atendimento</label>
              <textarea
                className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xs text-slate-300 focus:ring-1 focus:ring-primary min-h-[140px] italic leading-relaxed outline-none"
                value={additionalObs}
                onChange={e => setAdditionalObs(e.target.value)}
                placeholder="Insira detalhes específicos, preferências de concierge, restrições e solicitações especiais..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-6">
          <button className="px-10 py-4 rounded-2xl border border-white/10 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all">LIMPAR PROTOCOLO</button>
          <button
            onClick={handleConfirmRequest}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary-dark text-bg-dark px-14 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">send_and_archive</span>}
            {isProcessing ? 'PROCESSANDO...' : 'SOLICITAR CONCIERGE VIP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Concierge;
