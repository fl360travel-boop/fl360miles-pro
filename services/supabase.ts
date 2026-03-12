import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jmvr_it3_mDMBekUjOeQQg_LrMQ4uPi';

// Warning if environment variables are missing (but don't crash)
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase environment variables are not configured. Authentication will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbClient {
    id: string;
    public_token?: string;
    name: string;
    email: string;
    cpf?: string;
    birth_date?: string;
    gender?: string;
    marital_status?: string;
    region?: string;
    profession?: string;
    start_date: string;
    management_fee: number;
    billing_cycle: 'Mensal' | 'Anual';
    management_level: 'Standard' | 'Premium' | 'Elite';
    payment_method: 'A vista' | 'Cartão' | 'Boleto';
    status: 'active' | 'warning' | 'idle';
    avatar: string;
    notes?: string;
    preferences?: string;
    travel_notes?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface DbProgram {
    id: string;
    client_id: string;
    name: string;
    balance: number;
    icon: string;
    user_id?: string;
    created_at?: string;
}

export interface DbCard {
    id: string;
    client_id: string;
    bank: string;
    name: string;
    category: string;
    user_id?: string;
    created_at?: string;
}

export interface DbMovement {
    id: string;
    client_id: string;
    date: string;
    type: string;
    program: string;
    amount: number;
    description: string;
    observation?: string;
    negotiated_value?: number;
    economy_generated?: number;
    user_id?: string;
    created_at?: string;
}

export interface DbEconomyHistory {
    id: string;
    client_id: string;
    month: string;
    economy_percent: number;
    mileage_growth: number;
    user_id?: string;
    created_at?: string;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

const AVATARS_BUCKET = 'avatars';
const BRANDING_BUCKET = 'branding';

// Upload logo for branding
export async function uploadBrandingLogo(file: File, orgId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orgId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(BRANDING_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) {
        throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(BRANDING_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// Upload avatar image
export async function uploadAvatar(file: File, clientId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) {
        throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// Delete avatar image
export async function deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl || !avatarUrl.includes(AVATARS_BUCKET)) return;

    // Extract file path from URL
    const urlParts = avatarUrl.split(`${AVATARS_BUCKET}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .remove([filePath]);

    if (error) {
        console.error('Failed to delete avatar:', error.message);
    }
}

// Get public URL for avatar
export function getAvatarUrl(path: string): string {
    if (!path) return '';

    // If already a full URL, return as is
    if (path.startsWith('http')) return path;

    const { data } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
}
