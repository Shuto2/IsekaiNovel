// --- DOM Elements ---
const pages = {
  projectList: document.getElementById('project-list-page'),
  projectDetail: document.getElementById('project-detail-page'),
  episodeEditor: document.getElementById('episode-editor-page'),
};

const projectCardsContainer = document.getElementById('project-cards-container');
const episodeCardsContainer = document.getElementById('episode-cards-container');
const chatContainer = document.getElementById('chat-container');

const newProjectBtn = document.getElementById('new-project-btn');
const newEpisodeBtn = document.getElementById('new-episode-btn');
const aiGenerateBtn = document.getElementById('ai-generate-btn');
const footerBackToProjectListBtn = document.getElementById('footer-back-to-project-list');
const importFileInput = document.getElementById('import-file-input');
const sendOnlyBtn = document.getElementById('send-only-btn');

const projectTitleEl = document.getElementById('project-title');
const editProjectTitleBtn = document.getElementById('edit-project-title-btn');
const episodeTitleEl = document.getElementById('episode-title');
const editEpisodeTitleBtn = document.getElementById('edit-episode-title-btn');
const addCharacterBtn = document.getElementById('add-character-btn');
const completeEpisodeBtn = document.getElementById('complete-episode-btn');
const aiSettingsBtn = document.getElementById('ai-settings-btn');
const headerMenuBtn = document.getElementById('header-menu-btn');
const headerMenuPopover = document.getElementById('header-menu-popover');
const manageCharactersBtn = document.getElementById('manage-characters-btn');
const playerInputEl = document.getElementById('player-input');
const inputModeContainer = document.getElementById('input-mode-container');
const mainInputModeBtn = document.getElementById('main-input-mode-btn');
const inputModeOptions = document.getElementById('input-mode-options');
const lengthControlSlider = document.getElementById('length-control-slider');
const lengthValueDisplay = document.getElementById('length-value-display');

// Footer Menu Elements
const footerMenuContainer = document.getElementById('footer-menu-container');
const mainFooterMenuBtn = document.getElementById('main-footer-menu-btn');
const footerMenuOptions = document.getElementById('footer-menu-options');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const apiKeySettingsBtn = document.getElementById('api-key-settings-btn');

// Novel Viewer Elements
const novelViewerOverlay = document.getElementById('novel-viewer-overlay');
const novelContent = document.getElementById('novel-content');
const closeNovelViewerBtn = document.getElementById('close-novel-viewer-btn');
const nextEpisodeBtn = document.getElementById('next-episode-btn');
const globalLoadingOverlay = document.getElementById('global-loading-overlay');

// Settings Modal Elements
const projectSettingsBtn = document.querySelector('.settings-btn');
const settingsModalOverlay = document.getElementById('settings-modal-overlay');
const worldSettingInput = document.getElementById('world-setting-input');
const protagonistSettingInput = document.getElementById('protagonist-setting-input');
const protagonistPronounInput = document.getElementById('protagonist-pronoun-input');
const projectCharacterList = document.getElementById('project-character-list');
const addProjectCharacterBtn = document.getElementById('add-project-character-btn');

// Character Modal Elements
const characterModalOverlay = document.getElementById('character-modal-overlay');
const characterNameInput = document.getElementById('character-name-input');
const characterDescInput = document.getElementById('character-desc-input');
const saveCharacterBtn = document.getElementById('save-character-btn');
const closeCharacterBtn = document.getElementById('close-character-btn');

// Character Management Modal Elements
const characterManagementModalOverlay = document.getElementById('character-management-modal-overlay');
const closeCharacterManagementBtn = document.getElementById('close-character-management-btn');
const characterListPopover = document.getElementById('character-list-popover'); // Re-target to the one in the modal

// AI Settings Modal Elements
const aiSettingsModalOverlay = document.getElementById('ai-settings-modal-overlay');
const perspectiveButtons = document.getElementById('perspective-buttons');
const saveAiSettingsBtn = document.getElementById('save-ai-settings-btn');
const closeAiSettingsBtn = document.getElementById('close-ai-settings-btn');

// Viewer Selection Modal Elements
const viewerSelectionModalOverlay = document.getElementById('viewer-selection-modal-overlay');
const viewerSelectionModal = document.getElementById('viewer-selection-modal');
const viewerSelectionTitle = document.getElementById('viewer-selection-title');
const viewerSelectionContent = document.getElementById('viewer-selection-content');
const closeViewerSelectionBtn = document.getElementById('close-viewer-selection-btn');
const viewerSelectionBackBtn = document.getElementById('viewer-selection-back-btn');

// --- State Management ---
let db = {
  projects: [], // { id, title, episodes: [], world: '', protagonist: {desc: '', pronoun: ''}, characters: '', ai_settings: {perspective: 'third'} }
};
let currentProjectId = null;
let currentEpisodeId = null;
let currentViewingEpisodeId = null; // For novel viewer
let currentInputMode = 'action'; // Default input mode
let viewerSelectionProjectId = null; // For viewer selection modal
let characterModalContext = 'episode'; // 'episode' or 'project'

// --- Utility Functions ---
function extractJsonFromString(text) {
    if (!text) return null;

    const markdownMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
        return markdownMatch[2].trim();
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1).trim();
    }

    return text; 
}

// --- Core Functions (Reverted to be closer to original) ---

function getLocalApiKey() {
  let storedKey = null;
  try {
    storedKey = localStorage.getItem('GG_API_KEY');
  } catch (e) { /* ignore */ }

  if (storedKey) {
    return storedKey;
  }

  return null; // キーがなければnullを返す
}

