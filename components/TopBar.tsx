
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  onLogout?: () => void;
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onLogout, onMenuClick }) => {
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useSearch();
  const { userProfile, userRole } = useAuth();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pageTitle = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) : 'Dashboard';

  return (
    <header className="h-20 bg-bg-dark/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 print:hidden">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-primary p-2 hover:bg-white/5 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="hidden md:block">
          <h2 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Módulo</h2>
          <p className="text-sm font-semibold text-primary italic uppercase tracking-widest">{pageTitle}</p>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-8 hidden sm:block">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">search</span>
          <input
            className="w-full bg-bg-surface border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600 outline-none text-white italic"
            placeholder="Buscar no terminal elite..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <Link to="/alerts" className="relative p-2 text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-bg-dark"></span>
        </Link>
        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none italic uppercase tracking-tighter">
              {userProfile?.display_name || 'Usuário'}
            </p>
            <p className="text-[10px] text-primary uppercase mt-1 tracking-widest font-bold">
              {userProfile?.role === 'owner' ? 'Dono/Gestor' : userProfile?.role === 'developer' ? 'Operador' : 'Wealth Advisor'}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="size-10 rounded-full bg-card-dark border border-white/10 flex items-center justify-center overflow-hidden hover:border-primary transition-all group relative shadow-2xl"
          >
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt="Profile"
                className="w-full h-full object-cover group-hover:opacity-30 transition-opacity"
              />
            ) : (
              <span className="text-xs font-bold text-primary">
                {(userProfile?.display_name || 'U').charAt(0).toUpperCase()}
              </span>
            )}
            <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-primary text-xl transition-opacity bg-bg-dark/80">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
