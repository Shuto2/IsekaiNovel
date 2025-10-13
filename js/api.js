// ======================================================
// api.js — Gemini呼び出し（Lambda経由、安全版）
// ======================================================

// --- Utility: AI出力からJSONを安全に抽出 ---
function extractJsonFromString(text) {
  if (!text) return null;

  const markdownMatch = text.match(/```(json)?\\s*([\\s\\S]*?)\\s*```/);
  if (markdownMatch && markdownMatch[2]) return markdownMatch[2].trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

// callGemini for Pages (client-side)
async function callGemini(prompt) {
  const LAMBDA_ENDPOINT_URL = 'https://0c4kgofpej.execute-api.ap-southeast-2.amazonaws.com/dev'; // ← あなたのAPI GatewayのステージURL

  try {
    const res = await fetch(LAMBDA_ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const text = await res.text();
    console.log("Lambda response text:", text);

    if (!res.ok) {
      let parsed;
      try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
      console.error("Lambda HTTP error:", res.status, parsed);
      // Lambdaからのエラーメッセージをnarrationに設定
      const errorMessage = parsed.error || (typeof parsed === 'string' ? parsed : `API呼び出し失敗: ${res.status}`);
      return `{ "narration": "${errorMessage}", "character_reactions": [] }`;
    }

    // Lambdaからのレスポンスボディは、フロントエンドが期待するJSON文字列そのもの
    // そのまま返せば良い
    return text || '{}';

  } catch (e) {
    console.error("Fetch error:", e);
    const errorMessage = `APIへの接続に失敗しました: ${e.message}`;
    return `{ "narration": "${errorMessage}", "character_reactions": [] }`;
  }
}

// ======================================================
// 以下、既存関数からcallGeminiを呼び出して利用
// ======================================================

async function generateEpisodeSummary(project, episode) {
  const history = episode.turns.map(turn => {
    let turnText = '';
    if (turn.player_input) {
      if (turn.player_input.action) turnText += turn.player_input.action + '\\n';
      if (turn.player_input.speech) turnText += `「${turn.player_input.speech}」\\n`;
      if (turn.player_input.thought) turnText += `（${turn.player_input.thought}）\\n`;
    }
    if (turn.ai_output?.sequence) {
      turn.ai_output.sequence.forEach(item => {
        if (item.type === 'narration' && item.content) turnText += item.content + '\\n';
        if (item.type === 'reaction' && item.speech) turnText += `${item.character_name}「${item.speech}」\\n`;
      });
    }
    return turnText;
  }).join('\\n');

  const prompt = `
あなたは優秀な編集者です。以下の小説の本文を読み、100文字程度の簡潔で魅力的なあらすじを作成してください。

# 小説本文
${history}

# あなたへの指示
- 出力はあらすじの文章のみにしてください。
- JSON形式や見出しは不要です。
`;

  const summary = await callGemini(prompt);
  return summary.replace(/```/g, '').replace(/json/g, '').trim();
}


async function generateAiResponse(project, episode, turn) {
    // ターンがAIの応答を生成する対象のターン自身を含まないように履歴を作成
    const historyTurns = episode.turns.filter(t => t.id !== turn.id);
    const history = historyTurns.map(t => {
        let p_input = '';
        if (t.player_input?.action) p_input += `[行動] ${t.player_input.action}\n`;
        if (t.player_input?.speech) p_input += `[発言] 「${t.player_input.speech}」\n`;
        if (t.player_input?.thought) p_input += `[心の声] (${t.player_input.thought})\n`;
        if (t.player_input?.system) p_input += `【System】 ${t.player_input.system}\n`;

        let ai_output = '';
        if (t.ai_output?.sequence) {
            ai_output += t.ai_output.sequence.map(item => {
                if (item.type === 'narration') return item.content;
                if (item.type === 'reaction') return `${item.character_name}「${item.speech}」`;
                return '';
            }).join('\n');
        }
        const turnText = [p_input, ai_output].filter(Boolean).join('\n');
        return turnText.trim() ? turnText : null;
    }).filter(Boolean).join('\n\n---\n\n');

    const currentPlayerInput = (() => {
        if (!turn.player_input || Object.keys(turn.player_input).length === 0) {
            return '（プレイヤーからの具体的な入力はありません。物語を自然に進めてください）';
        }
        return Object.entries(turn.player_input).map(([key, value]) => {
                if (key === 'speech') return `[発言] 「${value}」`;
                if (key === 'thought') return `[心の声] (${value})`;
                if (key === 'system') return `【System】 ${value}`;
                if (key === 'action') return `[行動] ${value}`;
                return `[${key}] ${value}`;
            }).join('\n');
    })();


    const perspectiveSetting = project.ai_settings?.perspective || 'third';
    let perspectiveInstruction = 'あなたはライトノベル作家です。以下の設定とこれまでの物語の展開に基づき、物語を三人称視点で生成してください。';
    if (perspectiveSetting === 'first') {
        const pronoun = project.protagonist?.pronoun;
        if (pronoun) {
            perspectiveInstruction = `あなたは主人公本人です。物語を主人公の一人称視点（「${pronoun}」）で記述してください。`;
        } else {
            perspectiveInstruction = `あなたは主人公本人です。物語を主人公の一人称視点で記述してください。一人称は文脈に応じて「俺」「私」などを適切に使い分けてください。`;
        }
    }

    const prompt = `${perspectiveInstruction}

# 世界設定
${project.world || '一般的なファンタジー世界'}

# 主人公設定
${project.protagonist?.desc || '設定なし'}

# このエピソードに登場する人物
${
    (() => {
        if (!episode.activeCharacters || episode.activeCharacters.length === 0) {
            return '設定なし';
        }

        // project.characters はオブジェクトの配列
        const projectChars = project.characters || [];

        // 登場人物リストから、現在アクティブなキャラクターの情報だけを抽出
        return projectChars
            .filter(char => episode.activeCharacters.includes(char.name))
            .map(char => `${char.name}: ${char.description}`) // "名前: 説明" の形式に変換
            .join('\n') || '設定なし';
    })()
}
# これまでのあらすじ${
    (() => {
        const episodeIndex = project.episodes.findIndex(e => e.id === episode.id);
        return project.episodes
            .filter((ep, index) => index < episodeIndex && ep.summary)
            .map((ep, index) => `## 第${index + 1}話のあらすじ\n${ep.summary}`)
            .join('\n\n')
            || 'まだありません';
    })()
}

# 物語の直近の展開
${history || '（物語の始まり）'}

# プレイヤーの今回の入力
${currentPlayerInput}

# 文字数設定
${(() => {
    const length = parseInt(ui.lengthControlSlider.value, 10);
    if (length <= 100) {
        return `・物語の描写（narration）を約${length}文字程度の非常に短い文章にしてください。`;
    } else if (length >= 800) {
        return `・物語の描写（narration）を約${length}文字程度の非常に長い文章で、詳細に記述してください。`;
    }
    return `・物語の描写（narration）を約${length}文字程度の標準的な長さで記述してください。`;
})()}

# あなたへの指示
- プレイヤーからの【System】指示は、物語のルールや今後の展開に対する絶対的な命令です。必ずその指示に従って物語を進行させてください。
- プレイヤーの入力に対する自然な結果を物語として描写してください。
- 出力は必ず以下のJSON形式の文字列に従ってください。
- narration: 状況や風景の描写、キャラクターの行動の結果などを記述します。
- character_reactions: 登場人物が何か発言する場合に、そのキャラクター名とセリフを配列で記述します。誰も発言しない場合は空配列 [] にしてください。
- system_question: プレイヤーに物語の進行に必要な設定を尋ねる場合、ここに質問を記述します。質問がない場合はnullにしてください。

**重要: あなたの応答は、解説や前置きを一切含まず、上記のJSONオブジェクトから始まる必要があります。**
例:
{
  "narration": "部屋の中は静まり返っていた…",
  "character_reactions": [
    { "character_name": "Character A", "speech": "やっと来たのね" }
  ],
  "system_question": null
}
`;

    const aiResponseText = await callGemini(prompt);
    let aiOutput = {};
    try {
        const cleanJsonString = extractJsonFromString(aiResponseText);
        aiOutput = JSON.parse(cleanJsonString);
    } catch(e) {
        console.error("Failed to parse AI JSON response:", e, "Original response was:", aiResponseText);
        aiOutput = { narration: "AIからの応答を解析できませんでした。", character_reactions: [] };
    }

    const sequence = [];
    if (aiOutput.narration) {
        const narration = aiOutput.narration || '';
        const allLines = narration.split('\n').filter(line => line.trim() !== '');
        const reactionRegex = /^(.*?)「(.*?)」$/;

        allLines.forEach(line => {
            const match = line.match(reactionRegex);
            if (match) {
                sequence.push({ type: 'reaction', character_name: match[1].trim(), speech: match[2].trim() });
            } else {
                sequence.push({ type: 'narration', content: line });
            }
        });
    }
    if (aiOutput.character_reactions) {
        const reactions = aiOutput.character_reactions || [];
        reactions.forEach(r => {
            sequence.push({ type: 'reaction', ...r });
        });
    }
    aiOutput.sequence = sequence;

    turn.ai_output = aiOutput;
    project.lastUpdated = new Date().toISOString();
    saveDB();

    ui.globalLoadingOverlay.style.display = 'none';
    renderEpisodeEditor();
}

async function regenerateAiResponse(project, episode, turn) {
    const history = episode.turns
        .filter(t => t.id !== turn.id)
        .map(t => {
            let p_input = '';
            if (t.player_input?.action) p_input += `[行動] ${t.player_input.action}\n`;
            if (t.player_input?.speech) p_input += `[発言] 「${t.player_input.speech}」\n`;
            return p_input;
        }).join('\n\n---\n\n');

    const prompt = `あなたはライトノベル作家です。以下の物語の展開とプレイヤーの入力に基づき、物語の描写を**以前とは異なる表現で**生成してください。

# これまでの物語
${history}

# プレイヤーの入力
[${Object.keys(turn.player_input)[0]}] ${Object.values(turn.player_input)[0]}

# あなたへの指示
- narration（物語の描写）を、以前とは異なる、より創造的な表現で書き直してください。
- 出力は必ず以下のJSON形式の文字列に従ってください。

例:
{
  "narration": "部屋はしんと静まりかえり、窓から差し込む月光だけが床を照らしていた。",
  "character_reactions": [
    { "character_name": "Character A", "speech": "待ちくたびれたわ" }
  ],
  "system_question": null
}
`;

    const aiResponseText = await callGemini(prompt);
    let aiOutput = {};
    try {
        const cleanJsonString = extractJsonFromString(aiResponseText);
        aiOutput = JSON.parse(cleanJsonString);
    } catch(e) {
        console.error("Failed to parse AI JSON response:", e, "Original response was:", aiResponseText);
        aiOutput = { narration: "AIからの応答を解析できませんでした。", character_reactions: [] };
    }

    const sequence = [];
    if (aiOutput.narration) {
        const narration = aiOutput.narration || '';
        const allLines = narration.split('\n').filter(line => line.trim() !== '');
        const reactionRegex = /^(.*?)「(.*?)」$/;

        allLines.forEach(line => {
            const match = line.match(reactionRegex);
            if (match) {
                sequence.push({ type: 'reaction', character_name: match[1].trim(), speech: match[2].trim() });
            } else {
                sequence.push({ type: 'narration', content: line });
            }
        });
    }
    if (aiOutput.character_reactions) {
        const reactions = aiOutput.character_reactions || [];
        reactions.forEach(r => {
            sequence.push({ type: 'reaction', ...r });
        });
    }
    aiOutput.sequence = sequence;

    turn.ai_output = aiOutput;
    project.lastUpdated = new Date().toISOString();
    saveDB();

    ui.globalLoadingOverlay.style.display = 'none';
}
