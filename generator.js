// --- DOM Elements for Generator ---
const generatorModalOverlay = document.getElementById('generator-modal-overlay');
const closeGeneratorBtn = document.getElementById('close-generator-btn');
const generatorGrid = document.getElementById('generator-grid');

// Generator Screens
const generatorMainScreen = document.getElementById('generator-main-screen');
const generatorWorldScreen = document.getElementById('generator-world-screen');
const generatorProtagonistScreen = document.getElementById('generator-protagonist-screen');
const generatorCharacterScreen = document.getElementById('generator-character-screen');

// Buttons within Generator
const generateWorldBtn = document.getElementById('generate-world-btn');
const regenerateWorldBtn = document.getElementById('regenerate-world-btn');
const createProjectFromWorldBtn = document.getElementById('create-project-from-world-btn');
const copyWorldToProjectBtn = document.getElementById('copy-world-to-project-btn');
const generateProtagonistBtn = document.getElementById('generate-protagonist-btn');
const regenerateProtagonistBtn = document.getElementById('regenerate-protagonist-btn');
const createProjectFromProtagonistBtn = document.getElementById('create-project-from-protagonist-btn');
const copyProtagonistToProjectBtn = document.getElementById('copy-protagonist-to-project-btn');
const generateCharacterBtn = document.getElementById('generate-character-btn');
const regenerateCharacterBtn = document.getElementById('regenerate-character-btn');
const copyCharacterToProjectBtn = document.getElementById('copy-character-to-project-btn');

// Inputs and Outputs for World Generator
const worldKeywordsInput = document.getElementById('world-keywords-input');
const worldResultOutput = document.getElementById('world-result-output');

// Inputs and Outputs for Protagonist Generator
const protagonistKeywordsInput = document.getElementById('protagonist-keywords-input');
const protagonistResultOutput = document.getElementById('protagonist-result-output');

// Inputs and Outputs for Character Generator
const characterKeywordsInput = document.getElementById('character-keywords-input');
const characterResultOutput = document.getElementById('character-result-output');

/**
 * Opens the generator modal.
 */
function openGeneratorModal() {
    if (generatorModalOverlay) {
        generatorModalOverlay.style.display = 'flex';
        showGeneratorScreen('main'); // Always show main screen first
        // モーダルを開くたびに内容をリセット
        worldKeywordsInput.value = '';
        worldResultOutput.value = '';
        protagonistKeywordsInput.value = '';
        protagonistResultOutput.value = '';
        characterKeywordsInput.value = '';
        characterResultOutput.value = '';
    }
}

/**
 * Closes the generator modal.
 */
function closeGeneratorModal() {
    if (generatorModalOverlay) {
        generatorModalOverlay.style.display = 'none';
    }
}

/**
 * Shows the specified screen within the generator modal.
 * @param {string} screenName - 'main', 'world', etc.
 */
function showGeneratorScreen(screenName) {
    // Hide all screens first
    [generatorMainScreen, generatorWorldScreen, generatorProtagonistScreen, generatorCharacterScreen].forEach(screen => {
        if(screen) screen.style.display = 'none';
    });

    // Show the target screen
    switch (screenName) {
        case 'world':
            if(generatorWorldScreen) generatorWorldScreen.style.display = 'block';
            break;
        case 'protagonist':
            if(generatorProtagonistScreen) generatorProtagonistScreen.style.display = 'block';
            break;
        case 'character':
            if(generatorCharacterScreen) generatorCharacterScreen.style.display = 'block';
            break;
        default: // 'main'
            if(generatorMainScreen) generatorMainScreen.style.display = 'block';
            break;
    }
}

// --- Event Listeners ---
if (closeGeneratorBtn) {
    closeGeneratorBtn.addEventListener('click', closeGeneratorModal);
}

if (generatorModalOverlay) {
    generatorModalOverlay.addEventListener('click', (e) => {
        if (e.target === generatorModalOverlay) {
            closeGeneratorModal();
        }
    });
}

// --- Project Selection Modal for Copying ---
const projectSelectionOverlay = document.getElementById('generator-project-selection-overlay');
const projectSelectionList = document.getElementById('generator-project-selection-list');
const closeProjectSelectionBtn = document.getElementById('close-generator-project-selection-btn');

