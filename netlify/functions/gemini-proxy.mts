// Netlify Function: Proxy seguro para Google Gemini API
// A chave fica apenas no servidor, nunca exposta no frontend
// Usa fallback entre modelos para maximizar quota diária

const MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
];

async function callGemini(apiKey: string, model: string, contents: any, generationConfig: any, system_instruction?: any) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig, system_instruction })
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
        const { contents, generationConfig, system_instruction } = body;

        let lastErrorDetails = null;
        let lastErrorStatus = 500;

        // Tentar cada modelo até um funcionar
        for (const model of MODELS) {
            try {
                const response = await callGemini(GEMINI_API_KEY, model, contents, generationConfig, system_instruction);

                if (response.ok) {
                    const data = await response.json();
                    return new Response(JSON.stringify(data), { status: 200, headers });
                }

                // Ler o erro
                let data = {};
                try { data = await response.json(); } catch(e) { data = { text: await response.text() }; }
                
                lastErrorDetails = data;
                lastErrorStatus = response.status;
                console.warn(`[Proxy Gemini] Model ${model} failed with status ${response.status}`, data);

                // Se o erro for do payload (ex: 400 Bad Request), não adianta tentar outro modelo
                if (response.status === 400) {
                     return new Response(JSON.stringify({ error: 'Gemini API Bad Request', details: data }), { status: 400, headers });
                }

                // Demais erros (429 rate limit, 404 model not found, 500 server error, 403 quota) -> Pular p/ próximo
                await new Promise(r => setTimeout(r, 600));
            } catch (e: any) {
                console.warn(`[Proxy Gemini] Network error on model ${model}:`, e?.message);
                lastErrorDetails = { message: e?.message };
                await new Promise(r => setTimeout(r, 600));
            }
        }

        // Todos os modelos falharam
        console.error('[Proxy Gemini] All models exhausted. Last error:', lastErrorDetails);
        return new Response(JSON.stringify({ error: 'All models exhausted', details: lastErrorDetails }), { status: lastErrorStatus, headers });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Internal proxy error', details: error?.message }), { status: 500, headers });
    }
};

export const config = {
    path: "/api/gemini"
};
