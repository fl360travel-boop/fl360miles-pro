
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, MileageMovement } from '../types';
import { getClients, updateClient, getClient } from '../services/api';

const TransferForm: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [sourceProgram, setSourceProgram] = useState('');
  const [destProgram, setDestProgram] = useState('');
  const [points, setPoints] = useState<string>('');
  const [bonus, setBonus] = useState<number>(100);
  const [cpm, setCpm] = useState<string>('17.50');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddDest, setShowAddDest] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  const [programsList, setProgramsList] = useState(['Livelo', 'Esfera', 'TAP Miles&Go', 'Itaú Shop', 'PDA', 'Santander Esfera']);
  const [destinationsList, setDestinationsList] = useState(['Smiles', 'Latam Pass', 'Azul Fidelidade', 'Flying Blue', 'Iberia Plus', 'British Executive Club']);
  const [cards, setCards] = useState(['Amex The Platinum', 'Unlimited Black', 'Visa Infinite', 'Mastercard Black']);
  const [newItemName, setNewItemName] = useState('');

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

  const calculatedMiles = useMemo(() => {
    const qty = Number(points) || 0;
    return qty * (1 + bonus / 100);
  }, [points, bonus]);

  const projectedValue = useMemo(() => {
    const miles = calculatedMiles;
    const cpmVal = Number(cpm) || 0;
    return (miles / 1000) * cpmVal;
  }, [calculatedMiles, cpm]);

  const handleEfetivar = async () => {
    if (!selectedClientId || !sourceProgram || !destProgram || !points) {
      alert('Preencha todos os campos obrigatórios para efetivar a transferência.');
      return;
    }

    setIsProcessing(true);

    try {
      // Fetch fresh client data
      const client = await getClient(selectedClientId);

      const now = new Date();
      // Fix: Use local date to avoid timezone issues (UTC vs Local)
      const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

      // CORREÇÃO: Criar DUAS movimentações separadas para rastreamento correto
      // 1. Movimentação de SAÍDA (do programa origem)
      const movementOut: MileageMovement = {
        id: `TRF-OUT-${Date.now()}`,
        date: localDate,
        type: 'Venda', // Usar 'Venda' como tipo de saída para contabilização correta
        program: sourceProgram,
        amount: Number(points),
        description: `Transferência para ${destProgram}`,
        observation: `Saída de ${points} pontos de ${sourceProgram} para ${destProgram}`
      };

      // 2. Movimentação de ENTRADA (no programa destino)
      const movementIn: MileageMovement = {
        id: `TRF-IN-${Date.now() + 1}`,
        date: localDate,
        type: 'Inclusão', // Usar 'Inclusão' como tipo de entrada para contabilização correta
        program: destProgram,
        amount: calculatedMiles,
        description: `Transferência de ${sourceProgram} (${bonus}% bônus)`,
        observation: `Entrada de ${calculatedMiles} milhas vindas de ${sourceProgram}. Base: ${points}, Bônus: ${bonus}%`,
        bonusPercent: bonus > 0 ? bonus : undefined
      };

      let updatedPrograms = [...client.programs];

      const sourceIdx = updatedPrograms.findIndex(p => p.name.toLowerCase() === sourceProgram.toLowerCase());
      if (sourceIdx >= 0) {
        updatedPrograms[sourceIdx].balance -= Number(points);
      } else {
        updatedPrograms.push({ id: `P-${Date.now()}-1`, name: sourceProgram, balance: -Number(points), icon: 'diamond' });
      }

      const destIdx = updatedPrograms.findIndex(p => p.name.toLowerCase() === destProgram.toLowerCase());
      if (destIdx >= 0) {
        updatedPrograms[destIdx].balance += calculatedMiles;
      } else {
        updatedPrograms.push({ id: `P-${Date.now()}-2`, name: destProgram, balance: calculatedMiles, icon: 'flight_takeoff' });
      }

      // Adicionar AMBAS as movimentações ao histórico
      await updateClient(selectedClientId, {
        programs: updatedPrograms,
        history: [movementIn, movementOut, ...client.history]
      });

      setTimeout(() => {
        setIsProcessing(false);
        alert('Transferência VIP efetivada e registrada no dossiê do cliente.');
        navigate('/clients');
      }, 1000);
    } catch (error) {
      console.error('Error processing transfer:', error);
      setIsProcessing(false);
      alert('Erro ao processar transferência: Falha na sincronização.');
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
            <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">app_registration</span>
              </div>
              <h2 className="display-font text-white text-lg font-bold uppercase tracking-widest italic">Transferência Estratégica</h2>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Titular Designado</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-card-dark border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none outline-none italic"
                >
                  <option value="">Selecione o titular...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Origem (Clube/Programa)</label>
                    <button onClick={() => setShowAddSource(true)} className="text-primary hover:text-white transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">add_circle</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Novo</span>
                    </button>
                  </div>
                  <select value={sourceProgram} onChange={e => setSourceProgram(e.target.value)} className="w-full bg-card-dark border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none outline-none italic">
                    <option value="">Selecionar...</option>
                    {programsList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Destino (CIA/Programa)</label>
                    <button onClick={() => setShowAddDest(true)} className="text-primary hover:text-white transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">add_circle</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Novo</span>
                    </button>
                  </div>
                  <select value={destProgram} onChange={e => setDestProgram(e.target.value)} className="w-full bg-card-dark border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary appearance-none outline-none italic">
                    <option value="">Selecionar...</option>
                    {destinationsList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Quantidade de Pontos</label>
                  <div className="relative">
                    <input
                      className="w-full bg-card-dark border border-white/5 rounded-2xl py-6 px-8 text-4xl font-black text-white italic focus:ring-0 placeholder:text-slate-800 outline-none"
                      placeholder="0"
                      value={points}
                      onChange={e => setPoints(e.target.value)}
                      type="number"
                    />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 font-black tracking-tighter italic text-xs uppercase">Pontos</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">CPM de Referência (R$)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">R$</span>
                    <input
                      className="w-full bg-card-dark border border-white/5 rounded-2xl py-6 px-16 text-4xl font-black text-primary italic focus:ring-0 placeholder:text-slate-800 outline-none"
                      placeholder="0.00"
                      value={cpm}
                      onChange={e => setCpm(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card-dark border border-white/5 rounded-3xl p-8 space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Bônus da Promoção Ativa</label>
                  <span className="text-primary display-font text-2xl font-black italic">{bonus}%</span>
                </div>
                <input
                  type="range"
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-primary cursor-pointer"
                  min="0"
                  max="150"
                  step="5"
                  value={bonus}
                  onChange={e => setBonus(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10 sticky top-28 shadow-2xl backdrop-blur-sm overflow-hidden text-center md:text-left">
            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Resultado Estimado</p>
                  <h3 className="display-font text-5xl font-black text-white italic tracking-tighter">
                    {calculatedMiles.toLocaleString('pt-BR')}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">Milhas Creditadas</p>
                </div>
              </div>

              <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-custom uppercase font-black">Valor Patrimonial Projetado</span>
                  <span className="text-emerald-custom text-xl font-black italic">R$ {projectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={handleEfetivar}
                disabled={isProcessing}
                className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-5 rounded-2xl transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group italic tracking-widest uppercase text-sm active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">sync_alt</span>}
                {isProcessing ? 'EFETIVANDO...' : 'EFETIVAR TRANSFERÊNCIA VIP'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals for adding items */}
      {(showAddSource || showAddDest || showAddCard) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg-dark/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="display-font text-white font-bold uppercase tracking-widest">
              Cadastrar Novo(a) {showAddSource ? 'Origem' : showAddDest ? 'Destino' : 'Cartão'}
            </h3>
            <input
              autoFocus
              className="w-full bg-card-dark border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              placeholder="Digite o nome..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (showAddSource) addItem(setProgramsList, () => setShowAddSource(false));
                  else if (showAddDest) addItem(setDestinationsList, () => setShowAddDest(false));
                  else if (showAddCard) addItem(setCards, () => setShowAddCard(false));
                }
              }}
            />
            <div className="flex gap-4">
              <button
                onClick={() => { setShowAddSource(false); setShowAddDest(false); setShowAddCard(false); setNewItemName(''); }}
                className="flex-1 py-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (showAddSource) addItem(setProgramsList, () => setShowAddSource(false));
                  else if (showAddDest) addItem(setDestinationsList, () => setShowAddDest(false));
                  else if (showAddCard) addItem(setCards, () => setShowAddCard(false));
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

export default TransferForm;
