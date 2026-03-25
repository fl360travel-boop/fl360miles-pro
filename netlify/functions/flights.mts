// Netlify Function: Proxy seguro para SerpAPI — Google Flights
// A chave SERPAPI_KEY fica apenas no servidor, nunca exposta no frontend

const SERPAPI_URL = 'https://serpapi.com/search';

export default async (request: Request) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const SERPAPI_KEY = process.env.SERPAPI_KEY;

    if (!SERPAPI_KEY) {
        return new Response(
            JSON.stringify({ error: 'SerpAPI key not configured', fallback: true }),
            { status: 503, headers }
        );
    }

    try {
        const body = await request.json();
        const {
            origin,
            destination,
            departureDate,
            adults = 1,
            returnDate,
            travelClass = 'ECONOMY',
        } = body;

        if (!origin || !destination || !departureDate) {
            return new Response(
                JSON.stringify({ error: 'Parâmetros obrigatórios: origin, destination, departureDate' }),
                { status: 400, headers }
            );
        }

        // Mapear cabine para o formato SerpAPI
        // 1=Economy, 2=Premium Economy, 3=Business, 4=First
        const cabinMap: Record<string, string> = {
            ECONOMY: '1',
            PREMIUM_ECONOMY: '2',
            BUSINESS: '3',
            FIRST: '4',
        };
        const travelClassCode = cabinMap[travelClass.toUpperCase()] || '1';

        // Montar parâmetros SerpAPI Google Flights
        const params = new URLSearchParams({
            engine: 'google_flights',
            api_key: SERPAPI_KEY,
            departure_id: origin.toUpperCase(),
            arrival_id: destination.toUpperCase(),
            outbound_date: departureDate,  // YYYY-MM-DD
            adults: String(adults),
            travel_class: travelClassCode,
            currency: 'BRL',
            hl: 'pt',
            gl: 'br',
        });

        if (returnDate) {
            params.set('return_date', returnDate);
            params.set('type', '1'); // Round trip
        } else {
            params.set('type', '2'); // One way
        }

        const res = await fetch(`${SERPAPI_URL}?${params.toString()}`);

        if (!res.ok) {
            const err = await res.text();
            console.error('SerpAPI error:', res.status, err);
            return new Response(
                JSON.stringify({ error: 'Erro SerpAPI', fallback: true }),
                { status: res.status, headers }
            );
        }

        const data = await res.json();

        // Extrair as melhores ofertas do resultado
        const rawFlights = [
            ...(data.best_flights || []),
            ...(data.other_flights || []),
        ];

        if (!rawFlights.length) {
            return new Response(
                JSON.stringify({
                    success: true,
                    fallback: false,
                    origin: origin.toUpperCase(),
                    destination: destination.toUpperCase(),
                    departureDate,
                    returnDate: returnDate || null,
                    adults,
                    travelClass,
                    offers: [],
                    totalFound: 0,
                    cheapest: null,
                }),
                { status: 200, headers }
            );
        }

        // Formatar ofertas no padrão do sistema
        const offers = rawFlights.slice(0, 6).map((f: any, i: number) => {
            const price = f.price ?? 0;
            const legs = f.flights || [];
            const firstLeg = legs[0] || {};
            const lastLeg = legs[legs.length - 1] || {};

            const segments = legs.map((leg: any) => ({
                airline: leg.airline || '',
                flightNumber: leg.flight_number || '',
                origin: leg.departure_airport?.id || '',
                destination: leg.arrival_airport?.id || '',
                departureTime: leg.departure_airport?.time || '',
                arrivalTime: leg.arrival_airport?.time || '',
                duration: `${Math.floor((leg.duration || 0) / 60)}h${(leg.duration || 0) % 60}m`,
                cabin: leg.travel_class || travelClass,
                stops: 0,
            }));

            return {
                id: `serpapi-${i}`,
                totalPrice: price,
                currency: 'BRL',
                priceFormatted: `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                seats: f.seats_available ?? null,
                validatingAirline: firstLeg.airline || '',
                airlineLogo: firstLeg.airline_logo || '',
                segments,
                oneWay: !returnDate,
                duration: f.total_duration
                    ? `${Math.floor(f.total_duration / 60)}h${f.total_duration % 60}m`
                    : '',
                stops: Math.max(0, legs.length - 1),
                layovers: (f.layovers || []).map((l: any) => l.name || ''),
            };
        });

        // Ordenar por preço
        offers.sort((a: any, b: any) => a.totalPrice - b.totalPrice);

        return new Response(
            JSON.stringify({
                success: true,
                fallback: false,
                origin: origin.toUpperCase(),
                destination: destination.toUpperCase(),
                departureDate,
                returnDate: returnDate || null,
                adults,
                travelClass,
                offers,
                totalFound: offers.length,
                cheapest: offers[0] || null,
            }),
            { status: 200, headers }
        );
    } catch (error: any) {
        console.error('SerpAPI proxy error:', error);
        return new Response(
            JSON.stringify({ error: 'Erro interno no proxy de voos', fallback: true }),
            { status: 500, headers }
        );
    }
};

export const config = {
    path: '/api/flights',
};
