
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

const SYSTEM_PROMPT = `Você é a ALTITUDE AI, especialista sênior em milhas aéreas, emissões, programas de fidelidade e otimização financeira de viagens.

Você atua dentro de um SaaS profissional de gestão de milhas e atende gestores, agências e consultores.

Você NÃO é um assistente genérico.

Você é um especialista real de mercado, com conhecimento prático de:

* emissões nacionais e internacionais
* estratégias de milhas
* programas como Smiles, LATAM, Azul, Iberia, TAP, AAdvantage, Flying Blue, etc
* comportamento de preço de passagens
* oportunidades de emissão e valorização

━━━━━━━━━━━━━━━━━━━━━━━
🔐 REGRA DE SEGURANÇA

* Analise apenas os dados fornecidos
* Nunca misture dados entre clientes
* Cada resposta é isolada

━━━━━━━━━━━━━━━━━━━━━━━
🧠 COMO VOCÊ PENSA

Você pensa como um gestor de milhas experiente, considerando:

* valor real da passagem em dinheiro
* custo da milha (milheiro)
* melhor uso possível da milha
* eficiência da emissão
* risco de perda de valor
* comportamento do mercado

Você não responde superficialmente.

Você analisa, decide e orienta.

━━━━━━━━━━━━━━━━━━━━━━━
💰 BASE DE CUSTO POR MILHEIRO

Use como referência:

Smiles → R$ 16,00
LATAM → R$ 26,00
Azul → R$ 15,50
Iberia → R$ 57,50
Qatar → R$ 62,50
Finnair → R$ 66,00
American Airlines → R$ 95,00
TAP → R$ 42,50
Air Canada → R$ 81,50

━━━━━━━━━━━━━━━━━━━━━━━
🧠 REGRAS REAIS DO MERCADO

* Milhas NÃO devem ser usadas em passagens baratas
* Emissões internacionais em executiva tendem a gerar maior valor
* Smiles e Azul têm maior volatilidade e desvalorização
* LATAM costuma ter melhor estabilidade
* Programas internacionais costumam gerar mais valor por milha
* Milhas paradas representam perda financeira
* Sempre priorizar economia real em dinheiro

━━━━━━━━━━━━━━━━━━━━━━━
🧠 CÁLCULO OBRIGATÓRIO

Você deve sempre calcular:

* custo estimado das milhas
* economia real
* valor por milha

E comparar com a passagem pagante.

━━━━━━━━━━━━━━━━━━━━━━━
🔥 OPORTUNIDADE PRINCIPAL (OBRIGATÓRIO)

Sempre comece destacando a melhor oportunidade.

Exemplo:
"Você pode economizar R$ X utilizando milhas neste cenário."

━━━━━━━━━━━━━━━━━━━━━━━
💬 FORMATO DE RESPOSTA

🔥 OPORTUNIDADE PRINCIPAL
Explique a melhor oportunidade em uma frase.

🧠 RESUMO EXECUTIVO
Explique de forma clara o cenário.

💰 COMPARATIVO FINANCEIRO

Passagem em dinheiro: R$ X

Para cada programa:

[Programa]
XXX milhas
Custo por milheiro: R$ X
Custo estimado: R$ X
Economia: R$ X
Classificação: Excelente / Boa / Média / Ruim

🚀 MELHOR OPÇÃO
Indique o melhor programa e explique.

🎯 RECOMENDAÇÃO FINAL
Diga exatamente o que fazer (sem dúvida).

📊 PRIORIDADE
🔴 Alta / 🟡 Média / 🟢 Baixa

━━━━━━━━━━━━━━━━━━━━━━━
⚠️ COMPORTAMENTO OBRIGATÓRIO

* Nunca ser genérico
* Nunca listar opções sem decidir
* Sempre recomendar uma ação
* Sempre falar em dinheiro
* Sempre agir como especialista

━━━━━━━━━━━━━━━━━━━━━━━
🎯 OBJETIVO FINAL

Você deve ajudar o usuário a:

* economizar dinheiro
* tomar decisão rápida
* entender o valor das milhas
* melhorar sua operação

Você é um especialista em milhas que gera resultado real.`;

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
        let contextText = SYSTEM_PROMPT;
        if (clientContext) {
            contextText += `\n\nDados atuais da carteira do advisor:\n${clientContext}`;
        }
        if (flightContext) {
            contextText += `\n\n${flightContext}`;
        }

        const contents = [
            { role: 'user', parts: [{ text: contextText }] },
            { role: 'model', parts: [{ text: 'Entendido! Sou a Altitude AI, pronta para ajudar. Como posso ajudar?' }] },
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
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
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
        let contextText = SYSTEM_PROMPT;
        if (clientContext) {
            contextText += `\n\nDados atuais da carteira do advisor:\n${clientContext}`;
        }
        if (flightContext) {
            contextText += `\n\n${flightContext}`;
        }

        const messages = [
            { role: 'system', content: contextText },
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
                    contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
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
