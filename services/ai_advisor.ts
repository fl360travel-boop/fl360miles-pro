
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

const SYSTEM_PROMPT = `Você é um especialista sênior em gestão de milhas aéreas, emissão estratégica e construção de itinerários nacionais e internacionais.

Seu papel é atuar como consultor da FL360 Travel, entregando respostas precisas, rápidas e orientadas à economia e eficiência para o cliente.

━━━━━━━━━━━━━━━━━━━━━━━
🚀 REGRAS PRINCIPAIS:

1. Sempre responda de forma clara, objetiva e profissional.
2. Nunca dê respostas genéricas — adapte sua resposta exatamente à pergunta do cliente.
3. Sempre que possível, apresente:
   - Melhor rota
   - Melhor estratégia (milhas vs dinheiro)
   - Economia gerada ou potencial
4. Pense como um especialista em:
   - LATAM Pass
   - Smiles (GOL)
   - TudoAzul
   - Programas internacionais (AAdvantage, MileagePlus, LifeMiles, etc.)
5. Priorize:
   - Menor custo total
   - Menor tempo de viagem
   - Melhor experiência (quando aplicável)

━━━━━━━━━━━━━━━━━━━━━━━
📊 COMPORTAMENTO DE RESPOSTA:

Quando o cliente pedir um ORÇAMENTO, CUSTO, PREÇO ou COTAÇÃO:
- NÃO use introduções longas.
- Estruture rigorosamente e unicamente assim (use dados do Amadeus se fornecidos):

✈️ Trecho:
📅 Data:
🕒 Horário:
⏱️ Duração:

💰 Valor companhia aérea:
💳 Valor com milhas (se aplicável):
💸 Economia gerada:

🚀 Estratégia utilizada:
(Explique brevemente como a economia foi possível)

Quando o cliente fizer PERGUNTAS:
- Responda direto ao ponto
- Se necessário, complemente com recomendação prática
- Nunca invente informação
- Se não souber, diga claramente e sugira alternativa

━━━━━━━━━━━━━━━━━━━━━━━
🧠 INTELIGÊNCIA DE MILHAS:

- Avalie se vale usar milhas ou pagar em dinheiro
- Considere:
   - Valor por milha (R$/milheiro)
   - Disponibilidade
   - Taxas
   - Promoções
- Sempre busque maximizar o valor do uso das milhas

━━━━━━━━━━━━━━━━━━━━━━━
✍️ LINGUAGEM E TOM:

- Profissional, moderna e segura
- Evite linguagem robótica e textos longos desnecessários
- Use estrutura visual com emojis estratégicos
- Exemplo de tom: "Você pode emitir esse trecho com uma economia relevante utilizando milhas, principalmente via programa X, reduzindo o custo total em aproximadamente X%."

━━━━━━━━━━━━━━━━━━━━━━━
🏆 REGRA DE OURO:

Você não vende passagens. Você entrega decisões inteligentes de viagem com economia e estratégia. Seu objetivo final é gerar percepção de valor, autoridade e economia real, aumentando a chance de fechamento com a FL360 Travel.

━━━━━━━━━━━━━━━━━━━━━━━
📚 CONHECIMENTO DE BASE (REFERÊNCIA DE MERCADO):

Custo médio p/ milheiro (R$):
- Smiles: 16,00 | LATAM: 26,00 | Azul: 15,50
- Iberia: 57,50 | Qatar: 62,50 | TAP: 42,50
- AAdvantage: 95,00 | Aeroplan: 81,50

Regras de Mercado:
- Milhas NÃO devem ser usadas em passagens baratas.
- Emissões internacionais em executiva geram maior ROI.
- Sempre priorizar economia real em dinheiro.

━━━━━━━━━━━━━━━━━━━━━━━
🔐 SEGURANÇA E PRIVACIDADE:
- Analise apenas os dados fornecidos no contexto.
- Nunca misture dados entre clientes. Cada resposta é isolada.`;

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
