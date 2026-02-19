
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Client, MileageProgram, CreditCard, MileageMovement } from '../types';
import { useSearch } from '../contexts/SearchContext';
import { getClients, updateClient as updateClientAPI, deleteClient as deleteClientAPI, deleteMovement as deleteMovementAPI, subscribeToClients, subscribeToPrograms, subscribeToAllMovements, getClient } from '../services/api';
import { BrandLogo, CardSkin } from '../components/BrandAssets';


const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const Clients: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const handleDeleteMovement = async (movementId: string) => {
    if (!selectedClient) return;

    // Find the movement to reverse its effect
    const movement = selectedClient.history.find(h => h.id === movementId);
    if (!movement) return;

    // Check if it's a persisted movement (UUID) or temp
    const isTemp = movementId.startsWith('H-');

    // Calculate reverse factor to revert balance
    // If original was "Inclusão" (factor 1), we need -1. 
    // If "Venda" or "Resgate" (factor -1), we need 1.
    // "Transferência" with bonus is typically an INFLOW (Entry), so it should be treated as +1 originally.
    const originalFactor = ['Venda', 'Resgate'].includes(movement.type) ? -1 : 1;
    const reverseFactor = originalFactor * -1;

    // Update Program Balance
    const updatedProgs = selectedClient.programs.map(p => {
      // Trying to match program. Ideally we matched by ID if we had it stored, but name is what we have linked.
      if (p.name.toLowerCase() === movement.program.toLowerCase()) {
        return { ...p, balance: p.balance + (movement.amount * reverseFactor) };
      }
      return p;
    });

    // Remove from history
    const updatedHistory = selectedClient.history.filter(h => h.id !== movementId);
    const updatedClient = { ...selectedClient, programs: updatedProgs, history: updatedHistory };

    // If it was already persisted (UUID), delete from DB specifically
    if (!isTemp) {
      try {
        await deleteMovementAPI(movementId);
      } catch (err) {
        console.error('Failed to delete movement from DB', err);
        return; // Don't proceed if DB delete failed
      }
    }

    // Update Client (persists new balance)
    updateCurrent(updatedClient);
  };

  const [isLoading, setIsLoading] = useState(true);
  const { searchQuery } = useSearch();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showWa, setShowWa] = useState(false);
  const [managerAnalysis, setManagerAnalysis] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'programs' | 'cards' | 'history'>('info');
  const [reportCycle, setReportCycle] = useState<'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' | 'Personalizado'>('Mensal');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth().toString());
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState<string>('');
  const [hFilterType, setHFilterType] = useState<string>('Todos');
  const [hStartDate, setHStartDate] = useState<string>('');
  const [hEndDate, setHEndDate] = useState<string>('');
  const [newProg, setNewProg] = useState({ name: '', balance: '' });
  const [newCard, setNewCard] = useState({ bank: '', name: '', category: 'Black' as any });
  const [newMove, setNewMove] = useState({
    type: 'Inclusão' as MileageMovement['type'],
    program: '',
    amount: '',
    desc: '',
    val: '',
    obs: '',
    passengers: '1',
    flightClass: 'Econômica',
    ticketVal: '',
    cpm: '15.00',
    yieldCpm: '',
    bonusPercent: ''
  });
  const [customProgram, setCustomProgram] = useState('');

  // Auto-calculate Economy for Redemption
  useEffect(() => {
    if (newMove.type === 'Resgate' && newMove.ticketVal && newMove.amount && newMove.cpm) {
      const ticket = parseFloat(newMove.ticketVal);
      const miles = parseFloat(newMove.amount);
      const cost = (miles / 1000) * parseFloat(newMove.cpm);
      const economy = ticket - cost;
      setNewMove(prev => ({ ...prev, val: economy.toFixed(2) }));
    }
    // Auto-calculate Profit for Sale (Liquidez)
    if (newMove.type === 'Venda' && newMove.val && newMove.amount && newMove.cpm) {
      const saleValue = parseFloat(newMove.val);
      const miles = parseFloat(newMove.amount);
      const cost = (miles / 1000) * parseFloat(newMove.cpm);
      const profit = saleValue - cost;
      // We don't overwrite 'val' here as it is the user input for Sale Price
      // We just store the calculated profit ? We need a place to show it.
      // Actually we need to verify if we want to show it in UI dynamically.
      // For now, calculation happens at save time or render time.
    }
  }, [newMove.type, newMove.ticketVal, newMove.amount, newMove.cpm, newMove.val]);

  // Auto-calculate Bonus for Transfer
  useEffect(() => {
    if (newMove.type === 'Transferência' && newMove.val && newMove.bonusPercent) {
      // Here 'val' will be treated as BASE amount (miles)
      const base = parseFloat(newMove.val);
      const percent = parseFloat(newMove.bonusPercent);
      if (base > 0) {
        const total = base + (base * (percent / 100));
        setNewMove(prev => ({ ...prev, amount: total.toFixed(0) }));
      }
    } else if (newMove.type === 'Transferência' && newMove.val && !newMove.bonusPercent) {
      setNewMove(prev => ({ ...prev, amount: prev.val }));
    }
  }, [newMove.type, newMove.val, newMove.bonusPercent]);

  // Two-way binding: Ticket Value <-> Yield CPM
  const handleTicketValChange = (val: string) => {
    setNewMove(prev => {
      const newState = { ...prev, ticketVal: val };
      if (val && prev.amount) {
        const ticket = parseFloat(val);
        const miles = parseFloat(prev.amount);
        if (miles > 0) {
          newState.yieldCpm = ((ticket / miles) * 1000).toFixed(2);
        }
      } else if (!val) {
        newState.yieldCpm = '';
      }
      return newState;
    });
  };

  const handleYieldCpmChange = (val: string) => {
    setNewMove(prev => {
      const newState = { ...prev, yieldCpm: val };
      if (val && prev.amount) {
        const yieldVal = parseFloat(val);
        const miles = parseFloat(prev.amount);
        newState.ticketVal = ((miles / 1000) * yieldVal).toFixed(2);
      } else if (!val) {
        newState.ticketVal = '';
      }
      return newState;
    });
  };

  const handleAmountChange = (val: string) => {
    setNewMove(prev => {
      const newState = { ...prev, amount: val };
      // If we have a Yield, recalculate Ticket. If we have Ticket, recalculate Yield?
      // Priority: Keep Yield constant if it was set explicitly? Or Ticket?
      // Let's bias towards keeping Ticket Value constant if set, updating Yield.
      if (val && prev.ticketVal) {
        const miles = parseFloat(val);
        const ticket = parseFloat(prev.ticketVal);
        if (miles > 0) {
          newState.yieldCpm = ((ticket / miles) * 1000).toFixed(2);
        }
      }
      return newState;
    });
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const loadedClients = await getClients();
        setClients(loadedClients);

        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
          const client = loadedClients.find(c => c.id === idFromUrl);
          if (client) {
            setSelectedClient(client);
            setActiveTab('info');
          }
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadClients();

    // Subscribe to Real-Time Changes
    const unsubClients = subscribeToClients(() => loadClients());
    const unsubPrograms = subscribeToPrograms(() => loadClients());
    const unsubMovements = subscribeToAllMovements(() => loadClients());

    return () => {
      unsubClients();
      unsubPrograms();
      unsubMovements();
    };
  }, [searchParams]);

  const saveClient = async (updatedClient: Client) => {
    try {
      const saved = await updateClientAPI(updatedClient.id, updatedClient);
      setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
      return saved;
    } catch (error) {
      console.error('Failed to save client:', error);
      return updatedClient;
    }
  };

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = clients;

    if (q) {
      result = clients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.cpf && c.cpf.includes(q)) ||
        c.programs.some(p => p.name.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
  }, [clients, searchQuery, sortOrder]);

  const updateCurrent = async (updated: Client) => {
    const saved = await saveClient(updated);
    setSelectedClient(saved);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClientAPI(clientToDelete.id);
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      if (selectedClient?.id === clientToDelete.id) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
    setClientToDelete(null);
  };


  const addMovement = async () => {
    // Determine effective program name
    const effectiveProgram = newMove.program === '_NEW_' ? customProgram : newMove.program;

    if (!selectedClient || !effectiveProgram || !newMove.amount) return;

    try {
      // Hardening: Fetch fresh client data
      const freshClient = await getClient(selectedClient.id);

      // Check if we need to create a new program
      let updatedProgs = [...freshClient.programs];
      const existingProgIndex = updatedProgs.findIndex(p => p.name.toLowerCase() === effectiveProgram.toLowerCase());

      if (existingProgIndex === -1 && newMove.program === '_NEW_') {
        // Create new program if it doesn't exist
        updatedProgs.push({
          id: `P-${Date.now()}`,
          name: effectiveProgram,
          balance: 0,
          icon: 'diamond'
        });
      }

      const m: MileageMovement = {
        id: `H-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: newMove.type as MileageMovement['type'],
        program: effectiveProgram,
        amount: Number(newMove.amount),
        description: newMove.desc || `${newMove.type} de milhas`,
        observation: newMove.type === 'Resgate'
          ? `${newMove.obs || 'Resgate Manual'}. ${newMove.passengers} Pax • ${newMove.flightClass}.`
          : newMove.obs,
        negotiatedValue: ['Venda', 'Compra', 'Inclusão'].includes(newMove.type) ? Number(newMove.val) : undefined,
        economyGenerated: ['Inclusão', 'Resgate', 'Transferência'].includes(newMove.type) ? Number(newMove.val) : undefined,
        passengers: newMove.type === 'Resgate' ? Number(newMove.passengers) : undefined,
        flightClass: newMove.type === 'Resgate' ? newMove.flightClass : undefined,
        ticketValue: newMove.type === 'Resgate' ? Number(newMove.ticketVal) : undefined,
        cpm: ['Resgate', 'Venda'].includes(newMove.type) ? Number(newMove.cpm) : undefined,
        profit: newMove.type === 'Venda' ? (Number(newMove.val) - (Number(newMove.amount) / 1000 * Number(newMove.cpm))) : undefined,
        bonusPercent: newMove.type === 'Transferência' ? Number(newMove.bonusPercent) : undefined
      };

      // Update balances
      updatedProgs = updatedProgs.map(p => {
        if (p.name.toLowerCase() === effectiveProgram.toLowerCase()) {
          // Transferência is now treated as Inflow (Entry with Bonus)
          const factor = ['Venda', 'Resgate'].includes(m.type) ? -1 : 1;
          return { ...p, balance: p.balance + (m.amount * factor) };
        }
        return p;
      });

      // Use updateCurrent wrapper which calls saveClient -> updateClientAPI
      // But updateCurrent expects a client object to set as Selected. 
      // Since we fetched 'freshClient', we should update THAT.
      // NOTE: updateCurrent updates 'selectedClient' state after saving. 
      // We'll call updateCurrent with the modified freshClient.
      await updateCurrent({ ...freshClient, history: [m, ...freshClient.history], programs: updatedProgs });

      setNewMove({ type: 'Inclusão', program: '', amount: '', desc: '', val: '', obs: '', bonusPercent: '' });
      setCustomProgram('');
    } catch (error) {
      console.error('Failed to add movement safely:', error);
      alert('Erro de sincronização. Tente novamente.');
    }
  };

  const startEditingBalance = (program: MileageProgram) => {
    setEditingProgramId(program.id);
    setEditBalanceValue(program.balance.toString());
  };

  const saveEditedBalance = async (program: MileageProgram) => {
    if (!selectedClient || editBalanceValue === '') return;

    try {
      const freshClient = await getClient(selectedClient.id);

      // Find the fresh program state
      const freshProgram = freshClient.programs.find(p => p.id === program.id);
      // If program was deleted remotely, we might have an issue, but let's assume it exists or use the passed one as fallback logic? 
      // Better: if not found, we can't update it.
      if (!freshProgram) {
        alert('Programa não encontrado na versão mais recente do cliente.');
        return;
      }

      const newBalance = Number(editBalanceValue);
      const diff = newBalance - freshProgram.balance; // diff against FRESH balance
      if (diff === 0) {
        setEditingProgramId(null);
        return;
      }

      const m: MileageMovement = {
        id: `H-ADJ-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: (diff > 0 ? 'Inclusão' : 'Resgate') as 'Inclusão' | 'Resgate',
        program: freshProgram.name,
        amount: Math.abs(diff),
        description: 'Ajuste Manual de Saldo',
        observation: `Saldo anterior: ${freshProgram.balance.toLocaleString('pt-BR')} | Novo saldo: ${newBalance.toLocaleString('pt-BR')}`
      };

      const updatedProgs = freshClient.programs.map(p => p.id === freshProgram.id ? { ...p, balance: newBalance } : p);
      await updateCurrent({ ...freshClient, programs: updatedProgs, history: [m, ...freshClient.history] });
      setEditingProgramId(null);

    } catch (error) {
      console.error('Failed to save balance safely:', error);
      alert('Erro ao salvar saldo. Tente novamente.');
    }
  };

  const filteredHistory = useMemo(() => {
    if (!selectedClient) return [];
    return selectedClient.history.filter(h => {
      const matchesType = hFilterType === 'Todos' || h.type === hFilterType;
      const hDate = new Date(h.date).getTime();
      const start = hStartDate ? new Date(hStartDate).getTime() : 0;
      const end = hEndDate ? new Date(hEndDate).getTime() : Infinity;
      return matchesType && hDate >= start && hDate <= end;
    });
  }, [selectedClient, hFilterType, hStartDate, hEndDate]);

  const reportMetrics = useMemo(() => {
    if (!selectedClient) return { roi: 0, saving: 0, totalMoves: 0, filteredHistory: [] };

    const now = new Date();

    // 1. LIFETIME METRICS (Common)
    const lifetimeHistory = selectedClient.history;
    const lifetimeInvested = lifetimeHistory
      .filter(h => h.type === 'Compra' || h.type === 'Inclusão')
      .reduce((acc, h) => acc + (h.negotiatedValue || h.economyGenerated || 0), 0);

    const lifetimeSaving = lifetimeHistory.reduce((acc, h) => {
      let profit = Number(h.profit || 0);
      if (!profit && h.type === 'Venda' && h.negotiatedValue && h.amount) {
        const estimatedCpm = Number(h.cpm || 15.00);
        profit = Number(h.negotiatedValue) - ((Number(h.amount) / 1000) * estimatedCpm);
      }
      if (h.type === 'Inclusão' || h.type === 'Inclusao') return acc + profit;
      return acc + Number(h.economyGenerated || 0) + profit;
    }, 0);

    const lifetimeRoi = lifetimeHistory
      .filter(h => h.type === 'Venda')
      .reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);

    const totalPoints = selectedClient.programs.reduce((acc, curr) => acc + curr.balance, 0);
    const totalValue = totalPoints * 0.0185; // Est. R$ 18,50/milheiro

    // 2. FILTERED HISTORY & PERIOD SPECIFIC METRICS
    let fHistory: MileageMovement[] = [];
    let roi = 0;
    let saving = 0;

    if (reportCycle === 'Personalizado') {
      const start = new Date(Number(reportYear), Number(reportMonth), 1);
      const end = new Date(Number(reportYear), Number(reportMonth) + 1, 0); // Last day of month

      fHistory = selectedClient.history.filter(h => {
        // Robust Date Check
        if (!h.date) return false;
        const parts = h.date.split('-').map(Number);
        if (parts.length < 3) return false;

        const [y, m, day] = parts;
        const localDate = new Date(y, m - 1, day);
        return localDate >= start && localDate <= end;
      });

      // Maintain existing logic for Personalizado ROI (Sum of all negotiatedValue in period)
      // Note: Typically ROI should target 'Venda', but preserving original logic for Personalizado just in case.
      // If original logic was 'Venda' specific, this line might need adjustment, but based on reading it was summing all.
      // Let's use the safer Venda logic if that was the intention, but the previous code did:
      // const roi = fHistory.reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);
      // I will refine it to be consistent with standard if the previous logic seemed buggy, 
      // but to strictly fix the crash I should maybe stick to previous logic or improve it.
      // Given 'roi' usually means Liquidity/Cash-out, summing 'Compra' (cost) seems wrong.
      // I will harmonize it with the standard logic for consistency and correctness.
      roi = fHistory
        .filter(h => h.type === 'Venda')
        .reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);

      saving = fHistory.reduce((acc, h) => {
        let profit = Number(h.profit || 0);
        if (!profit && h.type === 'Venda' && h.negotiatedValue && h.amount) {
          const estimatedCpm = Number(h.cpm || 15.00);
          profit = Number(h.negotiatedValue) - ((Number(h.amount) / 1000) * estimatedCpm);
        }
        if (h.type === 'Inclusão' || h.type === 'Inclusao') return acc + profit;
        return acc + Number(h.economyGenerated || 0) + profit;
      }, 0);

    } else {
      let months = 1;
      if (reportCycle === 'Trimestral') months = 3;
      if (reportCycle === 'Semestral') months = 6;
      if (reportCycle === 'Anual') months = 12;

      const startDate = new Date();
      startDate.setMonth(now.getMonth() - months);

      fHistory = selectedClient.history.filter(h => new Date(h.date) >= startDate);

      roi = fHistory
        .filter(h => h.type === 'Venda')
        .reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);

      saving = fHistory.reduce((acc, h) => {
        let profit = Number(h.profit || 0);
        if (!profit && h.type === 'Venda' && h.negotiatedValue && h.amount) {
          const estimatedCpm = Number(h.cpm || 15.00);
          profit = Number(h.negotiatedValue) - ((Number(h.amount) / 1000) * estimatedCpm);
        }
        if (h.type === 'Inclusão' || h.type === 'Inclusao') return acc + profit;
        return acc + Number(h.economyGenerated || 0) + profit;
      }, 0);
    }

    // 3. PERIOD INVESTED (Dependent on fHistory)
    const totalInvested = fHistory
      .filter(h => h.type === 'Compra' || h.type === 'Inclusão')
      .reduce((acc, h) => acc + (h.negotiatedValue || h.economyGenerated || 0), 0);

    return {
      roi,
      saving,
      totalMoves: fHistory.length,
      filteredHistory: fHistory,
      totalPoints,
      totalValue,
      totalInvested,
      lifetimeInvested,
      lifetimeSaving,
      lifetimeRoi
    };
  }, [selectedClient, reportCycle, reportMonth, reportYear]);

  // AI Analysis Generators
  const generateAnalysis = useCallback(() => {
    if (!selectedClient) return;
    const history = reportMetrics.filteredHistory;
    const firstName = selectedClient.name.split(' ')[0];

    // 1. Analyze specific events
    const sales = history.filter(h => h.type === 'Venda');
    const redemptions = history.filter(h => h.type === 'Resgate');
    const accumulations = history.filter(h => ['Compra', 'Transferência', 'Bônus', 'Inclusão', 'Inclusao'].includes(h.type));

    const totalSalesVal = sales.reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);
    const totalEcoVal = redemptions.reduce((acc, h) => acc + (h.economyGenerated || 0), 0);

    let text = `Olá, ${firstName}.\n\n`;

    if (history.length === 0) {
      // Scenario: No movement
      text += `Neste período, sua carteira manteve-se estável, sem novas movimentações. `;
      text += `O saldo total consolidado é de ${reportMetrics.totalPoints.toLocaleString('pt-BR')} milhas, com valor de mercado estimado em R$ ${reportMetrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\n`;
      text += `Continuamos monitorando o mercado diariamente em busca das melhores oportunidades de multiplicação e uso do seu patrimônio.`;
    } else {
      // Scenario: Active Layout
      const hasInclusion = accumulations.some(h => h.type === 'Inclusão' || h.type === 'Inclusao');
      const hasTransfer = accumulations.some(h => h.type === 'Transferência');

      text += `Neste ciclo, realizamos uma gestão ativa do seu portfólio. `;

      if (hasInclusion) {
        text += `Consolidamos suas posições e incorporamos novos ativos ao painel de gestão, fortalecendo seu poder de emissão.\n\n`;
      } else {
        text += `Focamos em ${sales.length > 0 ? 'rentabilidade' : ''} ${sales.length > 0 && redemptions.length > 0 ? 'e' : ''} ${redemptions.length > 0 ? 'experiências exclusivas' : 'acumulação estratégica'}.\n\n`;
      }

      // Detail Sales
      if (sales.length > 0) {
        text += `💰 **Liquidez e Lucro:** Executamos vendas estratégicas (Cash-out) que colocaram **R$ ${totalSalesVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** de dinheiro novo no seu bolso.\n`;
      }

      // Detail Redemptions
      if (redemptions.length > 0) {
        text += `✈️ **Viagens e Experiências:** Emitimos passagens utilizando suas milhas, gerando uma **economia real de R$ ${totalEcoVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** em comparação ao preço pagante.\n`;
      }

      // Detail Accumulation
      if (accumulations.length > 0) {
        const topProg = accumulations.sort((a, b) => b.amount - a.amount)[0]?.program || 'Fidelidade';
        if (hasTransfer) {
          text += `🔄 **Multiplicação:** Aproveitamos janelas de transferência bonificada para o programa **${topProg}**, maximizando o acúmulo sem custo adicional.\n`;
        } else if (!hasInclusion) {
          text += `📈 **Crescimento:** Aumentamos sua posição estratégica, principalmente no programa **${topProg}**, preparando o terreno para futuras emissões.\n`;
        }
      }

      text += `\nAtualmente, seu patrimônio totaliza **${reportMetrics.totalPoints.toLocaleString('pt-BR')} milhas** (R$ ${reportMetrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`;
    }

    text += `\n\nQualquer dúvida sobre estas movimentações, estou à disposição.\n\nAtenciosamente,\nFL360 Concierge.`;

    setManagerAnalysis(text);
  }, [selectedClient, reportMetrics, setManagerAnalysis]);

  // Trigger Analysis on Update
  useEffect(() => {
    generateAnalysis();
  }, [generateAnalysis]);

  const currentTotalMiles = useMemo(() => selectedClient?.programs.reduce((acc, curr) => acc + curr.balance, 0) || 0, [selectedClient]);

  const consolidatedPrograms = useMemo(() => {
    if (!selectedClient) return {};
    return selectedClient.programs.reduce((acc, curr) => {
      const key = curr.name.trim().toUpperCase();
      if (!acc[key]) acc[key] = 0;
      acc[key] += Number(curr.balance);
      return acc;
    }, {} as Record<string, number>);
  }, [selectedClient]);

  const addProgram = () => {
    if (!selectedClient || !newProg.name) return;

    const normalizedName = newProg.name.trim().toUpperCase();
    const existingProgram = selectedClient.programs.find(p => p.name.trim().toUpperCase() === normalizedName);

    if (existingProgram) {
      // Programa já existe - atualiza o saldo (soma)
      const updatedPrograms = selectedClient.programs.map(p =>
        p.id === existingProgram.id
          ? { ...p, balance: p.balance + (Number(newProg.balance) || 0) }
          : p
      );
      updateCurrent({ ...selectedClient, programs: updatedPrograms });
    } else {
      // Programa novo - adiciona com nome normalizado (uppercase)
      const p: MileageProgram = { id: `P-${Date.now()}`, name: normalizedName, balance: Number(newProg.balance) || 0, icon: 'diamond' };
      updateCurrent({ ...selectedClient, programs: [...selectedClient.programs, p] });
    }
    setNewProg({ name: '', balance: '' });
  };

  const addCard = () => {
    if (!selectedClient || !newCard.bank || !newCard.name) return;
    const c: CreditCard = { id: `C-${Date.now()}`, bank: newCard.bank, name: newCard.name, category: newCard.category };
    updateCurrent({ ...selectedClient, cards: [...selectedClient.cards, c] });
    setNewCard({ bank: '', name: '', category: 'Black' });
  };

  const clientAge = useMemo(() => {
    if (!selectedClient?.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(selectedClient.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [selectedClient]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700 relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="display-font text-white text-3xl font-bold tracking-tight uppercase italic">Gestão de Ativos</h1>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-[0.3em] italic">FL360MILES Elite Protocol</p>
        </div>
        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="bg-bg-surface border border-white/10 hover:border-[#E2BE6A]/50 text-slate-400 hover:text-white px-6 py-3 rounded-2xl font-bold text-[10px] tracking-widest uppercase transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-lg">sort_by_alpha</span>
          {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </button>
        <Link to="/onboarding" className="shrink-0 bg-[#E2BE6A] hover:bg-[#B8952E] text-[#0A0D11] px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all shadow-xl shadow-[#E2BE6A]/20 flex items-center gap-3 active:scale-95 whitespace-nowrap">
          <span className="material-symbols-outlined text-sm">person_add</span> NOVO CLIENTE
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {filteredClients.map((client) => {
          // Metrics Calculation
          const totalPoints = client.programs.reduce((acc, p) => acc + p.balance, 0);
          const totalValue = totalPoints * 0.0185;
          const roi = client.history
            .filter(h => h.type === 'Venda')
            .reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);

          const totalInvested = client.history
            .filter(h => h.type === 'Compra' || h.type === 'Inclusão')
            .reduce((acc, h) => acc + (h.negotiatedValue || h.economyGenerated || 0), 0);

          const totalEconomy = client.history.reduce((acc, h) => {
            // Fallback Logic: If profit is missing but it's a Sale, calculate it
            let profit = h.profit || 0;
            if (!profit && h.type === 'Venda' && h.negotiatedValue && h.amount) {
              const estimatedCpm = h.cpm || 15.00; // Legacy Fallback
              profit = h.negotiatedValue - ((h.amount / 1000) * estimatedCpm);
            }
            if (h.type === 'Inclusão' || h.type === 'Inclusao') return acc + profit;
            return acc + (h.economyGenerated || 0) + profit;
          }, 0);

          let evolutionPercent = 0;
          if (totalInvested && totalInvested > 0) {
            // Evolution = ((Current Assets + Realized Liquidity) - Invested) / Invested
            // This reflects Global Return (Holdings + Cashouts)
            evolutionPercent = (((totalValue + roi) - totalInvested) / totalInvested) * 100;
          } else if ((totalValue + roi) > 0) {
            evolutionPercent = 100; // Pure profit if 0 invested
          }

          if (!Number.isFinite(evolutionPercent) || isNaN(evolutionPercent)) {
            evolutionPercent = 0;
          }

          return (
            <div
              key={client.id}
              onClick={() => { setSelectedClient(client); setActiveTab('info'); }}
              className="group bg-bg-surface border border-white/5 p-8 rounded-[40px] flex flex-col hover:border-primary/50 transition-all cursor-pointer shadow-2xl relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-6 font-black italic uppercase text-[9px] tracking-[0.4em] transition-colors ${client.managementLevel === 'Elite' ? 'text-white group-hover:text-[#E2BE6A]' : 'text-slate-600'}`}>
                {client.managementLevel}
              </div>

              <div className="absolute bottom-8 right-8 flex gap-3 z-20 transition-all">
                <Link
                  to={`/onboarding?edit=${client.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="size-12 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-bg-dark flex items-center justify-center transition-all shadow-xl"
                  title="Editar Cadastro"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); setClientToDelete(client); }}
                  className="size-12 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-xl"
                  title="Excluir Cliente"
                >
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                </button>
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div className="size-16 rounded-full bg-gradient-to-br from-card-dark to-black border-2 border-[#E2BE6A]/20 flex items-center justify-center text-[#E2BE6A] text-xl font-black display-font shadow-[0_0_30px_-10px_rgba(226,190,106,0.3)]">
                  {getInitials(client.name)}
                </div>
                <div>
                  <p className="text-white font-black text-lg group-hover:text-[#E2BE6A] transition-colors italic uppercase tracking-tighter leading-none">{client.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[#E2BE6A] font-black text-xs tracking-tight">{totalPoints.toLocaleString('pt-BR')}</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black italic">Capital Ativo</span>
                  </div>
                </div>
              </div>

              {/* NEW METRICS ROW */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 mb-4">
                <div>
                  <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Evolução</p>
                  <p className={`text-sm font-black italic tracking-tighter ${evolutionPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {evolutionPercent > 0 ? '+' : ''}{evolutionPercent.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Economia</p>
                  <p className="text-sm font-black text-white italic tracking-tighter">
                    <span className="text-emerald-500 text-[10px] mr-1">R$</span>
                    {totalEconomy.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1 text-right">Liquidez</p>
                  <p className="text-sm font-black text-white italic tracking-tighter text-right">
                    <span className="text-emerald-500 text-[10px] mr-1">R$</span>
                    {roi.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest italic">Compliance Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="size-1.5 bg-emerald-custom rounded-full"></span>
                    <span className="text-[9px] text-white font-bold uppercase tracking-widest">Auditado</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all">north_east</span>
              </div>
            </div>
          );
        })}
      </div>

      {clientToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300 print:hidden">
          <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-2xl" onClick={() => setClientToDelete(null)}></div>
          <div className="relative bg-bg-surface border border-red-500/20 p-12 rounded-[48px] w-full max-w-md shadow-2xl text-center space-y-10 animate-in zoom-in-95 duration-500">
            <div className="size-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border border-red-600/20 shadow-2xl shadow-red-600/10">
              <span className="material-symbols-outlined text-red-600 text-5xl font-light">warning</span>
            </div>
            <div>
              <h3 className="display-font text-2xl font-bold text-white uppercase italic tracking-widest mb-4">Expurgar Dossiê?</h3>
              <p className="text-slate-500 text-sm italic leading-relaxed px-4">Remover permanentemente o registro de <span className="text-white font-black">{clientToDelete.name}</span>? Esta ação não poderá ser desfeita.</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={confirmDeleteClient} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">CONFIRMAR EXCLUSÃO</button>
              <button onClick={() => setClientToDelete(null)} className="w-full py-2 text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] hover:text-white transition-all">CANCELAR PROTOCOLO</button>
            </div>
          </div>
        </div>
      )}

      {selectedClient && !showReport && (
        <div className="fixed inset-0 z-[100] flex justify-end print:hidden">
          <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-sm" onClick={() => setSelectedClient(null)}></div>
          <div className="relative w-full max-w-5xl bg-bg-surface h-full shadow-2xl border-l border-white/10 overflow-y-auto animate-in slide-in-from-right duration-500 custom-scrollbar">
            <div className="p-12 space-y-12">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-8">
                  <div className="size-24 rounded-full bg-gradient-to-br from-card-dark to-black border-4 border-primary/20 flex items-center justify-center text-primary text-4xl font-black display-font shadow-[0_0_50px_-12px_rgba(226,190,106,0.4)]">
                    {getInitials(selectedClient.name)}
                  </div>
                  <div>
                    <h2 className="display-font text-4xl font-bold text-white italic uppercase tracking-tighter leading-none">{selectedClient.name}</h2>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mt-4 italic">{selectedClient.managementLevel} Protocol • Membro desde {selectedClient.startDate}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowReport(true)} className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-bg-dark transition-all shadow-xl group" title="Relatório PDF">
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">analytics</span>
                  </button>
                  <button onClick={() => setShowWa(true)} className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-xl group" title="Gerar Resumo WhatsApp">
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">chat</span>
                  </button>
                  <button onClick={() => setSelectedClient(null)} className="size-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-white/10">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-10 border-b border-white/5 overflow-x-auto pb-0.5 custom-scrollbar">
                {(['info', 'programs', 'cards', 'history'] as const).map((t) => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`pb-5 px-1 text-[11px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${activeTab === t ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-white'}`}>
                    {t === 'info' ? 'Dossiê' : t === 'programs' ? 'Ativos' : t === 'cards' ? 'Cartões' : 'Auditoria'}
                  </button>
                ))}
              </div>

              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
                  <div className="bg-bg-card/40 p-10 rounded-[32px] border border-white/5 space-y-8">
                    <h4 className="display-font text-[10px] text-primary font-black uppercase tracking-[0.4em] italic border-b border-white/5 pb-5">Perfil Identificado</h4>
                    <div className="space-y-6">
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Documento: <span className="text-white ml-2 italic font-black">{selectedClient.cpf || 'Não Informado'}</span></p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Nascimento: <span className="text-white ml-2 italic font-black">{selectedClient.birthDate ? new Date(selectedClient.birthDate).toLocaleDateString() : 'Não Informado'} {clientAge ? `(${clientAge} anos)` : ''}</span></p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Carreira: <span className="text-white ml-2 italic font-black">{selectedClient.profession || 'Empresário'}</span></p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Local: <span className="text-white ml-2 italic font-black">{selectedClient.region || 'Brasil'}</span></p>
                    </div>
                  </div>
                  <div className="bg-bg-card/40 p-10 rounded-[32px] border border-white/5 space-y-8">
                    <h4 className="display-font text-[10px] text-primary font-black uppercase tracking-[0.4em] italic border-b border-white/5 pb-5">Parâmetros de Gestão</h4>
                    <div className="space-y-6">
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Honorários: <span className="text-white ml-2 italic font-black">R$ {selectedClient.managementFee.toLocaleString('pt-BR')}</span></p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Faturamento: <span className="text-white ml-2 italic font-black">{selectedClient.billingCycle}</span></p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Liquidação: <span className="text-primary ml-2 italic font-black uppercase">{selectedClient.paymentMethod}</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ativos Tab */}
              {activeTab === 'programs' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  {/* Smart Asset Cards (Evolution & Economy) - UPDATED WITH LIQUIDITY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-bg-surface border border-emerald-500/20 p-8 rounded-[32px] relative overflow-hidden shadow-2xl group hover:border-emerald-500/40 transition-all">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-emerald-500">savings</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Economia Total Gerada</p>
                      <p className="text-4xl font-black text-white italic tracking-tighter">
                        <span className="text-emerald-500 mr-2">R$</span>
                        {reportMetrics.lifetimeSaving.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                          Lifetime Saving
                        </span>
                      </div>
                    </div>

                    <div className="bg-bg-surface border border-blue-500/20 p-8 rounded-[32px] relative overflow-hidden shadow-2xl group hover:border-blue-500/40 transition-all">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-blue-500">trending_up</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Evolução Patrimonial</p>
                      <p className="text-4xl font-black text-white italic tracking-tighter">
                        {reportMetrics.totalInvested > 1
                          ? (() => {
                            const val = ((reportMetrics.totalValue - reportMetrics.totalInvested) / reportMetrics.totalInvested) * 100;
                            // Sanity check: se o ROI for absurdo (> 2000%), provavelmente é erro de base de custo ou acúmulo orgânico.
                            // Nesses casos, mostramos 100% (lucro total) para manter a coerência visual.
                            if (val > 2000) return '+100,0%';
                            return `${val > 0 ? '+' : ''}${val.toFixed(1).replace('.', ',')}%`;
                          })()
                          : (reportMetrics.totalValue > 0 ? '+100,0%' : '0,0%')}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[9px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                          Rentabilidade Global
                        </span>
                        <span className="text-[9px] text-slate-600 font-bold">
                          (Mkt Val + ROI vs Invest)
                        </span>
                      </div>
                    </div>

                    <div className="bg-bg-surface border border-indigo-500/20 p-8 rounded-[32px] relative overflow-hidden shadow-2xl group hover:border-indigo-500/40 transition-all">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-indigo-500">payments</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Liquidez Realizada (ROI)</p>
                      <p className="text-4xl font-black text-white italic tracking-tighter">
                        <span className="text-emerald-500 mr-2">R$</span>
                        {reportMetrics.lifetimeRoi.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                          Cash-out Real
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Consolidated Summary - existing */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-bg-card border-l-4 border-amber-500 p-8 rounded-r-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <span className="material-symbols-outlined text-8xl text-amber-500">leaderboard</span>
                    </div>

                    <h4 className="display-font text-[10px] text-amber-500 font-bold uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm">dataset</span>
                      Painel de Ativos em Tempo Real
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                      {Object.entries(consolidatedPrograms).map(([name, balance]) => (
                        <div key={name} className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{name}</span>
                          <span className="text-3xl font-black text-white italic tracking-tighter">{Number(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Program Action */}
                  <div className="bg-bg-surface border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-end shadow-lg">
                    <div className="flex-1 w-full space-y-2">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-1">Novo Programa</label>
                      <input className="w-full bg-bg-card border-none rounded-xl py-4 px-5 text-xs text-white italic outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-700" value={newProg.name} onChange={e => setNewProg({ ...newProg, name: e.target.value })} placeholder="Ex: Livelo" />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-1">Capital Inicial</label>
                      <input type="number" className="w-full bg-bg-card border-none rounded-xl py-4 px-5 text-lg text-white font-black italic outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-700" value={newProg.balance} onChange={e => setNewProg({ ...newProg, balance: e.target.value })} placeholder="0" />
                    </div>
                    <button onClick={addProgram} className="bg-primary hover:bg-primary-dark text-bg-dark font-black px-8 py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-primary/20 h-[52px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">add_circle</span> VINCULAR
                    </button>
                  </div>

                  {/* Compact Rows List */}
                  <div className="space-y-3 pb-20">
                    {selectedClient.programs.length === 0 && (
                      <p className="text-center text-slate-600 italic text-xs py-10 opacity-50">Nenhum ativo vinculado.</p>
                    )}
                    {selectedClient.programs.filter(p => p.balance > 0).map(p => (
                      <div key={p.id} className="bg-bg-card border-b border-white/5 p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all">
                        {/* Left: Icon & Info */}
                        <div className="flex items-center gap-6">
                          <div className="size-10 bg-gradient-to-br from-white/5 to-white/0 rounded-lg flex items-center justify-center text-slate-500 border border-white/5 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                            <BrandLogo name={p.name} className="size-5 opacity-80" />
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-white uppercase italic tracking-tighter">{p.name}</span>
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest bg-bg-dark px-2 py-0.5 rounded-full">
                                {(() => {
                                  const lastMove = selectedClient.history
                                    .filter(h => h.program.toLowerCase() === p.name.toLowerCase())
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                                  return lastMove
                                    ? `${new Date(lastMove.date).toLocaleDateString()} • ${lastMove.type}`
                                    : 'SEM HISTÓRICO';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Balance & Actions */}
                        <div className="flex items-center gap-4">
                          {editingProgramId === p.id ? (
                            <div className="flex items-center gap-2">
                              <input autoFocus type="number" className="bg-bg-dark border border-primary/30 rounded py-1 px-2 text-sm text-primary font-black italic w-24 outline-none text-right" value={editBalanceValue} onChange={e => setEditBalanceValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEditedBalance(p)} />
                              <button onClick={() => saveEditedBalance(p)} className="text-emerald-400 hover:scale-110"><span className="material-symbols-outlined text-lg">check</span></button>
                              <button onClick={() => setEditingProgramId(null)} className="text-slate-600 hover:scale-110"><span className="material-symbols-outlined text-lg">close</span></button>
                            </div>
                          ) : (
                            <>
                              <p className="text-xl font-black text-white italic tracking-tighter">
                                {p.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <button onClick={() => startEditingBalance(p)} className="size-8 rounded-lg text-slate-600 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors" title="Editar saldo">
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                            </>
                          )}

                          <button onClick={() => updateCurrent({ ...selectedClient, programs: selectedClient.programs.filter(x => x.id !== p.id) })} className="size-8 rounded-lg text-slate-700 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-colors" title="Excluir programa">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cartões Tab */}
              {activeTab === 'cards' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-bg-surface border border-white/10 p-10 rounded-[40px] flex flex-col md:flex-row gap-8 items-end shadow-2xl">
                    <div className="flex-1 w-full space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Banco</label>
                      <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-5 px-6 text-sm text-white italic outline-none focus:ring-1 focus:ring-primary" value={newCard.bank} onChange={e => setNewCard({ ...newCard, bank: e.target.value })} placeholder="Ex: Santander" />
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cartão</label>
                      <input className="w-full bg-bg-card border border-white/5 rounded-2xl py-5 px-6 text-sm text-white italic outline-none focus:ring-1 focus:ring-primary" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} placeholder="Ex: Unlimited Black" />
                    </div>
                    <button onClick={addCard} className="bg-primary hover:bg-primary-dark text-bg-dark font-black px-10 py-5 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20 h-[64px]">CADASTRAR</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedClient.cards.map(c => (
                      <div key={c.id} className="group relative">
                        <CardSkin bank={c.bank} name={c.name} className="h-40 w-full hover:scale-105 transition-transform duration-300" />
                        <button
                          onClick={() => updateCurrent({ ...selectedClient, cards: selectedClient.cards.filter(x => x.id !== c.id) })}
                          className="absolute -top-2 -right-2 size-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auditoria Tab */}
              {activeTab === 'history' && (
                <div className="space-y-12 animate-in fade-in duration-500 pb-20">
                  <div className="bg-bg-surface border border-white/10 p-10 rounded-[40px] shadow-2xl space-y-10">
                    <h4 className="display-font text-[10px] text-primary font-black uppercase tracking-[0.4em] italic border-b border-white/5 pb-5">Manual Ledger Injection 3.0</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Operação</label>
                        <select className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-[11px] text-white font-black italic outline-none appearance-none cursor-pointer" value={newMove.type} onChange={e => setNewMove({ ...newMove, type: e.target.value as any })}>
                          <option value="Inclusão">Inclusão de Capital</option>
                          <option value="Compra">Compra</option>
                          <option value="Venda">Liquidação (Venda)</option>
                          <option value="Resgate">Resgate (Emissão)</option>
                          <option value="Transferência">Transferência</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Programa</label>
                        {newMove.program === '_NEW_' ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              className="w-full bg-bg-card border border-primary/50 rounded-2xl py-5 px-6 text-[11px] text-white font-black italic outline-none"
                              value={customProgram}
                              onChange={e => setCustomProgram(e.target.value)}
                              placeholder="Nome do Novo Programa"
                            />
                            <button onClick={() => { setNewMove({ ...newMove, program: '' }); setCustomProgram(''); }} className="px-4 text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                          </div>
                        ) : (
                          <select className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-[11px] text-white font-black italic outline-none appearance-none cursor-pointer" value={newMove.program} onChange={e => setNewMove({ ...newMove, program: e.target.value })}>
                            <option value="">Selecione o ativo...</option>
                            {selectedClient.programs.map(p => <option key={p.id} value={p.name}>{p.name.toUpperCase()}</option>)}
                            <option value="_NEW_">✨ Inserir Novo Programa...</option>
                          </select>
                        )}
                      </div>
                      {newMove.type !== 'Resgate' && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
                            {newMove.type === 'Transferência' ? 'Milhas Originais (Base)' : 'Volume (Milhas)'}
                          </label>
                          {newMove.type === 'Transferência' ? (
                            <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xl text-white font-black italic outline-none" value={newMove.val} onChange={e => setNewMove({ ...newMove, val: e.target.value })} placeholder="0" />
                          ) : (
                            <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xl text-white font-black italic outline-none" value={newMove.amount} onChange={e => handleAmountChange(e.target.value)} placeholder="0" />
                          )}
                        </div>
                      )}

                      {newMove.type === 'Transferência' && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Bônus %</label>
                          <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xl text-emerald-400 font-black italic outline-none" value={newMove.bonusPercent} onChange={e => setNewMove({ ...newMove, bonusPercent: e.target.value })} placeholder="0%" />
                          {newMove.amount && (
                            <div className="absolute right-4 top-10 text-xs font-bold text-emerald-400">
                              Total: {Number(newMove.amount).toLocaleString('pt-BR')} mi
                            </div>
                          )}
                        </div>
                      )}

                      {newMove.type !== 'Resgate' && newMove.type !== 'Transferência' && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Valor Financeiro (R$)</label>
                          <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xl text-emerald-500 font-black italic outline-none" value={newMove.val} onChange={e => setNewMove({ ...newMove, val: e.target.value })} placeholder="0.00" />
                          {newMove.type === 'Venda' && newMove.val && newMove.amount && newMove.cpm && (
                            <div className="absolute right-4 top-10 text-xs font-bold text-emerald-400">
                              Lucro: R$ {(Number(newMove.val) - (Number(newMove.amount) / 1000 * Number(newMove.cpm))).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {newMove.type === 'Venda' && (
                            <div className="mt-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Custo CPM (R$)</label>
                              <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-3 px-4 text-sm text-slate-300 font-bold outline-none" value={newMove.cpm} onChange={e => setNewMove({ ...newMove, cpm: e.target.value })} placeholder="Custo Médio" />
                            </div>
                          )}
                        </div>
                      )}

                      {newMove.type === 'Resgate' && (
                        <>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Valor Passagem (R$)</label>
                            <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xl text-white font-black italic outline-none" value={newMove.ticketVal} onChange={e => handleTicketValChange(e.target.value)} placeholder="0.00" />
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Milheiro Gerado (R$)</label>
                            <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xl text-emerald-400 font-black italic outline-none" value={newMove.yieldCpm} onChange={e => handleYieldCpmChange(e.target.value)} placeholder="0.00" />
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">CPM (R$)</label>
                            <input type="number" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-xl text-slate-400 font-black italic outline-none" value={newMove.cpm} onChange={e => setNewMove({ ...newMove, cpm: e.target.value })} placeholder="15.00" />
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Economia (Calc)</label>
                            <input readOnly className="w-full bg-bg-card/50 border border-emerald-500/20 rounded-2xl py-5 px-6 text-xl text-emerald-500 font-black italic outline-none" value={`R$ ${newMove.val || '0.00'}`} />
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Passageiros</label>
                            <input type="number" min="1" className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-[11px] text-white font-black italic outline-none" value={newMove.passengers} onChange={e => setNewMove({ ...newMove, passengers: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Classe</label>
                            <select className="w-full bg-bg-card border-none rounded-2xl py-5 px-6 text-[11px] text-white font-black italic outline-none appearance-none cursor-pointer" value={newMove.flightClass} onChange={e => setNewMove({ ...newMove, flightClass: e.target.value })}>
                              <option value="Econômica">Econômica</option>
                              <option value="Premium Economy">Premium Economy</option>
                              <option value="Executiva">Executiva</option>
                              <option value="Primeira Classe">Primeira Classe</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    <button onClick={addMovement} className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 active:scale-95 transition-all">INJETAR NO LEDGER DE AUDITORIA</button>
                  </div>

                  <div className="space-y-6">
                    {filteredHistory.map(h => (
                      <div key={h.id} className="bg-bg-card/30 p-8 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-white/10 transition-all">
                        <div className="flex items-center gap-8">
                          <div className={`size-16 rounded-[24px] flex items-center justify-center shadow-2xl ${['Venda', 'Resgate', 'Transferência'].includes(h.type) ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {['Venda', 'Resgate', 'Transferência'].includes(h.type) ? (
                              <span className="material-symbols-outlined text-3xl font-black">{h.type === 'Resgate' ? 'airplane_ticket' : h.type === 'Venda' ? 'payments' : 'sync'}</span>
                            ) : (
                              <BrandLogo name={h.program} className="size-8" />
                            )}
                          </div>
                          <div>
                            <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{h.type} {h.program}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-3">
                              {h.date} • {h.description || 'Verified Trail'}
                              {h.bonusPercent ? (
                                <span className="text-emerald-400 ml-2">
                                  (Bônus +{h.bonusPercent}%)
                                  <span className="text-slate-500 text-[9px] ml-1 block font-normal tracking-wide lowercase">
                                    base: <span className="text-white font-bold">{Math.round(h.amount / (1 + (h.bonusPercent / 100))).toLocaleString('pt-BR')}</span> |
                                    bônus: <span className="text-emerald-400 font-bold">+{Math.round(h.amount - (h.amount / (1 + (h.bonusPercent / 100)))).toLocaleString('pt-BR')}</span>
                                  </span>
                                </span>
                              ) : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-black italic tracking-tighter ${['Venda', 'Resgate', 'Transferência'].includes(h.type) ? 'text-red-400' : 'text-emerald-400'}`}>
                            {['Venda', 'Resgate', 'Transferência'].includes(h.type) ? '-' : '+'}{Number(h.amount).toLocaleString('pt-BR')}
                          </p>

                          {/* Ocultar valores zerados para não poluir a interface */}
                          {h.negotiatedValue && Number(h.negotiatedValue) > 0 && (
                            <p className="text-xs font-black text-white italic mt-1">
                              R$ {Number(h.negotiatedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          {!h.negotiatedValue && h.economyGenerated && Number(h.economyGenerated) > 0 && (
                            <p className="text-xs font-black text-white italic mt-1">
                              Eco: R$ {Number(h.economyGenerated).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}

                          {(() => {
                            const profit = h.profit || (h.type === 'Venda' && h.negotiatedValue && h.amount ? (h.negotiatedValue - ((h.amount / 1000) * (h.cpm || 15))) : 0);
                            return profit ? (
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
                                Lucro: R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            ) : null;
                          })()}
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <span className="material-symbols-outlined text-emerald-custom text-sm">verified</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 italic">Audit Confirmed</span>
                            <button
                              onClick={() => handleDeleteMovement(h.id)}
                              className="ml-4 size-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                              title="Excluir Lançamento"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WEALTH REPORT PREMIUM - PDF OPTIMIZED */}
      {showReport && selectedClient && (
        <>
          <style>{`
            @media print {
              @page { margin: 0; size: auto; }
              
              /* 1. Hide everything initially */
              body * {
                visibility: hidden;
              }

              /* 2. Collapse Layout Containers (Sidebar, App Shell) */
              /* Targeted based on App.tsx and typical Sidebar behavior */
              .flex, 
              .flex-col, 
              .h-screen, 
              aside, 
              nav, 
              [class*="sidebar"],
              .lg\:relative,
              main {
                display: block !important; /* Break flexbox */
                position: static !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                left: 0 !important;
                transform: none !important;
                overflow: visible !important;
              }
              
              /* Explicitly hide Sidebar components to remove their reserved space */
              /* Assuming 'aside' or specific sidebar classes found in standard layouts */
              /* Also hiding the specific flex containers if they are purely for layout */
              .flex.h-screen > div:first-child { 
                  display: none !important; /* Often the sidebar wrapper */
              }

              /* 3. The Report Container - VISIBLE and POSITIONED */
              #wealth-report-root, #wealth-report-root * {
                visibility: visible !important;
              }

              #wealth-report-root {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 2147483647 !important;
                background: white !important;
              }

              @page {
                margin: 10mm;
                size: A4 portrait;
              }

              /* 4. Restore Internal Layouts (Grid/Flex INSIDE the report) */
              #wealth-report-root .flex { display: flex !important; }
              #wealth-report-root .grid { display: grid !important; }
              #wealth-report-root table { display: table !important; width: 100% !important; }
              #wealth-report-root thead { display: table-header-group !important; }
              #wealth-report-root tbody { display: table-row-group !important; }
              #wealth-report-root tr { display: table-row !important; }
              #wealth-report-root td, #wealth-report-root th { display: table-cell !important; }
              
              /* Hide UI Controls inside report */
              .print\:hidden { display: none !important; }
            }
          `}</style>

          {/* Note: We move the ID to the outer fixed wrapper to let it break out */}
          <div id="wealth-report-root" className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 animate-in zoom-in duration-300 print:relative print:p-0 print:m-0 print:block print:inset-auto print:z-auto print:h-auto">
            <div className="absolute inset-0 bg-bg-dark/98 backdrop-blur-2xl print:hidden" onClick={() => setShowReport(false)}></div>
            <div className="relative w-full max-w-5xl bg-white text-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col custom-scrollbar print:bg-white print:shadow-none print:overflow-visible print:w-full print:h-auto print:max-w-none print:rounded-none print:block">

              <div className="sticky top-0 z-[210] bg-bg-dark p-6 border-b border-white/10 flex items-center justify-between print:hidden">
                <div className="flex gap-4">
                  {(['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Personalizado'] as const).map(c => (
                    <button key={c} onClick={() => setReportCycle(c)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${reportCycle === c ? 'bg-primary text-bg-dark' : 'text-slate-500 hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                  {reportCycle === 'Personalizado' && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-left-4">
                      <select
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        className="bg-bg-dark border border-white/10 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:border-primary/50"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>{new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</option>
                        ))}
                      </select>
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(e.target.value)}
                        className="bg-bg-dark border border-white/10 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:border-primary/50"
                      >
                        {Array.from({ length: 12 }, (_, i) => 2024 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowReport(false)} className="text-slate-500 hover:text-white flex items-center gap-2 text-[10px] uppercase font-black">
                  <span className="material-symbols-outlined">close</span> FECHAR PREVIEW
                </button>
              </div>

              <div className="bg-black p-20 text-white flex justify-between items-center relative overflow-hidden print:p-12 print:bg-black print-card-background">
                <div className="absolute top-0 right-0 size-[500px] bg-primary/10 rounded-full -mr-64 -mt-64 blur-[120px] print:hidden"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="size-12 bg-primary rounded-lg flex items-center justify-center print-color-adjust">
                      <span className="material-symbols-outlined text-bg-dark font-black text-3xl">diamond</span>
                    </div>
                    <span className="display-font text-2xl font-bold tracking-[0.6em] uppercase italic">FL360<span className="text-primary print:text-black">MILES</span></span>
                  </div>
                  <h2 className="text-7xl font-black italic uppercase tracking-tighter leading-none print:text-5xl">Wealth Report</h2>
                  <p className="text-primary text-[11px] font-black uppercase tracking-[0.8em] mt-6 opacity-90 print:text-gray-300">Estratégia {reportCycle} de Ativos</p>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">Relatório Confidencial</p>
                  <p className="text-4xl font-black italic uppercase tracking-tighter print:text-3xl">
                    {reportCycle === 'Personalizado'
                      ? new Date(Number(reportYear), Number(reportMonth)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                      : reportCycle === 'Mensal'
                        ? new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                        : `Cycle ${reportCycle} — ${new Date().getFullYear()}`}
                  </p>
                  <div className="w-20 h-1 bg-primary ml-auto mt-6 print-color-adjust"></div>
                  <p className="text-[12px] text-white mt-4 font-black uppercase tracking-widest italic">{selectedClient.name}</p>
                </div>
              </div>

              <div className="flex-1 p-24 space-y-24 print:p-10 print:space-y-10">
                <section>
                  <div className="flex items-center gap-6 mb-12">
                    <span className="text-primary font-black italic text-4xl display-font">01</span>
                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] border-b-2 border-slate-100 flex-1 pb-4">Patrimônio Consolidado</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-16 print:gap-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Saldo em Custódia</p>
                      <p className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none">{currentTotalMiles.toLocaleString('pt-BR')}<span className="text-xs opacity-40 uppercase ml-1">mi</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Líquidez Realizada</p>
                      <p className="text-4xl font-black text-emerald-600 italic tracking-tighter leading-none">R$ {reportMetrics.roi.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Economy (Saving)</p>
                      <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">R$ {reportMetrics.saving.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Level Designado</p>
                      <p className="text-3xl font-black text-primary italic tracking-tighter uppercase leading-none">{selectedClient.managementLevel}</p>
                    </div>
                  </div>
                </section>

                {/* NOVA SEÇÃO: Composição do Patrimônio por Programa */}
                <section>
                  <div className="flex items-center gap-6 mb-12">
                    <span className="text-primary font-black italic text-4xl display-font">02</span>
                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] border-b-2 border-slate-100 flex-1 pb-4">Composição do Patrimônio</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:gap-4">
                    {Object.entries(consolidatedPrograms).filter(([, balance]) => (balance as number) > 0).map(([name, balance]) => (
                      <div key={name} className="bg-slate-50 p-6 rounded-2xl print:p-4 print:bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{name}</p>
                        <p className="text-2xl font-black text-slate-900 italic tracking-tighter print:text-xl">
                          {(balance as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-xs opacity-40 uppercase ml-1">mi</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">
                          ≈ R$ {((balance as number) * 0.0185).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                    {Object.entries(consolidatedPrograms).filter(([, balance]) => (balance as number) > 0).length === 0 && (
                      <p className="text-slate-400 italic text-sm col-span-4 text-center py-8">Nenhum programa com saldo ativo</p>
                    )}
                  </div>
                </section>

                {/* MANAGER ANALYSIS SECTION */}
                <section className="mb-12 break-inside-avoid px-8 py-8 bg-slate-50 border-l-4 border-[#E2BE6A] rounded-r-2xl print:bg-transparent print:border-black print:px-0">
                  <div className="flex items-center gap-4 mb-4 justify-between">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-[#E2BE6A] print:text-black">psychology</span>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] italic">Análise do Gestor</h3>
                    </div>
                    <button
                      onClick={() => generateAnalysis()}
                      className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all print:hidden"
                      title="Forçar Reanálise IA"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Atualizar IA
                    </button>
                  </div>

                  {/* Editable in Preview, Static in Print */}
                  <div className="relative group">
                    <textarea
                      value={managerAnalysis}
                      onChange={(e) => setManagerAnalysis(e.target.value)}
                      className="w-full bg-transparent resize-none text-xs font-medium text-gray-900 placeholder-gray-400 leading-relaxed font-sans border-none focus:ring-0 p-0 print:hidden whitespace-pre-wrap h-32"
                      placeholder="Escreva sua análise aqui..."
                    />
                    {/* Print Version */}
                    <div className="hidden print:block text-xs font-medium text-gray-900 leading-relaxed font-sans whitespace-pre-wrap text-justify">
                      {managerAnalysis}
                    </div>
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-200 text-[9px] px-2 py-1 rounded text-slate-600 print:hidden pointer-events-none">
                      Editável
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-6 mb-12">
                    <span className="text-primary font-black italic text-4xl display-font">03</span>
                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] border-b-2 border-slate-100 flex-1 pb-4">Extrato Detalhado</h3>
                  </div>
                  <div className="overflow-hidden border border-slate-100 rounded-[32px] print:overflow-visible print:border-none print:rounded-none">
                    <table className="w-full">
                      <thead className="bg-slate-50 print:bg-transparent">
                        <tr>
                          <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] print:px-4 print:py-2">Data</th>
                          <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] print:px-4 print:py-2">Operação</th>
                          <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] print:px-4 print:py-2">Programa</th>
                          <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] print:px-4 print:py-2">Milhas</th>
                          <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] print:px-4 print:py-2">Resultado (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                        {(() => {
                          // 1. Separate items
                          const allItems = reportMetrics.filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                          const conciergeItems = allItems.filter(h => h.id.startsWith('CONC-') || h.program === 'Concierge VIP' || h.type === 'Concierge');
                          const standardItems = allItems.filter(h => !conciergeItems.includes(h));

                          return (
                            <>
                              {standardItems.map((h, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors break-inside-avoid page-break-inside-avoid print:bg-white">
                                  <td className="px-8 py-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest print:px-4 print:py-2">{new Date(h.date).toLocaleDateString()}</td>
                                  <td className="px-8 py-6 print:px-4 print:py-2">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest print:border print:px-2 ${['Venda', 'Resgate'].includes(h.type) ? 'bg-red-100 text-red-600 print:border-red-600 print:bg-transparent' : 'bg-emerald-100 text-emerald-600 print:border-emerald-600 print:bg-transparent'}`}>
                                      {h.type}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6 text-[11px] font-black text-slate-900 uppercase italic print:px-4 print:py-2">{h.program}</td>
                                  <td className={`px-8 py-6 text-[12px] font-black italic tracking-tight print:px-4 print:py-2 ${['Venda', 'Resgate'].includes(h.type) ? 'text-red-500' : 'text-slate-900'}`}>
                                    {['Venda', 'Resgate', 'Transferência'].includes(h.type) ? '-' : '+'}{h.amount.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="px-8 py-6 text-right text-[12px] font-black text-slate-900 italic tracking-tight print:px-4 print:py-2">
                                    {(() => {
                                      // Render Logic for "Resultado" Column
                                      if (h.type === 'Venda') {
                                        // Venda: Show Value + Profit
                                        const profit = h.profit || (h.negotiatedValue && h.amount ? (h.negotiatedValue - ((h.amount / 1000) * (h.cpm || 15))) : 0);
                                        return (
                                          <div>
                                            {h.negotiatedValue ? `R$ ${h.negotiatedValue.toLocaleString('pt-BR')}` : '-'}
                                            {profit ? (
                                              <div className="text-[8px] text-emerald-600 font-bold block mt-1">
                                                Lucro: R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      } else if (h.type === 'Resgate') {
                                        // Resgate: Show Economy (which is stored in val/economyGenerated for display) or Calculated
                                        // For Resgate, 'negotiatedValue' might be empty, we use 'economyGenerated'
                                        // Actually in addMovement: economyGenerated = val
                                        const eco = h.economyGenerated || (h.ticketValue && h.amount && h.cpm ? (h.ticketValue - ((h.amount / 1000) * h.cpm)) : 0);
                                        return (
                                          <div>
                                            {eco ? (
                                              <span className="text-emerald-600">
                                                (Eco) R$ {eco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                              </span>
                                            ) : '-'}
                                          </div>
                                        );
                                      } else {
                                        // Other (Compra, etc)
                                        if (h.type === 'Inclusão' || h.type === 'Inclusao') return '-';
                                        return h.negotiatedValue ? `R$ ${h.negotiatedValue.toLocaleString('pt-BR')}` : '-';
                                      }
                                    })()}
                                  </td>
                                </tr>
                              ))}

                              {/* Concierge Section - Only if exists */}
                              {conciergeItems.length > 0 && (
                                <>
                                  <tr className="bg-slate-50 print:bg-slate-50 break-inside-avoid">
                                    <td colSpan={5} className="py-6 px-8 print:px-4">
                                      <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-primary">diamond</span>
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-800">Concierge & Lifestyle Services</span>
                                      </div>
                                    </td>
                                  </tr>
                                  {conciergeItems.map((h, i) => (
                                    <tr key={`conc-${i}`} className="hover:bg-slate-50/50 transition-colors break-inside-avoid page-break-inside-avoid print:bg-white border-l-4 border-primary/20">
                                      <td className="px-8 py-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest print:px-4 print:py-2">{new Date(h.date).toLocaleDateString()}</td>
                                      <td className="px-8 py-6 print:px-4 print:py-2">
                                        <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                          Lifestyle
                                        </span>
                                      </td>
                                      <td className="px-8 py-6 text-[11px] font-black text-slate-900 uppercase italic print:px-4 print:py-2" colSpan={2}>
                                        {h.description || 'Solicitação Concierge'} <span className="text-slate-400 font-normal normal-case block text-[10px]">{h.observation}</span>
                                      </td>
                                      <td className="px-8 py-6 text-right text-[12px] font-black text-slate-900 italic tracking-tight print:px-4 print:py-2">
                                        {h.negotiatedValue ? `R$ ${h.negotiatedValue.toLocaleString('pt-BR')}` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </>
                              )}
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="pt-20 text-center border-t border-slate-100 opacity-60">
                  <p className="display-font text-slate-400 text-[11px] tracking-[1em] uppercase italic mb-16">FL360MILES Wealth Management Protocol — 2024</p>
                </section>
              </div>

              <div className="p-12 bg-slate-50 border-t border-slate-200 sticky bottom-0 print:hidden mt-auto space-y-6">

                {/* Manager Analysis Input */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Análise do Gestor (Personalização)</label>
                    <button
                      onClick={generateAnalysis}
                      className="text-[9px] font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      Gerar com IA
                    </button>
                  </div>
                  <textarea
                    className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#E2BE6A] focus:border-transparent outline-none resize-none shadow-inner"
                    placeholder="Escreva uma análise executiva sobre a performance do cliente neste período..."
                    value={managerAnalysis}
                    onChange={(e) => setManagerAnalysis(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-6">
                  <button onClick={() => setShowReport(false)} className="px-10 py-5 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] hover:text-bg-dark transition-all">DESCARTAR</button>
                  <button onClick={() => {
                    const printData = {
                      clientName: selectedClient.name,
                      clientCpf: selectedClient.cpf,
                      managerAnalysis: managerAnalysis, // Pass the analysis text
                      metrics: {
                        ...reportMetrics,
                        totalEconomy: reportMetrics.saving,
                        lastUpdate: new Date().toLocaleDateString('pt-BR')
                      },
                      period: reportCycle === 'Personalizado' ? reportMonth : reportCycle,
                      generatedDate: new Date().toISOString()
                    };
                    localStorage.setItem('fl360_print_data', JSON.stringify(printData));
                    window.open('#/print-report', '_blank');
                  }} className="bg-black text-white px-20 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4 active:scale-95">
                    <span className="material-symbols-outlined text-2xl">print_connect</span>
                    IMPRIMIR PDF OFICIAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* WHATSAPP GENERATOR MODAL */}
      {showWa && selectedClient && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300 print:hidden">
          <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-2xl" onClick={() => setShowWa(false)}></div>
          <div className="relative bg-bg-surface border border-emerald-500/20 p-12 rounded-[48px] w-full max-w-4xl shadow-2xl h-[90vh] overflow-y-auto custom-scrollbar">

            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="display-font text-3xl font-bold text-white uppercase italic tracking-tighter">Gerador de Mensagens</h2>
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">FL360 Concierge • WhatsApp Templates</p>
              </div>
              <button onClick={() => setShowWa(false)} className="size-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Template 1: Resumo Executivo */}
              <div className="bg-bg-dark/50 p-8 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Resumo Executivo</h3>
                </div>
                <div className="bg-black/30 p-6 rounded-2xl border border-white/5 mb-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                    {`Olá ${selectedClient.name.split(' ')[0]}! 🚀\n\nSegue seu status atualizado no FL360:\n💎 Patrimônio: ${reportMetrics.totalPoints.toLocaleString('pt-BR')} milhas\n💰 Valoração: R$ ${reportMetrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📈 Evolução: ${(() => {
                      const val = reportMetrics.totalInvested > 1
                        ? ((reportMetrics.totalValue - reportMetrics.totalInvested) / reportMetrics.totalInvested) * 100
                        : (reportMetrics.totalValue > 0 ? 100 : 0);
                      return (val > 2000 ? 100 : val).toFixed(1).replace('.', ',');
                    })()}% este mês\n\nQualquer dúvida, estou à disposição!\nAbs.`}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    const txt = `Olá ${selectedClient.name.split(' ')[0]}! 🚀\n\nSegue seu status atualizado no FL360:\n💎 Patrimônio: ${reportMetrics.totalPoints.toLocaleString('pt-BR')} milhas\n💰 Valoração: R$ ${reportMetrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📈 Evolução: ${(() => {
                      const val = reportMetrics.totalInvested > 1
                        ? ((reportMetrics.totalValue - reportMetrics.totalInvested) / reportMetrics.totalInvested) * 100
                        : (reportMetrics.totalValue > 0 ? 100 : 0);
                      return (val > 2000 ? 100 : val).toFixed(1).replace('.', ',');
                    })()}% este mês\n\nQualquer dúvida, estou à disposição!\nAbs.`;
                    navigator.clipboard.writeText(txt);
                    alert('Copiado!');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span> COPIAR
                </button>
              </div>

              {/* Template 2: Foco em Lucro */}
              <div className="bg-bg-dark/50 p-8 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined text-lg">savings</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Lucro Realizado</h3>
                </div>
                <div className="bg-black/30 p-6 rounded-2xl border border-white/5 mb-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                    {`Fala ${selectedClient.name.split(' ')[0]}, tudo bem?\n\nBoas notícias sobre nossa gestão de milhas:\n💵 Lucro/Economia Total: R$ ${reportMetrics.lifetimeSaving.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🏦 Liquidez (Cash-out): R$ ${reportMetrics.lifetimeRoi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nSeguimos monitorando as melhores emissões para você! ✈️`}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    const txt = `Fala ${selectedClient.name.split(' ')[0]}, tudo bem?\n\nBoas notícias sobre nossa gestão de milhas:\n💵 Lucro/Economia Total: R$ ${reportMetrics.lifetimeSaving.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🏦 Liquidez (Cash-out): R$ ${reportMetrics.lifetimeRoi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nSeguimos monitorando as melhores emissões para você! ✈️`;
                    navigator.clipboard.writeText(txt);
                    alert('Copiado!');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span> COPIAR
                </button>
              </div>

              {/* Template 3: Auditoria */}
              <div className="bg-bg-dark/50 p-8 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group md:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Auditoria e Compliance</h3>
                </div>
                <div className="bg-black/30 p-6 rounded-2xl border border-white/5 mb-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                    {`Olá ${selectedClient.name}, informo que sua auditoria mensal foi concluída.\n\n✅ Status: AUDITADO\n📅 Data Base: ${new Date().toLocaleDateString('pt-BR')}\n📂 Movimentações: ${reportMetrics.totalMoves} registros auditados\n\nSeu Dossiê completo está disponível no painel. Qualquer divergência, por favor me avise.\n\nAtenciosamente,\nFL360 Concierge.`}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    const txt = `Olá ${selectedClient.name}, informo que sua auditoria mensal foi concluída.\n\n✅ Status: AUDITADO\n📅 Data Base: ${new Date().toLocaleDateString('pt-BR')}\n📂 Movimentações: ${reportMetrics.totalMoves} registros auditados\n\nSeu Dossiê completo está disponível no painel. Qualquer divergência, por favor me avise.\n\nAtenciosamente,\nFL360 Concierge.`;
                    navigator.clipboard.writeText(txt);
                    alert('Copiado!');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span> COPIAR
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
