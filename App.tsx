
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
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
import Settings from './pages/Settings';
import Login from './pages/Login';
import { SearchProvider } from './contexts/SearchContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { signOut } = useAuth();
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();

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
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/operations" element={<AppLayout><Operations /></AppLayout>} />
          <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
          <Route path="/summary" element={<AppLayout><StrategicSummary /></AppLayout>} />
          <Route path="/alerts" element={<AppLayout><Alerts /></AppLayout>} />
          <Route path="/transfer" element={<AppLayout><TransferForm /></AppLayout>} />
          <Route path="/sale" element={<AppLayout><SaleForm /></AppLayout>} />
          <Route path="/redemption" element={<AppLayout><RedemptionForm /></AppLayout>} />
          <Route path="/concierge" element={<AppLayout><Concierge /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="/onboarding/*" element={<AppLayout><Onboarding /></AppLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SearchProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
