import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

import { getSubscription } from '../services/api';
import { Subscription } from '../types';

export type UserRole = 'owner' | 'developer' | 'demo' | null;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userRole: UserRole;
    subscription: Subscription | null;
    isOwner: boolean;
    isDeveloper: boolean;
    isDemo: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    signInAsDemo: () => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
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

// Busca o role do usuário no banco de dados
async function fetchUserRole(userId: string): Promise<UserRole> {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.warn('Perfil não encontrado. Usando role padrão.');
            return 'developer'; // fallback seguro
        }

        return data.role as UserRole;
    } catch {
        console.warn('Erro ao buscar perfil. Usando role padrão.');
        return 'developer';
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
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    useEffect(() => {
        let currentUserId: string | null = null;

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                currentUserId = session.user.id;
                const [role, sub] = await Promise.all([
                    withTimeout(fetchUserRole(session.user.id), 5000, 'developer' as UserRole),
                    withTimeout(fetchSubscriptionSafe(), 5000, null)
                ]);
                setUserRole(role);
                setSubscription(sub);
            }

            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Evita chamadas duplicadas se o usuário já foi carregado
                    if (currentUserId === session.user.id) {
                        setLoading(false);
                        return;
                    }
                    currentUserId = session.user.id;
                    const [role, sub] = await Promise.all([
                        withTimeout(fetchUserRole(session.user.id), 5000, 'developer' as UserRole),
                        withTimeout(fetchSubscriptionSafe(), 5000, null)
                    ]);
                    setUserRole(role);
                    setSubscription(sub);
                } else {
                    currentUserId = null;
                    setUserRole(null);
                    setSubscription(null);
                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
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
            email: 'demo@fl360miles.com',
            password: 'demo360',
        });
        return { error: error as Error | null };
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error as Error | null };
    };

    const value = {
        user,
        session,
        loading,
        userRole,
        subscription,
        isOwner: userRole === 'owner',
        isDeveloper: userRole === 'developer',
        isDemo: userRole === 'demo',
        signIn,
        signUp,
        signOut,
        signInAsDemo,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
