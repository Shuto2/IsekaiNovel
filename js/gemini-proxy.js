// Node.js v18以降のランタイムを想定しています。

// GitHub PagesのURLに置き換えてください。開発中は '*' でも動作します。
// 例: 'https://your-username.github.io'
const ALLOWED_ORIGIN = '*';

exports.handler = async (event) => {
    // CORSプリフライトリクエストへの対応
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: '',
        };
    }

    // CORSヘッダーをすべてのレスポンスに含める
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Content-Type': 'application/json',
    };

    try {
        // リクエストボディが空またはnullの場合のエラーハンドリングを追加
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'リクエストボディが空です。' }),
            };
        }
        // リクエストボディをパース
        const body = JSON.parse(event.body);
        const { prompt, apiKey } = body;

        if (!prompt || !apiKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'promptとapiKeyは必須です。' }),
            };
        }

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
            }),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Gemini API Error:', errorBody);
            // Geminiからのエラーをそのままフロントに返す
            return {
                statusCode: geminiResponse.status,
                headers,
                body: errorBody,
            };
        }

        const geminiData = await geminiResponse.json();

        // 成功したレスポンスをフロントエンドに返す
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(geminiData),
        };

    } catch (error) {
        console.error('Lambda Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'サーバーで予期せぬエラーが発生しました。', details: error.message }),
        };
    }
};