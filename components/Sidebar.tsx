import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';

const navItems = [
  { label: 'Início', path: '/', icon: 'dashboard' },
  { label: 'Clientes', path: '/clients', icon: 'group' },
  { label: 'Operações', path: '/operations', icon: 'sync_alt' },
  { label: 'Resumo', path: '/summary', icon: 'analytics' },
  { label: 'Alertas', path: '/alerts', icon: 'notifications_active' },
  { label: 'Concierge', path: '/concierge', icon: 'support_agent' },
  { label: 'Configurações', path: '/settings', icon: 'settings' },
  { label: 'Equipe', path: '/settings/team', icon: 'diversity_3' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, userRole, userProfile, isDemo } = useAuth();
  const { branding } = useBranding();

  const isMaster = ['fl360travel@gmail.com', 'adriano.moraesnr@gmail.com'].includes(user?.email?.trim().toLowerCase() || '') || userRole === 'owner';

  return (
    <aside className="w-full lg:w-64 bg-bg-dark border-r border-white/5 flex flex-col h-full shrink-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          {branding.logoUrl ? (
            <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0">
               <img src={branding.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0">
               <img src="/login-logo.png" alt="FL360 MILES" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {/* BOTÃO PAINEL MASTER - SOMENTE PARA ADMINS */}
          {isMaster && (
            <Link
              to="/master-admin"
              className={`flex items-center gap-4 px-5 py-4 text-[12px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all mb-6 border-2 shadow-lg ${location.pathname === '/master-admin'
                ? 'bg-primary text-bg-dark border-primary shadow-primary/30'
                : 'bg-primary/15 text-primary border-primary/50 hover:bg-primary/25 animate-pulse'
                }`}
            >
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              PAINEL MASTER
            </Link>
          )}

          {navItems.map((item) => {
            const tourClass =
              item.path === '/' ? 'tour-step-dashboard-nav' :
                item.path === '/clients' ? 'tour-step-clients' :
                  item.path === '/operations' ? 'tour-step-operations' :
                    item.path === '/summary' ? 'tour-step-summary' :
                      item.path === '/alerts' ? 'tour-step-alerts' :
                        item.path === '/concierge' ? 'tour-step-concierge' :
                          item.path === '/settings' ? 'tour-step-settings' :
                            item.path === '/settings/team' ? 'tour-step-team' : '';

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${tourClass} flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary shadow-lg shadow-primary/5'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}

          <div className="pt-4 mt-2 border-t border-white/5 space-y-1">
            {isDemo ? (
              <div
                className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl text-slate-600 bg-white/5 cursor-not-allowed"
                title="Opção bloqueada no Modo Demonstração"
              >
                <span className="material-symbols-outlined text-lg">lock</span>
                Meu Plano
              </div>
            ) : (
              <Link
                to="/plans"
                className={`tour-step-plans flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${location.pathname === '/plans'
                  ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border-l-2 border-primary'
                  : 'text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">workspace_premium</span>
                Meu Plano
              </Link>
            )}
          </div>
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5">
        <div className="bg-bg-surface/50 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
          {userProfile?.avatar ? (
            <img src={userProfile.avatar} alt="Profile" className="size-10 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-bg-dark font-black text-xs">
              {(userProfile?.display_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate">
              {userProfile?.display_name || 'Usuário'}
            </p>
            <p className="text-[8px] text-primary uppercase font-bold tracking-widest mt-0.5">
              {userRole === 'owner' ? 'Dono/Gestor' : userRole === 'developer' ? 'Operador' : 'Wealth Advisor'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
