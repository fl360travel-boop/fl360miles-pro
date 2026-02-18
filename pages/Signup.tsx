
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup: React.FC = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const { error } = await signUp(email, password);
            if (error) {
                setError(error.message);
            } else {
                setSuccessMessage('Conta criada com sucesso! Verifique seu email para confirmar.');
                // Opcional: Redirecionar após alguns segundos ou manter na tela com mensagem
                setTimeout(() => navigate('/'), 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-bg-dark flex items-center justify-center p-6 overflow-hidden">
            {/* Background Image - Reusing Login BG */}
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
                <div className="text-center mb-8">
                    <img src="/login-logo.png" alt="FL360 Miles Logo" className="w-40 mx-auto mb-4 object-contain drop-shadow-2xl" />
                    <h2 className="text-2xl font-bold text-white mb-2">Crie sua conta</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">Comece seus 14 dias grátis</p>
                </div>

                <div className="bg-bg-surface/95 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                Email Profissional
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                placeholder="voce@empresa.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Confirmar Senha</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-bg-card border border-white/5 rounded-2xl py-3 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-[11px] font-medium text-center bg-red-500/10 p-3 rounded-xl">{error}</p>
                        )}

                        {successMessage && (
                            <div className="text-green-400 text-[11px] font-medium text-center bg-green-500/10 p-3 rounded-xl">
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-dark text-bg-dark font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] group disabled:opacity-50 mt-4"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                                <>
                                    INICIAR TRIAL
                                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>

                        <div className="text-center mt-6">
                            <Link
                                to="/"
                                className="text-slate-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                            >
                                Já tem uma conta? Faça Login
                            </Link>
                        </div>
                    </form>
                </div>

                <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-8">
                    FL360 Miles Systems <br />
                    <span className="opacity-50">Secure Enrollment Portal</span>
                </p>
            </div>
        </div>
    );
};

export default Signup;
