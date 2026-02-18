
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
    actionUrl?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: [{ text: string }];
}

// Proxy seguro via Netlify Function — a chave fica apenas no servidor
const GEMINI_PROXY_URL = '/api/gemini';

const SYSTEM_PROMPT = `Você é a Altitude AI, a assistente de inteligência artificial premium da FL360 Miles — uma plataforma de gestão de milhas aéreas e pontos de fidelidade.

Seu papel:
- Ajudar o advisor (usuário) a gerenciar a carteira de milhas dos seus clientes
- Dar insights sobre compra, venda, emissão e acúmulo de milhas
- Sugerir estratégias para maximizar o valor das milhas
- Informar sobre promoções, bônus de transferência e oportunidades de mercado
- Analisar dados de clientes quando fornecidos no contexto

Regras:
- Responda SEMPRE em português do Brasil
- Seja concisa, direta e profissional
- Use emojis com moderação para destacar pontos importantes
- Você é entusiasta do mercado de milhas e programas de fidelidade
- Conheça os principais programas: Latam Pass, Smiles (GOL), TudoAzul, Livelo, Esfera, TAP Miles&Go
- Se não souber algo específico, seja honesta e sugira onde buscar a informação
- Nunca invente dados financeiros específicos — use os dados fornecidos no contexto
- Formate respostas com **negrito** para destacar informações importantes`;

export class AIAdvisorService {

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    // Chat com Gemini API
    static async chat(userMessage: string, history: ChatMessage[], clientContext?: string): Promise<string> {

        try {
            // Build context with system prompt and client data
            let contextText = SYSTEM_PROMPT;
            if (clientContext) {
                contextText += `\n\nDados atuais da carteira do advisor:\n${clientContext}`;
            }

            const contents = [
                // System context as first user message
                { role: 'user', parts: [{ text: contextText }] },
                { role: 'model', parts: [{ text: 'Entendido! Sou a Altitude AI, pronta para ajudar com a gestão de milhas. Como posso ajudar?' }] },
                // Chat history
                ...history,
                // Current user message
                { role: 'user', parts: [{ text: userMessage }] }
            ];

            const response = await fetch(GEMINI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error('Gemini API error:', error);
                if (response.status === 429) {
                    return '⏳ Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
                }
                return '❌ Erro ao se comunicar com a IA. Tente novamente em instantes.';
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || 'Desculpe, não consegui gerar uma resposta no momento.';

        } catch (error) {
            console.error('AI Chat error:', error);
            return '❌ Erro de conexão com a IA. Verifique sua internet e tente novamente.';
        }
    }

    // Gerar insight estratégico real usando Gemini
    static async getStrategicInsight(clientContext?: string): Promise<string> {

        try {
            let prompt = `${SYSTEM_PROMPT}\n\nGere UM insight curto e útil (máximo 2 frases) sobre o mercado de milhas aéreas brasileiro hoje. Seja específico e prático. Não use listas, apenas texto corrido.`;
            if (clientContext) {
                prompt += `\n\nContexto da carteira:\n${clientContext}`;
                prompt += `\n\nBaseie o insight nos dados acima se possível.`;
            }

            const response = await fetch(GEMINI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 256,
                    }
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Mercado de milhas em movimento. Fique atento às oportunidades.';
        } catch {
            return '📊 Mercado de milhas em movimento. Conecte a IA para insights em tempo real.';
        }
    }

    // Análise local de portfólio (não precisa de API - roda no browser)
    static analyzePortfolio(clients: Client[]): Opportunity[] {
        const opportunities: Opportunity[] = [];
        const today = new Date();

        clients.forEach(client => {
            const totalMiles = client.programs.reduce((acc, p) => acc + p.balance, 0);

            if (totalMiles > 300000) {
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

            if (client.birthDate) {
                const bDate = new Date(client.birthDate);
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

        return opportunities.sort((a, b) => {
            const map = { 'alta': 3, 'media': 2, 'baixa': 1 };
            return map[b.priority] - map[a.priority];
        });
    }

    // Gerar resumo de clientes para contexto da IA
    static buildClientContext(clients: Client[]): string {
        if (!clients.length) return 'Nenhum cliente cadastrado ainda.';

        const totalClients = clients.length;
        const totalMiles = clients.reduce((acc, c) => acc + c.programs.reduce((a, p) => a + p.balance, 0), 0);
        const programs = new Set<string>();
        clients.forEach(c => c.programs.forEach(p => programs.add(p.name)));

        let ctx = `Resumo: ${totalClients} clientes, ${totalMiles.toLocaleString('pt-BR')} milhas totais.\n`;
        ctx += `Programas: ${Array.from(programs).join(', ')}\n\n`;
        ctx += `Clientes:\n`;

        clients.slice(0, 20).forEach(c => {
            const miles = c.programs.reduce((a, p) => a + p.balance, 0);
            const progsStr = c.programs.map(p => `${p.name}: ${p.balance.toLocaleString('pt-BR')}`).join(', ');
            ctx += `- ${c.name}: ${miles.toLocaleString('pt-BR')} milhas (${progsStr})\n`;
        });

        if (clients.length > 20) {
            ctx += `... e mais ${clients.length - 20} clientes.\n`;
        }

        return ctx;
    }
}
