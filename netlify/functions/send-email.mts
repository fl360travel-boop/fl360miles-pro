import { Resend } from 'resend';

// Vanilla HTML Templates for Edge Environment
const getWelcomeHtml = (userName: string) => `
<div style="font-family: sans-serif; background-color: #0A0A0B; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #111113; border: 1px solid #27272A; border-radius: 12px; padding: 40px 20px;">
    <h1 style="color: #FFFFFF; font-size: 24px;">Bem-vindo ao Flight 360 Miles, ${userName}!</h1>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">Sua conta corporativa foi criada com sucesso e o seu <strong>Trial de 7 dias</strong> já está valendo.</p>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">O Flight 360 Miles é o sistema operacional definitivo para agências de turismo e emissores de passagens com milhas.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://fl360miles.netlify.app" style="background-color: #10B981; color: #0A0A0B; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acessar Meu Painel</a>
    </div>
    <p style="color: #52525B; font-size: 13px; margin-top: 32px; padding-top: 32px; border-top: 1px solid #27272A;">— Equipe Flight 360 Miles</p>
  </div>
</div>
`;

const getTrialEndingHtml = (userName: string, daysLeft: number) => `
<div style="font-family: sans-serif; background-color: #0A0A0B; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #111113; border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 40px 20px;">
    <h1 style="color: #FFFFFF; font-size: 24px;">Seu período de testes está acabando!</h1>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">Olá, ${userName}. Este é um lembrete rápido de que o seu período de testes vai acabar em <strong>${daysLeft} dia(s)</strong>.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://fl360miles.netlify.app/plans" style="background-color: #F59E0B; color: #0A0A0B; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver Planos e Preços</a>
    </div>
    <p style="color: #52525B; font-size: 13px; margin-top: 32px; padding-top: 32px; border-top: 1px solid #27272A;">— Equipe Flight 360 Miles</p>
  </div>
</div>
`;

const getPaymentSuccessHtml = (userName: string, planName: string) => `
<div style="font-family: sans-serif; background-color: #0A0A0B; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #111113; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 40px 20px;">
    <h1 style="color: #FFFFFF; font-size: 24px;">Pagamento Confirmado! 🎉</h1>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">Olá, ${userName}. A sua assinatura do <strong>Plano ${planName}</strong> foi processada com sucesso!</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://fl360miles.netlify.app" style="background-color: #10B981; color: #0A0A0B; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acessar Painel Premium</a>
    </div>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">A nota fiscal referente a esta cobrança será enviada em breve pelo Gateway (Asaas).</p>
    <p style="color: #52525B; font-size: 13px; margin-top: 32px; padding-top: 32px; border-top: 1px solid #27272A;">— Equipe Flight 360 Miles</p>
  </div>
</div>
`;

const resend = new Resend(process.env.RESEND_API_KEY);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

export default async (request: Request) => {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: 'Resend API key not configured' }), { status: 500, headers });
    }

    try {
        const body = await request.json();
        const { to, subject, template, props } = body;

        let html = '';

        if (template === 'welcome') {
            html = getWelcomeHtml(props.userName);
        } else if (template === 'trial_ending') {
            html = getTrialEndingHtml(props.userName, props.daysLeft);
        } else if (template === 'payment_success') {
            html = getPaymentSuccessHtml(props.userName, props.planName);
        } else {
            return new Response(JSON.stringify({ error: 'Template not found' }), { status: 400, headers });
        }

        const data = await resend.emails.send({
            from: 'FL360 Miles <onboarding@resend.dev>', // Por hora, usa dominio teste da Resend
            to: [to],
            subject: subject,
            html: html,
        });

        return new Response(JSON.stringify(data), {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error('Email error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
        });
    }
};

export const config = {
    path: '/api/send-email'
};
