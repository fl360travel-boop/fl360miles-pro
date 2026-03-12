
import React, { useState, useEffect } from 'react';
import { Client, MileageMovement } from '../types';
import { getClients, updateClient } from '../services/api';
import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';

type ConciergeCategory = 'Vôos' | 'Hospedagem' | 'Locação' | 'Seguros' | 'Experiências' | 'Manual';

const Concierge: React.FC = () => {
  const { planId } = useSubscription();

  if (planId === 'starter') {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center animate-in zoom-in-95 duration-700">
        <div className="size-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-primary/20 shadow-[0_0_50px_-10px_rgba(226,190,106,0.3)]">
          <span className="material-symbols-outlined text-primary text-6xl">diamond</span>
        </div>
        <h1 className="display-font text-5xl font-bold italic text-white mb-6 uppercase tracking-tighter">
          Exclusivo para<br /><span className="text-[#E2BE6A]">Membros Premium</span>
        </h1>
        <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          O Concierge VIP e a inteligência de emissões são recursos reservados para operações em escala. Faça o upgrade para o plano <strong className="text-white">Profissional</strong> e desbloqueie emissões otimizadas e atendimento prioritário.
        </p>
        <Link to="/plans" className="inline-flex items-center gap-3 bg-[#E2BE6A] hover:bg-[#B8952E] text-[#0A0D11] px-10 py-5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-2xl shadow-[#E2BE6A]/20 active:scale-95">
          <span className="material-symbols-outlined">workspace_premium</span>
          FAZER UPGRADE AGORA
        </Link>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<ConciergeCategory>('Vôos');
  const [peopleCount, setPeopleCount] = useState('1');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form fields
  const [route, setRoute] = useState('');
  const [hotel, setHotel] = useState('');
  const [additionalObs, setAdditionalObs] = useState('');

  // New Flight Fields
  const [tripType, setTripType] = useState<'round' | 'one'>('round');
  const [dateOut, setDateOut] = useState('');
  const [dateBack, setDateBack] = useState('');

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

    const flightDetails = activeTab === 'Vôos'
      ? ` | Tipo: ${tripType === 'round' ? 'Ida e Volta' : 'Só Ida'} | Datas: ${dateOut}${tripType === 'round' ? ` - ${dateBack}` : ''}`
      : '';

    const movement: MileageMovement = {
      id: `CONC-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Resgate',
      program: 'Concierge VIP',
      amount: 0,
      description: `Solicitação Concierge: ${activeTab} - ${route || hotel || 'Serviço Premium'}${flightDetails}`,
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
        // Reset flight fields
        setTripType('round');
        setDateOut('');
        setDateBack('');
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Origem / Destino</label>
                    <input className="w-full bg-card-dark border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary italic" value={route} onChange={e => setRoute(e.target.value)} placeholder="Ex: GRU -> LHR" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Trip Type */}
                    <div className="space-y-2">
                      <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Tipo de Viagem</label>
                      <div className="flex bg-bg-card border border-white/5 p-1 rounded-xl">
                        <button
                          onClick={() => setTripType('round')}
                          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${tripType === 'round' ? 'bg-primary text-bg-dark' : 'text-slate-500 hover:text-white'}`}
                        >
                          Ida e Volta
                        </button>
                        <button
                          onClick={() => setTripType('one')}
                          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${tripType === 'one' ? 'bg-primary text-bg-dark' : 'text-slate-500 hover:text-white'}`}
                        >
                          Só Ida
                        </button>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                      <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Datas</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="w-full bg-card-dark border-none rounded-xl py-3 px-4 text-xs text-white focus:ring-1 focus:ring-primary"
                          value={dateOut}
                          onChange={(e) => setDateOut(e.target.value)}
                        />
                        {tripType === 'round' && (
                          <input
                            type="date"
                            className="w-full bg-card-dark border-none rounded-xl py-3 px-4 text-xs text-white focus:ring-1 focus:ring-primary"
                            value={dateBack}
                            onChange={(e) => setDateBack(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Smart Flight Tools */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const codes = route.match(/([a-zA-Z]{3})/g);
                        const url = codes && codes.length >= 2
                          ? `https://www.flightconnections.com/pt/voos-de-${codes[0].toLowerCase()}-para-${codes[1].toLowerCase()}`
                          : 'https://www.flightconnections.com/pt';
                        window.open(url, '_blank', 'noopener');
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg py-2 px-2 flex items-center justify-center gap-1.5 group transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 text-xs transition-colors">hub</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Connections</span>
                    </button>
                    <button
                      onClick={() => {
                        const codes = route.match(/([a-zA-Z]{3})/g);
                        const url = codes && codes.length >= 2
                          ? `https://seats.aero/search?origins=${codes[0].toUpperCase()}&destinations=${codes[1].toUpperCase()}&date=${dateOut || new Date().toISOString().split('T')[0]}`
                          : 'https://seats.aero/search';
                        window.open(url, '_blank', 'noopener');
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg py-2 px-2 flex items-center justify-center gap-1.5 group transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-400 text-xs transition-colors">travel_explore</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Seats.aero</span>
                    </button>
                    <button
                      onClick={() => {
                        const codes = route.match(/([a-zA-Z]{3})/g);
                        const url = codes && codes.length >= 2
                          ? `https://www.google.com/travel/flights?q=Flights%20to%20${codes[1].toUpperCase()}%20from%20${codes[0].toUpperCase()}${dateOut ? `%20on%20${dateOut}` : ''}`
                          : 'https://www.google.com/travel/flights';
                        window.open(url, '_blank', 'noopener');
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg py-2 px-2 flex items-center justify-center gap-1.5 group transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-red-400 text-xs transition-colors">travel</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Google</span>
                    </button>
                  </div>

                  {/* Loyalty Program Direct Links */}
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <label className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] px-1 mb-3 block">Emissão Direta (Companhias)</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => window.open('https://www.smiles.com.br/home', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-500 uppercase tracking-widest">Smiles</span>
                      </button>
                      <button onClick={() => window.open('https://www.latamairlines.com/br/pt', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-red-600 uppercase tracking-widest">Latam</span>
                      </button>
                      <button onClick={() => window.open('https://azulpelomundo.voeazul.com.br', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 uppercase tracking-widest">Azul</span>
                      </button>
                      <button onClick={() => window.open('https://www.iberia.com/br/', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-red-500 uppercase tracking-widest">Iberia</span>
                      </button>
                      <button onClick={() => window.open('https://www.aa.com.br/homePage.do?locale=pt_BR', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">AA</span>
                      </button>
                      <button onClick={() => window.open('https://www.livelo.com.br', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-pink-500 uppercase tracking-widest">Livelo</span>
                      </button>
                      <button onClick={() => window.open('https://www.esfera.com.vc', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-red-400 uppercase tracking-widest">Esfera</span>
                      </button>
                      <button onClick={() => window.open('https://www.aircanada.com/home/ca/en/aco/flights', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-red-500 uppercase tracking-widest">Air Canada</span>
                      </button>
                      <button onClick={() => window.open('https://www.finnair.com/us-en/booking/flight-selection?json=%7B%22flights%22:%5B%7B%22origin%22:%22MIA%22,%22destination%22:%22GRU%22,%22departureDate%22:%222026-03-14%22%7D%5D,%22cabin%22:%22MIXED%22,%22adults%22:1,%22c15s%22:0,%22children%22:0,%22infants%22:0,%22isAward%22:true%7D', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 uppercase tracking-widest">Finnair</span>
                      </button>
                      <button onClick={() => window.open('https://www.flytap.com/pt-cl/miles-and-go/utilizar-milhas/comprar-bilhete', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-green-500 uppercase tracking-widest">TAP M&G</span>
                      </button>
                      <button onClick={() => window.open('https://www.virginatlantic.com/flying-club/account/flights', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-red-600 uppercase tracking-widest">Virgin Atl.</span>
                      </button>
                      <button onClick={() => window.open('https://www.qatarairways.com/pt-br/homepage.html', '_blank')} className="bg-bg-card hover:bg-white/5 border border-white/5 rounded-lg py-2.5 flex items-center justify-center group transition-all">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-purple-600 uppercase tracking-widest">Qatar</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Classe Requerida</label>
                  <select className="w-full bg-card-dark border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none italic">
                    <option>First Class (Padrão Elite)</option>
                    <option>Business Class</option>
                    <option>Premium Economy</option>
                    <option>Econômica</option>
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
