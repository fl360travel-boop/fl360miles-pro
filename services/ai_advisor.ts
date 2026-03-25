
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

const GEMINI_PROXY_URL = '/api/gemini';
const OPENAI_PROXY_URL = '/api/openai';

const SYSTEM_PROMPT = `Você é um especialista sênior em gestão de milhas aéreas e emissão estratégica da FL360 Travel. MODO ESPECIALISTA ATIVO: Você não apenas responde, você melhora a decisão do cliente.

━━━━━━━━━━━━━━━━━━━━━━━
🔥 MISSÃO:
Transformar qualquer dado em análise inteligente, economia clara e recomendação direta. Você é um consultor estratégico, não um assistente de busca.

━━━━━━━━━━━━━━━━━━━━━━━
✈️ EXTRAÇÃO E LEITURA:
Interprete textos, prints ou dados soltos. Identifique: Origem/Destino, Data, Companhia e Valor Cia. Se faltar algo, assuma o cenário mais provável e sinalize.

━━━━━━━━━━━━━━━━━━━━━━━
💰 CÁLCULO E OTIMIZAÇÃO:
- Calcule Economia R$ e Economia %.
- ANALISE SEMPRE: Existe rota melhor? Aeroporto alternativo? Horário mais barato?
- Sugira pelo menos 1 alternativa mais inteligente (ou afirme se a atual for a melhor).

━━━━━━━━━━━━━━━━━━━━━━━
📊 FORMATO DE RESPOSTA (ESTRUTURA OBRIGATÓRIA):

✈️ Trecho: [Origem] -> [Destino]
📅 Data: [Data]
🕒 Horário: [Horário]
⏱️ Duração: [Conexões]

💰 Valor companhia aérea: R$ [Valor]
💳 Valor estratégia FL360: R$ [Custo total]
💸 Economia gerada: R$ [Valor]
📉 Economia percentual: [X]%

🚀 Análise estratégica:
(Explique a economia via Smiles, LATAM, Inter, etc. Use: "Neste cenário, a estratégia mais eficiente é...")

🔥 Oportunidade / Alternativa:
(Sugira 1 rota/opção melhor. Use: "O melhor caminho, considerando custo e disponibilidade, é...")

⚠️ Observação estratégica:
(Ex: "Tarifa instável", "Disponibilidade muda rápido", "O erro mais comum aqui seria...")

📌 Recomendação direta:
(Vale emitir agora / Vale aguardar / Melhor pagar em dinheiro / Melhor usar milhas)

━━━━━━━━━━━━━━━━━━━━━━━
🧠 INTELIGÊNCIA DE EMISSÃO (REFERÊNCIA):
Smiles: 16 | LATAM: 26 | Azul: 15,5 | TAP: 42,5 | Iberia: 57,5 | AAdvantage: 95.
Regras: Milhas em executiva internacional = maior ROI. Sempre busque maximizar o valor.

━━━━━━━━━━━━━━━━━━━━━━━
🔐 SEGURANÇA:
Analise apenas dados contextuais fornecidos. Respostas isoladas por sessão.`;

export class AIAdvisorService {

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Chat com suporte a multi-provedor e fallback automático
     * @param flightContext - Dados reais de voos do Amadeus (opcional)
     */
    static async chat(
        userMessage: string,
        history: ChatMessage[],
        clientContext?: string,
        flightContext?: string
    ): Promise<string> {
        // Tentar Gemini primeiro (mais custo-eficiente)
        try {
            const result = await this.callGemini(userMessage, history, clientContext, flightContext);
            if (result) return result;
        } catch (e) {
            console.warn('Gemini falhou, tentando OpenAI...', e);
        }

        // Fallback para OpenAI
        try {
            return await this.callOpenAI(userMessage, history, clientContext, flightContext);
        } catch (e) {
            console.error('Ambos os provedores de IA falharam:', e);
            return '❌ Ocorreu um erro temporário em todos os nossos sistemas de IA. Por favor, tente novamente em alguns instantes.';
        }
    }

    private static async callGemini(
        userMessage: string,
        history: ChatMessage[],
        clientContext?: string,
        flightContext?: string
    ): Promise<string> {
        let fullSystemPrompt = SYSTEM_PROMPT;
        if (clientContext) {
            fullSystemPrompt += `\n\n[CONTEXTO DO CLIENTE]:\n${clientContext}`;
        }
        if (flightContext) {
            fullSystemPrompt += `\n\n[DADOS REAIS DE VOOS AMADEUS]:\n${flightContext}`;
        }

        const contents = [
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
            const response = await fetch(GEMINI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    system_instruction: {
                        parts: [{ text: fullSystemPrompt }]
                    },
                    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Gemini Error: ${response.status}`);

            const data = await response.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error: any) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    private static async callOpenAI(
        userMessage: string,
        history: ChatMessage[],
        clientContext?: string,
        flightContext?: string
    ): Promise<string> {
        let fullSystemPrompt = SYSTEM_PROMPT;
        if (clientContext) {
            fullSystemPrompt += `\n\n[CONTEXTO DO CLIENTE]:\n${clientContext}`;
        }
        if (flightContext) {
            fullSystemPrompt += `\n\n[DADOS REAIS DE VOOS AMADEUS]:\n${flightContext}`;
        }

        const messages = [
            { role: 'system', content: fullSystemPrompt },
            ...history.map(h => ({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.parts[0].text
            })),
            { role: 'user', content: userMessage }
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
            const response = await fetch(OPENAI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`OpenAI Error: ${response.status}`);

            const data = await response.json();
            return data?.choices?.[0]?.message?.content || '';
        } catch (error: any) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // Gerar insight estratégico com fallback
    static async getStrategicInsight(clientContext?: string): Promise<string> {
        const prompt = `Gere UM insight curto e útil (máximo 2 frases) sobre o mercado de milhas aéreas brasileiro hoje. Seja específico e prático.`;
        
        try {
            // Tentar Gemini
            const response = await fetch(GEMINI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    system_instruction: {
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    generationConfig: { temperature: 0.9, maxOutputTokens: 256 }
                })
            });
            if (response.ok) {
                const data = await response.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Mercado de milhas em movimento.';
            }
        } catch (e) {
            console.warn('Insight Gemini falhou, tentando OpenAI...');
        }

        try {
            // Fallback OpenAI
            const response = await fetch(OPENAI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: prompt }
                    ],
                    generationConfig: { temperature: 0.9, maxOutputTokens: 256 }
                })
            });
            if (response.ok) {
                const data = await response.json();
                return data?.choices?.[0]?.message?.content || 'Mercado de milhas em movimento.';
            }
        } catch (e) {
            return '📊 Mercado de milhas em movimento. Conecte a IA para insights em tempo real.';
        }

        return '📊 Mercado de milhas em movimento.';
    }

    // Análise local de portfólio (mantida igual)
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
