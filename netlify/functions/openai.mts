// Netlify Function: Proxy seguro para OpenAI API (fallback da Altitude AI)
// A chave fica apenas no servidor, nunca exposta no frontend
// Usa fallback entre modelos para maximizar disponibilidade

const MODELS = [
    'gpt-4o-mini',
    'gpt-3.5-turbo',
    'gpt-4o'
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

        let lastErrorDetails = null;
        let lastErrorStatus = 500;

        // Tentar cada modelo até um funcionar
        for (const model of MODELS) {
            try {
                const response = await callOpenAI(OPENAI_API_KEY, model, messages, generationConfig);

                if (response.ok) {
                    const data = await response.json();
                    return new Response(JSON.stringify(data), { status: 200, headers });
                }

                // Ler o erro
                let data = {};
                try { data = await response.json(); } catch(e) { data = { text: await response.text() }; }
                
                lastErrorDetails = data;
                lastErrorStatus = response.status;
                console.warn(`[Proxy OpenAI] Model ${model} failed with status ${response.status}`, data);

                // Se o erro for do payload (ex: 400 Bad Request), não adianta tentar outro modelo
                if (response.status === 400) {
                    return new Response(JSON.stringify({ error: 'OpenAI API Bad Request', details: data }), { status: 400, headers });
                }

                await new Promise(r => setTimeout(r, 600));
            } catch (e: any) {
                console.warn(`[Proxy OpenAI] Network error on model ${model}:`, e?.message);
                lastErrorDetails = { message: e?.message };
                await new Promise(r => setTimeout(r, 600));
            }
        }

        // Todos os modelos falharam
        console.error('[Proxy OpenAI] All models exhausted. Last error:', lastErrorDetails);
        return new Response(JSON.stringify({ error: 'All OpenAI models exhausted.', details: lastErrorDetails }), { status: lastErrorStatus, headers });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Internal proxy error', details: error?.message }), { status: 500, headers });
    }
};

export const config = {
    path: "/api/openai"
};
