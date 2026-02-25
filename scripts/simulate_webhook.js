/**
 * Simulação de Webhook do Asaas para testes locais e em staging.
 * 
 * Este script envia um payload similar ao do Asaas para a função do Netlify.
 */

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const WEBHOOK_URL = 'https://fl360miles.netlify.app/api/webhook-asaas'; // Ajuste se estiver testando localmente
const TEST_ORG_ID = 'your-org-id-here'; // Substitua por um ID real para teste

const simulatePaymentConfirmed = async () => {
    console.log('--- Simulando PAYMENT_CONFIRMED ---');

    const payload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
            id: 'pay_123456789',
            customer: 'cus_123456789',
            subscription: 'sub_123456789',
            externalReference: TEST_ORG_ID,
            value: 799.00,
            netValue: 790.00,
            billingType: 'CREDIT_CARD',
            status: 'CONFIRMED',
            dueDate: '2026-03-23'
        }
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Adicione headers de segurança se o webhook os exigir futuramente
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Resposta:', response.status, data);
    } catch (error) {
        console.error('Erro na simulação:', error);
    }
};

// Se quiser testar localmente com netlify dev:
// const LOCAL_URL = 'http://localhost:8888/api/webhook-asaas';

simulatePaymentConfirmed();
