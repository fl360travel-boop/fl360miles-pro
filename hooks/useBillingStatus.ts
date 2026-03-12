import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

// =============================================
// TYPES
// =============================================
export type BillingStatusType = 'ACTIVE' | 'TRIAL' | 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE_WARNING' | 'BLOCKED';

export interface BillingStatusData {
    user_id: string;
    last_paid_at: string | null;
    due_date: string | null;
    trial_ends_at: string | null;
    status: BillingStatusType;
    popup_last_shown_at: string | null;
    popup_snoozed_until: string | null;
    blocked_at: string | null;
    timezone: string;
}

export interface BillingInfo {
    status: BillingStatusType;
    dueDate: string | null;
    remainingDays: number;
    showPopup: boolean;
    popupCopy: string;
    isBypassed: boolean;
    loading: boolean;
}

// =============================================
// BYPASS EMAILS — these users NEVER see billing popups or blocks
// =============================================
const BYPASS_EMAILS = [
    'fl360travel@gmail.com',
    'adriano.moraesnr@gmail.com',
];

// =============================================
// PURE FUNCTIONS (exported for testing)
// =============================================

/**
 * Calculates due_date = last_paid_at + 30 calendar days
 * If last_paid_at is null, returns null (will be handled by the hook)
 */
export function calculateDueDate(lastPaidAt: string | null): string | null {
    if (!lastPaidAt) return null;
    const d = new Date(lastPaidAt);
    d.setDate(d.getDate() + 30);
    // Return as YYYY-MM-DD (date only, no time)
    return d.toISOString().split('T')[0];
}

/**
 * Calculates billing status based on today and due_date.
 * Both parameters should be date strings in YYYY-MM-DD format.
 */
export function calculateStatus(todayStr: string, dueDateStr: string | null, trialEndsAtStr?: string | null): BillingStatusType {
    // 1. Check trial first
    if (trialEndsAtStr) {
        const today = new Date(todayStr + 'T00:00:00');
        const trialEndsAt = new Date(trialEndsAtStr + 'T00:00:00');
        if (today <= trialEndsAt) return 'TRIAL';

        // Trial expired. If no due_date (payment) set yet, it's BLOCKED
        if (!dueDateStr) return 'BLOCKED';
    }

    // 2. Standard billing cycles
    if (!dueDateStr) return 'ACTIVE';

    const today = new Date(todayStr + 'T00:00:00');
    const dueDate = new Date(dueDateStr + 'T00:00:00');

    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 5) return 'ACTIVE';
    if (diffDays >= 1 && diffDays <= 5) return 'DUE_SOON';
    if (diffDays === 0) return 'DUE_TODAY';
    if (diffDays >= -3 && diffDays < 0) return 'OVERDUE_WARNING';
    return 'BLOCKED'; // diffDays < -3
}

/**
 * Calculate remaining days until due_date.
 * Positive = days until due. Negative = days overdue.
 */
