// Netlify Function: Proxy seguro para Google Gemini API
// A chave fica apenas no servidor, nunca exposta no frontend
// Usa fallback entre modelos para maximizar quota diária

const MODELS = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
];

async function callGemini(apiKey: string, model: string, contents: any, generationConfig: any) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig })
        }
    );
    return response;
}

export default async (request: Request) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), { status: 500, headers });
    }

    try {
        const body = await request.json();
        const { contents, generationConfig } = body;

        // Tentar cada modelo até um funcionar
        for (const model of MODELS) {
            try {
                const response = await callGemini(GEMINI_API_KEY, model, contents, generationConfig);

                if (response.ok) {
                    const data = await response.json();
                    return new Response(JSON.stringify(data), { status: 200, headers });
                }

                // Se não for rate limit, retornar o erro
                if (response.status !== 429) {
                    const data = await response.json();
                    return new Response(JSON.stringify({ error: 'Gemini API error', details: data }), { status: response.status, headers });
                }

                // Se for 429, tentar o próximo modelo
                console.log(`Model ${model} rate limited, trying next...`);
            } catch (e) {
                console.log(`Model ${model} failed, trying next...`);
            }
        }

        // Todos os modelos falharam
        return new Response(JSON.stringify({ error: 'All models rate limited. Please try again in a few minutes.' }), { status: 429, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

export const config = {
    path: "/api/gemini"
};
