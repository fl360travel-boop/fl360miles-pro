
// Siga a documentação do Supabase para fazer deploy:
// https://supabase.com/docs/guides/functions/deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ASAAS_API_URL = Deno.env.get('ASAAS_ENV') === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3';

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the Auth context of the user invoking the function
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get the user from the authorization header
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const { planId, cycle, billingType } = await req.json()

        // 1. Buscar ou Criar Cliente no Asaas
        let asaasCustomerId;

        // Check if tenant already has asaas_id
        const { data: tenant } = await supabaseClient
            .from('tenants')
            .select('asaas_customer_id, company_name')
            .eq('user_id', user.id) // Assuming owner
            .single();

        if (tenant?.asaas_customer_id) {
            asaasCustomerId = tenant.asaas_customer_id;
        } else {
            // Create new customer in Asaas
            // TODO: Get real user details from profile or request body
            const customerData = {
                name: tenant?.company_name || user.email,
                email: user.email,
                externalReference: user.id
            };

            const asaasRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': ASAAS_API_KEY
                },
                body: JSON.stringify(customerData)
            });

            const asaasData = await asaasRes.json();
            if (asaasData.errors) throw new Error(`Asaas Error: ${asaasData.errors[0].description}`);

            asaasCustomerId = asaasData.id;

            // Update tenant with new customer ID
            await supabaseClient
                .from('tenants')
                .update({ asaas_customer_id: asaasCustomerId })
                .eq('user_id', user.id);
        }

        // 2. Criar Assinatura ou Cobrança
        const value = planId === 'pro' ? 197 : 97; // Exemplo simplificado

        const subscriptionData = {
            customer: asaasCustomerId,
            billingType: billingType || 'BOLETO', // BOLETO, PIX, CREDIT_CARD
            value: value,
            nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
            cycle: cycle || 'MONTHLY', // MONTHLY
            description: `Assinatura FL360 - Plano ${planId}`
        };

        const subRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify(subscriptionData)
        });

        const subData = await subRes.json();
        if (subData.errors) throw new Error(`Asaas Subscription Error: ${subData.errors[0].description}`);

        // 3. Salvar no banco local (subscriptions table)
        await supabaseClient
            .from('subscriptions')
            .insert({
                user_id: user.id,
                asaas_customer_id: asaasCustomerId,
                asaas_subscription_id: subData.id,
                status: 'pending',
                plan_id: planId,
                amount: value,
                payment_link: subData.invoiceUrl
            });

        return new Response(
            JSON.stringify({
                subscriptionId: subData.id,
                paymentLink: subData.invoiceUrl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
