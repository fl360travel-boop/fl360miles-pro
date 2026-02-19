
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import RoleBanner from './components/RoleBanner';
import Dashboard from './pages/Dashboard';
import Operations from './pages/Operations';
import Clients from './pages/Clients';
import Onboarding from './pages/Onboarding';
import StrategicSummary from './pages/StrategicSummary';
import Alerts from './pages/Alerts';
import TransferForm from './pages/TransferForm';
import SaleForm from './pages/SaleForm';
import RedemptionForm from './pages/RedemptionForm';
import Concierge from './pages/Concierge';
import Team from './pages/Settings/Team'; // Add import

import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SubscriptionPlans from './pages/SubscriptionPlans';
import PrintReport from './pages/PrintReport';
import { SearchProvider } from './contexts/SearchContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePermissions } from './hooks/usePermissions';
import SubscriptionBanner from './components/SubscriptionBanner';

// Componente que protege rotas exclusivas do Owner
const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOwner } = usePermissions();

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <span className="material-symbols-outlined text-6xl text-red-400/50 mb-6">shield_lock</span>
        <h2 className="display-font text-xl font-bold text-white italic uppercase tracking-tighter mb-3">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Esta área é exclusiva para o proprietário do sistema.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

// Componente que bloqueia ações para modo Demo
const ReadOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReadOnly } = usePermissions();

  if (isReadOnly) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <span className="material-symbols-outlined text-6xl text-amber-400/50 mb-6">visibility</span>
        <h2 className="display-font text-xl font-bold text-white italic uppercase tracking-tighter mb-3">Modo Demonstração</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Esta funcionalidade não está disponível no modo de demonstração.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { signOut, isDemo } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const isOnboarding = location.pathname.startsWith('/onboarding');

  // Fecha sidebar ao mudar de rota em dispositivos móveis
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-dark">
      {/* Banner de Status de Assinatura (Topo Absoluto) */}
      <SubscriptionBanner />

      {/* Banner de Demo/Dev */}
      <RoleBanner />

      {!isOnboarding && (
        <>
          {/* Overlay Mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition duration-300 ease-in-out z-[70] lg:z-auto`}>
            <Sidebar />
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        {!isOnboarding && <TopBar onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar ${isDemo ? 'mt-10' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/signup'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <p className="text-slate-500 mt-4 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => { }} />;
  }

  return (
    <SearchProvider>
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/operations" element={<AppLayout><Operations /></AppLayout>} />
        <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
        <Route path="/summary" element={<AppLayout><StrategicSummary /></AppLayout>} />
        <Route path="/alerts" element={<AppLayout><Alerts /></AppLayout>} />
        <Route path="/transfer" element={<AppLayout><ReadOnlyGuard><TransferForm /></ReadOnlyGuard></AppLayout>} />
        <Route path="/sale" element={<AppLayout><ReadOnlyGuard><SaleForm /></ReadOnlyGuard></AppLayout>} />
        <Route path="/redemption" element={<AppLayout><ReadOnlyGuard><RedemptionForm /></ReadOnlyGuard></AppLayout>} />
        <Route path="/concierge" element={<AppLayout><Concierge /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><OwnerRoute><Settings /></OwnerRoute></AppLayout>} />
        <Route path="/settings/team" element={<AppLayout><OwnerRoute><Team /></OwnerRoute></AppLayout>} />
        <Route path="/onboarding/*" element={<AppLayout><ReadOnlyGuard><Onboarding /></ReadOnlyGuard></AppLayout>} />
        <Route path="/plans" element={<AppLayout><SubscriptionPlans /></AppLayout>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/print-report" element={<PrintReport />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SearchProvider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </Router>
  );
};

export default App;