export function remainingDays(todayStr: string, dueDateStr: string | null): number {
    if (!dueDateStr) return 999; // No due date
    const today = new Date(todayStr + 'T00:00:00');
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    return Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determines if the popup should be shown.
 * Rules:
 * 1. Max 1x per day (popup_last_shown_at !== today)
 * 2. Respect snooze (popup_snoozed_until > now)
 * 3. Only show if status is DUE_SOON, DUE_TODAY, or OVERDUE_WARNING
 */
export function shouldShowPopup(
    status: BillingStatusType,
    todayStr: string,
    popupLastShownAt: string | null,
    popupSnoozedUntil: string | null,
    nowISO: string
): boolean {
    // Only show for billing-relevant statuses
    if (status === 'ACTIVE' || status === 'BLOCKED') return false;

    // Check if already shown today
    if (popupLastShownAt === todayStr) return false;

    // Check snooze
    if (popupSnoozedUntil) {
        const snoozedUntil = new Date(popupSnoozedUntil);
        const now = new Date(nowISO);
        if (now < snoozedUntil) return false;
    }

    return true;
}

/**
 * Generates the popup copy text based on status and remaining days.
 */
export function getPopupCopy(status: BillingStatusType, days: number, dueDateStr: string | null): string {
    switch (status) {
        case 'TRIAL':
            return 'Aproveite seu período de testes grátis.';
        case 'DUE_SOON': {
            if (!dueDateStr) return '';
            const [year, month, day] = dueDateStr.split('-');
            const dueDateFormatted = `${day}/${month}`;
            if (days === 1) return `Falta 1 dia para o vencimento em ${dueDateFormatted}.`;
            return `Faltam ${days} dias para o vencimento em ${dueDateFormatted}.`;
        }
        case 'DUE_TODAY':
            return 'Seu pagamento vence hoje.';
        case 'OVERDUE_WARNING': {
            const daysUntilBlock = 3 + days; // days is negative when overdue
            if (daysUntilBlock <= 1) return 'Seu pagamento está em atraso. Seu acesso será bloqueado amanhã.';
            return `Seu pagamento está em atraso. Seu acesso será bloqueado em ${daysUntilBlock} dias.`;
        }
        default:
            return '';
    }
}

// =============================================
// HOOK
// =============================================

export function useBillingStatus(): BillingInfo & {
    snoozeToday: () => Promise<void>;
    markPopupShown: () => Promise<void>;
    simulatePayment: () => Promise<void>;
    refresh: () => Promise<void>;
} {
    const { user } = useAuth();
    const [billingData, setBillingData] = useState<BillingStatusData | null>(null);
    const [loading, setLoading] = useState(true);

    const isBypassed = BYPASS_EMAILS.includes(user?.email?.toLowerCase() || '');

    // Get today in user timezone (defaults to America/Sao_Paulo)
    const getTodayStr = useCallback((tz: string = 'America/Sao_Paulo'): string => {
        try {
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: tz,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
            return formatter.format(new Date()); // Returns YYYY-MM-DD
        } catch {
            // Fallback to local date
            return new Date().toISOString().split('T')[0];
        }
    }, []);

    const getNowISO = useCallback((): string => {
        return new Date().toISOString();
    }, []);

    // Fetch billing status from Supabase
    const fetchBillingStatus = useCallback(async () => {
        if (!user || isBypassed) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('billing_status')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // Row not found — create one
                const { data: newRow, error: insertError } = await supabase
                    .from('billing_status')
                    .insert({ user_id: user.id, status: 'ACTIVE' })
                    .select()
                    .single();

                if (!insertError && newRow) {
                    setBillingData(newRow as BillingStatusData);
                }
            } else if (!error && data) {
                setBillingData(data as BillingStatusData);
            }
        } catch (err) {
            console.warn('[BillingStatus] Erro ao buscar billing_status:', err);
        } finally {
            setLoading(false);
        }
    }, [user, isBypassed]);

    useEffect(() => {
        fetchBillingStatus();
    }, [fetchBillingStatus]);

    // Compute all billing info
    const tz = billingData?.timezone || 'America/Sao_Paulo';
    const todayStr = getTodayStr(tz);
    const nowISO = getNowISO();

    const effectiveDueDate = billingData?.due_date || calculateDueDate(billingData?.last_paid_at || null);
    const effectiveTrialEndsAt = billingData?.trial_ends_at || null;

    const status = isBypassed ? 'ACTIVE' as BillingStatusType : calculateStatus(todayStr, effectiveDueDate, effectiveTrialEndsAt);
    const days = remainingDays(todayStr, effectiveDueDate);
    const showPopup = isBypassed ? false : shouldShowPopup(
        status,
        todayStr,
        billingData?.popup_last_shown_at || null,
        billingData?.popup_snoozed_until || null,
        nowISO
    );
    const popupCopy = getPopupCopy(status, days, effectiveDueDate);

    // Actions

    const snoozeToday = useCallback(async () => {
        if (!user || !billingData) return;
        // Set snooze until today 23:59:59 in user timezone
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const { error } = await supabase
            .from('billing_status')
            .update({
                popup_snoozed_until: endOfDay.toISOString(),
                popup_last_shown_at: todayStr,
            })
            .eq('user_id', user.id);

        if (!error) {
            console.log('[Analytics] snooze_clicked', { user_id: user.id });
            setBillingData(prev => prev ? {
                ...prev,
                popup_snoozed_until: endOfDay.toISOString(),
                popup_last_shown_at: todayStr,
            } : prev);
        }
    }, [user, billingData, todayStr]);

    const markPopupShown = useCallback(async () => {
        if (!user) return;

        const { error } = await supabase
            .from('billing_status')
            .update({ popup_last_shown_at: todayStr })
            .eq('user_id', user.id);

        if (!error) {
            console.log('[Analytics] popup_shown', { user_id: user.id, status });
            setBillingData(prev => prev ? { ...prev, popup_last_shown_at: todayStr } : prev);
        }
    }, [user, todayStr, status]);

    const simulatePayment = useCallback(async () => {
        if (!user) return;

        const now = new Date();
        const newDueDate = new Date(now);
        newDueDate.setDate(newDueDate.getDate() + 30);
        const dueDateStr = newDueDate.toISOString().split('T')[0];

        const { error } = await supabase
            .from('billing_status')
            .update({
                last_paid_at: now.toISOString(),
                due_date: dueDateStr,
                status: 'ACTIVE',
                blocked_at: null,
                popup_snoozed_until: null,
                popup_last_shown_at: null,
            })
            .eq('user_id', user.id);

        if (!error) {
            console.log('[Analytics] payment_completed', { user_id: user.id });
            await fetchBillingStatus();
        }
    }, [user, fetchBillingStatus]);

    return {
        status,
        dueDate: effectiveDueDate,
        remainingDays: days,
        showPopup,
        popupCopy,
        isBypassed,
        loading,
        snoozeToday,
        markPopupShown,
        simulatePayment,
        refresh: fetchBillingStatus,
    };
}
