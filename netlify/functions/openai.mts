// Netlify Function: Proxy seguro para OpenAI API (fallback da Altitude AI)
// A chave fica apenas no servidor, nunca exposta no frontend
// Usa fallback entre modelos para maximizar disponibilidade

const MODELS = [
    'gpt-4o-mini',
    'gpt-3.5-turbo',
];

async function callOpenAI(apiKey: string, model: string, messages: any[], generationConfig: any) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: generationConfig?.temperature ?? 0.7,
            max_tokens: generationConfig?.maxOutputTokens ?? 1024,
        })
    });
    return response;
}

export default async (request: Request) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500, headers });
    }

    try {
        const body = await request.json();
        const { messages, generationConfig } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400, headers });
        }

        // Tentar cada modelo até um funcionar
        for (const model of MODELS) {
            try {
                const response = await callOpenAI(OPENAI_API_KEY, model, messages, generationConfig);

                if (response.ok) {
                    const data = await response.json();
                    return new Response(JSON.stringify(data), { status: 200, headers });
                }

                // Se não for rate limit, retornar o erro
                if (response.status !== 429) {
                    const data = await response.json();
                    return new Response(JSON.stringify({ error: 'OpenAI API error', details: data }), { status: response.status, headers });
                }

                // Se for 429, tentar o próximo modelo
                console.log(`Model ${model} rate limited, trying next...`);
            } catch (e) {
                console.log(`Model ${model} failed, trying next...`);
            }
        }

        // Todos os modelos falharam
        return new Response(JSON.stringify({ error: 'All OpenAI models rate limited. Please try again.' }), { status: 429, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

export const config = {
    path: "/api/openai"
};
