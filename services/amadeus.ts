// Serviço de Voos — FL360 Miles
// Consulta preços reais via Google Flights (SerpAPI) através do proxy Netlify seguro

const AMADEUS_PROXY_URL = '/api/flights';

export interface FlightSearchParams {
    origin: string;          // IATA code, ex: "GRU"
    destination: string;     // IATA code, ex: "JFK"
    departureDate: string;   // YYYY-MM-DD
    adults?: number;
    returnDate?: string;     // YYYY-MM-DD, opcional
    travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    maxResults?: number;
}

export interface FlightSegment {
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    cabin: string;
    stops: number;
}

export interface FlightOffer {
    id: string;
    totalPrice: number;
    currency: string;
    priceFormatted: string;
    seats: number;
    validatingAirline: string;
    segments: FlightSegment[];
    oneWay: boolean;
    lastTicketingDate: string;
}

export interface FlightSearchResult {
    success: boolean;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string | null;
    adults: number;
    travelClass: string;
    offers: FlightOffer[];
    totalFound: number;
    cheapest: FlightOffer | null;
    fallback?: boolean;     // true = Amadeus não disponível, usar estimativas
    error?: string;
}

export class AmadeusService {

    /**
     * Busca ofertas de voo reais no Amadeus
     * Retorna `fallback: true` se credenciais não configuradas ou erro
     */
    static async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        try {
            const response = await fetch(AMADEUS_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: params.origin,
                    destination: params.destination,
                    departureDate: params.departureDate,
                    adults: params.adults ?? 1,
                    returnDate: params.returnDate,
                    travelClass: params.travelClass ?? 'ECONOMY',
                    maxResults: params.maxResults ?? 5,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            // Se Amadeus não está configurado ou falhou, retornar fallback
            if (data.fallback || !data.success) {
                console.warn('[Voos] Fallback ativado:', data.error || 'Sem resultados');
                return { ...data, fallback: true };
            }

            return data as FlightSearchResult;
        } catch (error: any) {
            clearTimeout(timeoutId);
            const isTimeout = error.name === 'AbortError';
            console.error(isTimeout ? '[Voos] Timeout atingido' : '[Voos] Erro na busca:', error);
            
            return {
                success: false,
                fallback: true,
                origin: params.origin,
                destination: params.destination,
                departureDate: params.departureDate,
                returnDate: params.returnDate ?? null,
                adults: params.adults ?? 1,
                travelClass: params.travelClass ?? 'ECONOMY',
                offers: [],
                totalFound: 0,
                cheapest: null,
                error: isTimeout ? 'Tempo de resposta excedido' : 'Serviço de voos indisponível',
            };
        }
    }

