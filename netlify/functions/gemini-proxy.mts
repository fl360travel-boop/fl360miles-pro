// Netlify Function: Proxy seguro para Google Gemini API
// A chave fica apenas no servidor, nunca exposta no frontend

export default async (request) => {
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

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Gemini API error', details: data }), { status: response.status, headers });
        }

        return new Response(JSON.stringify(data), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

export const config = {
    path: "/api/gemini"
};
