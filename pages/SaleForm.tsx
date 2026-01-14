
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, MileageMovement } from '../types';
import { getClients, updateClient } from '../services/api';

const SaleForm: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [program, setProgram] = useState('');
  const [amount, setAmount] = useState('');
  const [negotiatedValue, setNegotiatedValue] = useState('');
  const [costBasis, setCostBasis] = useState('15.50');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [programList, setProgramList] = useState(['LATAM Pass', 'Smiles', 'Azul Fidelidade', 'TAP Miles&Go', 'Flying Blue', 'British Executive Club']);

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

  const profit = useMemo(() => {
    const sale = Number(negotiatedValue) || 0;
    const qty = Number(amount) || 0;
    const cost = (qty / 1000) * Number(costBasis);
    return sale - cost;
  }, [negotiatedValue, amount, costBasis]);

  const cpmVenda = useMemo(() => {
    const sale = Number(negotiatedValue) || 0;
    const qty = Number(amount) || 0;
    if (qty === 0) return 0;
    return sale / (qty / 1000);
  }, [negotiatedValue, amount]);

  const handleConfirmSale = async () => {
    if (!selectedClientId || !program || !amount || !negotiatedValue) {
      alert('Preencha os dados da liquidação para prosseguir.');
      return;
    }

    setIsProcessing(true);

    const movement: MileageMovement = {
      id: `SALE-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Venda',
      program: program,
      amount: Number(amount),
      description: `Venda de Ativos - ${program}`,
      negotiatedValue: Number(negotiatedValue),
      observation: `Liquidação de ${amount} mi de ${program}. ROI: R$ ${profit.toLocaleString()}.`
    };

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    const updatedPrograms = [...client.programs];
    const idx = updatedPrograms.findIndex(p => p.name.toLowerCase() === program.toLowerCase());
    if (idx >= 0) {
      updatedPrograms[idx].balance -= Number(amount);
    } else {
      updatedPrograms.push({ id: `P-${Date.now()}`, name: program, balance: -Number(amount), icon: 'sell' });
    }

    try {
      await updateClient(selectedClientId, {
        programs: updatedPrograms,
        history: [movement, ...client.history]
      });

      setTimeout(() => {
        setIsProcessing(false);
        alert('Venda Elite confirmada e protocolada no sistema.');
        navigate('/clients');
      }, 1000);
    } catch (error) {
      setIsProcessing(false);
      alert('Erro ao processar venda.');
    }
  };

  const addItem = () => {
    if (!newItemName) return;
    setProgramList(prev => [...new Set([...prev, newItemName])]);
    setNewItemName('');
    setShowAddProgram(false);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700 p-4 md:p-10 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-bg-surface rounded-3xl p-10 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">sell</span>
              </div>
              <h2 className="display-font text-white text-lg font-bold uppercase tracking-widest italic">Registrar Venda de Ativos</h2>
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
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Programa / CIA Aérea</label>
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
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Quantidade Vendida</label>
                  <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-6 px-8 text-4xl font-black text-white italic focus:ring-0 placeholder:text-slate-800 outline-none" placeholder="0" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>

                <div className="space-y-3">
                  <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-1">Valor Negociado (Total)</label>
                  <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-6 px-8 text-4xl font-black text-primary italic focus:ring-0 placeholder:text-slate-800 outline-none" placeholder="0,00" type="number" value={negotiatedValue} onChange={e => setNegotiatedValue(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 text-center md:text-left">
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10 sticky top-28 shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start text-left">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Resumo da Liquidação</p>
                  <h3 className="display-font text-5xl font-black text-white italic tracking-tighter">
                    R$ {Number(negotiatedValue || 0).toLocaleString()}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lucro Estimado</p>
                  <p className={`text-2xl font-black italic ${profit >= 0 ? 'text-emerald-custom' : 'text-red-500'}`}>
                    R$ {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <button onClick={handleConfirmSale} disabled={isProcessing} className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-5 rounded-2xl transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group italic tracking-widest uppercase text-sm active:scale-95 disabled:opacity-50">
                {isProcessing ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">check_circle</span>}
                {isProcessing ? 'CONFIRMANDO...' : 'CONFIRMAR VENDA ELITE'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddProgram && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-bg-dark/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="display-font text-white font-bold uppercase tracking-widest">Cadastrar Novo Programa</h3>
            <input
              autoFocus
              className="w-full bg-bg-card border-none rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              placeholder="Digite o nome..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <div className="flex gap-4">
              <button
                onClick={() => { setShowAddProgram(false); setNewItemName(''); }}
                className="flex-1 py-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={addItem}
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

export default SaleForm;
