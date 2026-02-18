
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('fl360_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Contate o administrador.');
        } else if (error.message.includes('Email logins are disabled')) {
          setError('Login por email desabilitado. Configure no Supabase.');
        } else {
          setError(error.message);
        }
      } else {
        if (rememberMe) {
          localStorage.setItem('fl360_saved_email', email);
        } else {
          localStorage.removeItem('fl360_saved_email');
        }
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Digite seu email primeiro');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setShowResetPassword(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-bg-dark flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/login-bg.png)' }}
      />
      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-dark/95 via-bg-dark/80 to-bg-dark/95" />

      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 size-[800px] bg-primary/10 rounded-full -mr-96 -mt-96 blur-[150px]"></div>
      <div className="absolute bottom-0 left-0 size-[600px] bg-primary/10 rounded-full -ml-64 -mb-64 blur-[120px]"></div>

      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-1000">
        <div className="text-center mb-12">
          <img src="/login-logo.png" alt="FL360 Miles Logo" className="w-48 mx-auto mb-6 object-contain drop-shadow-2xl" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.6em] mt-4">Terminal de Gestão Confidencial</p>
        </div>

        <div className="bg-bg-surface/95 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl">
          <form onSubmit={showResetPassword ? handleResetPassword : handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                {showResetPassword ? 'Email para Recuperação' : 'Identificador Advisor'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                placeholder="email@fl360miles.com"
              />
            </div>

            {!showResetPassword && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Código de Segurança</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 pl-6 pr-12 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-[11px] font-medium text-center bg-red-500/10 p-3 rounded-xl">{error}</p>
            )}

            {successMessage && (
              <p className="text-green-400 text-[11px] font-medium text-center bg-green-500/10 p-3 rounded-xl">{successMessage}</p>
            )}

            {!showResetPassword && (
              <div className="flex items-center gap-3 px-1">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`size-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${rememberMe ? 'bg-primary border-primary text-bg-dark' : 'bg-transparent border-white/20 hover:border-white/40'}`}
                >
                  {rememberMe && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                </div>
                <label onClick={() => setRememberMe(!rememberMe)} className="text-[11px] text-slate-400 font-bold uppercase tracking-widest cursor-pointer select-none">
                  Manter conectado
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] group disabled:opacity-50"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">sync</span>
              ) : showResetPassword ? (
                <>
                  <span className="material-symbols-outlined text-lg">mail</span>
                  ENVIAR EMAIL DE RECUPERAÇÃO
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">lock_open</span>
                  AUTENTICAR ACESSO
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowResetPassword(!showResetPassword);
                setError('');
                setSuccessMessage('');
              }}
              className="w-full text-slate-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors py-2"
            >
              {showResetPassword ? '← Voltar ao Login' : 'Esqueceu sua senha?'}
            </button>
            {!showResetPassword && (
              <div className="text-center pt-4 border-t border-white/5 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('demo@fl360miles.com');
                    setPassword('demo123');
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-white/5 hover:border-white/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  Modo Demonstração
                </button>
                <Link to="/signup" className="text-primary hover:text-primary-light text-[10px] uppercase tracking-widest font-bold transition-colors block">
                  Não tem conta? Crie agora
                </Link>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-12">
          Este sistema contém informações protegidas. <br />
          O acesso não autorizado é estritamente proibido. <br />
          <span className="text-[8px] opacity-30 mt-2 block">v1.2.0 - SYSTEM FORCE UPDATED</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
