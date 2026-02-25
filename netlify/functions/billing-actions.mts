// Netlify Function: Billing Actions (Sandbox)
// POST /api/billing-actions
// Simula ações de billing para testes em sandbox

import { createClient } from '@supabase/supabase-js';

export default async (request: Request) => {
    const headers = { 'Content-Type': 'application/json' };

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers });
    }

    try {
        const body = await request.json();
        const { action, userId } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        switch (action) {
            case 'simulate-payment': {
                const now = new Date();
                const newDueDate = new Date(now);
                newDueDate.setDate(newDueDate.getDate() + 30);

                const { error } = await supabase
                    .from('billing_status')
                    .upsert({
                        user_id: userId,
                        last_paid_at: now.toISOString(),
                        due_date: newDueDate.toISOString().split('T')[0],
                        status: 'ACTIVE',
                        blocked_at: null,
                        popup_snoozed_until: null,
                        popup_last_shown_at: null,
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error('[BillingActions] Erro ao simular pagamento:', error);
                    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
                }

                console.log(`[BillingActions] Pagamento simulado para user ${userId}`);
                console.log('[Analytics] payment_completed (simulated)', { user_id: userId });

                return new Response(JSON.stringify({
                    success: true,
                    action: 'payment_simulated',
                    last_paid_at: now.toISOString(),
                    due_date: newDueDate.toISOString().split('T')[0],
                }), { status: 200, headers });
            }

            case 'simulate-overdue': {
                // Set last_paid_at to 35 days ago to simulate BLOCKED
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - 35);
                const dueDate = new Date(pastDate);
                dueDate.setDate(dueDate.getDate() + 30);

                const { error } = await supabase
                    .from('billing_status')
                    .upsert({
                        user_id: userId,
                        last_paid_at: pastDate.toISOString(),
                        due_date: dueDate.toISOString().split('T')[0],
                        status: 'BLOCKED',
                        blocked_at: new Date().toISOString(),
                        popup_snoozed_until: null,
                        popup_last_shown_at: null,
                    }, { onConflict: 'user_id' });

                if (error) {
                    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
                }

                return new Response(JSON.stringify({
                    success: true,
                    action: 'overdue_simulated',
                    last_paid_at: pastDate.toISOString(),
                    due_date: dueDate.toISOString().split('T')[0],
                    status: 'BLOCKED',
                }), { status: 200, headers });
            }

            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers });
        }
    } catch (error: any) {
        console.error('[BillingActions] Erro:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
};

export const config = {
    path: '/api/billing-actions',
};
