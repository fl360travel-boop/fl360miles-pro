
import { Client } from './api';

export interface Opportunity {
    id: string;
    type: 'venda' | 'emissao' | 'risco' | 'alerta';
    title: string;
    description: string;
    priority: 'alta' | 'media' | 'baixa';
    clientId?: string;
    clientName?: string;
    actionLabel?: string;
    actionUrl?: string; // Deep link
}

// Simulador de "Cérebro" (Futuramente conecta com OpenAI)
export class AIAdvisorService {

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    static analyzePortfolio(clients: Client[]): Opportunity[] {
        const opportunities: Opportunity[] = [];
        const today = new Date();

        clients.forEach(client => {
            // 1. Riqueza Parada (Saldo Alto sem Movimento)
            const totalMiles = client.programs.reduce((acc, p) => acc + p.balance, 0);

            if (totalMiles > 300000) {
                // Check last movement
                const lastMove = client.history.length > 0 ? new Date(client.history[0].date) : new Date(0);
                const daysSinceLastMove = Math.floor((today.getTime() - lastMove.getTime()) / (1000 * 3600 * 24));

                if (daysSinceLastMove > 60) {
                    opportunities.push({
                        id: this.generateId(),
                        type: 'venda',
                        priority: 'alta',
                        title: `Liquidez Imediata: ${client.name}`,
                        description: `${client.name} tem ${totalMiles.toLocaleString()} milhas paradas há ${daysSinceLastMove} dias. Sugira venda ou emissão.`,
                        clientId: client.id,
                        clientName: client.name,
                        actionLabel: 'Ver Perfil',
                        actionUrl: `/clients?id=${client.id}`
                    });
                }
            }

            // 2. Aniversário Próximo (Relacionamento)
            if (client.birthDate) {
                const bDate = new Date(client.birthDate);
                // Simple check for day/month match (ignoring year)
                if (bDate.getUTCMonth() === today.getUTCMonth()) {
                    const dayDiff = bDate.getUTCDate() - today.getUTCDate();
                    if (dayDiff >= 0 && dayDiff <= 7) {
                        opportunities.push({
                            id: this.generateId(),
                            type: 'alerta',
                            priority: 'media',
                            title: `Aniversário: ${client.name}`,
                            description: `Aniversário em ${dayDiff === 0 ? 'hoje' : dayDiff + ' dias'}. Ótimo pretexto para contato.`,
                            clientId: client.id,
                            clientName: client.name,
                            actionLabel: 'Mensagem WhatsApp',
                            actionUrl: '#'
                        });
                    }
                }
            }

            // 3. Programas Específicos (Oportunidade de Mercado)
            // Exemplo: Latam Pass vende bem
            const latam = client.programs.find(p => p.name.toLowerCase().includes('latam'));
            if (latam && latam.balance > 100000) {
                opportunities.push({
                    id: this.generateId(),
                    type: 'emissao',
                    priority: 'media',
                    title: `Emissão Latam: ${client.name}`,
                    description: `Saldo alto na Latam (${latam.balance.toLocaleString()}). Bom momento para buscar passagens nacionais.`,
                    clientId: client.id,
                    clientName: client.name
                });
            }
        });

        // Sort by priority (Alta first)
        return opportunities.sort((a, b) => {
            const map = { 'alta': 3, 'media': 2, 'baixa': 1 };
            return map[b.priority] - map[a.priority];
        });
    }

    static async getStrategicInsight(): Promise<string> {
        // Simulando um insight de mercado (futuramente via API externa ou GPT)
        const insights = [
            "O Dólar caiu 2% hoje. Bom momento para clientes Nomad/Wise fazerem remessas.",
            "Latam Pass liberou lote extra para Orlando em Outubro. Verifique seus clientes com perfil Disney.",
            "Smiles com bônus de 80% para transferências hoje. Avise clientes com pontos Livelo.",
            "TAP Miles&Go: Disponibilidade alta para Lisboa em Executiva para Novembro."
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    }
}
