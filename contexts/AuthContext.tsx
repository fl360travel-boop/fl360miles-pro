import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

import { getSubscription } from '../services/api';
import { Subscription } from '../types';

export type UserRole = 'owner' | 'developer' | 'demo' | null;

export interface UserProfile {
    role: UserRole;
    display_name: string;
    email: string; // Added email
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userRole: UserRole;
    userProfile: UserProfile | null;
    subscription: Subscription | null;
    isOwner: boolean;
    isDeveloper: boolean;
    isDemo: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    signInAsDemo: () => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    mustChangePassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Timeout helper para evitar chamadas que travam
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => {
            console.warn(`Timeout de ${ms}ms atingido. Usando fallback.`);
            resolve(fallback);
        }, ms))
    ]);
}

// Busca o perfil do usuário no banco de dados
async function fetchUserProfile(userId: string): Promise<UserProfile> {
    const defaultProfile: UserProfile = { role: 'developer', display_name: 'Usuário', email: '', avatar: undefined };
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('role, display_name, email, avatar')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.warn('Perfil não encontrado. Usando perfil padrão.');
            return defaultProfile; // fallback seguro
        }

        return {
            role: data.role as UserRole,
            display_name: data.display_name || 'Usuário',
            email: data.email || '',
            avatar: data.avatar || undefined
        };
    } catch {
        console.warn('Erro ao buscar perfil. Usando perfil padrão.');
        return defaultProfile;
    }
}

// Busca subscription com tratamento de erro
async function fetchSubscriptionSafe(): Promise<Subscription | null> {
    try {
        const sub = await getSubscription();
        return sub as Subscription;
    } catch (err) {
        console.warn('Erro ao buscar subscription:', err);
        return null;
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    useEffect(() => {
        let currentUserId: string | null = null;
        let loadingResolved = false;

        const resolveLoading = () => {
            if (!loadingResolved) {
                loadingResolved = true;
                setLoading(false);
            }
        };

        // SAFETY NET: Force loading to false after 8 seconds no matter what
        const safetyTimer = setTimeout(() => {
            console.warn('[Auth] Safety timeout (8s) — forcing load complete.');
            resolveLoading();
        }, 8000);

        // Helper: Load user profile and set state
        const loadUserData = async (sessionUser: any) => {
            try {
                const [profile, sub] = await Promise.all([
                    withTimeout(fetchUserProfile(sessionUser.id), 5000, { role: 'developer', display_name: 'Usuário', email: '' } as UserProfile),
                    withTimeout(fetchSubscriptionSafe(), 5000, null)
                ]);

                // FORÇAR ROLE OWNER SE FOR OS EMAILS DO DONO
                const adminEmails = ['fl360travel@gmail.com', 'adriano.moraesnr@gmail.com'];
                const currentUserEmail = sessionUser.email?.trim().toLowerCase() || '';

                if (adminEmails.includes(currentUserEmail)) {
                    profile.role = 'owner';
                    if (!profile.display_name || profile.display_name === 'Usuário') {
                        profile.display_name = 'Adriano (Dono)';
                    }
                }

                // Auto-update email in profile (fire-and-forget, never block)
                if (sessionUser.email && (!profile.email || profile.email !== sessionUser.email)) {
                    supabase.from('user_profiles')
                        .update({ email: sessionUser.email })
                        .eq('user_id', sessionUser.id)
                        .then(() => {}).catch(() => {});
                    profile.email = sessionUser.email;
                }

                setUserRole(profile.role);
                setUserProfile({ ...profile, role: profile.role });
                setSubscription(sub);
            } catch (err) {
                console.error('[Auth] Erro ao carregar perfil:', err);
            }
        };

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                currentUserId = session.user.id;
                await loadUserData(session.user);
            }

            resolveLoading();
            clearTimeout(safetyTimer);
        }).catch((err) => {
            console.error('[Auth] Erro fatal ao obter sessão:', err);
            resolveLoading();
            clearTimeout(safetyTimer);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                try {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        // Skip if user already loaded
                        if (currentUserId === session.user.id) {
                            resolveLoading();
                            return;
                        }
                        currentUserId = session.user.id;
                        await loadUserData(session.user);
                    } else {
                        currentUserId = null;
                        setUserRole(null);
                        setUserProfile(null);
                        setSubscription(null);
                    }
                } catch (err) {
                    console.error('[Auth] Erro em onAuthStateChange:', err);
                }

                resolveLoading();
            }
        );

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        setUserRole(null);
        await supabase.auth.signOut();
    };

    // Login automático com conta demo
    const signInAsDemo = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email: 'demo@fl360miles.com.br',
            password: 'Demo@FL360',
        });
        return { error: error as Error | null };
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error as Error | null };
    };

    const mustChangePassword = user?.user_metadata?.must_change_password === true;

    const value = {
        user,
        session,
        loading,
        userRole,
        userProfile,
        subscription,
        isOwner: userRole === 'owner',
        isDeveloper: userRole === 'developer',
        isDemo: userRole === 'demo',
        signIn,
        signUp,
        signOut,
        signInAsDemo,
        resetPassword,
        mustChangePassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
