// image-proxy.js (Replicate/Stable Diffusion用 Lambda関数)

// Node.js 18.x以降のランタイムではfetchが標準で利用可能
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
// Replicate上のStable Diffusion XLモデルのバージョンID
const STABLE_DIFFUSION_MODEL_VERSION = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

// ユーティリティ：指定時間待機する関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.handler = async (event) => {
    // CORSプリフライト(OPTIONS)とメソッドチェックはLambdaの関数URL設定に任せる
    // ここではPOSTリクエストが来ることだけを期待する
    try {
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) };
        }

        // --- Step 1: 画像生成ジョブをリクエスト ---
        const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: STABLE_DIFFUSION_MODEL_VERSION,
                input: {
                    prompt: prompt,
                    // ネガティブプロンプトで人物の出現を抑制
                    negative_prompt: "person, man, woman, child, people, character, anime, cartoon, signature, watermark, text",
                    width: 1024,
                    height: 576, // 16:9に近い比率
                    num_outputs: 1,
                    guidance_scale: 7.5,
                    num_inference_steps: 25
                },
            }),
        });

        const prediction = await startResponse.json();
        if (startResponse.status !== 201) {
            console.error('Replicate API Error (Step 1):', prediction.detail);
            return { statusCode: 500, body: JSON.stringify({ error: `Failed to start image generation: ${prediction.detail}` }) };
        }

        const predictionUrl = prediction.urls.get;

        // --- Step 2: 生成結果をポーリングして取得 ---
        let finalPrediction = null;
        for (let i = 0; i < 15; i++) { // 最大15回リトライ (約30秒)
            await sleep(2000); // 2秒待機
            const resultResponse = await fetch(predictionUrl, {
                headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
            });
            finalPrediction = await resultResponse.json();

            if (finalPrediction.status === "succeeded") {
                break;
            } else if (finalPrediction.status === "failed" || finalPrediction.status === "canceled") {
                throw new Error(`Image generation failed with status: ${finalPrediction.status}`);
            }
        }

        const imageUrl = finalPrediction?.output?.[0];
        if (!imageUrl) {
            throw new Error('Image generation timed out or returned no output.');
        }

        // --- Step 3: 画像URLから画像データを取得し、Base64に変換 ---
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');

        return {
            statusCode: 200,
            body: JSON.stringify({ image: imageBase64 }),
        };

    } catch (error) {
        console.error('Error in Lambda handler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process image generation', details: error.message }),
        };
    }
};