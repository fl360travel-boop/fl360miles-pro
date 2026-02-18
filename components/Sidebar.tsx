
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Início', path: '/', icon: 'dashboard' },
  { label: 'Clientes', path: '/clients', icon: 'group' },
  { label: 'Operações', path: '/operations', icon: 'sync_alt' },
  { label: 'Resumo', path: '/summary', icon: 'analytics' },
  { label: 'Alertas', path: '/alerts', icon: 'notifications_active' },
  { label: 'Concierge', path: '/concierge', icon: 'support_agent' },
  { label: 'Audit Log', path: '/settings', icon: 'security' },
  { label: 'Equipe', path: '/settings/team', icon: 'diversity_3' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-bg-dark border-r border-white/5 flex flex-col h-full shrink-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="size-8 bg-primary rounded flex items-center justify-center transition-transform group-hover:scale-110">
            <span className="material-symbols-outlined text-bg-dark font-bold">diamond</span>
          </div>
          <span className="display-font text-sm font-bold tracking-widest text-white uppercase italic">
            FL360<span className="text-primary">MILES</span>
          </span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary shadow-lg shadow-primary/5'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5">
        <div className="bg-bg-surface/50 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-bg-dark font-black text-xs">
            AM
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate">Adriano Moraes</p>
            <p className="text-[8px] text-primary uppercase font-bold tracking-widest mt-0.5">Wealth Advisor</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
