// Netlify Function: Webhook do Asaas
// POST /api/webhook-asaas
// Recebe notificações de pagamento e atualiza status da subscription

import { createClient } from '@supabase/supabase-js';

// Tipos de eventos que o Asaas envia
type AsaasEvent =
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_OVERDUE'
    | 'PAYMENT_DELETED'
    | 'PAYMENT_REFUNDED'
    | 'PAYMENT_CHARGEBACK_REQUESTED'
    | 'SUBSCRIPTION_DELETED'
    | 'SUBSCRIPTION_UPDATED';

// Mapeamento de eventos Asaas → status da subscription
const EVENT_STATUS_MAP: Partial<Record<AsaasEvent, string>> = {
    PAYMENT_CONFIRMED: 'active',
    PAYMENT_RECEIVED: 'active',
    PAYMENT_OVERDUE: 'past_due',
    PAYMENT_DELETED: 'past_due',
    PAYMENT_REFUNDED: 'canceled',
    PAYMENT_CHARGEBACK_REQUESTED: 'canceled',
    SUBSCRIPTION_DELETED: 'canceled',
};

export default async (request: Request) => {
    const headers = {
        'Content-Type': 'application/json',
    };

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
        const event = body.event as AsaasEvent;
        const payment = body.payment;

        console.log(`[Webhook Asaas] Evento: ${event}`);

        // Verificar se é um evento que tratamos
        const newStatus = EVENT_STATUS_MAP[event];
        if (!newStatus) {
            return new Response(JSON.stringify({ received: true, action: 'ignored' }), { status: 200, headers });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Identificadores
        const asaasSubscriptionId = payment?.subscription || body.subscription?.id;
        const externalRef = payment?.externalReference || body.subscription?.externalReference;

        if (!asaasSubscriptionId && !externalRef) {
            console.warn('[Webhook] Nenhum identificador encontrado no payload');
            return new Response(JSON.stringify({ received: true, action: 'no_identifier' }), { status: 200, headers });
        }

        // Preparar payload de atualização
        const payload: Record<string, any> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        // Se pagamento confirmado, calcular nova data de fim
        if (newStatus === 'active' && payment?.dueDate) {
            const periodEnd = new Date(payment.dueDate);
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            payload.current_period_end = periodEnd.toISOString();
            payload.trial_ends_at = null; // Limpar trial quando pagar
        }

        let updateQuery;
        if (asaasSubscriptionId) {
            updateQuery = supabase.from('subscriptions').update(payload).eq('asaas_subscription_id', asaasSubscriptionId);
        } else {
            updateQuery = supabase.from('subscriptions').update(payload).eq('organization_id', externalRef);
        }

        const { data, error: updateError } = await updateQuery.select('organization_id').single();

        if (updateError) {
            // ========================================
            // AUTO-PROVISIONING: Se não encontrou subscription,
            // pode ser um cliente novo que pagou direto pelo Asaas.
            // Tentar auto-criar conta via provision-user.
            // ========================================
            if (newStatus === 'active' && (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED')) {
                const customerEmail = payment?.customer?.email || payment?.email;
                const customerName = payment?.customer?.name || payment?.name || customerEmail;
                const paymentId = payment?.id || body.id || `asaas-${Date.now()}`;

                if (customerEmail) {
                    console.log(`[Webhook] Subscription não encontrada. Tentando auto-provisioning para: ${customerEmail}`);

                    try {
                        const origin = new URL(request.url).origin;
                        const provisionRes = await fetch(`${origin}/api/provision-user`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: customerEmail,
                                full_name: customerName,
                                plan: 'starter',
                                external_payment_id: paymentId,
                            }),
                        });

                        const provisionResult = await provisionRes.json();
                        console.log('[Webhook] Auto-provisioning result:', provisionResult);

                        return new Response(JSON.stringify({
                            received: true,
                            action: 'auto_provisioned',
                            result: provisionResult,
                        }), { status: 200, headers });
                    } catch (provErr) {
                        console.error('[Webhook] Erro no auto-provisioning:', provErr);
                    }
                }
            }

            console.error('[Webhook] Erro ao atualizar subscription:', updateError);
            return new Response(JSON.stringify({ error: 'Erro ao atualizar banco de dados' }), { status: 500, headers });
        }

        const orgId = data?.organization_id || externalRef;

        // ========================================
        // BILLING STATUS: Atualizar billing_status quando pagamento confirmado
        // ========================================
        if (newStatus === 'active' && orgId && (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED')) {
            try {
                // Achar o user_id do owner dessa organização
                const { data: ownerMember } = await supabase
                    .from('organization_members')
                    .select('user_id')
                    .eq('organization_id', orgId)
                    .eq('role', 'owner')
                    .limit(1)
                    .single();

                if (ownerMember?.user_id) {
                    const now = new Date();
                    const newDueDate = new Date(now);
                    newDueDate.setDate(newDueDate.getDate() + 30);

                    const { error: billingError } = await supabase
                        .from('billing_status')
                        .upsert({
                            user_id: ownerMember.user_id,
                            last_paid_at: now.toISOString(),
                            due_date: newDueDate.toISOString().split('T')[0],
                            status: 'ACTIVE',
                            blocked_at: null,
                            popup_snoozed_until: null,
                            popup_last_shown_at: null,
                        }, { onConflict: 'user_id' });

                    if (billingError) {
                        console.error('[Webhook] Erro ao atualizar billing_status:', billingError);
                    } else {
                        console.log(`[Webhook] billing_status atualizado para user ${ownerMember.user_id}`);
                        console.log('[Analytics] payment_completed', { user_id: ownerMember.user_id });
                    }
                }
            } catch (err) {
                console.error('[Webhook] Erro no bloco de billing_status:', err);
            }
        }

        // Se pagamento foi confirmado, disparar email
        if (newStatus === 'active' && orgId && (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED')) {
            try {
                // 1. Achar o user_id do owner dessa organização
                const { data: member } = await supabase
                    .from('organization_members')
                    .select('user_id')
                    .eq('organization_id', orgId)
                    .eq('role', 'owner')
                    .limit(1)
                    .single();

                if (member?.user_id) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('email, display_name')
                        .eq('user_id', member.user_id)
                        .single();

                    if (profile?.email) {
                        const origin = new URL(request.url).origin;
                        fetch(`${origin}/api/send-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: profile.email,
                                subject: 'Pagamento Confirmado! Bem-vindo ao Flight 360 Miles',
                                template: 'payment_success',
                                props: {
                                    userName: profile.display_name?.split(' ')[0] || 'Cliente',
                                    planName: 'Premium'
                                }
                            })
                        }).catch(e => console.error('[Webhook] Falha ao disparar fetch de email:', e));
                    }
                }
            } catch (err) {
                console.error('[Webhook] Erro no bloco de envio de email:', err);
            }
        }

        return new Response(
            JSON.stringify({ received: true, action: 'updated', newStatus, orgId }),
            { status: 200, headers }
        );
    } catch (error: any) {
        console.error('[Webhook] Erro fatal:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Erro interno' }),
            { status: 500, headers }
        );
    }
};

export const config = {
    path: '/api/webhook-asaas',
};
