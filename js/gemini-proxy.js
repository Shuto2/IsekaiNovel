// Node.js v18以降のランタイムを想定しています。
const ALLOWED_ORIGIN = '*';

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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

        const { prompt } = body;
        const apiKey = process.env.GEMINI_API_KEY; // 環境変数からAPIキーを取得

        if (!prompt) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `必須パラメータが不足しています: prompt` }) };
        }
        if (!apiKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'サーバー側でAPIキーが設定されていません。' }) };
        }

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        let response;
        try {
            response = await fetch(geminiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }], role: 'user' }] }),
            });
        } catch (fetchError) {
            console.error('Gemini API Fetch Error:', fetchError);
            return {
                statusCode: 502, // Bad Gateway
                headers,
                body: JSON.stringify({ error: 'Gemini APIへの接続に失敗しました。' }),
            };
        }

        const responseText = await response.text();
        let responseBody;

        if (!response.ok) {
            console.error('Gemini API Error:', { status: response.status, body: responseText });
            try {
                responseBody = JSON.parse(responseText);
            } catch (e) {
                responseBody = { error: { message: responseText || '不明なAPIエラー' } };
            }
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: `Gemini APIエラー: ${responseBody.error?.message || '詳細不明'}` }),
            };
        }

        responseBody = JSON.parse(responseText);
        const content = responseBody.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        return {
            statusCode: 200,
            headers,
            body: content, // フロントエンドが欲しいJSON文字列だけを返す
        };

    } catch (error) {
        console.error('Lambda Internal Error:', error.name, error.message, error.stack);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Lambda関数内部で予期せぬエラーが発生しました。' }),
        };
    }
};