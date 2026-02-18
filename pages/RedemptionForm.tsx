
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, MileageMovement } from '../types';
import { getClients, updateClient, getClient } from '../services/api';

const RedemptionForm: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [program, setProgram] = useState('');
  const [airline, setAirline] = useState('');
  const [milesUsed, setMilesUsed] = useState('');
  const [ticketValue, setTicketValue] = useState('');
  const [cpmCusto, setCpmCusto] = useState('16.00');
  const [passengers, setPassengers] = useState('1');
  const [flightClass, setFlightClass] = useState('Econômica');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddAirline, setShowAddAirline] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const [programList, setProgramList] = useState(['Smiles', 'LATAM Pass', 'Azul Fidelidade', 'TAP Miles&Go', 'Flying Blue', 'Emirates Skywards', 'Executive Club']);
  const [airlineList, setAirlineList] = useState(['Emirates', 'Qatar Airways', 'LATAM', 'GOL', 'Azul', 'Air France', 'KLM', 'British Airways', 'Iberia']);

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

  const economy = useMemo(() => {
    const pagante = Number(ticketValue) || 0;
    const qty = Number(milesUsed) || 0;
    const custoMilha = (qty / 1000) * Number(cpmCusto);
    return pagante - custoMilha;
  }, [ticketValue, milesUsed, cpmCusto]);

  const economyPercentage = useMemo(() => {
    const pagante = Number(ticketValue) || 0;
    if (pagante === 0) return 0;
    return (economy / pagante) * 100;
  }, [economy, ticketValue]);

  const handleFinalizar = async () => {
    if (!selectedClientId || !program || !milesUsed || !ticketValue) {
      alert('Dados de emissão insuficientes para finalização.');
      return;
    }

    setIsProcessing(true);

    try {
      // Fetch latest client data to avoid stale state
      const client = await getClient(selectedClientId);

      const movement: MileageMovement = {
        id: `RED-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Resgate',
        program: program,
        amount: Number(milesUsed),
        description: `Emissão VIP: ${airline || 'Cia Aérea'}`,
        airline: airline,
        ticketValue: Number(ticketValue),
        economyGenerated: economy,
        passengers: Number(passengers),
        flightClass: flightClass,
        observation: `Resgate de ${milesUsed} mi via ${program}. Economia: R$ ${economy.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${economyPercentage.toFixed(1)}%). ${Number(passengers)} Pax • ${flightClass}.`
      };

      const updatedPrograms = [...client.programs];
      const idx = updatedPrograms.findIndex(p => p.name.toLowerCase() === program.toLowerCase());
      if (idx >= 0) {
        updatedPrograms[idx].balance -= Number(milesUsed);
      } else {
        updatedPrograms.push({ id: `P-${Date.now()}`, name: program, balance: -Number(milesUsed), icon: 'airplane_ticket' });
      }

      await updateClient(selectedClientId, {
        programs: updatedPrograms,
        history: [movement, ...client.history]
      });

      setTimeout(() => {
        setIsProcessing(false);
        alert('Emissão VIP finalizada com sucesso. Dados de economia vinculados ao cliente.');
        navigate('/clients');
      }, 1000);
    } catch (error) {
      console.error('Error processing redemption:', error);
      setIsProcessing(false);
      alert('Erro ao processar emissão: Falha na sincronização.');
    }
  };

  const addItem = (listSetter: React.Dispatch<React.SetStateAction<string[]>>, closeModal: () => void) => {
    if (!newItemName) return;
    listSetter(prev => [...new Set([...prev, newItemName])]);
    setNewItemName('');
    closeModal();
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700 p-4 md:p-10 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-bg-surface rounded-3xl p-10 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 size-64 bg-emerald-custom/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="size-10 bg-emerald-custom/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-custom">airplane_ticket</span>
              </div>
              <h2 className="display-font text-white text-lg font-bold uppercase tracking-widest italic">Nova Emissão VIP 2.0</h2>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Titular Designado</label>
                  <select className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none outline-none italic" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Programa de Origem</label>
                    <button onClick={() => setShowAddProgram(true)} className="text-primary hover:text-white transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">add_circle</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Novo</span>
                    </button>
                  </div>
                  <select className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none outline-none italic" value={program} onChange={e => setProgram(e.target.value)}>
                    <option value="">Selecione...</option>
                    {programList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Companhia Aérea</label>
                    <button onClick={() => setShowAddAirline(true)} className="text-primary hover:text-white transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">add_circle</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Nova</span>
                    </button>
                  </div>
                  <select className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none outline-none italic" value={airline} onChange={e => setAirline(e.target.value)}>
                    <option value="">Selecione...</option>
                    {airlineList.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Milhas Utilizadas</label>
                  <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-xl font-black text-white focus:ring-1 focus:ring-primary outline-none italic" type="number" placeholder="0" value={milesUsed} onChange={e => setMilesUsed(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Passageiros</label>
                  <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none italic" type="number" min="1" value={passengers} onChange={e => setPassengers(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Classe</label>
                  <select className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none outline-none italic" value={flightClass} onChange={e => setFlightClass(e.target.value)}>
                    <option value="Econômica">Econômica</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Executiva">Executiva</option>
                    <option value="Primeira Classe">Primeira Classe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Valor da Passagem Pagante (R$)</label>
                  <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-5 px-14 text-2xl font-black text-white italic focus:ring-0 placeholder:text-slate-800 outline-none" placeholder="0,00" type="number" value={ticketValue} onChange={e => setTicketValue(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">CPM Custo Médio (R$)</label>
                  <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-5 px-14 text-2xl font-black text-primary italic focus:ring-0 placeholder:text-slate-800 outline-none" placeholder="16,00" type="number" value={cpmCusto} onChange={e => setCpmCusto(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 text-center md:text-left">
          <div className="bg-emerald-custom/5 border border-emerald-custom/20 rounded-3xl p-10 sticky top-28 shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start text-left">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-emerald-custom uppercase tracking-[0.2em]">Economia Gerada</p>
                  <h3 className="display-font text-5xl font-black text-white italic tracking-tighter">
                    R$ {economy.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Redução de Custo</p>
                  <p className="text-2xl font-black text-emerald-custom italic">{economyPercentage.toFixed(1)}%</p>
                </div>
              </div>

              <button onClick={handleFinalizar} disabled={isProcessing} className="w-full bg-emerald-custom hover:bg-emerald-custom/80 text-bg-dark font-black py-5 rounded-2xl transition-all shadow-2xl shadow-emerald-custom/20 flex items-center justify-center gap-3 group italic tracking-widest uppercase text-sm active:scale-95 disabled:opacity-50">
                {isProcessing ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">flight_takeoff</span>}
                {isProcessing ? 'FINALIZANDO...' : 'FINALIZAR EMISSÃO VIP'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modals */}
      {(showAddProgram || showAddAirline) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg-dark/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="display-font text-white font-bold uppercase tracking-widest">Cadastrar Novo(a) {showAddProgram ? 'Programa' : 'Cia Aérea'}</h3>
            <input
              autoFocus
              className="w-full bg-bg-card border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              placeholder="Digite o nome..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (showAddProgram) addItem(setProgramList, () => setShowAddProgram(false));
                  else if (showAddAirline) addItem(setAirlineList, () => setShowAddAirline(false));
                }
              }}
            />
            <div className="flex gap-4">
              <button
                onClick={() => { setShowAddProgram(false); setShowAddAirline(false); setNewItemName(''); }}
                className="flex-1 py-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showAddProgram) addItem(setProgramList, () => setShowAddProgram(false));
                  else if (showAddAirline) addItem(setAirlineList, () => setShowAddAirline(false));
                }}
                className="flex-1 bg-primary text-bg-dark font-black py-3 rounded-xl text-[10px] uppercase tracking-widest"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedemptionForm;
