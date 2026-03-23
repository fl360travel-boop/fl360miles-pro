
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

interface Branding {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    subdomain: string | null;
    redirectUrl?: string | null;
}

interface BrandingContextType {
    branding: Branding;
    loading: boolean;
    updateBranding: (updates: Partial<Branding>) => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const DEFAULT_BRANDING: Branding = {
    logoUrl: null,
    primaryColor: '#E2BE6A',
    secondaryColor: '#B8952E',
    subdomain: null,
    redirectUrl: null,
};

// Helper to get subdomain
const getSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        // e.g., "empresa.fl360miles.com" or "empresa.localhost"
        return parts[0];
    }
    return null;
};

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, subscription } = useAuth();
    const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
    const [loading, setLoading] = useState(true);

    const adminEmails = ['fl360travel@gmail.com', 'adriano.moraesnr@gmail.com'];
    const isWhiteLabelEnabled = (user?.email && ['fl360travel@gmail.com', 'adriano.moraesnr@gmail.com'].includes(user.email.trim().toLowerCase())) || subscription?.planId === 'enterprise';

    useEffect(() => {
        const fetchBranding = async () => {
            const currentSubdomain = getSubdomain();

            // 1. Prioridade: Se houver subdomínio, buscar por ele (mesmo sem login)
            if (currentSubdomain) {
                try {
                    const { data: tenant, error } = await supabase
                        .from('tenants')
                        .select('company_logo, primary_color, secondary_color, subdomain, redirect_url')
                        .eq('subdomain', currentSubdomain)
                        .single();

                    if (!error && tenant) {
                        // Check for redirect
                        if (tenant.redirect_url) {
                            window.location.href = tenant.redirect_url;
                            return;
                        }

                        setBranding({
                            logoUrl: tenant.company_logo,
                            primaryColor: tenant.primary_color || DEFAULT_BRANDING.primaryColor,
                            secondaryColor: tenant.secondary_color || DEFAULT_BRANDING.secondaryColor,
                            subdomain: tenant.subdomain,
                            redirectUrl: tenant.redirect_url,
                        });
                        setLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching branding by subdomain:', error);
                }
            }

            // 2. Se não houver subdomínio ou falhar, mas o usuário estiver logado e autorizado
            if (user && isWhiteLabelEnabled) {
                try {
                    // Tenta por membership primeiro
                    let { data: membership } = await supabase
                        .from('organization_members')
                        .select('organization_id')
                        .eq('user_id', user.id)
                        .limit(1)
                        .maybeSingle();

                    let targetOrgId = membership?.organization_id;

                    // Se não tiver membership, tenta buscar tenant direto do usuário (Dono)
                    if (!targetOrgId) {
                        const { data: tenant } = await supabase
                            .from('tenants')
                            .select('id')
                            .eq('user_id', user.id)
                            .limit(1)
                            .maybeSingle();
                        targetOrgId = tenant?.id;
                    }

                    if (targetOrgId) {
                        const { data: tenant } = await supabase
                            .from('tenants')
                            .select('company_logo, primary_color, secondary_color, subdomain, redirect_url')
                            .eq('id', targetOrgId)
                            .single();

                        if (tenant) {
                            setBranding({
                                logoUrl: tenant.company_logo,
                                primaryColor: tenant.primary_color || DEFAULT_BRANDING.primaryColor,
                                secondaryColor: tenant.secondary_color || DEFAULT_BRANDING.secondaryColor,
                                subdomain: tenant.subdomain,
                                redirectUrl: tenant.redirect_url,
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching branding by user org:', error);
                }
            } else if (!currentSubdomain) {
                // Se não houver subdomínio e não estiver logado/autorizado, resetar para default
                setBranding(DEFAULT_BRANDING);
            }

            setLoading(false);
        };

        fetchBranding();
    }, [user, isWhiteLabelEnabled]);

    // Apply CSS variables to :root
    useEffect(() => {
        const root = document.documentElement;
        // Sempre aplicamos o branding atual, que pode ser o default ou o customizado via subdomain/login
        root.style.setProperty('--color-primary', branding.primaryColor);
        root.style.setProperty('--color-primary-dark', branding.secondaryColor);
    }, [branding]);

    const updateBranding = async (updates: Partial<Branding>) => {
        if (!user) return;

        try {
            let { data: membership } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle();

            let targetOrgId = membership?.organization_id;

            if (!targetOrgId) {
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .maybeSingle();
                targetOrgId = tenant?.id;
            }

            if (targetOrgId) {
                const dbUpdates: any = {};
                if (updates.logoUrl !== undefined) dbUpdates.company_logo = updates.logoUrl;
                if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor;
                if (updates.secondaryColor !== undefined) dbUpdates.secondary_color = updates.secondaryColor;
                if (updates.subdomain !== undefined) dbUpdates.subdomain = updates.subdomain;
                if (updates.redirectUrl !== undefined) dbUpdates.redirect_url = updates.redirectUrl;

                const { error } = await supabase
                    .from('tenants')
                    .upsert({
                        id: targetOrgId,
                        user_id: user.id,
                        ...dbUpdates
                    });

                if (error) throw error;

                setBranding(prev => ({ ...prev, ...updates }));
            }
        } catch (error) {
            console.error('Error updating branding:', error);
            throw error;
        }
    };

    return (
        <BrandingContext.Provider value={{ branding, loading, updateBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
