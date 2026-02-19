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

        console.log(`[Webhook Asaas] Evento: ${event}`, JSON.stringify(body, null, 2));

        // Verificar se é um evento que tratamos
        const newStatus = EVENT_STATUS_MAP[event];
        if (!newStatus) {
            // Evento não mapeado — aceitar mas não processar
            return new Response(JSON.stringify({ received: true, action: 'ignored' }), { status: 200, headers });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Buscar subscription pelo asaas_subscription_id
        // O payment.subscription contém o ID da assinatura no Asaas
        const asaasSubscriptionId = payment?.subscription || body.subscription?.id;

        if (!asaasSubscriptionId) {
            // Tentar pelo externalReference (organization_id)
            const externalRef = payment?.externalReference || body.subscription?.externalReference;

            if (externalRef) {
                const updateData: Record<string, any> = {
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                };

                // Se pagamento confirmado, calcular nova data de fim
                if (newStatus === 'active' && payment?.dueDate) {
                    const periodEnd = new Date(payment.dueDate);
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                    updateData.current_period_end = periodEnd.toISOString();
                    updateData.trial_ends_at = null; // Limpar trial quando paga
                }

                const { error } = await supabase
                    .from('subscriptions')
                    .update(updateData)
                    .eq('organization_id', externalRef);

                if (error) {
                    console.error('[Webhook] Erro ao atualizar por externalRef:', error);
                }

                return new Response(JSON.stringify({ received: true, action: 'updated_by_ref' }), { status: 200, headers });
            }

            console.warn('[Webhook] Nenhum identificador encontrado no payload');
            return new Response(JSON.stringify({ received: true, action: 'no_identifier' }), { status: 200, headers });
        }

        // Atualizar subscription por asaas_subscription_id
        const updateData: Record<string, any> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        // Se pagamento confirmado, calcular nova data de fim do período
        if (newStatus === 'active' && payment?.dueDate) {
            const periodEnd = new Date(payment.dueDate);
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            updateData.current_period_end = periodEnd.toISOString();
            updateData.trial_ends_at = null; // Limpar trial
        }

        const { error } = await supabase
            .from('subscriptions')
            .update(updateData)
            .eq('asaas_subscription_id', asaasSubscriptionId);

        if (error) {
            console.error('[Webhook] Erro ao atualizar subscription:', error);
            return new Response(JSON.stringify({ error: 'Erro ao processar webhook' }), { status: 500, headers });
        }

        console.log(`[Webhook] Subscription ${asaasSubscriptionId} → status: ${newStatus}`);

        return new Response(
            JSON.stringify({ received: true, action: 'updated', newStatus }),
            { status: 200, headers }
        );
    } catch (error: any) {
        console.error('[Webhook] Erro:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Erro interno' }),
            { status: 500, headers }
        );
    }
};

export const config = {
    path: '/api/webhook-asaas',
};
