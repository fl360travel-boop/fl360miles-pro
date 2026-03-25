
export enum OperationStatus {
  CONCLUIDO = 'Concluído',
  PROCESSANDO = 'Processando',
  ALERTA = 'Ação Necessária'
}

export type PaymentMethod = 'A vista' | 'Cartão' | 'Boleto';
export type ManagementLevel = 'Standard' | 'Premium' | 'Elite';
export type BillingCycle = 'Mensal' | 'Anual';

export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'canceled' | 'lifetime' | 'legacy';

export interface Subscription {
  planId: 'starter' | 'pro' | 'elite' | 'enterprise' | 'demo' | 'legacy';
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string | null;
}

export interface MileageProgram {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

export interface CreditCard {
  id: string;
  bank: string;
  name: string;
  category: 'Black' | 'Infinite' | 'Platinum' | 'Gold';
}

export interface MileageMovement {
  id: string;
  date: string;
  type: 'Compra' | 'Venda' | 'Transferência' | 'Inclusão' | 'Resgate';
  program: string;
  amount: number;
  description: string;
  observation?: string;
  expirationDate?: string;
  clientName?: string;
  negotiatedValue?: number;
  ticketValue?: number;
  airline?: string;
  economyGenerated?: number;
  passengers?: number;
  flightClass?: string;
  cpm?: number;
  profit?: number;
  bonusPercent?: number;
}

export interface ExpirationAlert {
  id: string;
  clientName: string;
  program: string;
  amount: number;
  expirationDate: string;
  observation: string;
  status: 'pending' | 'resolved';
  createdAt?: string;
}

export interface Client {
  id: string;
  public_token?: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  region?: string;
  profession?: string;
  startDate: string;
  managementFee: number;
  billingCycle: BillingCycle;
  managementLevel: ManagementLevel;
  paymentMethod: PaymentMethod;
  status: 'active' | 'warning' | 'idle';
  avatar: string;
  programs: MileageProgram[];
  cards: CreditCard[];
  history: MileageMovement[];
  notes: string;
  preferences: string;
  travelNotes: string;
  economyHistory: { month: string; economyPercent: number; mileageGrowth: number }[];
}

export interface ClientMember {
  id: string;
  client_id: string;
  organization_id: string;
  name: string;
  cpf?: string;
  birthDate?: string;
  relationship: 'Cônjuge' | 'Filho(a)' | 'Pai/Mãe' | 'Irmão/Irmã' | 'Outro';
  programs: MileageProgram[];
  cards: CreditCard[];
  history: MileageMovement[];
  notes: string;
}

export interface Operation {
  id: string;
  type: 'Venda' | 'Compra' | 'Transferência' | 'Resgate';
  platform: string;
  user: string;
  date: string;
  value: string;
  status: OperationStatus;
  amount?: string;
}

export interface DashboardStats {
  metrics: {
    totalMiles: number;
    totalProfit: number;
    totalEconomy: number;
    activeClients: number;
  };
  recentOps: Array<{
    id: string;
    date: string;
    type: string;
    program: string;
    amount: number;
    clientName: string;
    clientId: string;
  }>;
  programMetrics: Array<{
    name: string;
    balance: number;
    clientCount: number;
  }>;
  chartData: Array<{
    n: string;
    v: number;
    year: number;
  }>;
}
