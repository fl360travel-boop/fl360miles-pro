import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const ChangePassword: React.FC = () => {
    const { user } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 10) {
            setError('A nova senha deve ter pelo menos 10 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        // Check password strength
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        if (!hasUpper || !hasLower || !hasNumber) {
            setError('A senha deve conter letras maiúsculas, minúsculas e números.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Update password via Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
                data: {
                    must_change_password: false,
                },
            });

            if (updateError) {
                setError(updateError.message);
                return;
            }

            // 2. Log audit event
            console.log('[Analytics] PASSWORD_CHANGED', { user_id: user?.id });

            setSuccess(true);

            // 3. Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao trocar a senha.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-bg-dark flex items-center justify-center p-6 overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/login-bg.png)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-bg-dark/95 via-bg-dark/80 to-bg-dark/95" />

            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 size-[800px] bg-amber-500/10 rounded-full -mr-96 -mt-96 blur-[150px]"></div>
            <div className="absolute bottom-0 left-0 size-[600px] bg-primary/10 rounded-full -ml-64 -mb-64 blur-[120px]"></div>

            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-1000">
                <div className="text-center mb-8">
                    <img src="/login-logo.png" alt="FL360 Miles Logo" className="w-40 mx-auto mb-4 object-contain drop-shadow-2xl" />
                    <div className="size-16 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400 mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">lock_reset</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Troque sua Senha</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
                        Obrigatório no primeiro acesso
                    </p>
                </div>

                <div className="bg-bg-surface/95 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="size-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Senha Alterada!</h3>
                            <p className="text-slate-400 text-sm">Redirecionando para o painel...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                                <p className="text-amber-400 text-xs leading-relaxed">
                                    <span className="font-bold">⚠️ Atenção:</span> Sua conta foi criada com uma senha provisória.
                                    Por segurança, defina uma nova senha pessoal antes de continuar.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                    Nova Senha
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 pl-6 pr-12 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                        placeholder="Mínimo 10 caracteres"
                                        minLength={10}
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

                                {/* Password strength indicator */}
                                {newPassword.length > 0 && (
                                    <div className="flex gap-1 px-2 mt-2">
                                        {[
                                            newPassword.length >= 10,
                                            /[A-Z]/.test(newPassword),
                                            /[a-z]/.test(newPassword),
                                            /[0-9]/.test(newPassword),
                                        ].map((met, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 mt-1">
                                    <span className={`text-[9px] uppercase tracking-wider ${newPassword.length >= 10 ? 'text-emerald-400' : 'text-slate-600'}`}>10+ chars</span>
                                    <span className={`text-[9px] uppercase tracking-wider ${/[A-Z]/.test(newPassword) ? 'text-emerald-400' : 'text-slate-600'}`}>Maiúscula</span>
                                    <span className={`text-[9px] uppercase tracking-wider ${/[a-z]/.test(newPassword) ? 'text-emerald-400' : 'text-slate-600'}`}>Minúscula</span>
                                    <span className={`text-[9px] uppercase tracking-wider ${/[0-9]/.test(newPassword) ? 'text-emerald-400' : 'text-slate-600'}`}>Número</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-bg-card border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                    placeholder="Repita a nova senha"
                                />
                                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                    <p className="text-red-400 text-[10px] px-2">As senhas não coincidem</p>
                                )}
                            </div>

                            {error && (
                                <p className="text-red-400 text-[11px] font-medium text-center bg-red-500/10 p-3 rounded-xl">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || newPassword.length < 10 || newPassword !== confirmPassword}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-bg-dark font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                                        DEFINIR NOVA SENHA
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-8">
                    FL360 Miles Systems <br />
                    <span className="opacity-50">Secure Password Reset</span>
                </p>
            </div>
        </div>
    );
};

export default ChangePassword;
