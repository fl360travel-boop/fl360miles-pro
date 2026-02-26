// Netlify Function: Criar assinatura no Asaas
// POST /api/create-subscription
// Body: { planId, billingType, userEmail, userName }

import { createClient } from '@supabase/supabase-js';

const PLAN_PRICES: Record<string, number> = {
    starter: 799.99,
    pro: 1299,
    enterprise: 2399,
};

const PLAN_NAMES: Record<string, string> = {
    starter: 'Starter',
    pro: 'Profissional',
    enterprise: 'White Label',
};

export default async (request: Request) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
    const ASAAS_ENV = process.env.ASAAS_ENV || 'sandbox';
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!ASAAS_API_KEY) {
        return new Response(JSON.stringify({ error: 'Asaas API key not configured' }), { status: 500, headers });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers });
    }

    const ASAAS_API_URL = ASAAS_ENV === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';

    try {
        const body = await request.json();
        const { planId, billingType, userEmail, userName, cpfCnpj, mobilePhone, organizationId, userId, cycle, trialDays } = body;

        if (!planId || !PLAN_PRICES[planId]) {
            return new Response(JSON.stringify({ error: 'Plano inválido' }), { status: 400, headers });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        let value = PLAN_PRICES[planId];
        if (cycle === 'YEARLY') {
            value = value * 12 * 0.9; // 10% discount for annual plans
        }

        const planName = PLAN_NAMES[planId];

        // 1. Verificar se já existe customer no Asaas
        let asaasCustomerId: string | null = null;

        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('asaas_customer_id')
            .eq('organization_id', organizationId)
            .not('asaas_customer_id', 'is', null)
            .limit(1)
            .single();

        if (existingSub?.asaas_customer_id) {
            asaasCustomerId = existingSub.asaas_customer_id;
        } else {
            // Criar customer no Asaas
            const customerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': ASAAS_API_KEY,
                },
                body: JSON.stringify({
                    name: userName || userEmail,
                    email: userEmail,
                    cpfCnpj: cpfCnpj?.replace(/\D/g, ''),
                    mobilePhone: mobilePhone?.replace(/\D/g, ''),
                    externalReference: organizationId,
                }),
            });

            const customerData = await customerRes.json();

            if (customerData.errors) {
                return new Response(
                    JSON.stringify({ error: `Asaas: ${customerData.errors[0]?.description || 'Erro ao criar cliente'}` }),
                    { status: 400, headers }
                );
            }

            asaasCustomerId = customerData.id;
        }

        // 2. Criar assinatura no Asaas
        const trialOffset = trialDays ? Number(trialDays) : 1;
        const nextDueDate = new Date(Date.now() + trialOffset * 86400000).toISOString().split('T')[0];

        const subscriptionRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY,
            },
            body: JSON.stringify({
                customer: asaasCustomerId,
                billingType: billingType || 'UNDEFINED',
                value: value,
                nextDueDate: nextDueDate,
                cycle: cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
                description: `FL360 Miles - Plano ${planName} (${cycle === 'YEARLY' ? 'Anual' : 'Mensal'})`,
                externalReference: organizationId,
            }),
        });

        const subData = await subscriptionRes.json();

        if (subData.errors) {
            return new Response(
                JSON.stringify({ error: `Asaas: ${subData.errors[0]?.description || 'Erro ao criar assinatura'}` }),
                { status: 400, headers }
            );
        }

        // 3. Atualizar subscriptions no Supabase
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);

        await supabase
            .from('subscriptions')
            .upsert({
                organization_id: organizationId,
                plan_id: planId,
                status: 'pending',
                asaas_customer_id: asaasCustomerId,
                asaas_subscription_id: subData.id,
                amount: value,
                current_period_end: periodEnd.toISOString(),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'organization_id',
            });

        // 4. Retornar link de pagamento
        // O Asaas gera automaticamente a primeira cobrança
        // Buscar o link de pagamento da primeira cobrança
        let paymentLink = '';

        const paymentsRes = await fetch(
            `${ASAAS_API_URL}/subscriptions/${subData.id}/payments?limit=1`,
            {
                headers: { 'access_token': ASAAS_API_KEY },
            }
        );

        const paymentsData = await paymentsRes.json();

        if (paymentsData.data && paymentsData.data.length > 0) {
            paymentLink = paymentsData.data[0].invoiceUrl || paymentsData.data[0].bankSlipUrl || '';
        }

        return new Response(
            JSON.stringify({
                success: true,
                subscriptionId: subData.id,
                paymentLink: paymentLink,
                planName: planName,
                value: value,
            }),
            { status: 200, headers }
        );
    } catch (error: any) {
        console.error('create-subscription error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
            { status: 500, headers }
        );
    }
};

export const config = {
    path: '/api/create-subscription',
};
