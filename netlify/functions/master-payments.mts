// Netlify Function: Fetch Master Payments from Asaas
// GET /api/master-payments
// Only accessible by master admins

import { createClient } from '@supabase/supabase-js';

export default async (request: Request) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    // Get the auth token from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers });
    }

    const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
    const ASAAS_ENV = process.env.ASAAS_ENV || 'sandbox';
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers });
    }

    const ASAAS_API_URL = ASAAS_ENV === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // Verify user is master admin
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers });
        }

        const isMaster = ['fl360travel@gmail.com', 'adriano.moraesnr@gmail.com'].includes(user.email?.trim().toLowerCase() || '');
        if (!isMaster) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Master Admin access required.' }), { status: 403, headers });
        }

        // Parse query params for date filtering
        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        let asaasUrl = `${ASAAS_API_URL}/payments?limit=100`; // Fetch up to 100 payments
        if (startDate && endDate) {
            asaasUrl += `&dueDate[ge]=${startDate}&dueDate[le]=${endDate}`;
        }

        // Fetch payments from Asaas
        const paymentsRes = await fetch(asaasUrl, {
            method: 'GET',
            headers: {
                'access_token': ASAAS_API_KEY,
            },
        });

        const paymentsData = await paymentsRes.json();

        if (paymentsData.errors) {
            return new Response(
                JSON.stringify({ error: `Asaas Error: ${paymentsData.errors[0]?.description}` }),
                { status: 400, headers }
            );
        }

        // Map it to a safe output
        const safePayments = (paymentsData.data || []).map((p: any) => ({
            id: p.id,
            customer: p.customer,
            dueDate: p.dueDate,
            value: p.value,
            netValue: p.netValue,
            status: p.status, // e.g. RECEIVED, CONFIRMED, OVERDUE, PENDING
            billingType: p.billingType,
            paymentDate: p.paymentDate || p.clientPaymentDate || p.creditDate,
            description: p.description
        }));

        // Now, we need to map customer IDs to agency names in our DB
        const asaasCustomerIds = [...new Set(safePayments.map(p => p.customer))].filter(Boolean);
        
        let customerMap: Record<string, string> = {};
        if (asaasCustomerIds.length > 0) {
            // Find subscriptions matching these customer IDs
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('asaas_customer_id, organization_id')
                .in('asaas_customer_id', asaasCustomerIds as string[]);

            if (subs && subs.length > 0) {
                const orgIds = subs.map(s => s.organization_id);
                // Get organization names
                const { data: orgs } = await supabase
                    .from('organizations')
                    .select('id, company_name')
                    .in('id', orgIds);
                
                if (orgs) {
                    subs.forEach(s => {
                        const org = orgs.find(o => o.id === s.organization_id);
                        if (org && s.asaas_customer_id) {
                            customerMap[s.asaas_customer_id] = org.company_name;
                        }
                    });
                }
            }
        }

        // Attach agency names to payments
        const extendedPayments = safePayments.map(p => ({
            ...p,
            agencyName: customerMap[p.customer as string] || 'Agência Desconhecida / Avulso'
        }));

        return new Response(
            JSON.stringify({
                success: true,
                data: extendedPayments,
                totalCount: paymentsData.totalCount
            }),
            { status: 200, headers }
        );
    } catch (error: any) {
        console.error('master-payments error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Server error' }),
            { status: 500, headers }
        );
    }
};

export const config = {
    path: '/api/master-payments',
};
