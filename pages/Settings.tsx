
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, MileageMovement } from '../types';
import { getClients } from '../services/api';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase, uploadBrandingLogo } from '../services/supabase';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { branding, updateBranding } = useBranding();
  const { planId } = useSubscription();

  const [filterType, setFilterType] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  // Branding states
  const [tempBranding, setTempBranding] = useState(branding);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    setTempBranding(branding);
  }, [branding]);

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

  const globalHistory = useMemo(() => {
    const all = clients.flatMap(c => c.history.map(h => ({ ...h, clientName: c.name, clientId: c.id })));
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clients]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const opsToday = globalHistory.filter(h => h.date === today).length;
    const totalVolume = globalHistory.reduce((acc, h) => acc + h.amount, 0);
    return { opsToday, totalVolume };
  }, [globalHistory]);

  const filteredMovements = globalHistory.filter(m => {
    const matchesType = filterType === 'Todos' || m.type === filterType;
    const q = searchTerm.toLowerCase();
    const matchesSearch = m.clientName?.toLowerCase().includes(q) ||
      m.program.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const handleRowClick = (clientId: string) => {
    navigate(`/clients?id=${clientId}`);
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await updateBranding(tempBranding);
      alert('Configurações de marca atualizadas com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar marca.');
    } finally {
      setIsSaving(false);
    }
  };

  const isWhiteLabelEligible = planId === 'enterprise' || userRole === 'owner';

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <h1 className="display-font text-3xl font-bold text-white italic uppercase tracking-tighter">Configurações & Auditoria</h1>
          <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest font-bold">Gerenciamento de Marca e Integridade do Sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-custom/10 text-emerald-custom px-4 py-2 rounded-full border border-emerald-custom/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-custom/5">
            <span className="size-1.5 bg-emerald-custom rounded-full animate-pulse"></span>
            Compliance Ativo
          </div>
        </div>
      </header>

      {isWhiteLabelEligible && (
        <section className="bg-bg-surface border border-white/5 rounded-3xl shadow-2xl overflow-hidden p-8 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary">palette</span>
            <h2 className="display-font text-xl font-bold text-white italic uppercase tracking-tighter">Personalização (White Label)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Seu Link Personalizado (Subdomínio)</label>
                <div className="flex items-center gap-2">
                  <div className="relative group flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">language</span>
                    <input
                      type="text"
                      value={tempBranding.subdomain || ''}
                      onChange={e => setTempBranding({ ...tempBranding, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="nome-da-empresa"
                      className="bg-card-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[11px] text-white focus:ring-1 focus:ring-primary w-full outline-none italic"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">.fl360miles.com</span>
                </div>
                {tempBranding.subdomain && (
                  <p className="text-[9px] text-emerald-400 mt-2 italic flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">link</span>
                    Seu acesso será: {tempBranding.subdomain}.fl360miles.com
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Link de Redirecionamento (Opcional)</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">redo</span>
                  <input
                    type="url"
                    value={tempBranding.redirectUrl || ''}
                    onChange={e => setTempBranding({ ...tempBranding, redirectUrl: e.target.value })}
                    placeholder="https://sua-pagina-de-vendas.com"
                    className="bg-card-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[11px] text-white focus:ring-1 focus:ring-primary w-full outline-none italic"
                  />
                </div>
                <p className="text-[9px] text-slate-600 mt-2 italic">* Se preenchido, quem acessar o subdomínio será levado para este link.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Logotipo da Empresa (PNG/SVG)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="bg-card-dark border border-dashed border-white/20 rounded-xl p-4 text-center hover:border-primary/50 transition-colors group">
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-primary mb-2 block">upload_file</span>
                        <p className="text-[10px] font-bold text-slate-500 group-hover:text-primary uppercase tracking-widest">
                          {isUploadingLogo ? 'Fazendo Upload...' : 'Selecionar Novo Logo'}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsUploadingLogo(true);
                            try {
                              console.log('Iniciando upload...');
                              const { data: { session } } = await supabase.auth.getSession();
                              if (!session?.user) {
                                alert('Erro: Usuário não autenticado.');
                                return;
                              }

                              // Precisamos do Org ID para o upload (agora filtrando por User ID)
                              let { data: member } = await supabase
                                .from('organization_members')
                                .select('organization_id')
                                .eq('user_id', session.user.id)
                                .limit(1)
                                .maybeSingle();

                              let orgId = member?.organization_id;

                              // Fallback para admin/owner sem membership
                              if (!orgId) {
                                const { data: tenant } = await supabase
                                  .from('tenants')
                                  .select('id')
                                  .eq('user_id', session.user.id)
                                  .limit(1)
                                  .maybeSingle();
                                orgId = tenant?.id;
                              }

                              if (!orgId) {
                                alert('Erro: Não foi possível identificar sua empresa. Verifique seu perfil ou tente logar de novo.');
                                return;
                              }

                              console.log('Org ID encontrado:', orgId);
                              const publicUrl = await uploadBrandingLogo(file, orgId);
                              console.log('Upload concluído. URL:', publicUrl);

                              // Salva IMEDIATAMENTE no banco para o usuário ver o resultado na hora na sidebar
                              await updateBranding({ ...tempBranding, logoUrl: publicUrl });

                              setTempBranding(prev => ({ ...prev, logoUrl: publicUrl }));
                              alert('✅ Logotipo atualizado com sucesso em todo o sistema!');
                            } catch (err: any) {
                              console.error('Erro no upload:', err);
                              alert('Falha no upload: ' + (err.message || 'Erro desconhecido'));
                            } finally {
                              setIsUploadingLogo(false);
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                    </label>
                    {tempBranding.logoUrl && (
                      <button
                        onClick={() => setTempBranding({ ...tempBranding, logoUrl: '' })}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Remover Logo"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">link</span>
                    <input
                      type="text"
                      value={tempBranding.logoUrl || ''}
                      onChange={e => setTempBranding({ ...tempBranding, logoUrl: e.target.value })}
                      placeholder="Ou cole a URL da imagem aqui..."
                      className="bg-card-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[11px] text-white focus:ring-1 focus:ring-primary w-full outline-none italic"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 mt-2 italic">* Recomendado: fundo transparente, altura de 40px.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Cor Primária</label>
                  <div className="flex items-center gap-3 bg-card-dark border border-white/10 rounded-xl p-2 px-3">
                    <input
                      type="color"
                      value={tempBranding.primaryColor}
                      onChange={e => setTempBranding({ ...tempBranding, primaryColor: e.target.value })}
                      className="size-6 bg-transparent border-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tempBranding.primaryColor}
                      onChange={e => setTempBranding({ ...tempBranding, primaryColor: e.target.value })}
                      className="bg-transparent text-[11px] text-white outline-none w-full font-mono uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Cor Secundária</label>
                  <div className="flex items-center gap-3 bg-card-dark border border-white/10 rounded-xl p-2 px-3">
                    <input
                      type="color"
                      value={tempBranding.secondaryColor}
                      onChange={e => setTempBranding({ ...tempBranding, secondaryColor: e.target.value })}
                      className="size-6 bg-transparent border-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tempBranding.secondaryColor}
                      onChange={e => setTempBranding({ ...tempBranding, secondaryColor: e.target.value })}
                      className="bg-transparent text-[11px] text-white outline-none w-full font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveBranding}
                disabled={isSaving}
                className="bg-primary text-bg-dark font-black uppercase tracking-widest text-[10px] px-8 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Aplicar Identidade Visual'}
              </button>
            </div>

            <div className="bg-bg-dark rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4">Prévia do Logo</p>
              <div className="h-20 flex items-center justify-center mb-6">
                {tempBranding.logoUrl ? (
                  <img src={tempBranding.logoUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <img src="/login-logo.png" alt="Preview" className="h-12 w-auto rounded-lg" />
                    <span className="display-font text-[10px] font-bold tracking-[0.3em] uppercase italic">Padrão FL360</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="size-4 rounded-full border border-white/10" style={{ backgroundColor: tempBranding.primaryColor }}></div>
                <div className="size-4 rounded-full border border-white/10" style={{ backgroundColor: tempBranding.secondaryColor }}></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-white/10 transition-all">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Total de Registros (Audit)</p>
          <h3 className="display-font text-3xl font-black text-white italic">{globalHistory.length}</h3>
        </div>
        <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/20 transition-all">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Volume Acumulado</p>
          <h3 className="display-font text-3xl font-black text-primary italic">{stats.totalVolume.toLocaleString('pt-BR')} <span className="text-xs opacity-40 uppercase">milhas</span></h3>
        </div>
        <div className="bg-bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl hover:border-emerald-custom/20 transition-all">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Atualizações Hoje</p>
          <h3 className="display-font text-3xl font-black text-emerald-custom italic">{stats.opsToday}</h3>
        </div>
      </section>

      <section className="bg-bg-surface border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0">
            <h3 className="display-font text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">Audit Log Global</h3>
            <div className="flex gap-2">
              {['Todos', 'Venda', 'Compra', 'Transferência', 'Resgate'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filterType === t ? 'bg-primary border-primary text-bg-dark' : 'bg-transparent border-white/10 text-slate-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="relative group min-w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="Buscar por titular ou ativo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-card-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[11px] text-white focus:ring-1 focus:ring-primary w-full outline-none italic"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-card-dark/50 text-slate-500 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5">
                <th className="px-8 py-5">Data Operação</th>
                <th className="px-8 py-5">Titular do Ativo</th>
                <th className="px-8 py-5">Natureza</th>
                <th className="px-8 py-5">Programa / Ativo</th>
                <th className="px-8 py-5 text-right">Quantidade</th>
                <th className="px-8 py-5">Verificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMovements.map(m => (
                <tr
                  key={m.id}
                  onClick={() => m.clientId && handleRowClick(m.clientId)}
                  className="hover:bg-primary/5 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-primary"
                >
                  <td className="px-8 py-5 text-[10px] text-slate-500 font-bold italic">{m.date}</td>
                  <td className="px-8 py-5">
                    <p className="text-white text-xs font-black uppercase tracking-tighter group-hover:text-primary transition-colors">{m.clientName}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest ${['Venda', 'Resgate', 'Transferência'].includes(m.type) ? 'text-red-400 bg-red-400/10' : 'text-emerald-custom bg-emerald-custom/10'}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs text-slate-400 font-bold italic">{m.program}</td>
                  <td className={`px-8 py-5 text-right text-sm font-black italic ${['Venda', 'Resgate', 'Transferência'].includes(m.type) ? 'text-red-400' : 'text-emerald-400'}`}>
                    {['Venda', 'Resgate', 'Transferência'].includes(m.type) ? '-' : '+'}{m.amount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-emerald-custom text-sm">verified</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Auditado</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <span className="material-symbols-outlined text-slate-800 text-5xl mb-4">search_off</span>
                    <p className="text-slate-600 italic uppercase tracking-[0.4em] text-[10px] font-black">Nenhum registro localizado no terminal</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Settings;