let copyDataType = null;
let copyData = null;

function openProjectSelectionForCopy(dataType, data) {
    copyDataType = dataType;
    copyData = data;

    projectSelectionList.innerHTML = ''; // Clear previous list
    if (db.projects && db.projects.length > 0) {
        db.projects.forEach(project => {
            const item = document.createElement('li');
            item.className = 'viewer-selection-list-item'; // Reuse style
            // どの設定を上書きするか分かりやすく表示
            let subtext = '';
            if (dataType === 'world') {
                subtext = project.world ? `(現在の世界観: ${project.world.substring(0, 20)}...)` : '(世界観未設定)';
            } else if (dataType === 'protagonist') {
                subtext = project.protagonist?.desc ? `(現在の主人公: ${project.protagonist.desc.substring(0, 20)}...)` : '(主人公未設定)';
            } else if (dataType === 'character') {
                subtext = `(現在の登場人物数: ${project.characters.split('\n').filter(Boolean).length})`;
            }
            item.innerHTML = `${project.title} <br><span style="font-size:0.8em; color: #888;">${subtext}</span>`;
            item.dataset.projectId = project.id;
            projectSelectionList.appendChild(item);
        });
    } else {
        projectSelectionList.innerHTML = '<p>コピー先のプロジェクトがありません。</p>';
    }
    projectSelectionOverlay.style.display = 'flex';
}

function closeProjectSelectionModal() {
    projectSelectionOverlay.style.display = 'none';
}

copyWorldToProjectBtn.addEventListener('click', () => {
    const worldSetting = worldResultOutput.value.trim();
    if (worldSetting) {
        openProjectSelectionForCopy('world', worldSetting);
    } else { alert('世界観が生成されていません。'); }
});
closeProjectSelectionBtn.addEventListener('click', closeProjectSelectionModal);
projectSelectionOverlay.addEventListener('click', (e) => {
    if (e.target === projectSelectionOverlay) closeProjectSelectionModal();
});

projectSelectionList.addEventListener('click', (e) => {
    const item = e.target.closest('.viewer-selection-list-item');
    if (!item || !item.dataset.projectId) return;

    const project = db.projects.find(p => p.id === item.dataset.projectId);
    if (!project) return;

    let confirmMessage = '';
    if (copyDataType === 'world') {
        confirmMessage = `プロジェクト「${project.title}」の世界観を上書きしますか？`;
    } else if (copyDataType === 'protagonist') {
        confirmMessage = `プロジェクト「${project.title}」の主人公設定を上書きしますか？`;
    } else if (copyDataType === 'character') {
        confirmMessage = `プロジェクト「${project.title}」にこのキャラクターを追加しますか？`;
    }

    if (confirm(confirmMessage)) {
        if (copyDataType === 'world') project.world = copyData;
        if (copyDataType === 'protagonist') project.protagonist = copyData;
        if (copyDataType === 'character') {
            const currentChars = project.characters ? project.characters.split('\n') : [];
            project.characters = [...currentChars, copyData].filter(Boolean).join('\n');
        }
        saveDB();
        alert(`「${project.title}」の設定を更新しました。`);
        closeProjectSelectionModal();
        closeGeneratorModal();
    }
});

if (generatorGrid) {
    generatorGrid.addEventListener('click', (e) => {
        const button = e.target.closest('.generator-btn');
        if (!button || button.classList.contains('unimplemented')) {
            if (button) {
                // 未実装ボタンがクリックされたことをユーザーに伝える（任意）
                // alert('この機能は現在開発中です。');
            }
            return;
        }

        const generatorType = button.dataset.generator;
        showGeneratorScreen(generatorType);
    });
}

document.querySelectorAll('.back-to-generator-main-btn').forEach(btn => {
    btn.addEventListener('click', () => showGeneratorScreen('main'));
});

/**
 * Generates world setting using AI based on keywords.
 */
