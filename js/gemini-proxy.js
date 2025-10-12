// Node.js v18以降のランタイムを想定しています。
const ALLOWED_ORIGIN = '*';

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // CORSプリフライトリクエスト(OPTIONS)への対応
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'リクエストボディが空です。' }),
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message, 'Received body:', event.body);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'リクエストボディのJSON解析に失敗しました。' }),
            };
        }

        const { prompt, apiKey } = body;

        if (!prompt || !apiKey) {
            const missing = [];
            if (!prompt) missing.push('prompt');
            if (!apiKey) missing.push('apiKey');
            return { statusCode: 400, headers, body: JSON.stringify({ error: `必須パラメータが不足しています: ${missing.join(', ')}` }) };
        }

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }], role: 'user' }] }),
        });

        const responseBody = await response.text();

        if (!response.ok) {
            console.error('Gemini API Error:', { status: response.status, body: responseBody });
            return {
                statusCode: response.status,
                headers,
                body: responseBody, // Geminiからのエラーをそのまま返す
            };
        }

        return {
            statusCode: 200,
            headers,
            body: responseBody, // Geminiからの成功レスポンスをそのまま返す
        };

    } catch (error) {
        console.error('Lambda Internal Error:', error.name, error.message, error.stack);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Lambda関数内部で予期せぬエラーが発生しました。', details: error.message }),
        };
    }
};