// Gemini API呼び出し (User's original logic)
async function callGemini(prompt) {
  const apiKey = getLocalApiKey();
  if (!apiKey) {
    const msg = '認証情報がありません。';
    console.error(msg, 'トップページの鍵アイコンからAPIキーを設定してください。');
    alert('APIキーが設定されていません。\nトップページの鍵アイコンから設定してください。');
    return `{ "narration": "生成に失敗しました: ${msg}", "character_reactions": [] }`;
  }

  const endpointBase = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const endpoint = `${endpointBase}?key=${apiKey}`;

  const headers = { 'Content-Type': 'application/json' };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
            role: 'user',
          },
        ],
      }),
    });

    if (!res.ok) {
      let errText = `APIエラー: ${res.status}`;
      try {
        const errJson = await res.json();
        errText += `: ${errJson.error?.message || JSON.stringify(errJson)}`;
      } catch (e) {
        const txt = await res.text();
        if (txt) errText += `: ${txt}`;
      }
      console.error('Gemini API error:', errText);
      return `{ "narration": "API呼び出しに失敗しました: ${errText}", "character_reactions": [] }`;
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  } catch (e) {
    console.error(e);
    return `{ "narration": "生成エラーが発生しました: ${e.message}", "character_reactions": [] }`;
  }
}
async function generateEpisodeSummary(project, episode) {
    // 1. 小説形式のテキストを生成（HTMLタグなし）
    const history = episode.turns.map(turn => {
        let turnText = '';
        // Player's turn
        if (turn.player_input) {
            if (turn.player_input.action) turnText += turn.player_input.action + '\n';
            if (turn.player_input.speech) turnText += `「${turn.player_input.speech}」\n`;
            if (turn.player_input.thought) turnText += `（${turn.player_input.thought}）\n`;
        }
        // AI's turn
        if (turn.ai_output?.sequence) {
            turn.ai_output.sequence.forEach(item => {
                if (item.type === 'narration' && item.content) turnText += item.content + '\n';
                if (item.type === 'reaction' && item.speech) turnText += `${item.character_name}「${item.speech}」\n`;
            });
        }
        return turnText;
    }).join('\n');

    // 2. AIへのプロンプトを作成
    const prompt = `
あなたは優秀な編集者です。以下の小説の本文を読み、100文字程度の簡潔で魅力的なあらすじを作成してください。

# 小説本文
${history}

# あなたへの指示
- 出力はあらすじの文章のみにしてください。
- JSON形式や見出しは不要です。
`;

    // 3. AIを呼び出し
    const summary = await callGemini(prompt);

    // 4. 生成されたあらすじを返す（余計なマークダウンや引用符を削除）
    return summary.replace(/```/g, '').replace(/json/g, '').trim();
}

// --- Data Persistence ---
function saveDB() {
  try {
    localStorage.setItem('isekaiNovelDB', JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

function loadDB() {
  try {
    const savedDB = localStorage.getItem('isekaiNovelDB');
    if (savedDB) {
      db = JSON.parse(savedDB);
    }
  } catch (e) {
    console.error("Failed to load from localStorage", e);
    db = { projects: [] };
  }
}

// --- Page Navigation ---
function showPage(pageId) {
  Object.values(pages).forEach(page => {
    page.style.display = 'none';
  });
  pages[pageId].style.display = 'block';
}

// --- Rendering ---
function renderProjectList() {
  // Remove only project cards, not the "add" button
  projectCardsContainer.querySelectorAll('.card.project-card').forEach(card => card.remove());

  if (!db.projects || db.projects.length === 0) {
      // If there's no message element, create one.
      if (!projectCardsContainer.querySelector('.empty-list-message')) {
          projectCardsContainer.insertAdjacentHTML('afterbegin', '<p class="empty-list-message">プロジェクトがありません。「新しい物語を始める」ボタンから始めましょう。</p>');
      }
      return;
  }

  db.projects.forEach(project => {
    const episodeCount = project.episodes?.length || 0;
    const lastUpdated = project.lastUpdated 
      ? new Date(project.lastUpdated).toLocaleString('ja-JP') 
      : '更新なし';

    const card = document.createElement('div');
    card.className = 'card project-card';
    card.dataset.id = project.id; // カード自体にIDを持たせる
    card.innerHTML = `
      <div class="project-card-title"><h3>${project.title}</h3></div>
      <div class="project-card-details">
        <div class="project-card-meta">
          <p>エピソード数: ${episodeCount}</p>
          <p>最終更新: ${lastUpdated}</p>
        </div>
        <div class="card-actions">
          <button class="export-project-btn card-icon-btn" data-id="${project.id}" title="エクスポート"><span class="material-symbols-outlined">file_download</span></button>
          <button class="delete-project-btn card-icon-btn" data-id="${project.id}" title="削除"><span class="material-symbols-outlined">delete</span></button>
        </div>
      </div>
    `;
    // Insert before the "add" button
    const addButton = projectCardsContainer.querySelector('.add-list-item-btn');
    projectCardsContainer.insertBefore(card, addButton);
  });
}

function renderProjectDetail() {
    const project = db.projects.find(p => p.id === currentProjectId);
    // この関数が呼ばれた時点でプロジェクトIDがなければ、何もせずプロジェクト一覧に戻る
    if (!project) {
        renderProjectList();
        showPage('projectList');
        return;
    }

    projectTitleEl.textContent = project.title;
    // Remove only episode cards, not the "add" button
    episodeCardsContainer.querySelectorAll('.card.episode-card').forEach(card => card.remove());

    if (!project.episodes || project.episodes.length === 0) {
        episodeCardsContainer.innerHTML = '<p>エピソードがありません。「+」ボタンから新しいエピソードを作成しましょう。</p>';
        return;
    }

    project.episodes.forEach((episode, index) => {
        const card = document.createElement('div');
        card.className = 'card episode-card'; // 専用クラスを追加
        card.innerHTML = `
            <div class="card-main-row">
                <h4>第${index + 1}話：${episode.title}</h4>
                <div class="card-actions">
                    <button class="novel-viewer-btn card-icon-btn" data-id="${episode.id}" title="小説を読む"><span class="material-symbols-outlined">menu_book</span></button>
                    <button class="open-episode-btn card-icon-btn" data-id="${episode.id}" title="開く"><span class="material-symbols-outlined">play_arrow</span></button>
                    <button class="delete-episode-btn card-icon-btn" data-id="${episode.id}" title="削除"><span class="material-symbols-outlined">delete</span></button>
                </div>
            </div>
            ${episode.summary ? `<div class="card-summary">${episode.summary}</div>` : ''}
        `;
        // Insert before the "add" button
        const addButton = episodeCardsContainer.querySelector('.add-list-item-btn');
        episodeCardsContainer.insertBefore(card, addButton);
    });
}


function renderEpisodeEditor() {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) {
        showPage('projectDetail');
        return;
    }

    const episodeIndex = project.episodes.findIndex(e => e.id === currentEpisodeId);
    episodeTitleEl.textContent = `第${episodeIndex + 1}話：${episode.title}`;
    chatContainer.innerHTML = '';
    // 文字数を計算して表示
    const charCountEl = document.getElementById('episode-char-count');
    if (charCountEl) {
        const completeBtn = document.getElementById('complete-episode-btn');
        const charCount = countEpisodeCharacters(episode);
        charCountEl.textContent = `${charCount.toLocaleString()}文字`;

        // インジケーターのマーカー位置を更新
        const marker = document.getElementById('indicator-marker');
        if (marker) {
            marker.classList.remove('level-low', 'level-mid', 'level-high');
            if (completeBtn) completeBtn.classList.remove('blinking'); // 点滅クラスをリセット

            if (charCount <= 1999) {
                marker.classList.add('level-low');
            } else if (charCount <= 3000) {
                marker.classList.add('level-mid');
                if (completeBtn) completeBtn.classList.add('blinking'); // 文字数が適切な場合に点滅クラスを追加
            } else {
                marker.classList.add('level-high');
            }
        }
    }
    renderCharacterList(project, episode);

    // 最初の挿入ポイントを追加
    const firstInsertionPoint = createInsertionPoint(-1);
    chatContainer.appendChild(firstInsertionPoint);

    if (!episode.turns || episode.turns.length === 0) {
        // 初回ターンでAIからの質問があればそれを表示
        if (episode.initial_ai_question) {
            const systemQuestion = document.createElement('div');
            systemQuestion.className = 'system-question';
            systemQuestion.innerHTML = `<p><strong>【System】</strong> ${episode.initial_ai_question}</p>`;
            chatContainer.appendChild(systemQuestion);
        }
        return;
    }

    episode.turns.forEach((turn, turnIndex) => {
        if (turn.player_input) {
            // プレイヤーのターン内の各入力を個別のバブルとしてレンダリングする
            Object.entries(turn.player_input).forEach(([inputType, inputValue]) => {
                const typeLabels = {
                    action: '行動',
                    speech: '発言',
                    thought: '心の声',
                    system: 'System'
                };

                // ラベルとバブルをまとめるラッパーを作成
                const turnWrapper = document.createElement('div');
                turnWrapper.className = 'turn-wrapper player-turn';

                // ドロップダウンを作成
                const select = document.createElement('select');
                select.className = 'input-type-dropdown';
                select.dataset.turnId = turn.id;
                select.dataset.inputType = inputType; // どの入力タイプに対応するかを記録

                Object.keys(typeLabels).forEach(key => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = typeLabels[key];
                    if (key === inputType) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });

                // ドロップダウンをラッパーで囲む
                const dropdownWrapper = document.createElement('div');
                dropdownWrapper.className = 'dropdown-wrapper';
                dropdownWrapper.appendChild(select);
                turnWrapper.appendChild(dropdownWrapper);

                // バブル本体を作成
                const playerTurn = document.createElement('div');
                playerTurn.className = 'chat-message player';
                if (inputType === 'system') {
                    playerTurn.classList.add('player-system');
                }
                playerTurn.innerHTML = `
                    <div class="bubble-actions">
                        <button class="bubble-edit-btn" data-turn-id="${turn.id}" data-input-type="${inputType}" title="編集"><span class="material-symbols-outlined">edit</span></button>
                        <button class="bubble-delete-btn" data-turn-id="${turn.id}" data-input-type="${inputType}" title="削除"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                    <div class="bubble-content"><p>${inputValue}</p></div>`;
                turnWrapper.appendChild(playerTurn);
                chatContainer.appendChild(turnWrapper);
            });

            // プレイヤーのターンの後に挿入ポイントを追加
            chatContainer.appendChild(createInsertionPoint(turnIndex));
        }
        if (turn.ai_output) {
            // AIの応答をシーケンスとしてレンダリング
            if (turn.ai_output.sequence) {
                turn.ai_output.sequence.forEach((item, index) => {
                    if (item.type === 'narration' && item.content) {
                        // AIの各バブルの前に挿入ポイントを追加
                        chatContainer.appendChild(createInsertionPoint(turnIndex, index));
                        const turnWrapper = document.createElement('div');
                        turnWrapper.className = 'turn-wrapper ai-turn';
                        turnWrapper.innerHTML = `<div class="ai-type-label">Narration</div>`;

                        const narrationBubble = document.createElement('div');
                        narrationBubble.className = 'chat-message ai';
                        narrationBubble.innerHTML = `
                            <div class="bubble-actions">
                                <button class="bubble-edit-btn" data-turn-id="${turn.id}" data-item-index="${index}" title="編集"><span class="material-symbols-outlined">edit</span></button>
                                <button class="bubble-regenerate-btn" data-turn-id="${turn.id}" title="再生成"><span class="material-symbols-outlined">replay</span></button>
                                <button class="bubble-delete-btn" data-turn-id="${turn.id}" data-item-index="${index}" title="削除"><span class="material-symbols-outlined">delete</span></button>
                            </div>
                            <div class="bubble-content" data-edit-type="narration">
                                <p>${item.content.replace(/\n/g, '<br>')}</p>
                            </div>
                        `;
                        turnWrapper.appendChild(narrationBubble);
                        chatContainer.appendChild(turnWrapper);

                    } else if (item.type === 'reaction') {
                        // AIの各バブルの前に挿入ポイントを追加
                        chatContainer.appendChild(createInsertionPoint(turnIndex, index));
                        const turnWrapper = document.createElement('div');
                        turnWrapper.className = 'turn-wrapper ai-turn';
                        turnWrapper.innerHTML = `<div class="ai-type-label">${item.character_name}</div>`;

                        const reactionBubble = document.createElement('div');
                        reactionBubble.className = 'chat-message ai';
                        reactionBubble.innerHTML = `
                            <div class="bubble-actions">
                                <button class="bubble-edit-btn" data-turn-id="${turn.id}" data-item-index="${index}" title="編集"><span class="material-symbols-outlined">edit</span></button>
                                <button class="bubble-regenerate-btn" data-turn-id="${turn.id}" title="再生成"><span class="material-symbols-outlined">replay</span></button>
                                <button class="bubble-delete-btn" data-turn-id="${turn.id}" data-item-index="${index}" title="削除"><span class="material-symbols-outlined">delete</span></button>
                            </div>
                            <div class="bubble-content" data-edit-type="reaction">
                                <p>「${item.speech}」</p>
                            </div>
                        `;
                        // 編集時にキャラクター名を取得・更新するために、非表示のタグを保持する
                        const hiddenSpeakerTag = document.createElement('div');
                        hiddenSpeakerTag.className = 'speaker-tag';
                        hiddenSpeakerTag.style.display = 'none';
                        hiddenSpeakerTag.innerText = item.character_name;
                        reactionBubble.querySelector('.bubble-content').prepend(hiddenSpeakerTag);

                        turnWrapper.appendChild(reactionBubble);
                        chatContainer.appendChild(turnWrapper);

                        // AIの各バブルの後にも挿入ポイントを追加
                        chatContainer.appendChild(createInsertionPoint(turnIndex, index + 1));
                    }
                });
            }
            // 互換性のための古い形式のレンダリング
            else if (turn.ai_output.narration || turn.ai_output.character_reactions) {
                 const narrationBubble = document.createElement('div');
                 narrationBubble.className = 'chat-message ai';
                 let oldContent = turn.ai_output.narration || '';
                 if(turn.ai_output.character_reactions){
                     oldContent += turn.ai_output.character_reactions.map(r => `<br>${r.character_name}「${r.speech}」`).join('');
                 }
                 narrationBubble.innerHTML = `<div class="bubble-content"><p>${oldContent.replace(/\n/g, '<br>')}</p></div>`;
                 chatContainer.appendChild(narrationBubble);
            }

            // システムからの質問は最後に表示
            if (turn.ai_output.system_question) {
            const systemQuestion = document.createElement('div');
            systemQuestion.className = 'system-question';
            systemQuestion.innerHTML = `<p><strong>【System】</strong> ${turn.ai_output.system_question}</p>`;
            chatContainer.appendChild(systemQuestion);
        }
        }
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function createInsertionPoint(turnIndex, itemIndex) {
    const insertionPoint = document.createElement('div');
    insertionPoint.className = 'insertion-point';
    let dataset = `data-turn-index="${turnIndex}"`;
    if (itemIndex !== undefined) {
        dataset += ` data-item-index="${itemIndex}"`;
    }
    insertionPoint.innerHTML = `
        <button class="add-bubble-btn" ${dataset}>
            <span class="material-symbols-outlined">add_circle</span>
        </button>`;
    return insertionPoint;
}

function renderCharacterList(project, episode) {
    characterListPopover.innerHTML = '';

    // プロジェクトに登録されている全キャラクターをパース
    const projectCharLines = (project.characters || '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(':'));

    // Combine and remove duplicates
    const uniqueCharNames = [...new Set(projectCharLines.map(line => line.split(':')[0].trim()))];

    if (uniqueCharNames.length === 0) {
        characterListPopover.innerHTML = '<p style="padding: 5px; font-size: 0.9em; color: #888;">利用可能なキャラクターがいません。</p>';
        return;
    }

    uniqueCharNames.forEach(charName => {
        const isChecked = episode.activeCharacters.includes(charName);
        const item = document.createElement('div');
        item.className = 'popover-list-item';
        item.innerHTML = `
            <input type="checkbox" id="char-toggle-${charName}" data-name="${charName}" ${isChecked ? 'checked' : ''}>
            <label for="char-toggle-${charName}">${charName}</label>
        `;
        characterListPopover.appendChild(item);
    });
}

function generateNovelFromEpisode(project, episode) {
    let novelText = '';
    const episodeIndex = project.episodes.findIndex(e => e.id === episode.id);

    novelText += `<h1 class="novel-title">${project.title}</h1>`;
    novelText += `<h2 class="novel-episode-title">第${episodeIndex + 1}話：${episode.title}</h2>`;
    novelText += `<p>&nbsp;</p>`;

    episode.turns.forEach(turn => {
        // Player's turn
        if (turn.player_input) {
            if (turn.player_input.action) {
                novelText += `<p>${turn.player_input.action.replace(/\n/g, '</p><p>')}</p>`;
            }
            if (turn.player_input.speech) {
                novelText += `<p>「${turn.player_input.speech}」</p>`;
            }
            if (turn.player_input.thought) {
                novelText += `<p>（${turn.player_input.thought}）</p>`;
            }
            // 【System】入力は小説ビューワーには表示しない
        }

        // AI's turn
        if (turn.ai_output) {
            if (turn.ai_output.sequence && turn.ai_output.sequence.length > 0) {
                turn.ai_output.sequence.forEach(item => {
                    if (item.type === 'narration' && item.content) {
                        novelText += `<p>${item.content.replace(/\n/g, '</p><p>')}</p>`;
                    } else if (item.type === 'reaction') {
                        // 発言者タグは表示せず、セリフのみ表示
                        novelText += `<p>「${item.speech}」</p>`;
                    }
                });
            } else {
                // Fallback for old data structure without 'sequence'
                if (turn.ai_output.narration) {
                    novelText += `<p>${(turn.ai_output.narration || '').replace(/\n/g, '</p><p>')}</p>`;
                }
                if (turn.ai_output.character_reactions) {
                    turn.ai_output.character_reactions.forEach(reaction => {
                        // 発言者名は表示しない
                        novelText += `<p>「${reaction.speech}」</p>`;
                    });
                }
            }
            // 【System】からの質問も小説ビューワーには表示しない
        }
    });

    return novelText;
}

function countEpisodeCharacters(episode) {
    if (!episode || !episode.turns) return 0;

    let totalChars = 0;

    episode.turns.forEach(turn => {
        // Player's turn
        if (turn.player_input) {
            if (turn.player_input.action) {
                totalChars += turn.player_input.action.length;
            }
            if (turn.player_input.speech) {
                totalChars += turn.player_input.speech.length;
            }
            if (turn.player_input.thought) {
                totalChars += turn.player_input.thought.length;
            }
            // 【System】入力は小説形式ではないのでカウントしない
        }

        // AI's turn
        if (turn.ai_output) {
            if (turn.ai_output.sequence && turn.ai_output.sequence.length > 0) {
                turn.ai_output.sequence.forEach(item => {
                    if (item.type === 'narration' && item.content) {
                        totalChars += item.content.length;
                    } else if (item.type === 'reaction' && item.speech) {
                        totalChars += item.speech.length;
                    }
                });
            } else {
                // Fallback for old data structure
                if (turn.ai_output.narration) {
                    totalChars += turn.ai_output.narration.length;
                }
                if (turn.ai_output.character_reactions) {
                    turn.ai_output.character_reactions.forEach(reaction => {
                        totalChars += reaction.speech.length;
                    });
                }
            }
        }
    });
    return totalChars;
}

characterListPopover.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const charName = e.target.dataset.name;
        updateActiveCharacters(charName, e.target.checked);
    }
});

// --- Event Listeners ---

// Page Navigation
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // クリックされた要素がボタンそのものでなくても、親をたどってボタンを探す
    const button = e.target.closest('.back-btn');
    if (!button) return;

    // 'project-list-page' -> 'project-list' -> 'projectList' のように変換
    const targetPageId = button.dataset.target.replace('-page', '').replace(/-(\w)/g, (match, letter) => letter.toUpperCase());

    if (targetPageId === 'projectList') {
      currentProjectId = null; // プロジェクト選択をリセット
      renderProjectList(); // ★ プロジェクト一覧を再描画
    } else if (targetPageId === 'projectDetail') {
      currentEpisodeId = null; // エピソード選択のみリセット
      renderProjectDetail(); // ★ プロジェクト詳細を再描画
    }
    showPage(targetPageId);
  });
});

// Footer button on Project Detail page to go back to Project List
if (footerBackToProjectListBtn) {
    footerBackToProjectListBtn.addEventListener('click', () => {
        currentProjectId = null;
        renderProjectList();
        showPage('projectList');
    });
}
// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeIcon(isDarkMode);
});
// App Menu Navigation
document.querySelectorAll('.app-menu').forEach(menu => {
  menu.addEventListener('click', (e) => {
    // クリックされた要素がボタンそのもの、またはボタン内の要素（span）であることを確認
    const clickedElement = e.target;
    console.log('[DEBUG] .app-menu clicked. Element:', clickedElement); // デバッグログ1
    const button = clickedElement.closest('button.app-menu-btn');

    // ボタンが見つからない、または特定のIDを持つボタン（個別処理）の場合は何もしない
    if (!button || button.id === 'footer-back-to-project-list') {
      console.log('[DEBUG] No valid button found or it is an ignored button. Button:', button); // デバッグログ2
      return;
    }

    console.log('[DEBUG] Button found:', button.outerHTML); // デバッグログ3

    // Handle page navigation
    const targetPage = button.dataset.target; // この変数は後続の処理で使われる可能性があるため残します
    if (targetPage === 'project-list-page') {
      console.log('[DEBUG] Navigating to project list page.'); // デバッグログ4
      currentProjectId = null;
      currentEpisodeId = null;
      renderProjectList();
      showPage('projectList');
      return;
    }
    // Handle actions
    if (button.dataset.action === 'import') {
      console.log('[DEBUG] Import action triggered.'); // デバッグログ5
      importFileInput.click();
    } else if (button.dataset.action === 'open-viewer') {
      console.log('[DEBUG] Open viewer action triggered. Calling openViewerSelectionModal().'); // デバッグログ6
      openViewerSelectionModal();
    }
  });
});

function updateThemeIcon(isDarkMode) {
    themeToggleBtn.querySelector('.material-symbols-outlined').textContent = isDarkMode ? 'light_mode' : 'dark_mode';
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark';
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeIcon(isDarkMode);
}
apiKeySettingsBtn.addEventListener('click', () => {
  const currentKey = localStorage.getItem('GG_API_KEY') || '';
  const newKey = prompt('Google Generative Language API Key を入力してください:', currentKey);

  if (newKey !== null) { // キャンセルされなかった場合 (空文字列の入力も許可)
    localStorage.setItem('GG_API_KEY', newKey);
    alert('APIキーを保存しました。');
  }
});

importFileInput.addEventListener('change', handleImportFile);

function openProjectSettings() {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    // モーダルに現在の設定を読み込む
    // --- データ構造の互換性維持 ---
    // 古いデータ形式（protagonistが文字列）の場合、新しいオブジェクト形式に変換する
    if (typeof project.protagonist === 'string') {
        project.protagonist = { desc: project.protagonist, pronoun: '' };
    } else if (!project.protagonist) {
        project.protagonist = { desc: '', pronoun: '' };
    }

    worldSettingInput.value = project.world || '';
    protagonistSettingInput.value = project.protagonist.desc || '';
    protagonistPronounInput.value = project.protagonist?.pronoun || '';

    renderProjectCharacterEditor(project);
    // 詳細エリアを初期化
    document.getElementById('project-character-detail-area').style.display = 'none';

    settingsModalOverlay.style.display = 'flex';
}

function renderProjectCharacterEditor(project) {
    const container = document.getElementById('project-character-list-container');
    container.innerHTML = '';
    const charLines = (project.characters || '').split('\n').filter(line => line.trim() !== '');

    if (charLines.length === 0) {
        container.innerHTML = '<p style="font-size: 0.9em; color: var(--secondary-text-color);">登録されているキャラクターはいません。</p>';
    } else {
        const ul = document.createElement('ul');
        charLines.forEach((line, index) => {
            const [name] = line.split(':');
            const li = document.createElement('li');
            li.className = 'character-list-item';
            li.textContent = name.trim();
            li.dataset.charIndex = index; // DOMのインデックスをデータとして保持
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }
}

document.getElementById('project-character-list-container').addEventListener('click', (e) => {
    const listItem = e.target.closest('.character-list-item');
    if (!listItem) return;

    // 他の編集中の内容があれば保存
    saveCurrentlyEditingCharacter();

    // クリックされたカードをアクティブにする
    document.querySelectorAll('.character-list-item').forEach(item => item.classList.remove('active'));
    listItem.classList.add('active');

    const charId = listItem.dataset.charId;
    const project = db.projects.find(p => p.id === currentProjectId);
    const character = project.characters.find(c => c.id === charId);
    
    if (character) {
        document.getElementById('edit-char-name-input').value = character.name;
        document.getElementById('edit-char-faction-input').value = character.faction || '';
        document.getElementById('edit-char-desc-input').value = character.description;
        document.getElementById('project-character-detail-area').style.display = 'block';
    }
});

function saveCurrentlyEditingCharacter() {
    const activeItem = document.querySelector('.character-list-item.active');
    if (!activeItem) return;

    const charId = activeItem.dataset.charId;
    const newName = document.getElementById('edit-char-name-input').value.trim();
    const newFaction = document.getElementById('edit-char-faction-input').value.trim();
    const newDesc = document.getElementById('edit-char-desc-input').value.trim();

    if (!newName) { // 名前が空になったら削除として扱う
        deleteCharacter(charId);
        return;
    }

    const project = db.projects.find(p => p.id === currentProjectId);
    const character = project.characters.find(c => c.id === charId);

    if (character) {
        const oldFaction = character.faction || '未所属';
        const needsGroupChange = oldFaction !== (newFaction || '未所属');

        character.name = newName;
        character.faction = newFaction;
        character.description = newDesc;
        saveDB();
        // UI上の名前も更新
         // UIの更新
        if (activeItem.textContent !== newName) {
            activeItem.textContent = newName;
        }

        // 勢力が変更された場合、リストを再描画する代わりにDOMを直接移動させる
        if (needsGroupChange) {
            // 再描画してUIを最新の状態に保つのが最もシンプルで確実
            // DOM操作でやろうとすると、グループの新規作成や削除で複雑になりすぎる
            renderProjectCharacterEditor(project); // リスト全体を再描画
            const newActiveItem = document.querySelector(`.character-list-item[data-char-id="${charId}"]`);
            if (newActiveItem) newActiveItem.classList.add('active');
        }
    }
}

document.getElementById('delete-char-btn').addEventListener('click', () => {
    const activeItem = document.querySelector('.character-list-item.active');
    if (!activeItem) return;

    const charIdToDelete = activeItem.dataset.charId;
    const project = db.projects.find(p => p.id === currentProjectId);
    const character = project.characters.find(c => c.id === charIdToDelete);

    if (character && confirm(`「${character.name}」を削除しますか？`)) {
        deleteCharacter(charIdToDelete);
    }
});

function deleteCharacter(charId) {
    const project = db.projects.find(p => p.id === currentProjectId);
    project.characters = project.characters.filter(c => c.id !== charId);
    saveDB();
    renderProjectCharacterEditor(project);
    document.getElementById('project-character-detail-area').style.display = 'none';
}

function renderProjectCharacterEditor(project) {
    const container = document.getElementById('project-character-list-container');
    container.innerHTML = '';
    const charactersByFaction = (project.characters || []).reduce((acc, char) => {
        const faction = char.faction || '未所属';
        if (!acc[faction]) acc[faction] = [];
        acc[faction].push(char);
        return acc;
    }, {});

    Object.keys(charactersByFaction).sort().forEach(faction => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'character-faction-group';
        const title = document.createElement('h3');
        title.textContent = faction;
        groupDiv.appendChild(title);
        const ul = document.createElement('ul');
        charactersByFaction[faction].forEach(char => {
            const li = document.createElement('li');
            li.className = 'character-list-item';
            li.textContent = char.name;
            li.dataset.charId = char.id;
            ul.appendChild(li);
        });
        groupDiv.appendChild(ul);
        container.appendChild(groupDiv);
    });

    const factionSuggestions = document.getElementById('faction-suggestions');
    const uniqueFactions = [...new Set((project.characters || []).map(c => c.faction).filter(Boolean))];
    factionSuggestions.innerHTML = uniqueFactions.map(f => `<option value="${f}"></option>`).join('');
}

addProjectCharacterBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const newChar = {
        id: Date.now().toString() + Math.random(),
        name: '新しいキャラクター',
        description: '',
        faction: ''
    };
    project.characters.push(newChar);
    saveDB();
    renderProjectCharacterEditor(project);

    // 追加したキャラクターを選択状態にする
    setTimeout(() => {
        const newItemEl = document.querySelector(`.character-list-item[data-char-id="${newChar.id}"]`);
        if (newItemEl) newItemEl.click();
    }, 0);
});

document.getElementById('project-character-list-container').addEventListener('click', (e) => {
    const listItem = e.target.closest('.character-list-item');
    if (!listItem) return;

    // クリックされたアイテムをアクティブにする
    document.querySelectorAll('.character-list-item').forEach(item => item.classList.remove('active'));
    listItem.classList.add('active');
    const charId = listItem.dataset.charId;
    const project = db.projects.find(p => p.id === currentProjectId);
    const character = project.characters.find(c => c.id === charId);
    if (character) {
        document.getElementById('edit-char-name-input').value = character.name;
        document.getElementById('edit-char-faction-input').value = character.faction || '';
        document.getElementById('edit-char-desc-input').value = character.description;
        document.getElementById('project-character-detail-area').style.display = 'block';
    }
});

// Edit Project Title
editProjectTitleBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const newTitle = prompt("新しいプロジェクトタイトルを入力してください:", project.title);
    if (newTitle && newTitle.trim() !== project.title) {
        project.title = newTitle.trim();
        project.lastUpdated = new Date().toISOString();
        saveDB();
        projectTitleEl.textContent = project.title; // 画面上のタイトルを更新
        renderProjectList(); // タイトル変更を一覧に反映させるため
    }
});

// Edit Episode Title
editEpisodeTitleBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    const newTitle = prompt("新しいエピソード名を入力してください:", episode.title);
    if (newTitle && newTitle.trim() !== episode.title) {
        episode.title = newTitle.trim();
        project.lastUpdated = new Date().toISOString();
        saveDB();
        episodeTitleEl.textContent = episode.title; // 画面上のタイトルを更新
        renderProjectDetail(); // エピソード一覧のタイトルを更新するため
    }
});

function openNovelViewer(episodeId) {
    // 呼び出し元でcurrentProjectIdが設定されていることを前提とする
    currentViewingEpisodeId = episodeId;
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentViewingEpisodeId);
    if (!episode) return;

    viewerSelectionModalOverlay.style.display = 'none'; // 選択モーダルを閉じる
    handleNovelScroll(); // 初期表示時のボタン状態をチェック
    const novelHtml = generateNovelFromEpisode(project, episode);
    novelContent.innerHTML = novelHtml;
    novelViewerOverlay.style.display = 'flex';

    // ビューワーを開いた際に、必ず一番最初から表示されるようにスクロール位置を調整
    const novelViewer = document.getElementById('novel-viewer');
    // writing-mode: vertical-rl の場合、コンテンツの開始位置は右端になる
    novelViewer.scrollLeft = novelViewer.scrollWidth;
}

function handleNovelScroll() {
    const novelViewer = document.getElementById('novel-viewer');
    if (!novelViewer) return;

    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const currentEpisodeIndex = project.episodes.findIndex(e => e.id === currentViewingEpisodeId);
    const hasNextEpisode = currentEpisodeIndex !== -1 && currentEpisodeIndex < project.episodes.length - 1;

    // スクロール位置が左端（終端）で、かつ次のエピソードがある場合のみボタンを表示
    if (novelViewer.scrollLeft === 0 && hasNextEpisode) {
        nextEpisodeBtn.style.display = 'flex';
    } else {
        nextEpisodeBtn.style.display = 'none';
    }
}

document.getElementById('novel-viewer').addEventListener('scroll', handleNovelScroll);

nextEpisodeBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const currentEpisodeIndex = project.episodes.findIndex(e => e.id === currentViewingEpisodeId);
    if (currentEpisodeIndex !== -1 && currentEpisodeIndex < project.episodes.length - 1) {
        const nextEpisode = project.episodes[currentEpisodeIndex + 1];
        openNovelViewer(nextEpisode.id); // 次のエピソードを開く
    } else {
        nextEpisodeBtn.style.display = 'none'; // 念のため非表示に
    }
});

function openViewerSelectionModal() {
    viewerSelectionProjectId = null; // Reset state
    renderViewerProjectList();
    viewerSelectionModalOverlay.style.display = 'flex';
}

function renderViewerProjectList() {
    viewerSelectionTitle.textContent = 'プロジェクトを選択';
    viewerSelectionBackBtn.style.display = 'none';
    viewerSelectionContent.innerHTML = '';

    if (!db.projects || db.projects.length === 0) {
        viewerSelectionContent.innerHTML = '<p>表示できるプロジェクトがありません。</p>';
        return;
    }

    const list = document.createElement('ul');
    list.className = 'viewer-selection-list';
    db.projects.forEach(project => {
        const item = document.createElement('li');
        item.className = 'viewer-selection-list-item';
        item.textContent = project.title;
        item.dataset.projectId = project.id;
        list.appendChild(item);
    });
    viewerSelectionContent.appendChild(list);
}

function renderViewerEpisodeList(projectId) {
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return;

    viewerSelectionProjectId = projectId;
    viewerSelectionTitle.textContent = 'エピソードを選択';
    viewerSelectionBackBtn.style.display = 'inline-flex';
    viewerSelectionContent.innerHTML = '';

    if (!project.episodes || project.episodes.length === 0) {
        viewerSelectionContent.innerHTML = '<p>表示できるエピソードがありません。</p>';
        return;
    }

    const list = document.createElement('ul');
    list.className = 'viewer-selection-list';
    project.episodes.forEach((episode, index) => {
        const item = document.createElement('li');
        item.className = 'viewer-selection-list-item';
        item.textContent = `第${index + 1}話: ${episode.title}`;
        item.dataset.episodeId = episode.id;
        list.appendChild(item);
    });
    viewerSelectionContent.appendChild(list);
}

viewerSelectionContent.addEventListener('click', (e) => {
    const item = e.target.closest('.viewer-selection-list-item');
    if (!item) return;

    if (item.dataset.projectId) {
        renderViewerEpisodeList(item.dataset.projectId);
    } else if (item.dataset.episodeId) {
        // openNovelViewerを呼び出す前に、グローバルなcurrentProjectIdを設定する
        currentProjectId = viewerSelectionProjectId;
        openNovelViewer(item.dataset.episodeId);
    }
});

viewerSelectionBackBtn.addEventListener('click', renderViewerProjectList);

closeViewerSelectionBtn.addEventListener('click', () => {
  viewerSelectionModalOverlay.style.display = 'none';
});
viewerSelectionModalOverlay.addEventListener('click', (e) => {
  if (e.target === viewerSelectionModalOverlay) viewerSelectionModalOverlay.style.display = 'none';
});

function updateActiveCharacters(charName, isChecked) {
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    if (!episode.activeCharacters) {
        episode.activeCharacters = [];
    }

    if (isChecked && !episode.activeCharacters.includes(charName)) {
        episode.activeCharacters.push(charName);
    } else if (!isChecked) {
        episode.activeCharacters = episode.activeCharacters.filter(name => name !== charName);
    }
    saveDB();
}

// Add Episode-specific Character
addCharacterBtn.addEventListener('click', () => {
    headerMenuPopover.style.display = 'none'; // Close parent menu
    const project = db.projects.find(p => p.id === currentProjectId);
    characterModalContext = 'episode';
    if (!project || !project.episodes.find(e => e.id === currentEpisodeId)) return;

    // モーダルを開く前にフォームをリセット
    characterNameInput.value = '';
    characterDescInput.value = '';
    characterModalOverlay.style.display = 'flex';
    characterNameInput.focus();
});

// AI Settings Modal
aiSettingsBtn.addEventListener('click', () => {
    headerMenuPopover.style.display = 'none'; // メニューを閉じる
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    // Initialize settings if they don't exist
    if (!project.ai_settings) {
        project.ai_settings = { perspective: 'third' };
    }
    if (!project.protagonist) {
        project.protagonist = { desc: '', pronoun: '' };
    }

    // Load current settings into the modal
    updatePerspectiveButtons(project.ai_settings.perspective);

    aiSettingsModalOverlay.style.display = 'flex';
});

perspectiveButtons.addEventListener('click', (e) => {
    if (e.target.classList.contains('perspective-btn')) {
        const newPerspective = e.target.dataset.perspective;
        updatePerspectiveButtons(newPerspective);
    }
});

function updatePerspectiveButtons(activePerspective) {
    perspectiveButtons.querySelectorAll('.perspective-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.perspective === activePerspective);
    });
}

saveAiSettingsBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const activeButton = perspectiveButtons.querySelector('.perspective-btn.active');
    if (activeButton) {
        project.ai_settings.perspective = activeButton.dataset.perspective;
    }

    saveDB();
    aiSettingsModalOverlay.style.display = 'none';
    alert('AI設定を保存しました。');
});

closeAiSettingsBtn.addEventListener('click', () => {
    aiSettingsModalOverlay.style.display = 'none';
});


function closeCharacterModal() {
    characterModalOverlay.style.display = 'none';
}

closeCharacterBtn.addEventListener('click', closeCharacterModal);

saveCharacterBtn.addEventListener('click', () => {
    const charName = characterNameInput.value.trim();
    const charDesc = characterDescInput.value.trim();

    if (!charName || !charDesc) {
        alert('キャラクター名と説明の両方を入力してください。');
        return;
    }

    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const newCharacterInfo = `${charName}: ${charDesc}`;

    if (characterModalContext === 'project') {
        const newChar = {
            id: Date.now().toString() + Math.random(),
            name: charName,
            description: charDesc,
            faction: ''
        };
        project.characters.push(newChar);
        
        if (settingsModalOverlay.style.display === 'flex') renderProjectCharacterEditor(project);

    } else { // 'episode' (This context is currently not used for adding, but kept for future)
        const episode = project.episodes.find(e => e.id === currentEpisodeId);
        if (!episode) return;
        episode.characters = episode.characters
            ? `${episode.characters}\n${newCharacterInfo}`
            : newCharacterInfo;
        renderCharacterList(project, episode);
    }

    saveDB();
    closeCharacterModal();
});

// Character List Popover Toggle
manageCharactersBtn.addEventListener('click', (e) => {
    headerMenuPopover.style.display = 'none'; // Close parent menu

    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!project || !episode) return; // Should not happen if in episode editor

    renderCharacterList(project, episode); // Ensure the list is up-to-date before showing
    characterManagementModalOverlay.style.display = 'flex';
});
closeCharacterManagementBtn.addEventListener('click', () => characterManagementModalOverlay.style.display = 'none');

// Close popover when clicking outside
document.addEventListener('click', (e) => {
    // ヘッダーメニュー
    if (headerMenuPopover && !headerMenuPopover.contains(e.target) && !headerMenuBtn.contains(e.target)) {
        headerMenuPopover.style.display = 'none';
    }
});

// Header Menu Toggle
headerMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = headerMenuPopover.style.display === 'block';
    headerMenuPopover.style.display = isVisible ? 'none' : 'block';
});

// --- Input Mode UI ---
mainInputModeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = inputModeOptions.style.display === 'flex';
    inputModeOptions.style.display = isVisible ? 'none' : 'flex';
});

inputModeOptions.addEventListener('click', (e) => {
    const button = e.target.closest('.input-mode-btn');
    if (button) {
        currentInputMode = button.dataset.mode;
        
        // Update main button icon
        const newIcon = button.querySelector('.material-symbols-outlined').textContent;
        mainInputModeBtn.querySelector('.material-symbols-outlined').textContent = newIcon;

        // Hide options
        inputModeOptions.style.display = 'none';
    }
});

// Close input mode options when clicking outside
document.addEventListener('click', (e) => {
    if (!inputModeContainer.contains(e.target)) {
        inputModeOptions.style.display = 'none';
    }
});

// --- Footer Menu UI ---
mainFooterMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = footerMenuOptions.style.display === 'flex';
    footerMenuOptions.style.display = isVisible ? 'none' : 'flex';
});

// Close footer menu options when clicking outside
document.addEventListener('click', (e) => {
    // footerMenuContainer が null でないことを確認
    if (footerMenuContainer && !footerMenuContainer.contains(e.target)) {
        footerMenuOptions.style.display = 'none';
    }
});

lengthControlSlider.addEventListener('input', () => {
    lengthValueDisplay.textContent = lengthControlSlider.value;
});

function autoResizeTextarea() {
    // Auto-resize textarea height
    playerInputEl.style.height = 'auto'; // 一旦高さをリセット
    const scrollHeight = playerInputEl.scrollHeight;
    playerInputEl.style.height = `${scrollHeight}px`;
}

playerInputEl.addEventListener('input', () => {
    autoResizeTextarea();
});

// ドロップダウンでの入力種別変更
chatContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('input-type-dropdown')) {
        const turnId = e.target.dataset.turnId;
        const newType = e.target.value;

        const project = db.projects.find(p => p.id === currentProjectId);
        const episode = project?.episodes.find(e => e.id === currentEpisodeId);
        const turn = episode?.turns.find(t => t.id === turnId);

        if (turn && turn.player_input) {
            const currentType = Object.keys(turn.player_input)[0];
            const currentValue = turn.player_input[currentType];
            turn.player_input = { [newType]: currentValue };
            saveDB();
            renderEpisodeEditor();
        }
    }
});

chatContainer.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.bubble-edit-btn');
    if (editBtn) {
        handleEditClick(editBtn);
        return;
    }

    const regenerateBtn = e.target.closest('.bubble-regenerate-btn');
    if (regenerateBtn) {
        await handleRegenerateClick(regenerateBtn);
        return;
    }

    const deleteBtn = e.target.closest('.bubble-delete-btn');
    if (deleteBtn) {
        handleDeleteClick(deleteBtn);
        return;
    }

    const addBtn = e.target.closest('.add-bubble-btn');
    if (addBtn) {
        showInsertionMenu(addBtn);
    }
});

function handleEditClick(button) {
    const turnId = button.dataset.turnId;
    const bubble = button.closest('.chat-message');
    
    // 他の編集中のものがあればキャンセル
    const existingEdit = document.querySelector('.chat-message.editing');
    if (existingEdit) {
        renderEpisodeEditor();
    }

    const contentContainer = bubble.querySelector('.bubble-content');
    if (!contentContainer) return;

    const itemIndex = button.dataset.itemIndex;
    const isPlayer = bubble.classList.contains('player') || bubble.classList.contains('player-system');
    const isAI = bubble.classList.contains('ai');
    const editType = contentContainer.dataset.editType; // 'narration' or 'reaction'

    let originalText = '';
    const turn = db.projects.find(p => p.id === currentProjectId)?.episodes.find(e => e.id === currentEpisodeId)?.turns.find(t => t.id === turnId);
    if (!turn) return;

    if (isPlayer && turn.player_input) {
        originalText = Object.values(turn.player_input)[0] || '';
    } else if (isAI && turn.ai_output?.sequence) {
        const item = turn.ai_output?.sequence?.[itemIndex];
        if (item?.type === 'narration') {
            originalText = item.content || '';
        } else if (item?.type === 'reaction') {
            originalText = `${item.character_name}「${item.speech}」`;
        }
    }

    // Make bubble editable
    bubble.classList.add('editing');
    contentContainer.setAttribute('contenteditable', 'true');
    contentContainer.focus();

    // Add save/cancel buttons
    const actions = document.createElement('div');
    actions.className = 'inline-edit-actions';

    if (isPlayer) {
        const currentType = Object.keys(turn.player_input)[0];
        actions.innerHTML = `
            <div class="edit-mode-selector"></div>
            <div>
                <button class="cancel-edit-btn" title="キャンセル"><span class="material-symbols-outlined">close</span></button>
                <button class="save-edit-btn" title="保存"><span class="material-symbols-outlined">check</span></button>
            </div>
        `;
    } else {
        actions.innerHTML = `
            <button class="cancel-edit-btn" title="キャンセル"><span class="material-symbols-outlined">close</span></button>
            <button class="save-edit-btn" title="保存"><span class="material-symbols-outlined">check</span></button>
        `;
    }

    bubble.appendChild(actions);

    // Add event listeners for the new mode buttons if they exist
    if (isPlayer) {
        const modeButtons = actions.querySelectorAll('.edit-type-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    actions.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        renderEpisodeEditor(); // Re-render to cancel
    });

    actions.querySelector('.save-edit-btn').addEventListener('click', () => {
        const newText = contentContainer.innerText.trim();
        const project = db.projects.find(p => p.id === currentProjectId);
        const episode = project?.episodes.find(e => e.id === currentEpisodeId);
        const turn = episode?.turns.find(t => t.id === turnId);

        if (turn) {
            if (isPlayer) {
                // 編集UIで選択された新しい入力タイプを取得
                const activeTypeButton = bubble.querySelector('.edit-type-btn.active');
                const newType = activeTypeButton ? activeTypeButton.dataset.mode : Object.keys(turn.player_input)[0];
                // 新しい入力タイプと内容でplayer_inputを上書き
                turn.player_input = { [newType]: newText };
            } else if (isAI && turn.ai_output?.sequence) {
                const item = turn.ai_output?.sequence?.[itemIndex];
                if (item?.type === 'narration') {
                    item.content = newText;
                } else if (item?.type === 'reaction') {
                    // 編集されたキャラクター名とセリフを別々に取得
                    const speakerEl = contentContainer.querySelector('.speaker-tag');
                    const speechEl = contentContainer.querySelector('p');
                    const newSpeaker = speakerEl ? speakerEl.innerText.trim() : '';
                    const newSpeech = speechEl ? speechEl.innerText.trim().replace(/^「|」$/g, '') : ''; // 前後の「」を削除

                    if (newSpeaker && newSpeech) {
                        item.character_name = newSpeaker;
                        item.speech = newSpeech;
                    } else if (newText === '') {
                        // テキストが空なら、そのアイテムをシーケンスから削除
                        turn.ai_output.sequence.splice(itemIndex, 1);
                    } else {
                        // パターンに一致しない場合は、ナレーションに変換する
                        turn.ai_output.sequence[itemIndex] = { type: 'narration', content: newText };
                    }
                }
            }
            saveDB();
            renderEpisodeEditor();
        }
    });
}

function showInsertionMenu(button) {
    // 他のメニューは閉じる
    const existingMenu = document.querySelector('.insertion-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'insertion-menu';
    menu.innerHTML = `
        <button data-type="narration" title="ナレーション"><span class="material-symbols-outlined">notes</span></button>
        <button data-type="player" title="プレイヤー"><span class="material-symbols-outlined">person</span></button>
        <button data-type="character" title="登場人物"><span class="material-symbols-outlined">groups</span></button>
    `;

    button.parentElement.appendChild(menu);

    menu.addEventListener('click', (e) => {
        const menuButton = e.target.closest('button');
        if (!menuButton) return;

        const type = menuButton.dataset.type;
        const turnIndex = parseInt(button.dataset.turnIndex, 10);
        const itemIndex = button.dataset.itemIndex !== undefined ? parseInt(button.dataset.itemIndex, 10) : -1;

        insertNewBubble(type, turnIndex, itemIndex);
        menu.remove();
    });

    // メニューの外側をクリックしたら閉じる
    setTimeout(() => {
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
            }
        }, { once: true });
    }, 0);
}

function insertNewBubble(type, turnIndex, itemIndex) {
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    if (type === 'player') {
        const newTurn = {
            id: Date.now().toString(),
            player_input: { action: '' }, // デフォルトは行動
            ai_output: null,
            timestamp: new Date().toISOString()
        };

        // プレイヤーのターンは常に新しいターンとして挿入する
        // itemIndex がある場合（AIバブルの前）は、そのターンの前に挿入
        // itemIndex がない場合（プレイヤーバブルの後）は、そのターンの後に挿入 (turnIndexは0-basedなので+1する)
        const insertionIndex = turnIndex + 1;
        episode.turns.splice(insertionIndex, 0, newTurn);

    } else if (type === 'narration' || type === 'character') { // AIの応答（ナレーションやキャラクターのセリフ）を挿入
        const newItem = {
            type: type === 'narration' ? 'narration' : 'reaction',
            content: type === 'narration' ? '' : undefined,
            character_name: type === 'character' ? 'キャラクター名' : undefined,
            speech: type === 'character' ? '' : undefined,
        };

        // Case 1: チャットの先頭に挿入 (turnIndexが-1)
        if (turnIndex === -1) {
            const newTurn = {
                id: Date.now().toString(),
                player_input: null,
                ai_output: { sequence: [newItem] },
                timestamp: new Date().toISOString()
            };
            episode.turns.unshift(newTurn);
        } else {
            // Case 2: 既存のターンの間に挿入
            // AIの応答は、直前のプレイヤーのターンに紐づける必要がある。
            // 挿入ポイントのturnIndexは、その時点での直前のプレイヤーのターンを指している。
            const targetPlayerTurn = episode.turns[turnIndex];

            // 対象ターンにai_outputがなければ作成する
            if (!targetPlayerTurn.ai_output) {
                targetPlayerTurn.ai_output = { sequence: [] };
            } else if (!targetPlayerTurn.ai_output.sequence) { // 念のためsequenceもチェック
                targetPlayerTurn.ai_output.sequence = [];
            }

            // itemIndexが-1（プレイヤー入力の直後）ならシーケンスの先頭に、
            // それ以外なら指定インデックスに挿入
            const targetItemIndex = itemIndex === -1 ? 0 : itemIndex;
            targetPlayerTurn.ai_output.sequence.splice(targetItemIndex, 0, newItem);
        }
    }

    saveDB();
    renderEpisodeEditor();

    // TODO: 挿入したバブルを編集モードで開く
}

function handleDeleteClick(button) {
    if (!confirm("このバブルを削除しますか？")) {
        return;
    }

    const turnId = button.dataset.turnId;
    const itemIndex = button.dataset.itemIndex; // AIの応答部分の場合に存在する

    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    const turnIndex = episode.turns.findIndex(t => t.id === turnId);
    if (turnIndex === -1) return;

    if (itemIndex !== undefined) {
        // AIの応答の一部を削除
        const turn = episode.turns[turnIndex];
        if (turn.ai_output && turn.ai_output.sequence) {
            turn.ai_output.sequence.splice(itemIndex, 1);
        }
    } else {
        // プレイヤーのターン全体を削除
        episode.turns.splice(turnIndex, 1);
    }

    saveDB();
    renderEpisodeEditor();
}

async function handleRegenerateClick(button) {
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    const turnId = button.dataset.turnId;
    const turnToRegenerate = episode.turns.find(t => t.id === turnId);

    if (turnToRegenerate) {
        const existingEdit = document.querySelector('.chat-message.editing');
        if (existingEdit) {
            renderEpisodeEditor();
        }
        
        const bubble = button.closest('.chat-message');
        if (bubble) {
            bubble.remove();
        }
        showAiLoadingBubble();

        turnToRegenerate.ai_output = null;
        await regenerateAiResponse(project, episode, turnToRegenerate);
    }
}

// Episode Editor Page

async function handlePlayerInput(shouldTriggerAi) {
    const playerInputValue = playerInputEl.value.trim();
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    let turnForAi = null;

    // 1. プレイヤーの入力内容を処理する
    if (playerInputValue) {
        const lastTurn = episode.turns.length > 0 ? episode.turns[episode.turns.length - 1] : null;

        // Case 1-1: 連続入力中 (最後のターンにAIの応答がまだない)
        if (lastTurn && !lastTurn.ai_output) {
            lastTurn.player_input[currentInputMode] = playerInputValue;
            turnForAi = lastTurn;
        } else {
        // Case 1-2: 新しいターンを開始
            const newTurn = {
                id: Date.now().toString(),
                player_input: { [currentInputMode]: playerInputValue },
                ai_output: null,
                timestamp: new Date().toISOString()
            };
            episode.turns.push(newTurn);
            turnForAi = newTurn;
        }

        // 入力内容を即座に保存・表示
        saveDB();
        renderEpisodeEditor();
        playerInputEl.value = '';
        autoResizeTextarea();
        playerInputEl.focus();
    } else {
        // 入力がない場合は、最後のターンをAI生成の対象とする
        turnForAi = episode.turns.length > 0 ? episode.turns[episode.turns.length - 1] : null;
    }

    // 2. AIの応答生成をトリガーするかどうかを判断
    if (shouldTriggerAi) {
        if (!turnForAi || turnForAi.ai_output) return; // 対象ターンがない、または既に応答済みなら何もしない

        // 3. AI応答生成処理
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = 'AIが物語を生成中です...';
        }

        aiGenerateBtn.disabled = true;
        sendOnlyBtn.disabled = true;
        playerInputEl.disabled = true;
        globalLoadingOverlay.style.display = 'flex';

        await generateAiResponse(project, episode, turnForAi);

        playerInputEl.disabled = false;
        aiGenerateBtn.disabled = false;
        sendOnlyBtn.disabled = false;
        playerInputEl.focus();
    }
}

aiGenerateBtn.addEventListener('click', () => handlePlayerInput(true));
sendOnlyBtn.addEventListener('click', () => handlePlayerInput(false));



async function generateAiResponse(project, episode, turn) {
    // ターンがAIの応答を生成する対象のターン自身を含まないように履歴を作成
    const historyTurns = episode.turns.filter(t => t.id !== turn.id);
    // さらに、もしturnが最後のターンなら、それも履歴から除外する
    // const historyTurns = episode.turns.slice(0, episode.turns.findIndex(t => t.id === turn.id));
    const history = historyTurns.map(t => {
        let p_input = '';
        if (t.player_input?.action) p_input += `[行動] ${t.player_input.action}\n`;
        if (t.player_input?.speech) p_input += `[発言] 「${t.player_input.speech}」\n`;
        if (t.player_input?.thought) p_input += `[心の声] (${t.player_input.thought})\n`;
        if (t.player_input?.system) p_input += `【System】 ${t.player_input.system}\n`;

        // 最新のデータ構造(sequence)からAIの応答をテキスト化する
        let ai_output = '';
        if (t.ai_output?.sequence) {
            ai_output += t.ai_output.sequence.map(item => {
                if (item.type === 'narration') return item.content;
                if (item.type === 'reaction') return `${item.character_name}「${item.speech}」`;
                return '';
            }).join('\n');
        }
        // p_inputとai_outputを結合。両方とも中身がある場合のみ区切り文字を挿入
        const turnText = [p_input, ai_output].filter(Boolean).join('\n');
        // ターンが空文字列になっていないか確認
        return turnText.trim() ? turnText : null;
    }).filter(Boolean).join('\n\n---\n\n'); // nullを除外して結合

    // プレイヤーの今回の入力を整形
    const currentPlayerInput = Object.entries(turn.player_input).map(([key, value]) => {
        if (key === 'speech') return `[発言] 「${value}」`;
        if (key === 'thought') return `[心の声] (${value})`;
        if (key === 'system') return `【System】 ${value}`;
        if (key === 'action') return `[行動] ${value}`;
        return `[${key}] ${value}`;
    }).join('\n');

    // --- 視点に応じたプロンプトの動的生成 ---
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
    // Get all characters and filter by active ones
    (() => {
        const allChars = [];
        if (project.characters) allChars.push(project.characters);
        if (episode.characters) allChars.push(episode.characters);
        const combinedChars = allChars.join('\n');

        if (!episode.activeCharacters || episode.activeCharacters.length === 0) {
            return '設定なし';
        }

        return combinedChars.split('\n').filter(line => {
            const charName = line.split(':')[0].trim();
            return episode.activeCharacters.includes(charName);
        }).join('\n') || '設定なし';
    })()
}
# これまでのあらすじ${
    (() => {
        const episodeIndex = project.episodes.findIndex(e => e.id === episode.id);
        // 現在のエピソードより前のエピソードのあらすじをすべて結合
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
    const length = parseInt(lengthControlSlider.value, 10);
    if (length <= 100) {
        return `・物語の描写（narration）を約${length}文字程度の非常に短い文章にしてください。`;
    } else if (length >= 800) {
        return `・物語の描写（narration）を約${length}文字程度の非常に長い文章で、詳細に記述してください。`;
    }
    // '普通' or default
    return `・物語の描写（narration）を約${length}文字程度の標準的な長さで記述してください。`;
})()}

# あなたへの指示
- プレイヤーからの【System】指示は、物語のルールや今後の展開に対する絶対的な命令です。必ずその指示に従って物語を進行させてください。
- プレイヤーの入力に対する自然な結果を物語として描写してください。
- 出力は必ず以下のJSON形式の文字列に従ってください。
- narration: 状況や風景の描写、キャラクターの行動の結果などを記述します。
- character_reactions: 登場人物が何か発言する場合に、そのキャラクター名とセリフを配列で記述します。誰も発言しない場合は空配列 [] にしてください。
- system_question: プレイヤーに物語の進行に必要な設定を尋ねる場合、ここに質問を記述します。質問がない場合はnullにしてください。

例:
{
  "narration": "部屋の中は静まり返っていた…",
  "character_reactions": [
    { "character_name": "Character A", "speech": "やっと来たのね" }
  ],
  "system_question": null
}
`;

    // 3. Call AI and save AI turn
    const aiResponseText = await callGemini(prompt);
    let aiOutput = {};
    try {
        const cleanJsonString = extractJsonFromString(aiResponseText);
        aiOutput = JSON.parse(cleanJsonString);
    } catch(e) {
        console.error("Failed to parse AI JSON response:", e, "Original response was:", aiResponseText);
        aiOutput = { narration: "AIからの応答を解析できませんでした。", character_reactions: [] };
    }

    // --- AI Response Post-processing ---
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

    globalLoadingOverlay.style.display = 'none';
    renderEpisodeEditor();
}

async function regenerateAiResponse(project, episode, turn) {
    // 再生成用のプロンプトを作成
    const history = episode.turns
        .filter(t => t.id !== turn.id) // 再生成対象のターンを除外
        .map(t => {
            let p_input = '';
            if (t.player_input?.action) p_input += `[行動] ${t.player_input.action}\n`;
            if (t.player_input?.speech) p_input += `[発言] 「${t.player_input.speech}」\n`;
            // ... 他の入力タイプも同様に追加 ...
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

    // 3. Call AI and save AI turn
    const aiResponseText = await callGemini(prompt);
    let aiOutput = {};
    try {
        const cleanJsonString = extractJsonFromString(aiResponseText);
        aiOutput = JSON.parse(cleanJsonString);
    } catch(e) {
        console.error("Failed to parse AI JSON response:", e, "Original response was:", aiResponseText);
        aiOutput = { narration: "AIからの応答を解析できませんでした。", character_reactions: [] };
    }

    // --- AI Response Post-processing ---
    // If narration contains character speeches, move them to character_reactions to avoid duplication.
    // The goal is to create a single sequence of narration and reaction bubbles in the correct order.
    const sequence = [];
    if (aiOutput.narration) {
        const narration = aiOutput.narration || '';
        const allLines = narration.split('\n').filter(line => line.trim() !== '');
        const reactionRegex = /^(.*?)「(.*?)」$/;

        allLines.forEach(line => {
            const match = line.match(reactionRegex);
            if (match) {
                // This is a speech line.
                sequence.push({ type: 'reaction', character_name: match[1].trim(), speech: match[2].trim() });
            } else {
                // This is a narration line.
                sequence.push({ type: 'narration', content: line });
            }
        });
    }
    // Add reactions from the character_reactions array to the sequence
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

    globalLoadingOverlay.style.display = 'none';
    // 4. Render final turn
}

function exportProject(projectId) {
    const project = db.projects.find(p => p.id === projectId);
    if (!project) {
        alert('エクスポート対象のプロジェクトが見つかりません。');
        return;
    }

    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    // ファイル名に使えない文字を置換
    const safeFileName = project.title.replace(/[\\/:*?"<>|]/g, '_');
    a.download = `${safeFileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedProject = JSON.parse(e.target.result);

            // 簡単なバリデーション
            if (!importedProject.title || !importedProject.episodes) {
                throw new Error('無効なプロジェクトファイルです。');
            }

            // IDの重複を避けるために新しいIDを付与
            importedProject.id = Date.now().toString();
            importedProject.lastUpdated = new Date().toISOString();

            db.projects.push(importedProject);
            saveDB();
            renderProjectList();
            alert(`「${importedProject.title}」をインポートしました。`);
        } catch (error) {
            alert(`ファイルのインポートに失敗しました: ${error.message}`);
        } finally {
            // 同じファイルを連続で選択できるように、inputの値をリセット
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // イベントリスナーの重複登録を避けるため、初期化時に一度だけ登録する
  initializeEventListeners();
  loadDB();
  applySavedTheme();
  renderProjectList(); // アプリケーション起動時にプロジェクト一覧を描画する
  showPage('projectList');
});

function initializeEventListeners() {
  // Page Navigation
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // クリックされた要素がボタンそのものでなくても、親をたどってボタンを探す
      const button = e.target.closest('.back-btn');
      if (!button) return;

      // 'project-list-page' -> 'project-list' -> 'projectList' のように変換
      const targetPageId = button.dataset.target.replace('-page', '').replace(/-(\w)/g, (match, letter) => letter.toUpperCase());

      if (targetPageId === 'projectList') {
        currentProjectId = null; // プロジェクト選択をリセット
        renderProjectList(); // ★ プロジェクト一覧を再描画
      } else if (targetPageId === 'projectDetail') {
        currentEpisodeId = null; // エピソード選択のみリセット
        renderProjectDetail(); // ★ プロジェクト詳細を再描画
      }
      showPage(targetPageId);
    });
  });

  // Footer button on Project Detail page to go back to Project List
  if (footerBackToProjectListBtn) {
    footerBackToProjectListBtn.addEventListener('click', () => {
      currentProjectId = null;
      renderProjectList();
      showPage('projectList');
    });
  }

  // App Menu Navigation
  document.querySelectorAll('.app-menu').forEach(menu => {
    menu.addEventListener('click', (e) => {
      const clickedElement = e.target;
      const button = clickedElement.closest('button.app-menu-btn');

      if (!button || button.id === 'footer-back-to-project-list' || button.id === 'main-footer-menu-btn') {
        return;
      }

      const targetPage = button.dataset.target;
      if (targetPage === 'project-list-page') {
        currentProjectId = null;
        currentEpisodeId = null;
        renderProjectList();
        showPage('projectList');
        return;
      }

      if (button.dataset.action === 'import') {
        importFileInput.click();
      } else if (button.dataset.action === 'open-viewer') {
        openViewerSelectionModal();
      } else if (button.dataset.action === 'open-generator') {
        openGeneratorModal();
      }
    });
  });

  // Project List Page
  newProjectBtn.addEventListener('click', () => {
    const title = prompt("新しいプロジェクトのタイトルを入力してください:", "無題の物語");
    if (title) {
      const newProject = {
        id: Date.now().toString(),
        title: title,
        episodes: [],
        world: '',
        characters: '',
        protagonist: { desc: '', pronoun: '' }, // データ構造を統一
        lastUpdated: new Date().toISOString(),
      };
      db.projects.push(newProject);
      saveDB();
      renderProjectList();
    }
  });

  projectCardsContainer.addEventListener('click', (e) => {
    if (pages.projectList.style.display === 'none') return;

    // Check for specific button clicks first
    const deleteBtn = e.target.closest('.delete-project-btn');
    if (deleteBtn) {
      const projectId = deleteBtn.dataset.id;
      if (confirm("本当にこのプロジェクトを削除しますか？元に戻せません。")) {
        db.projects = db.projects.filter(p => p.id !== projectId);
        saveDB();
        renderProjectList();
      }
      return; // Prevent card click event
    }

    const exportBtn = e.target.closest('.export-project-btn');
    if (exportBtn) {
      exportProject(exportBtn.dataset.id);
      return; // Prevent card click event
    }

    // If no specific button was clicked, treat it as a card click
    const card = e.target.closest('.project-card');
    if (card) {
      currentProjectId = card.dataset.id;
      renderProjectDetail();
      showPage('projectDetail');
    }
  });

  // Project Detail Page
  newEpisodeBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const title = prompt("新しいエピソードのタイトルを入力してください:", `エピソード ${project.episodes.length + 1}`);
    if (title) {
      let initialActiveCharacters = [];
      if (project.episodes.length > 0) {
        const lastEpisode = project.episodes[project.episodes.length - 1];
        if (lastEpisode.activeCharacters) {
          initialActiveCharacters = [...lastEpisode.activeCharacters];
        }
      }
      const newEpisode = {
        id: Date.now().toString(),
        title: title,
        characters: '',
        activeCharacters: initialActiveCharacters,
        initial_ai_question: project.episodes.length === 0 ? '異世界転生する前の話を入れますか？入れるとすれば設定を教えてください。' : null,
        turns: [],
        summary: ''
      };

      if (project.episodes.length > 0) {
        const lastEpisode = project.episodes[project.episodes.length - 1];
        if (lastEpisode.turns && lastEpisode.turns.length > 0) {
          const lastTurn = lastEpisode.turns[lastEpisode.turns.length - 1];
          if (lastTurn.player_input && 'system' in lastTurn.player_input && !lastTurn.ai_output) {
            const turnToMove = lastEpisode.turns.pop();
            newEpisode.turns.push(turnToMove);
            newEpisode.initial_ai_question = null;
          } else if (lastTurn.ai_output && lastTurn.ai_output.system_question) {
            newEpisode.initial_ai_question = lastTurn.ai_output.system_question;
          }
        }
      }

      project.episodes.push(newEpisode);
      project.lastUpdated = new Date().toISOString();
      saveDB();
      renderProjectDetail();
    }
  });

  if (episodeCardsContainer) {
    episodeCardsContainer.addEventListener('click', (e) => {
      if (pages.projectDetail.style.display === 'none') return;

      const openBtn = e.target.closest('.open-episode-btn');
      if (openBtn) {
        currentEpisodeId = openBtn.dataset.id;
        renderEpisodeEditor();
        currentViewingEpisodeId = currentEpisodeId;
        showPage('episodeEditor');
        return;
      }

      const deleteBtn = e.target.closest('.delete-episode-btn');
      if (deleteBtn) {
        const project = db.projects.find(p => p.id === currentProjectId);
        if (project && confirm("本当にこのエピソードを削除しますか？")) {
          project.episodes = project.episodes.filter(ep => ep.id !== deleteBtn.dataset.id);
          project.lastUpdated = new Date().toISOString();
          saveDB();
          renderProjectDetail();
        }
        return;
      }

      const viewerBtn = e.target.closest('.novel-viewer-btn');
      if (viewerBtn) {
        openNovelViewer(viewerBtn.dataset.id);
        return;
      }
    });
  }

  // Novel Viewer
  closeNovelViewerBtn.addEventListener('click', () => {
    novelViewerOverlay.style.display = 'none';
  });

  // Project Settings Modal
  if (projectSettingsBtn) {
    projectSettingsBtn.addEventListener('click', () => {
      if (pages.projectDetail.style.display === 'none') return;
      openProjectSettings();
    });
  }

  // --- Project Settings Modal: World/Protagonist Auto-Save ---
  const autoSaveProjectSettings = () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    project.world = worldSettingInput.value.trim();
    if (!project.protagonist) project.protagonist = {};
    project.protagonist.desc = protagonistSettingInput.value.trim();
    project.protagonist.pronoun = protagonistPronounInput.value.trim();
    project.lastUpdated = new Date().toISOString();
    saveDB();
  };
  worldSettingInput.addEventListener('input', autoSaveProjectSettings);
  protagonistSettingInput.addEventListener('input', autoSaveProjectSettings);
  protagonistPronounInput.addEventListener('input', autoSaveProjectSettings);

  // --- Project Settings Modal: Character Editor Auto-Save ---
  const charNameInput = document.getElementById('edit-char-name-input');
  const charFactionInput = document.getElementById('edit-char-faction-input');
  const charDescInput = document.getElementById('edit-char-desc-input');

  const autoSaveCharacter = (e) => {
    const activeItem = document.querySelector('.character-list-item.active');
    if (!activeItem) return;

    const charId = activeItem.dataset.charId;
    const project = db.projects.find(p => p.id === currentProjectId);
    const character = project?.characters.find(c => c.id === charId);
    if (!character) return;

    const oldFaction = character.faction;

    character.name = charNameInput.value.trim();
    character.faction = charFactionInput.value.trim();
    character.description = charDescInput.value.trim();

    if (!character.name) {
      // 名前が空になったら削除する
      deleteCharacter(charId);
      return;
    }

    saveDB();

    // UIの更新
    activeItem.textContent = character.name;

    // 勢力が変更された場合のみリストを再描画
    if (e.target.id === 'edit-char-faction-input' && oldFaction !== character.faction) {
      renderProjectCharacterEditor(project);
      // 再描画後もアクティブ状態を維持
      setTimeout(() => {
        const newItemEl = document.querySelector(`.character-list-item[data-char-id="${charId}"]`);
        if (newItemEl) {
          newItemEl.classList.add('active');
          newItemEl.scrollIntoView({ block: 'nearest' });
        }
      }, 0);
    }
  };

  charNameInput.addEventListener('input', autoSaveCharacter);
  charFactionInput.addEventListener('input', autoSaveCharacter);
  charDescInput.addEventListener('input', autoSaveCharacter);

  document.getElementById('delete-char-btn').addEventListener('click', () => {
    const activeItem = document.querySelector('.character-list-item.active');
    if (activeItem) deleteCharacter(activeItem.dataset.charId);
  });

  function deleteCharacter(charId) {
    const project = db.projects.find(p => p.id === currentProjectId);
    const character = project?.characters.find(c => c.id === charId);
    if (character && confirm(`「${character.name}」を削除しますか？`)) {
      project.characters = project.characters.filter(c => c.id !== charId);
      saveDB();
      renderProjectCharacterEditor(project);
      document.getElementById('project-character-detail-area').style.display = 'none';
    }
  }

  settingsModalOverlay.addEventListener('click', (e) => {
      if (e.target === settingsModalOverlay) settingsModalOverlay.style.display = 'none'; // モーダル外クリックで閉じる
  });
}