async function generateWorldSetting() {
    const keywords = worldKeywordsInput.value.trim();
    if (!keywords) {
        alert('キーワードを入力してください。');
        return;
    }

    // Disable buttons and show loading state
    generateWorldBtn.disabled = true;
    regenerateWorldBtn.disabled = true;
    worldResultOutput.value = 'AIにより生成中...';

    const prompt = `
あなたはプロの小説家、特にファンタジー世界の創造を得意とする世界観設定作家です。
以下のキーワードを元に、読者がワクワクするような魅力的な世界観の設定を300文字程度で生成してください。

# キーワード
${keywords}

# あなたへの指示
- 出力は世界観設定の文章のみにしてください。
- JSON形式や見出しは不要です。
`;

    try {
        const result = await callGemini(prompt);
        // AIの応答から余計な部分を削除
        const cleanResult = result.replace(/```/g, '').replace(/json/g, '').trim();
        worldResultOutput.value = cleanResult;
    } catch (error) {
        console.error("World setting generation failed:", error);
        worldResultOutput.value = "エラーが発生しました。コンソールを確認してください。";
    } finally {
        // Re-enable buttons
        generateWorldBtn.disabled = false;
        regenerateWorldBtn.disabled = false;
    }
}

// Event listeners for world generation
generateWorldBtn.addEventListener('click', generateWorldSetting);
regenerateWorldBtn.addEventListener('click', generateWorldSetting); // Re-generate uses the same logic

/**
 * Generates protagonist setting using AI based on keywords.
 */
async function generateProtagonistSetting() {
    const keywords = protagonistKeywordsInput.value.trim();
    if (!keywords) {
        alert('キーワードを入力してください。');
        return;
    }

    generateProtagonistBtn.disabled = true;
    regenerateProtagonistBtn.disabled = true;
    protagonistResultOutput.value = 'AIにより生成中...';

    const prompt = `
あなたはプロの小説家、特にキャラクター創造を得意とする作家です。
以下のキーワードを元に、読者が感情移入できるような魅力的な主人公の設定を生成してください。

# キーワード
${keywords}

# あなたへの指示
- 出力は必ず以下のJSON形式に従ってください。
- desc: 主人公の背景、性格、能力などの設定を200文字程度で記述してください。
- pronoun: その主人公が使いそうな一人称を一つだけ記述してください。（例: 「俺」「私」「僕」）

例:
{
  "desc": "日本の平凡な高校生だったが、交通事故をきっかけに異世界へ転生。特別なスキルは持たないものの、持ち前の人の良さと現代知識を武器に、困難な状況を乗り越えていく。困っている人を見ると放っておけないお人好しな性格。",
  "pronoun": "俺"
}
`;

    try {
        const result = await callGemini(prompt);
        const cleanJsonString = extractJsonFromString(result);
        const parsedResult = JSON.parse(cleanJsonString);

        // テキストエリアには見やすい形で表示
        protagonistResultOutput.value = `【設定】\n${parsedResult.desc}\n\n【一人称】\n${parsedResult.pronoun}`;

    } catch (error) {
        console.error("Protagonist setting generation failed:", error);
        protagonistResultOutput.value = "エラーが発生しました。コンソールを確認してください。";
    } finally {
        generateProtagonistBtn.disabled = false;
        regenerateProtagonistBtn.disabled = false;
    }
}

generateProtagonistBtn.addEventListener('click', generateProtagonistSetting);
regenerateProtagonistBtn.addEventListener('click', generateProtagonistSetting);

function getProtagonistDataFromOutput() {
    const outputText = protagonistResultOutput.value;
    const descMatch = outputText.match(/【設定】\n([\s\S]*?)\n\n【一人称】/);
    const pronounMatch = outputText.match(/【一人称】\n(.*)/);

    if (descMatch && pronounMatch) {
        return {
            desc: descMatch[1].trim(),
            pronoun: pronounMatch[1].trim()
        };
    }
    return null;
}

createProjectFromProtagonistBtn.addEventListener('click', () => {
    const protagonistData = getProtagonistDataFromOutput();
    if (!protagonistData) {
        alert('主人公が生成されていません。');
        return;
    }

    const title = prompt("新しいプロジェクトのタイトルを入力してください:", "無題の物語");
    if (title) {
        const newProject = {
            id: Date.now().toString(),
            title: title,
            world: '',
            episodes: [],
            characters: '',
            protagonist: protagonistData,
            ai_settings: { perspective: 'third' },
            lastUpdated: new Date().toISOString(),
        };
        db.projects.push(newProject);
        saveDB();
        renderProjectList();
        closeGeneratorModal();
        showPage('projectList');
        alert(`プロジェクト「${title}」を作成し、主人公設定を適用しました。`);
    }
});

copyProtagonistToProjectBtn.addEventListener('click', () => {
    const protagonistData = getProtagonistDataFromOutput();
    if (!protagonistData) {
        alert('主人公が生成されていません。');
        return;
    }
    // 既存のプロジェクト選択モーダルを再利用
    openProjectSelectionForCopy('protagonist', protagonistData);
});

/**
 * Generates character setting using AI based on keywords.
 */
async function generateCharacterSetting() {
    const keywords = characterKeywordsInput.value.trim();
    if (!keywords) {
        alert('キーワードを入力してください。');
        return;
    }

    generateCharacterBtn.disabled = true;
    regenerateCharacterBtn.disabled = true;
    characterResultOutput.value = 'AIにより生成中...';

    const prompt = `
あなたはプロの小説家、特にキャラクター創造を得意とする作家です。
以下のキーワードを元に、物語を彩る魅力的な登場人物（キャラクター）の設定を生成してください。

# キーワード
${keywords}

# あなたへの指示
- 出力は必ず以下のJSON形式に従ってください。
- name: キャラクターの名前を生成してください。
- desc: キャラクターの背景、性格、能力などの設定を150文字程度で記述してください。

例:
{
  "name": "リリアナ",
  "desc": "かつて王国に仕えた魔法騎士団の生き残り。冷静沈着で無口だが、内に熱い情熱を秘めている。古代の魔法言語を解読できる唯一の人物。"
}
`;

    try {
        const result = await callGemini(prompt);
        const cleanJsonString = extractJsonFromString(result);
        const parsedResult = JSON.parse(cleanJsonString);

        // テキストエリアには見やすい形で表示
        characterResultOutput.value = `【名前】\n${parsedResult.name}\n\n【設定】\n${parsedResult.desc}`;

    } catch (error) {
        console.error("Character setting generation failed:", error);
        characterResultOutput.value = "エラーが発生しました。コンソールを確認してください。";
    } finally {
        generateCharacterBtn.disabled = false;
        regenerateCharacterBtn.disabled = false;
    }
}

generateCharacterBtn.addEventListener('click', generateCharacterSetting);
regenerateCharacterBtn.addEventListener('click', generateCharacterSetting);

function getCharacterDataFromOutput() {
    const outputText = characterResultOutput.value;
    const nameMatch = outputText.match(/【名前】\n(.*?)\n\n【設定】/);
    const descMatch = outputText.match(/【設定】\n([\s\S]*)/);

    if (nameMatch && descMatch) {
        const name = nameMatch[1].trim();
        const desc = descMatch[1].trim();
        // プロジェクトのcharactersプロパティと同じ形式 "名前: 説明" にする
        return `${name}: ${desc}`;
    }
    return null;
}

copyCharacterToProjectBtn.addEventListener('click', () => {
    const characterData = getCharacterDataFromOutput();
    if (!characterData) {
        alert('キャラクターが生成されていません。');
        return;
    }
    // 既存のプロジェクト選択モーダルを再利用
    openProjectSelectionForCopy('character', characterData);
});



if (createProjectFromWorldBtn) {
    createProjectFromWorldBtn.addEventListener('click', () => {
        const worldSetting = worldResultOutput.value.trim();
        if (!worldSetting) {
            alert('世界観が生成されていません。');
            return;
        }

        const title = prompt("新しいプロジェクトのタイトルを入力してください:", "無題の物語");
        if (title) {
            const newProject = {
                id: Date.now().toString(),
                title: title,
                world: worldSetting,
                episodes: [],
                characters: '',
                protagonist: { desc: '', pronoun: '' }, // 新しいデータ構造に合わせる
                ai_settings: { perspective: 'third' }, // デフォルトのAI設定
                lastUpdated: new Date().toISOString(),
            };
            db.projects.push(newProject);
            saveDB();
            renderProjectList();
            closeGeneratorModal();
            showPage('projectList');
            alert(`プロジェクト「${title}」を作成しました。`);
        }
    });
}