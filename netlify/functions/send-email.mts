import { Resend } from 'resend';

// Vanilla HTML Templates for Edge Environment
const getWelcomeHtml = (userName: string) => `
<div style="font-family: sans-serif; background-color: #0A0A0B; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #111113; border: 1px solid #27272A; border-radius: 12px; padding: 40px 20px;">
    <h1 style="color: #FFFFFF; font-size: 24px;">Bem-vindo ao Flight 360 Miles, ${userName}!</h1>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">Sua conta corporativa foi criada com sucesso e o seu <strong>Trial de 7 dias</strong> já está valendo.</p>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">O Flight 360 Miles é o sistema operacional definitivo para agências de turismo e emissores de passagens com milhas.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://fl360miles.com.br" style="background-color: #10B981; color: #0A0A0B; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acessar Meu Painel</a>
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
      <a href="https://fl360miles.com.br/plans" style="background-color: #F59E0B; color: #0A0A0B; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver Planos e Preços</a>
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
      <a href="https://fl360miles.com.br" style="background-color: #10B981; color: #0A0A0B; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acessar Painel Premium</a>
    </div>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">A nota fiscal referente a esta cobrança será enviada em breve pelo Gateway (Asaas).</p>
    <p style="color: #52525B; font-size: 13px; margin-top: 32px; padding-top: 32px; border-top: 1px solid #27272A;">— Equipe Flight 360 Miles</p>
  </div>
</div>
`;

const getCredentialsHtml = (userName: string, userEmail: string, tempPassword: string, loginUrl: string) => `
<div style="font-family: sans-serif; background-color: #0A0A0B; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #111113; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 40px 20px;">
    <h1 style="color: #FFFFFF; font-size: 24px;">Seu acesso ao Flight 360 Miles 🔑</h1>
    <p style="color: #A1A1AA; font-size: 15px; line-height: 24px;">Olá, ${userName}! Sua conta foi criada automaticamente após a confirmação do pagamento.</p>
    
    <div style="background-color: #1A1A1E; border: 1px solid #27272A; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Login (email)</p>
      <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; word-break: break-all;">${userEmail}</p>
      
      <p style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Senha provisória</p>
      <p style="color: #10B981; font-size: 18px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 1px;">${tempPassword}</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="background-color: #10B981; color: #0A0A0B; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Acessar Minha Conta</a>
    </div>

    <div style="background-color: #1C1917; border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #F59E0B; font-size: 13px; margin: 0; line-height: 20px;">⚠️ <strong>Importante:</strong> Por segurança, você será solicitado(a) a trocar a senha no primeiro acesso. Nunca compartilhe suas credenciais.</p>
    </div>

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
    } else if (template === 'credentials') {
      html = getCredentialsHtml(props.userName, props.userEmail, props.tempPassword, props.loginUrl);
    } else if (template === 'lead_demo') {
      const { nome, whatsapp, email: leadEmail, agencia, dificuldade } = props;
      html = `
<div style="font-family: sans-serif; background-color: #0A0A0B; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #111113; border: 1px solid rgba(226,190,106,0.3); border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #E2BE6A, #D4AF37); padding: 24px 32px;">
      <p style="color: #060911; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; margin: 0 0 4px 0;">🎯 NOVO LEAD — DEMONSTRAÇÃO</p>
      <h1 style="color: #060911; font-size: 22px; font-weight: 900; margin: 0;">FL360 Miles</h1>
    </div>
    <div style="padding: 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="color: #71717A; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding: 8px 0 2px 0; border-bottom: 1px solid #27272A;">Nome</td></tr>
        <tr><td style="color: #FFFFFF; font-size: 16px; font-weight: 700; padding: 6px 0 14px 0; border-bottom: 1px solid #1a1a1e;">${nome}</td></tr>
        <tr><td style="color: #71717A; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding: 14px 0 2px 0;">WhatsApp</td></tr>
        <tr><td style="color: #10B981; font-size: 18px; font-weight: 800; padding: 6px 0 14px 0; border-bottom: 1px solid #1a1a1e;">${whatsapp}</td></tr>
        <tr><td style="color: #71717A; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding: 14px 0 2px 0;">E-mail</td></tr>
        <tr><td style="color: #FFFFFF; font-size: 15px; padding: 6px 0 14px 0; border-bottom: 1px solid #1a1a1e;">${leadEmail}</td></tr>
        <tr><td style="color: #71717A; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding: 14px 0 2px 0;">Empresa / Agência</td></tr>
        <tr><td style="color: #FFFFFF; font-size: 15px; padding: 6px 0 14px 0; border-bottom: 1px solid #1a1a1e;">${agencia}</td></tr>
        <tr><td style="color: #71717A; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding: 14px 0 2px 0;">Principal Dificuldade</td></tr>
        <tr><td style="color: #F59E0B; font-size: 15px; font-weight: 600; padding: 6px 0 0 0;">${dificuldade}</td></tr>
      </table>
      <div style="margin-top: 28px; text-align: center;">
        <a href="https://wa.me/5511911988279?text=Ol%C3%A1+${encodeURIComponent(nome)}%2C+vi+seu+interesse+no+FL360+Miles!" style="display:inline-block; background: linear-gradient(135deg, #E2BE6A, #D4AF37); color: #060911; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Responder via WhatsApp</a>
      </div>
    </div>
    <div style="padding: 16px 32px; border-top: 1px solid #27272A; text-align: center;">
      <p style="color: #52525B; font-size: 11px; margin: 0;">Lead recebido em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} — FL360 Miles CRM</p>
    </div>
  </div>
</div>`;
    } else {
      return new Response(JSON.stringify({ error: 'Template not found' }), { status: 400, headers });
    }

    const fromEmail = process.env.EMAIL_FROM || 'FL360 Miles <noreply@fl360miles.com.br>';
    const data = await resend.emails.send({
      from: fromEmail,
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
