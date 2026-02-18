
export interface AsaasCustomer {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
}

export interface AsaasSubscription {
    id: string;
    customer: string;
    value: number;
    nextDueDate: string;
    cycle: 'MONTHLY' | 'YEARLY';
    status: 'ACTIVE' | 'OVERDUE' | 'EXPIRED';
    billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
}

export interface AsaasPayment {
    id: string;
    netValue: number;
    billingType: string;
    status: string;
    invoiceUrl: string;
    bankSlipUrl: string;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
}

// Resposta da nossa Edge Function
export interface SubscriptionResponse {
    subscriptionId: string;
    paymentLink: string; // URL do checkout
    qrCode?: {
        payload: string;
        encodedImage: string;
    };
}
