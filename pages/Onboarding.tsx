
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ManagementLevel, PaymentMethod, BillingCycle, Client, MileageProgram, CreditCard } from '../types';
import { createClient, getClient, updateClient } from '../services/api';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editClientId = searchParams.get('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Perfil & Dados Pessoais
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [region, setRegion] = useState('');
  const [profession, setProfession] = useState('');

  // Contrato & Financeiro
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [fee, setFee] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Mensal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cartão');
  const [level, setLevel] = useState<ManagementLevel>('Premium');
  const [observations, setObservations] = useState('');

  // Ativos (Milhas & Cartões)
  const [programs, setPrograms] = useState<{ name: string, balance: string }[]>([
    { name: 'Livelo', balance: '' },
    { name: 'Esfera', balance: '' }
  ]);
  const [cards, setCards] = useState<{ bank: string, name: string }[]>([
    { bank: 'Bradesco', name: 'Amex The Platinum' }
  ]);

  // Load client data for editing
  React.useEffect(() => {
    if (editClientId) {
      const loadClient = async () => {
        setIsLoading(true);
        try {
          const client = await getClient(editClientId);
          setName(client.name);
          setCpf(client.cpf || '');
          setEmail(client.email);
          setBirthDate(client.birthDate || '');
          setGender(client.gender || '');
          setMaritalStatus(client.maritalStatus || '');
          setRegion(client.region || '');
          setProfession(client.profession || '');
          setStartDate(client.startDate);
          setFee(client.managementFee.toString());
          setBillingCycle(client.billingCycle);
          setPaymentMethod(client.paymentMethod);
          setLevel(client.managementLevel);
          setObservations(client.notes);

          setPrograms(client.programs.map(p => ({
            name: p.name,
            balance: p.balance.toString()
          })));

          setCards(client.cards.map(c => ({
            bank: c.bank,
            name: c.name
          })));

        } catch (error) {
          console.error('Failed to load client:', error);
          alert('Erro ao carregar dados do cliente.');
          navigate('/clients');
        } finally {
          setIsLoading(false);
        }
      };
      loadClient();
    }
  }, [editClientId, navigate]);

  const handleNext = () => {
    if (step === 1 && !name) {
      alert("Por favor, insira ao menos o nome do titular.");
      return;
    }
    if (step < 4) setStep(step + 1);
    else handleFinalize();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/clients');
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);

    // Fix: Use local date to avoid timezone issues (UTC vs Local)
    const today = new Date();
    const now = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const formattedPrograms: MileageProgram[] = programs
      .filter(p => p.name.trim() !== '')
      .map((p, idx) => ({
        id: `P-${idx}-${Date.now()}`,
        name: p.name,
        balance: Number(p.balance) || 0,
        icon: 'diamond'
      }));

    const formattedCards: CreditCard[] = cards
      .filter(c => c.name.trim() !== '')
      .map((c, idx) => ({
        id: `C-${idx}-${Date.now()}`,
        bank: c.bank,
        name: c.name,
        category: 'Black'
      }));

    try {
      if (editClientId) {
        // Update existing client
        await updateClient(editClientId, {
          name, cpf, email, birthDate, gender, maritalStatus, region, profession,
          startDate, managementFee: Number(fee), billingCycle, managementLevel: level,
          paymentMethod, notes: observations,
          programs: formattedPrograms,
          cards: formattedCards
        });
      } else {
        // Create new client
        const initialHistory = formattedPrograms.map((p, idx) => ({
          id: `H-START-${idx}-${Date.now()}`,
          date: now,
          type: 'Inclusão' as const,
          program: p.name,
          amount: Number(p.balance) || 0, // Ensure number
          description: 'Saldo Inicial de Admissão',
          observation: 'Carga inicial de ativos realizada durante o onboarding.',
          negotiatedValue: (Number(p.balance) || 0) * 0.0185, // Standard Market Rate: R$ 18,50/k
          economyGenerated: (Number(p.balance) || 0) * 0.0185, // Also track as economy for reference
          cpm: 0,
          profit: 0,
          bonusPercent: 0
        }));

        await createClient({
          name: name || 'Cliente Sem Nome',
          cpf: cpf || '',
          email: email || '',
          birthDate: birthDate || '',
          gender,
          maritalStatus,
          region,
          profession,
          startDate: startDate || now,
          managementFee: Number(fee) || 0,
          billingCycle,
          managementLevel: level,
          paymentMethod,
          status: 'active',
          avatar: '1',
          programs: formattedPrograms,
          cards: formattedCards,
          history: initialHistory.length > 0 ? initialHistory : [{
            id: `H-0-${Date.now()}`,
            date: now,
            type: 'Inclusão',
            program: 'Geral',
            amount: 0,
            description: 'Abertura de Protocolo de Gestão Elite',
            cpm: 0,
            profit: 0,
            bonusPercent: 0
          }],
          notes: observations,
          preferences: '',
          travelNotes: '',
          economyHistory: []
        });
      }

      setIsSubmitting(false);
      navigate('/clients');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente. Verifique a conexão com o banco de dados.');
      setIsSubmitting(false);
    }
  };

  const updateProgram = (index: number, field: 'name' | 'balance', value: string) => {
    const newP = [...programs];
    newP[index] = { ...newP[index], [field]: value };
    setPrograms(newP);
  };

  const updateCard = (index: number, field: 'bank' | 'name', value: string) => {
    const newC = [...cards];
    newC[index] = { ...newC[index], [field]: value };
    setCards(newC);
  };

  return (
    <div className="max-w-6xl mx-auto py-10 animate-in fade-in duration-500 pb-32">

      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="display-font text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2">{editClientId ? 'Edição de Perfil' : 'Protocolo de Admissão'}</h2>
          <p className="serif-font text-3xl font-light text-white italic">Etapa {step} de 4 — {
            step === 1 ? 'Perfil & Contrato' :
              step === 2 ? 'Ativos em Milhas' :
                step === 3 ? 'Configuração de Cartões' :
                  'Revisão de Portfólio'
          }</p>
        </div>
        <div className="flex gap-2 w-full md:w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 transition-all duration-700 ${s <= step ? 'bg-primary' : 'bg-transparent'}`}></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          {step === 1 && (
            <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary">person_outline</span>
                  <h3 className="display-font text-lg font-bold text-white italic tracking-widest uppercase">Identidade do Cliente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nome Completo</label>
                    <input className="w-full bg-bg-card border border-white/5 rounded-xl py-3.5 px-5 text-sm text-white focus:ring-1 focus:ring-primary outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ricardo Albuquerque de Oliveira" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">CPF</label>
                    <input className="w-full bg-bg-card border border-white/5 rounded-xl py-3.5 px-5 text-sm text-white focus:ring-1 focus:ring-primary outline-none" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">E-mail</label>
                    <input className="w-full bg-bg-card border border-white/5 rounded-xl py-3.5 px-5 text-sm text-white focus:ring-1 focus:ring-primary outline-none" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemplo@high-ticket.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Data de Nascimento</label>
                    <input type="date" className="w-full bg-bg-card border border-white/5 rounded-xl py-3.5 px-5 text-sm text-white focus:ring-1 focus:ring-primary outline-none h-[48px]" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Profissão</label>
                    <input className="w-full bg-bg-card border border-white/5 rounded-xl py-3.5 px-5 text-sm text-white focus:ring-1 focus:ring-primary outline-none" value={profession} onChange={e => setProfession(e.target.value)} placeholder="Ex: Advogado" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Região / Cidade</label>
                    <input className="w-full bg-bg-card border border-white/5 rounded-xl py-3.5 px-5 text-sm text-white focus:ring-1 focus:ring-primary outline-none" value={region} onChange={e => setRegion(e.target.value)} placeholder="Ex: São Paulo, SP" />
                  </div>
                </div>
              </div>


              <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  <h3 className="display-font text-lg font-bold text-white italic tracking-widest uppercase">Parâmetros do Contrato</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {(['Standard', 'Premium', 'Elite'] as ManagementLevel[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`p-6 rounded-2xl border transition-all text-center group relative overflow-hidden ${level === l ? 'bg-primary/10 border-primary text-primary font-bold shadow-lg shadow-primary/5' : 'bg-bg-card border-white/5 text-slate-500 hover:border-primary/30'}`}
                    >
                      <span className="material-symbols-outlined block mb-3 text-3xl">
                        {l === 'Standard' ? 'person' : l === 'Premium' ? 'military_tech' : 'diamond'}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em]">{l}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Taxa de Gestão (R$)</label>
                    <input type="number" className="w-full bg-bg-card border border-white/5 rounded-xl py-4 px-5 text-xl font-black text-white focus:ring-1 focus:ring-primary outline-none" value={fee} onChange={e => setFee(e.target.value)} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Ciclo de Faturamento</label>
                    <select className="w-full bg-bg-card border border-white/5 rounded-xl py-4 px-5 text-sm text-white focus:ring-1 focus:ring-primary outline-none h-[60px]" value={billingCycle} onChange={e => setBillingCycle(e.target.value as BillingCycle)}>
                      <option>Mensal</option>
                      <option>Anual</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <h1 className="display-font text-2xl font-bold text-white italic uppercase tracking-widest">Carteira de Ativos {editClientId && '(Edição)'}</h1>
                <button onClick={() => setPrograms([...programs, { name: '', balance: '' }])} className="bg-primary/10 hover:bg-primary text-primary hover:text-bg-dark p-3 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                  <span className="material-symbols-outlined text-sm">add</span> Adicionar Programa
                </button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                {programs.map((p, idx) => (
                  <div key={idx} className="bg-bg-card p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-end group transition-all hover:border-primary/20">
                    <div className="flex-1 w-full space-y-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Programa</label>
                      <input className="w-full bg-bg-surface border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none font-bold italic" value={p.name} onChange={e => updateProgram(idx, 'name', e.target.value)} placeholder="Ex: Livelo" />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Saldo Atual</label>
                      <input type="number" className="w-full bg-bg-surface border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary text-right outline-none font-black italic" value={p.balance} onChange={e => updateProgram(idx, 'balance', e.target.value)} placeholder="0" />
                    </div>
                    <button onClick={() => setPrograms(programs.filter((_, i) => i !== idx))} className="size-11 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-white/5">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <h1 className="display-font text-2xl font-bold text-white italic uppercase tracking-widest">Cartões Premium</h1>
                <button onClick={() => setCards([...cards, { bank: '', name: '' }])} className="bg-primary/10 hover:bg-primary text-primary hover:text-bg-dark p-3 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                  <span className="material-symbols-outlined text-sm">add_card</span> Adicionar Cartão
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                {cards.map((c, idx) => (
                  <div key={idx} className="bg-bg-card p-6 rounded-2xl border border-white/5 space-y-4 relative group transition-all hover:border-primary/20">
                    <button onClick={() => setCards(cards.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-slate-700 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Banco</label>
                      <input className="w-full bg-bg-surface border border-white/5 rounded-xl py-2 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none font-bold" value={c.bank} onChange={e => updateCard(idx, 'bank', e.target.value)} placeholder="Ex: Bradesco" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Nome do Cartão</label>
                      <input className="w-full bg-bg-surface border border-white/5 rounded-xl py-2 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none italic" value={c.name} onChange={e => updateCard(idx, 'name', e.target.value)} placeholder="Ex: Amex The Platinum" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-bg-surface border border-white/5 rounded-[40px] p-12 text-center shadow-2xl animate-in zoom-in duration-500">
              <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
              </div>
              <h1 className="serif-font text-4xl italic text-white mb-2 uppercase tracking-tighter">{editClientId ? 'Dados Atualizados' : 'Pronto para Ativação'}</h1>
              <p className="text-slate-500 text-sm italic mb-10">{editClientId ? 'Os dados do cliente foram revisados.' : `O protocolo de gestão de ${name} está configurado.`}</p>

              <div className="grid grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                <div className="bg-bg-card p-6 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Patrimônio Inicial</p>
                  <p className="text-xl font-black text-white italic tracking-tighter">{programs.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0).toLocaleString()} <span className="text-[10px] opacity-40">mi</span></p>
                </div>
                <div className="bg-bg-card p-6 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Honorário</p>
                  <p className="text-xl font-black text-primary italic tracking-tighter">R$ {Number(fee || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-10 border-t border-white/10 mt-10">
            <button onClick={handleBack} className="px-10 py-4 text-slate-500 text-[10px] font-bold hover:text-white transition-colors uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">west</span> VOLTAR
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleNext}
              className={`bg-primary hover:bg-primary-dark text-bg-dark font-black px-14 py-4 rounded-2xl transition-all shadow-2xl shadow-primary/20 flex items-center gap-3 group italic text-[11px] tracking-[0.2em] uppercase ${isSubmitting ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
            >
              {isSubmitting ? 'PROCESSANDO...' : step === 4 ? (editClientId ? 'SALVAR ALTERAÇÕES' : 'OFICIALIZAR ADMISSÃO') : 'PRÓXIMO PASSO'}
              {!isSubmitting && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">east</span>}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 shadow-2xl sticky top-28">
            <h4 className="display-font text-xs font-black text-white uppercase tracking-[0.3em] italic mb-8 border-b border-white/5 pb-4">Preview do Perfil</h4>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Titular</p>
                <p className="text-sm font-black text-white italic uppercase tracking-tighter">{name || 'Aguardando...'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Nível</p>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">{level}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Patrimônio</p>
                  <p className="text-[10px] text-white font-black italic">{programs.reduce((a, b) => a + (Number(b.balance) || 0), 0).toLocaleString()} mi</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