    /**
     * Detecta parâmetros de voo a partir de texto livre do usuário
     * Retorna null se não encontrar dados suficientes
     */
    static detectFlightParams(text: string): Partial<FlightSearchParams> | null {
        const params: Partial<FlightSearchParams> = {};

        // 1. Extrair códigos IATA (3 letras maiúsculas)
        const iataPattern = /\b([A-Z]{3})\b/g;
        const iataCodes = [...text.toUpperCase().matchAll(iataPattern)].map(m => m[1]);

        // Palavras comuns de 3 letras que NÃO são IATA e devem ser ignoradas
        const noise = new Set([
            'VOO', 'DE', 'DAS', 'DOS', 'COM', 'SEM', 'POR', 'QUE', 'TEM', 'UM', 'UMA', 
            'BRL', 'USD', 'EUR', 'GBP', 'PDF', 'SIM', 'NAO', 'DIA', 'MES', 'ANO', 
            'PAX', 'FIM', 'VER', 'DA', 'DO', 'NAS', 'NOS', 'PRA', 'PRO'
        ]);
        
        let validIata = iataCodes.filter(c => !noise.has(c));

        // Se houver "PARA" no texto, ele separa a Origem do Destino
        const hasPara = /\bPARA\b/i.test(text);
        
        if (validIata.length >= 2) {
            if (hasPara) {
                // Tentar identificar o que vem antes e depois do "para"
                const parts = text.toUpperCase().split(/\bPARA\b/);
                const before = parts[0];
                const after = parts[1];
                
                const originMatch = before.match(/\b([A-Z]{3})\b/);
                const destMatch = after.match(/\b([A-Z]{3})\b/);
                
                if (originMatch && noise.has(originMatch[1])) {
                    // Se o primeiro match foi "VOO", pegar o próximo
                    const nextMatch = before.match(/\b([A-Z]{3})\b/g);
                    if (nextMatch && nextMatch.length > 1) params.origin = nextMatch[1];
                    else params.origin = validIata.find(c => c !== originMatch[1]);
                } else if (originMatch) {
                    params.origin = originMatch[1];
                }

                if (destMatch) params.destination = destMatch[1];
            }

            // Fallback se a lógica do "para" não funcionou
            if (!params.origin) params.origin = validIata[0];
            if (!params.destination) params.destination = validIata[1];
            
            // Garantir que não são iguais
            if (params.origin === params.destination && validIata.length > 2) {
                params.destination = validIata[2];
            }
        }

        // 2. Extrair Datas
        const currentYear = new Date().getFullYear();
        const dates: string[] = [];

        // Mapeamento de meses
        const monthMap: Record<string, string> = {
            janeiro: '01', jan: '01', fevereiro: '02', fev: '02', março: '03', mar: '03',
            abril: '04', abr: '04', maio: '05', mai: '05', junho: '06', jun: '06',
            julho: '07', jul: '07', agosto: '08', ago: '08', setembro: '09', set: '09',
            outubro: '10', out: '10', novembro: '11', nov: '11', dezembro: '12', dez: '12',
        };

        // DD/MM/YYYY ou DD/MM/YY
        const numericDateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
        for (const match of text.matchAll(numericDateRegex)) {
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            let year = match[3];
            if (year.length === 2) year = `20${year}`;
            dates.push(`${year}-${month}-${day}`);
        }

        // "15 de junho" ou "15 jun"
        const textDateRegex = /(\d{1,2})\s+(?:de\s+)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(?:\s+de\s+(\d{4}))?/gi;
        for (const match of text.matchAll(textDateRegex)) {
            const day = match[1].padStart(2, '0');
            const month = monthMap[match[2].toLowerCase()];
            const year = match[3] || String(currentYear);
            if (month) dates.push(`${year}-${month}-${day}`);
        }

        if (dates.length >= 1) params.departureDate = dates[0];
        if (dates.length >= 2) params.returnDate = dates[1];

        // 3. Passageiros
        const adultsMatch = text.match(/(\d+)\s+(adulto|passageiro|pax|pessoa)/i);
        if (adultsMatch) params.adults = parseInt(adultsMatch[1]);

        // 4. Cabine
        const lowerText = text.toLowerCase();
        if (/business|executiv|exec/i.test(lowerText)) params.travelClass = 'BUSINESS';
        else if (/primeira|first/i.test(lowerText)) params.travelClass = 'FIRST';
        else if (/premium/i.test(lowerText)) params.travelClass = 'PREMIUM_ECONOMY';
        else params.travelClass = 'ECONOMY';

        // Retornar null se não tiver dados mínimos
        if (!params.origin || !params.destination || !params.departureDate) {
            return null;
        }

        return params;
    }

    /**
     * Formata resultados do Amadeus como texto estruturado para o contexto da IA
     */
    static formatForAIContext(result: FlightSearchResult): string {
        if (result.fallback || !result.success || result.offers.length === 0) {
            return '';
        }

        let ctx = `\n\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
        ctx += `✈️ DADOS REAIS DE VOOS (Amadeus API)\n`;
        ctx += `Rota: ${result.origin} → ${result.destination}\n`;
        ctx += `Data ida: ${result.departureDate}`;
        if (result.returnDate) ctx += ` | Volta: ${result.returnDate}`;
        ctx += `\nPassageiros: ${result.adults} adulto(s) | Cabine: ${result.travelClass}\n\n`;

        ctx += `Ofertas encontradas (${result.totalFound}):\n`;

        result.offers.slice(0, 5).forEach((offer, i) => {
            const firstSeg = offer.segments[0];
            const lastSeg = offer.segments[offer.segments.length - 1];
            const stops = offer.segments.length - 1;

            ctx += `\n${i + 1}. ${offer.priceFormatted} — ${offer.validatingAirline || firstSeg.airline}\n`;
            ctx += `   Voo: ${firstSeg.origin} → ${lastSeg.destination}`;
            ctx += stops > 0 ? ` (${stops} escala${stops > 1 ? 's' : ''})` : ` (direto)`;
            ctx += `\n   Saída: ${firstSeg.departureTime} | Chegada: ${lastSeg.arrivalTime}\n`;
            if (offer.seats) ctx += `   Assentos disponíveis: ${offer.seats}\n`;
        });

        if (result.cheapest) {
            ctx += `\n💰 MENOR PREÇO REAL ENCONTRADO: ${result.cheapest.priceFormatted}\n`;
            ctx += `Use este valor como "preço da passagem pagante" para a análise comparativa com milhas.\n`;
        }

        ctx += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

        return ctx;
    }
}
