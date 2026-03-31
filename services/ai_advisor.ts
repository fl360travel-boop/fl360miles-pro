
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

// ── Configuração de Resiliência ──
const MAX_RETRIES = 3;
const BASE_TIMEOUT_MS = 25000;  // 25s (aumentado de 15s)
const RETRY_DELAY_BASE_MS = 1500; // 1.5s → 3s → 4.5s

const SYSTEM_PROMPT = `Você é um ESPECIALISTA DE ELITE em milhas aéreas, consultor profissional de emissão e gestor de mercado da FL360 Travel. MODO ESPECIALISTA RIGOROSO ATIVO.
Sua missão é auxiliar clientes e gestores em tempo real com orçamentos, emissões e estratégias de economia, transmitindo segurança, clareza, precisão e autoridade. Você NÃO é um assistente genérico.

━━━━━━━━━━━━━━━━━━━━━━━
1. REGRA ZERO (CRÍTICA E INEGOCIÁVEL):
- NUNCA invente dados, rotas inexistentes, valores irreais ou disponibilidade de assentos.
- NUNCA assuma disponibilidade garantida sem alertar que é uma estimativa sujeita a validação.
- NUNCA dê respostas vagas, genéricas, suposições sem base ou recomendações sem lógica.
- EVITE "talvez" ou "depende". Se não tiver certeza absoluta de um valor, informe CLARAMENTE que é uma estimativa e sugira validação antes da emissão.

━━━━━━━━━━━━━━━━━━━━━━━
2. FOCO ESTRATÉGICO:
- Priorize SEMPRE a economia real para o cliente ("Qual é a melhor forma desse cliente economizar e viajar melhor?").
- Sugira a melhor emissão possível e apresente raciocínio claro.
- Compare diretamente as opções (milhas vs dinheiro).
- Considere o tempo real: variação de disponibilidade, mudança de preços e necessidade de agir rápido.

━━━━━━━━━━━━━━━━━━━━━━━
3. CONHECIMENTO APLICADO E INTELIGÊNCIA:
Aja demonstrando domínio profundo sobre:
- Programas de milhas (Smiles, LATAM Pass, TudoAzul, etc.) e emissões nacionais/internacionais.
- Parceiros globais (Star Alliance, SkyTeam, OneWorld).
- Táticas avançadas: Stopover, otimização de conexões, fuga de sobretaxas, regras de tarifação, classes de cabines.
- Custos de referência FL360 (para cálculo): Smiles ~R$16 | LATAM ~R$26 | Azul ~R$15,5 | TAP ~R$42,5 | Iberia ~R$57,5 | AAdvantage ~R$95.
- Regra de ouro: Milhas em executiva internacional = maior ROI. Sempre busque maximizar o valor dos pontos.

━━━━━━━━━━━━━━━━━━━━━━━
4. FORMATO DE RESPOSTA OBRIGATÓRIO:
Para qualquer solicitação de pesquisa, orçamento ou análise, você DEVE estruturar a sua resposta exatamente neste formato estruturado:

1. Melhor opção sugerida: [Detalhe a emissão, programa, rota, cia aérea e valor estimado]
2. Alternativa (se houver): [Detalhe uma 2ª opção, ex: via conexão ou outro programa]
3. Economia estimada: [X% ou R$ Y em relação ao custo em dinheiro vivo]
4. Estratégia utilizada: [Ex: uso de tabela fixa com parceiro internacional, técnica adotada]
5. Observações importantes: [Avisos de disponibilidade, taxas extras, variação de preços, urgência de compra]

━━━━━━━━━━━━━━━━━━━━━━━
5. LINGUAGEM E TOM:
- Tom profissional, claro e objetivo.
- Sem jargões técnicos desnecessários para o cliente.
- Sem informalidade excessiva.
- Focado na tomada de decisão imediata e segura.`;

export class AIAdvisorService {

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Delay helper for retry backoff
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Single fetch with timeout — reusable helper
     */
    private static async fetchWithTimeout(
        url: string,
        options: RequestInit,
        timeoutMs: number = BASE_TIMEOUT_MS
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Chat com suporte a multi-provedor, fallback automático e retry com backoff
     * NUNCA retorna mensagem de erro fatal — sempre tenta degradar graciosamente
     */
    static async chat(
        userMessage: string,
        history: ChatMessage[],
        clientContext?: string,
        flightContext?: string
    ): Promise<string> {
        const errors: string[] = [];

        // ── Tentativa 1: Gemini (com retries) ──
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await this.callGemini(userMessage, history, clientContext, flightContext);
                if (result) return result;
            } catch (e: any) {
                const errorMsg = e?.message || 'unknown';
                errors.push(`Gemini attempt ${attempt}: ${errorMsg}`);
                console.warn(`[Altitude AI] Gemini tentativa ${attempt}/${MAX_RETRIES} falhou: ${errorMsg}`);

                // Se for timeout ou rate limit, esperar antes de tentar novamente
                if (attempt < MAX_RETRIES) {
                    const delayMs = RETRY_DELAY_BASE_MS * attempt;
                    console.log(`[Altitude AI] Aguardando ${delayMs}ms antes de tentar novamente...`);
                    await this.delay(delayMs);
                }
            }
        }

