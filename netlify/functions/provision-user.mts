// Netlify Function: Auto-Provision User on Payment
// POST /api/provision-user
// Creates Supabase Auth user + org + profile + subscription + billing_status
// Sends credentials email via /api/send-email

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Generate a strong temporary password: 16 chars, mixed case + numbers + symbols
function generateTempPassword(): string {
    const bytes = randomBytes(12);
    const base = bytes.toString('base64').replace(/[+/=]/g, ''); // URL-safe
    // Ensure complexity: add uppercase, lowercase, number, symbol
    return base.substring(0, 12) + 'A1!';
}

export default async (request: Request) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        const body = await request.json();
        const { email, full_name, plan, external_payment_id } = body;

        if (!email || !external_payment_id) {
            return new Response(JSON.stringify({ error: 'email and external_payment_id are required' }), { status: 400, headers });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // ============================
        // 1. IDEMPOTENCY CHECK
        // ============================
        const { data: existingEvent } = await supabase
            .from('payment_events')
            .select('id, processed_at')
            .eq('external_payment_id', external_payment_id)
            .single();

        if (existingEvent?.processed_at) {
            console.log(`[Provision] Idempotent skip: ${external_payment_id} already processed`);

            await supabase.from('audit_events').insert({
                type: 'PROVISIONING_SKIPPED',
                metadata: { reason: 'duplicate_webhook', external_payment_id, email: normalizedEmail },
            });

            return new Response(JSON.stringify({
                success: true,
                action: 'already_processed',
                external_payment_id,
            }), { status: 200, headers });
        }

        // Register payment event (or update if exists but not processed)
        await supabase.from('payment_events').upsert({
            external_payment_id,
            email: normalizedEmail,
            full_name: full_name || normalizedEmail,
            status: 'paid',
            plan: plan || 'starter',
            payload_json: body,
        }, { onConflict: 'external_payment_id' });

        // Log webhook received
        await supabase.from('audit_events').insert({
            type: 'PAYMENT_WEBHOOK_RECEIVED',
            metadata: { external_payment_id, email: normalizedEmail, plan },
        });

        // ============================
        // 2. CHECK IF USER ALREADY EXISTS
        // ============================
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
            (u: any) => u.email?.toLowerCase() === normalizedEmail
        );

        if (existingUser) {
            // User already exists — just log it, don't recreate password
            console.log(`[Provision] User already exists: ${normalizedEmail}`);

            // Mark payment event as processed
            await supabase.from('payment_events').update({
                processed_at: new Date().toISOString(),
                provisioned_user_id: existingUser.id,
            }).eq('external_payment_id', external_payment_id);

            await supabase.from('audit_events').insert({
                user_id: existingUser.id,
                type: 'PROVISIONING_SKIPPED',
                metadata: { reason: 'user_already_exists', email: normalizedEmail },
            });

            return new Response(JSON.stringify({
                success: true,
                action: 'user_already_exists',
                user_id: existingUser.id,
            }), { status: 200, headers });
        }

        // ============================
        // 3. CREATE NEW USER
        // ============================
        const tempPassword = generateTempPassword();
        const displayName = full_name || normalizedEmail.split('@')[0];

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                must_change_password: true,
                full_name: displayName,
                provisioned_by: 'payment_webhook',
            },
        });

        if (createError || !newUser?.user) {
            console.error('[Provision] Error creating user:', createError);
            return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), { status: 500, headers });
        }

        const userId = newUser.user.id;
        console.log(`[Provision] User created: ${normalizedEmail} (${userId})`);

        await supabase.from('audit_events').insert({
            user_id: userId,
            type: 'USER_CREATED',
            metadata: { email: normalizedEmail, provisioned_by: 'payment_webhook', plan },
        });

        await supabase.from('audit_events').insert({
            user_id: userId,
            type: 'TEMP_PASSWORD_CREATED',
            metadata: { email: normalizedEmail },
        });

        // ============================
        // 4. CREATE ORG + PROFILE + SUBSCRIPTION + BILLING_STATUS
        // ============================
        // Create user_profile
        await supabase.from('user_profiles').upsert({
            user_id: userId,
            email: normalizedEmail,
            role: 'owner',
            display_name: displayName,
        }, { onConflict: 'user_id' });

        // Create organization
        const orgSlug = normalizedEmail.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
            + '-' + Math.random().toString(36).substring(2, 7);

        const { data: orgData } = await supabase.from('organizations').insert({
            name: displayName + ' - Org',
            slug: orgSlug,
        }).select().single();

        if (orgData) {
            // Create membership
            await supabase.from('organization_members').insert({
                organization_id: orgData.id,
                user_id: userId,
                role: 'owner',
            });

            // Create subscription
            const periodEnd = new Date();
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);

            await supabase.from('subscriptions').upsert({
                organization_id: orgData.id,
                plan_id: plan || 'starter',
                status: 'active',
                current_period_end: periodEnd.toISOString(),
                trial_ends_at: null,
            }, { onConflict: 'organization_id' });

            // [NEW] Create tenant for branding/white-label
            await supabase.from('tenants').insert({
                id: orgData.id,
                user_id: userId,
                company_name: displayName + (plan === 'enterprise' ? '' : ' - Empresa'),
                plan: plan || 'starter',
                plan_status: 'active'
            });
        }

        // Create billing_status
        const now = new Date();
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + 30);

        await supabase.from('billing_status').upsert({
            user_id: userId,
            last_paid_at: now.toISOString(),
            due_date: dueDate.toISOString().split('T')[0],
            status: 'ACTIVE',
        }, { onConflict: 'user_id' });

        // ============================
        // 5. SEND CREDENTIALS EMAIL
        // ============================
        try {
            const origin = new URL(request.url).origin;
            const emailResponse = await fetch(`${origin}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: normalizedEmail,
                    subject: 'Seu acesso ao Flight 360 Miles — login e senha provisória',
                    template: 'credentials',
                    props: {
                        userName: displayName.split(' ')[0],
                        userEmail: normalizedEmail,
                        tempPassword: tempPassword,
                        loginUrl: 'https://fl360miles.com.br/#/login',
                    },
                }),
            });

            if (emailResponse.ok) {
                await supabase.from('audit_events').insert({
                    user_id: userId,
                    type: 'EMAIL_SENT',
                    metadata: { template: 'credentials', to: normalizedEmail },
                });
                console.log(`[Provision] Credentials email sent to ${normalizedEmail}`);
            } else {
                console.error('[Provision] Failed to send email:', await emailResponse.text());
            }
        } catch (emailErr) {
            console.error('[Provision] Email error:', emailErr);
        }

        // ============================
        // 6. MARK PAYMENT EVENT AS PROCESSED
        // ============================
        await supabase.from('payment_events').update({
            processed_at: new Date().toISOString(),
            provisioned_user_id: userId,
        }).eq('external_payment_id', external_payment_id);

        return new Response(JSON.stringify({
            success: true,
            action: 'user_provisioned',
            user_id: userId,
            email: normalizedEmail,
        }), { status: 200, headers });

    } catch (error: any) {
        console.error('[Provision] Fatal error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
};

export const config = {
    path: '/api/provision-user',
};
