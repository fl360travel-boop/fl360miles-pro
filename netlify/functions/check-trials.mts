import { createClient } from '@supabase/supabase-js';

export default async (request: Request) => {
    // Apenas para log no Netlify Scheduled Functions
    console.log('[Check Trials] Verificando assinaturas prestes a expirar...');

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('[Check Trials] Supabase não configurado');
        return new Response('Config error', { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        // 1. Buscar assinaturas 'trial' que expiram em exatamente 2 dias
        // Usamos uma janela de 24h para garantir que pegamos todo mundo uma vez por dia
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 2);

        const dateString = targetDate.toISOString().split('T')[0];

        const { data: expiringSubs, error } = await supabase
            .from('subscriptions')
            .select(`
                organization_id,
                trial_ends_at,
                organization_members!inner (
                    user_id,
                    role
                )
            `)
            .eq('status', 'trial')
            .eq('organization_members.role', 'owner')
            .gte('trial_ends_at', `${dateString}T00:00:00`)
            .lte('trial_ends_at', `${dateString}T23:59:59`);

        if (error) throw error;

        console.log(`[Check Trials] Encontradas ${expiringSubs?.length || 0} assinaturas expirando em 2 dias.`);

        if (expiringSubs && expiringSubs.length > 0) {
            const origin = new URL(request.url).origin;

            for (const sub of expiringSubs) {
                const owner = sub.organization_members[0];
                if (!owner) continue;

                // Pegar perfil do owner
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('email, display_name')
                    .eq('user_id', owner.user_id)
                    .single();

                if (profile?.email) {
                    console.log(`[Check Trials] Disparando aviso para ${profile.email}`);

                    await fetch(`${origin}/api/send-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: profile.email,
                            subject: 'Seu período de testes está acabando!',
                            template: 'trial_ending',
                            props: {
                                userName: profile.display_name?.split(' ')[0] || 'Cliente',
                                daysLeft: 2
                            }
                        })
                    }).catch(e => console.error(`[Check Trials] Erro ao enviar para ${profile.email}:`, e));
                }
            }
        }

        return new Response(JSON.stringify({ processed: expiringSubs?.length || 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('[Check Trials] Erro fatal:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

export const config = {
    // Roda todo dia às 09:00 UTC
    schedule: "0 9 * * *"
};