        // ── Tentativa 2: OpenAI fallback (com retries) ──
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await this.callOpenAI(userMessage, history, clientContext, flightContext);
                if (result) return result;
            } catch (e: any) {
                const errorMsg = e?.message || 'unknown';
                errors.push(`OpenAI attempt ${attempt}: ${errorMsg}`);
                console.warn(`[Altitude AI] OpenAI tentativa ${attempt}/${MAX_RETRIES} falhou: ${errorMsg}`);

                if (attempt < MAX_RETRIES) {
                    const delayMs = RETRY_DELAY_BASE_MS * attempt;
                    await this.delay(delayMs);
                }
            }
        }

        // ── Degradação graciosa — NUNCA mostrar erro genérico ──
        console.error('[Altitude AI] Todas as tentativas falharam:', errors);

        // Retornar resposta contextual de fallback em vez de erro
        return this.buildGracefulFallback(userMessage, clientContext);
    }

    /**
     * Gera uma resposta de fallback inteligente quando a IA está indisponível
     * Ao invés de mostrar erro, dá orientação útil ao usuário
     */
    private static buildGracefulFallback(userMessage: string, clientContext?: string): string {
        const lowerMsg = userMessage.toLowerCase();

        // Detectar tipo de pergunta para dar resposta contextual
        if (lowerMsg.includes('voo') || lowerMsg.includes('passagem') || lowerMsg.includes('gru') || lowerMsg.includes('emiss')) {
            return `⚠️ **Conexão instável — modo offline temporário**

Não consegui acessar os dados em tempo real para esta análise, mas aqui está minha orientação rápida:

📌 **Para emissões com milhas**, lembre-se:
- Smiles: ~R$16/1000 milhas (melhor custo nacional)
- LATAM: ~R$26/1000 milhas
- Azul: ~R$15,50/1000 milhas

💡 **Dica:** Compare o valor da passagem normal com a quantidade de milhas × custo/1000 para ver se vale emitir por milhas ou comprar direto.

🔄 _Envie sua pergunta novamente em alguns instantes para análise completa com dados reais._`;
        }

        if (lowerMsg.includes('client') || lowerMsg.includes('carteira') || lowerMsg.includes('portf')) {
            return `⚠️ **Conexão instável — modo offline temporário**

Não consegui processar a análise completa da sua carteira agora, mas aqui estão ações rápidas:

📌 **Checklist de gestão de carteira:**
1. Verifique milhas próximas ao vencimento (urgência alta)
2. Identifique clientes com saldo alto e sem movimentação (oportunidade)
3. Avalie emissões estratégicas para clientes de aniversário

🔄 _Envie sua pergunta novamente em alguns instantes para análise detalhada com IA._`;
        }

        // Fallback genérico — mas NUNCA dizendo "erro na IA"
        return `⚠️ **Conexão instável — modo offline temporário**

Estou com dificuldade de conexão agora, mas continuo aqui para ajudar.

📌 _Tente enviar sua pergunta novamente em alguns instantes._ A análise completa será processada assim que a conexão estabilizar.

💡 Enquanto isso, você pode consultar seus clientes e movimentações diretamente no painel.`;
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

        const response = await this.fetchWithTimeout(GEMINI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                system_instruction: {
                    parts: [{ text: fullSystemPrompt }]
                },
                generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
            })
        });

        if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

        const response = await this.fetchWithTimeout(OPENAI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages,
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            })
        });

        if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || '';
    }

    // Gerar insight estratégico com fallback e retries
    static async getStrategicInsight(clientContext?: string): Promise<string> {
        const prompt = `Gere UM insight curto e útil (máximo 2 frases) sobre o mercado de milhas aéreas brasileiro hoje. Seja específico e prático.`;
        const fallback = '📊 Mercado de milhas em movimento. Monitore vencimentos e oportunidades de emissão.';

        // Tentar Gemini com retries
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await this.fetchWithTimeout(GEMINI_PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        system_instruction: {
                            parts: [{ text: SYSTEM_PROMPT }]
                        },
                        generationConfig: { temperature: 0.9, maxOutputTokens: 256 }
                    })
                }, 15000);

                if (response.ok) {
                    const data = await response.json();
                    return data?.candidates?.[0]?.content?.parts?.[0]?.text || fallback;
                }
            } catch (e) {
                console.warn(`[Altitude AI] Insight Gemini tentativa ${attempt} falhou`);
                if (attempt < 2) await this.delay(1000);
            }
        }

        // Fallback OpenAI com retries
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await this.fetchWithTimeout(OPENAI_PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: prompt }
                        ],
                        generationConfig: { temperature: 0.9, maxOutputTokens: 256 }
                    })
                }, 15000);

                if (response.ok) {
                    const data = await response.json();
                    return data?.choices?.[0]?.message?.content || fallback;
                }
            } catch (e) {
                console.warn(`[Altitude AI] Insight OpenAI tentativa ${attempt} falhou`);
                if (attempt < 2) await this.delay(1000);
            }
        }

        return fallback;
    }

    // Análise local de portfólio (sem dependência de API)
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
