// --- DOM Elements ---
const ui = {
  pages: {
    projectList: document.getElementById('project-list-page'),
    projectDetail: document.getElementById('project-detail-page'),
    episodeEditor: document.getElementById('episode-editor-page'),
  },
  projectCardsContainer: document.getElementById('project-cards-container'),
  episodeCardsContainer: document.getElementById('episode-cards-container'),
  chatContainer: document.getElementById('chat-container'),
  newProjectBtn: document.getElementById('new-project-btn'),
  newEpisodeBtn: document.getElementById('new-episode-btn'),
  aiGenerateBtn: document.getElementById('ai-generate-btn'),
  footerBackToProjectListBtn: document.getElementById('footer-back-to-project-list'),
  importFileInput: document.getElementById('import-file-input'),
  sendOnlyBtn: document.getElementById('send-only-btn'),
  projectTitleEl: document.getElementById('project-title'),
  editProjectTitleBtn: document.getElementById('edit-project-title-btn'),
  episodeTitleEl: document.getElementById('episode-title'),
  editEpisodeTitleBtn: document.getElementById('edit-episode-title-btn'),
  addCharacterBtn: document.getElementById('add-character-btn'),
  completeEpisodeBtn: document.getElementById('complete-episode-btn'),
  aiSettingsBtn: document.getElementById('ai-settings-btn'),
  headerMenuBtn: document.getElementById('header-menu-btn'),
  headerMenuPopover: document.getElementById('header-menu-popover'),
  manageCharactersBtn: document.getElementById('manage-characters-btn'),
  playerInputEl: document.getElementById('player-input'),
  inputModeContainer: document.getElementById('input-mode-container'),
  mainInputModeBtn: document.getElementById('main-input-mode-btn'),
  inputModeOptions: document.getElementById('input-mode-options'),
  lengthControlSlider: document.getElementById('length-control-slider'),
  lengthValueDisplay: document.getElementById('length-value-display'),
  footerMenuContainer: document.getElementById('footer-menu-container'),
  mainFooterMenuBtn: document.getElementById('main-footer-menu-btn'),
  footerMenuOptions: document.getElementById('footer-menu-options'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  apiKeySettingsBtn: document.getElementById('api-key-settings-btn'),
  novelViewerOverlay: document.getElementById('novel-viewer-overlay'),
  novelContent: document.getElementById('novel-content'),
  closeNovelViewerBtn: document.getElementById('close-novel-viewer-btn'),
  nextEpisodeBtn: document.getElementById('next-episode-btn'),
  globalLoadingOverlay: document.getElementById('global-loading-overlay'),
  projectSettingsBtn: document.querySelector('.settings-btn'),
  settingsModalOverlay: document.getElementById('settings-modal-overlay'),
  worldSettingInput: document.getElementById('world-setting-input'),
  protagonistSettingInput: document.getElementById('protagonist-setting-input'),
  protagonistPronounInput: document.getElementById('protagonist-pronoun-input'),
  addProjectCharacterBtn: document.getElementById('add-project-character-btn'),
  characterModalOverlay: document.getElementById('character-modal-overlay'),
  characterNameInput: document.getElementById('character-name-input'),
  characterDescInput: document.getElementById('character-desc-input'),
  saveCharacterBtn: document.getElementById('save-character-btn'),
  closeCharacterBtn: document.getElementById('close-character-btn'),
  characterManagementModalOverlay: document.getElementById('character-management-modal-overlay'),
  closeCharacterManagementBtn: document.getElementById('close-character-management-btn'),
  characterListPopover: document.getElementById('character-list-popover'),
  aiSettingsModalOverlay: document.getElementById('ai-settings-modal-overlay'),
  perspectiveButtons: document.getElementById('perspective-buttons'),
  saveAiSettingsBtn: document.getElementById('save-ai-settings-btn'),
  closeAiSettingsBtn: document.getElementById('close-ai-settings-btn'),
  viewerSelectionModalOverlay: document.getElementById('viewer-selection-modal-overlay'),
  viewerSelectionModal: document.getElementById('viewer-selection-modal'),
  viewerSelectionTitle: document.getElementById('viewer-selection-title'),
  viewerSelectionContent: document.getElementById('viewer-selection-content'),
  closeViewerSelectionBtn: document.getElementById('close-viewer-selection-btn'),
  viewerSelectionBackBtn: document.getElementById('viewer-selection-back-btn'),
};

// --- Page Navigation ---
function showPage(pageId) {
  Object.values(ui.pages).forEach(page => {
    page.style.display = 'none';
  });
  ui.pages[pageId].style.display = 'block';
}

// --- Rendering ---
function renderProjectList() {
  ui.projectCardsContainer.querySelectorAll('.card.project-card').forEach(card => card.remove());

  if (!db.projects || db.projects.length === 0) {
      if (!ui.projectCardsContainer.querySelector('.empty-list-message')) {
          ui.projectCardsContainer.insertAdjacentHTML('afterbegin', '<p class="empty-list-message">プロジェクトがありません。「新しい物語を始める」ボタンから始めましょう。</p>');
      }
      return;
  } else {
      const emptyMessage = ui.projectCardsContainer.querySelector('.empty-list-message');
      if (emptyMessage) emptyMessage.remove();
  }

  db.projects.forEach(project => {
    const episodeCount = project.episodes?.length || 0;
    const lastUpdated = project.lastUpdated
      ? new Date(project.lastUpdated).toLocaleString('ja-JP')
      : '更新なし';

    const card = document.createElement('div');
    card.className = 'card project-card';
    card.dataset.id = project.id;
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
    const addButton = ui.projectCardsContainer.querySelector('.add-list-item-btn');
    ui.projectCardsContainer.insertBefore(card, addButton);
  });
}

function renderProjectDetail() {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) {
        renderProjectList();
        showPage('projectList');
        return;
    }

    ui.projectTitleEl.textContent = project.title;
    ui.episodeCardsContainer.querySelectorAll('.card.episode-card').forEach(card => card.remove());

    const addButton = ui.episodeCardsContainer.querySelector('.add-list-item-btn');
    // Clear existing content except the add button
    ui.episodeCardsContainer.innerHTML = '';
    ui.episodeCardsContainer.appendChild(addButton);

    if (!project.episodes || project.episodes.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'エピソードがありません。「+」ボタンから新しいエピソードを作成しましょう。';
        ui.episodeCardsContainer.insertBefore(p, addButton);
        return;
    }

    project.episodes.forEach((episode, index) => {
        const card = document.createElement('div');
        card.className = 'card episode-card';
        card.dataset.id = episode.id; // カード自体にIDを持たせる
        card.innerHTML = `
            <div class="card-main-row">
                <h4>第${index + 1}話：${episode.title}</h4>
                <div class="card-actions">
                    <button class="novel-viewer-btn card-icon-btn" data-id="${episode.id}" title="小説を読む"><span class="material-symbols-outlined">menu_book</span></button>
                    <button class="delete-episode-btn card-icon-btn" data-id="${episode.id}" title="削除"><span class="material-symbols-outlined">delete</span></button>
                </div>
            </div>
            ${episode.summary ? `<div class="card-summary">${episode.summary}</div>` : ''}
        `;
        ui.episodeCardsContainer.insertBefore(card, addButton);
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
    ui.episodeTitleEl.textContent = `第${episodeIndex + 1}話：${episode.title}`;
    ui.chatContainer.innerHTML = '';

    const charCountEl = document.getElementById('episode-char-count');
    if (charCountEl) {
        const completeBtn = document.getElementById('complete-episode-btn');
        const charCount = countEpisodeCharacters(episode);
        charCountEl.textContent = `${charCount.toLocaleString()}文字`;

        const marker = document.getElementById('indicator-marker');
        if (marker) {
            marker.classList.remove('level-low', 'level-mid', 'level-high');
            if (completeBtn) completeBtn.classList.remove('blinking');

            if (charCount <= 1999) {
                marker.classList.add('level-low');
            } else if (charCount <= 3000) {
                marker.classList.add('level-mid');
                if (completeBtn) completeBtn.classList.add('blinking');
            } else {
                marker.classList.add('level-high');
            }
        }
    }
    renderCharacterList(project, episode);

    const firstInsertionPoint = createInsertionPoint(-1);
    ui.chatContainer.appendChild(firstInsertionPoint);

    if (!episode.turns || episode.turns.length === 0) {
        if (episode.initial_ai_question) {
            const systemQuestion = document.createElement('div');
            systemQuestion.className = 'system-question';
            systemQuestion.innerHTML = `<p><strong>【System】</strong> ${episode.initial_ai_question}</p>`;
            ui.chatContainer.appendChild(systemQuestion);
        }
        return;
    }

    episode.turns.forEach((turn, turnIndex) => {
        if (turn.player_input) {
            Object.entries(turn.player_input).forEach(([inputType, inputValue]) => {
                const typeLabels = {
                    action: '行動',
                    speech: '発言',
                    thought: '心の声',
                    system: 'System'
                };

                const turnWrapper = document.createElement('div');
                turnWrapper.className = 'turn-wrapper player-turn';

                const select = document.createElement('select');
                select.className = 'input-type-dropdown';
                select.dataset.turnId = turn.id;
                select.dataset.inputType = inputType;

                Object.keys(typeLabels).forEach(key => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = typeLabels[key];
                    if (key === inputType) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });

                const dropdownWrapper = document.createElement('div');
                dropdownWrapper.className = 'dropdown-wrapper';
                dropdownWrapper.appendChild(select);
                turnWrapper.appendChild(dropdownWrapper);

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
                ui.chatContainer.appendChild(turnWrapper);
            });

            ui.chatContainer.appendChild(createInsertionPoint(turnIndex));
        }
        if (turn.ai_output) {
            if (turn.ai_output.sequence) {
                turn.ai_output.sequence.forEach((item, index) => {
                    if (item.type === 'narration' && item.content) {
                        ui.chatContainer.appendChild(createInsertionPoint(turnIndex, index));
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
                        ui.chatContainer.appendChild(turnWrapper);

                    } else if (item.type === 'reaction') {
                        ui.chatContainer.appendChild(createInsertionPoint(turnIndex, index));
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
                        const hiddenSpeakerTag = document.createElement('div');
                        hiddenSpeakerTag.className = 'speaker-tag';
                        hiddenSpeakerTag.style.display = 'none';
                        hiddenSpeakerTag.innerText = item.character_name;
                        reactionBubble.querySelector('.bubble-content').prepend(hiddenSpeakerTag);

                        turnWrapper.appendChild(reactionBubble);
                        ui.chatContainer.appendChild(turnWrapper);

                        ui.chatContainer.appendChild(createInsertionPoint(turnIndex, index + 1));
                    }
                });
            }
            else if (turn.ai_output.narration || turn.ai_output.character_reactions) {
                 const narrationBubble = document.createElement('div');
                 narrationBubble.className = 'chat-message ai';
                 let oldContent = turn.ai_output.narration || '';
                 if(turn.ai_output.character_reactions){
                     oldContent += turn.ai_output.character_reactions.map(r => `<br>${r.character_name}「${r.speech}」`).join('');
                 }
                 narrationBubble.innerHTML = `<div class="bubble-content"><p>${oldContent.replace(/\n/g, '<br>')}</p></div>`;
                 ui.chatContainer.appendChild(narrationBubble);
            }

            if (turn.ai_output.system_question) {
                const systemQuestion = document.createElement('div');
                systemQuestion.className = 'system-question';
                systemQuestion.innerHTML = `<p><strong>【System】</strong> ${turn.ai_output.system_question}</p>`;
                ui.chatContainer.appendChild(systemQuestion);
            }
        }
    });
    ui.chatContainer.scrollTop = ui.chatContainer.scrollHeight;
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
    ui.characterListPopover.innerHTML = '';

    // プロジェクトに登録されている全キャラクターを取得 (オブジェクトの配列として)
    const projectCharacters = project.characters || [];
    const uniqueCharNames = [...new Set(projectCharacters.map(char => char.name))];

    if (uniqueCharNames.length === 0) {
        ui.characterListPopover.innerHTML = '<p style="padding: 5px; font-size: 0.9em; color: #888;">利用可能なキャラクターがいません。</p>';
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
        ui.characterListPopover.appendChild(item);
    });
}

function generateNovelFromEpisode(project, episode) {
    let novelText = '';
    const episodeIndex = project.episodes.findIndex(e => e.id === episode.id);

    novelText += `<h1 class="novel-title">${project.title}</h1>`;
    novelText += `<h2 class="novel-episode-title">第${episodeIndex + 1}話：${episode.title}</h2>`;
    novelText += `<p>&nbsp;</p>`;

    episode.turns.forEach(turn => {
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
        }

        if (turn.ai_output) {
            if (turn.ai_output.sequence && turn.ai_output.sequence.length > 0) {
                turn.ai_output.sequence.forEach(item => {
                    if (item.type === 'narration' && item.content) {
                        novelText += `<p>${item.content.replace(/\n/g, '</p><p>')}</p>`;
                    } else if (item.type === 'reaction') {
                        novelText += `<p>「${item.speech}」</p>`;
                    }
                });
            } else {
                if (turn.ai_output.narration) {
                    novelText += `<p>${(turn.ai_output.narration || '').replace(/\n/g, '</p><p>')}</p>`;
                }
                if (turn.ai_output.character_reactions) {
                    turn.ai_output.character_reactions.forEach(reaction => {
                        novelText += `<p>「${reaction.speech}」</p>`;
                    });
                }
            }
        }
    });

    return novelText;
}

function countEpisodeCharacters(episode) {
    if (!episode || !episode.turns) return 0;

    let totalChars = 0;

    episode.turns.forEach(turn => {
        if (turn.player_input) {
            if (turn.player_input.action) totalChars += turn.player_input.action.length;
            if (turn.player_input.speech) totalChars += turn.player_input.speech.length;
            if (turn.player_input.thought) totalChars += turn.player_input.thought.length;
        }

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
                if (turn.ai_output.narration) totalChars += turn.ai_output.narration.length;
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

function updateThemeIcon(isDarkMode) {
    document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn-clone').forEach(btn => {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = isDarkMode ? 'light_mode' : 'dark_mode';
        }
    });
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark';
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeIcon(isDarkMode);
}

function openProjectSettings() {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    if (typeof project.protagonist === 'string') {
        project.protagonist = { desc: project.protagonist, pronoun: '' };
    } else if (!project.protagonist) {
        project.protagonist = { desc: '', pronoun: '' };
    }

    ui.worldSettingInput.value = project.world || '';
    ui.protagonistSettingInput.value = project.protagonist.desc || '';
    ui.protagonistPronounInput.value = project.protagonist?.pronoun || '';

    renderProjectCharacterEditor(project);
    document.getElementById('project-character-detail-area').style.display = 'none';

    ui.settingsModalOverlay.style.display = 'flex';
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

    if (Object.keys(charactersByFaction).length === 0) {
        container.innerHTML = '<p style="font-size: 0.9em; color: var(--secondary-text-color);">登録されているキャラクターはいません。</p>';
    } else {
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
    }

    const factionSuggestions = document.getElementById('faction-suggestions');
    const uniqueFactions = [...new Set((project.characters || []).map(c => c.faction).filter(Boolean))];
    factionSuggestions.innerHTML = uniqueFactions.map(f => `<option value="${f}"></option>`).join('');
}

function deleteCharacter(charId) {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const character = project.characters.find(c => c.id === charId);
    if (character && confirm(`「${character.name}」を削除しますか？`)) {
        project.characters = project.characters.filter(c => c.id !== charId);
        saveDB();
        renderProjectCharacterEditor(project);
        document.getElementById('project-character-detail-area').style.display = 'none';
    }
}

function openNovelViewer(episodeId) {
    currentViewingEpisodeId = episodeId;
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentViewingEpisodeId);
    if (!episode) return;

    ui.viewerSelectionModalOverlay.style.display = 'none';
    const novelHtml = generateNovelFromEpisode(project, episode);
    ui.novelContent.innerHTML = novelHtml;
    ui.novelViewerOverlay.style.display = 'flex';

    const novelViewer = document.getElementById('novel-viewer');
    novelViewer.scrollLeft = novelViewer.scrollWidth;
    handleNovelScroll(); // スクロール位置設定後に呼び出す
}

function handleNovelScroll() {
    const novelViewer = document.getElementById('novel-viewer');
    if (!novelViewer) return;

    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const currentEpisodeIndex = project.episodes.findIndex(e => e.id === currentViewingEpisodeId);
    const hasNextEpisode = currentEpisodeIndex !== -1 && currentEpisodeIndex < project.episodes.length - 1;

    if (novelViewer.scrollLeft === 0 && hasNextEpisode) {
        ui.nextEpisodeBtn.style.display = 'flex';
    } else {
        ui.nextEpisodeBtn.style.display = 'none';
    }
}

function openViewerSelectionModal() {
    viewerSelectionProjectId = null;
    renderViewerProjectList();
    ui.viewerSelectionModalOverlay.style.display = 'flex';
}

function renderViewerProjectList() {
    ui.viewerSelectionTitle.textContent = 'プロジェクトを選択';
    ui.viewerSelectionBackBtn.style.display = 'none';
    ui.viewerSelectionContent.innerHTML = '';

    if (!db.projects || db.projects.length === 0) {
        ui.viewerSelectionContent.innerHTML = '<p>表示できるプロジェクトがありません。</p>';
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
    ui.viewerSelectionContent.appendChild(list);
}

function renderViewerEpisodeList(projectId) {
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return;

    viewerSelectionProjectId = projectId;
    ui.viewerSelectionTitle.textContent = 'エピソードを選択';
    ui.viewerSelectionBackBtn.style.display = 'inline-flex';
    ui.viewerSelectionContent.innerHTML = '';

    if (!project.episodes || project.episodes.length === 0) {
        ui.viewerSelectionContent.innerHTML = '<p>表示できるエピソードがありません。</p>';
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
    ui.viewerSelectionContent.appendChild(list);
}

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

function updatePerspectiveButtons(activePerspective) {
    ui.perspectiveButtons.querySelectorAll('.perspective-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.perspective === activePerspective);
    });
}

function closeCharacterModal() {
    ui.characterModalOverlay.style.display = 'none';
    document.getElementById('character-faction-input').value = ''; // 勢力入力欄もリセット
}

function autoResizeTextarea() {
    ui.playerInputEl.style.height = 'auto';
    const scrollHeight = ui.playerInputEl.scrollHeight;
    ui.playerInputEl.style.height = `${scrollHeight}px`;
}

function handleEditClick(button) {
    const turnId = button.dataset.turnId;
    const bubble = button.closest('.chat-message');

    const existingEdit = document.querySelector('.chat-message.editing');
    if (existingEdit) {
        renderEpisodeEditor();
    }

    const contentContainer = bubble.querySelector('.bubble-content');
    if (!contentContainer) return;

    const itemIndex = button.dataset.itemIndex;
    const isPlayer = bubble.classList.contains('player') || bubble.classList.contains('player-system');
    const isAI = bubble.classList.contains('ai');

    const turn = db.projects.find(p => p.id === currentProjectId)?.episodes.find(e => e.id === currentEpisodeId)?.turns.find(t => t.id === turnId);
    if (!turn) return;

    bubble.classList.add('editing');
    contentContainer.setAttribute('contenteditable', 'true');
    contentContainer.focus();

    const actions = document.createElement('div');
    actions.className = 'inline-edit-actions';

    if (isPlayer) {
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
        renderEpisodeEditor();
    });

    actions.querySelector('.save-edit-btn').addEventListener('click', () => {
        const newText = contentContainer.innerText.trim();
        const project = db.projects.find(p => p.id === currentProjectId);
        const episode = project?.episodes.find(e => e.id === currentEpisodeId);
        const turn = episode?.turns.find(t => t.id === turnId);

        if (turn) {
            if (isPlayer) {
                const activeTypeButton = bubble.querySelector('.edit-type-btn.active');
                const newType = activeTypeButton ? activeTypeButton.dataset.mode : Object.keys(turn.player_input)[0];
                turn.player_input = { [newType]: newText };
            } else if (isAI && turn.ai_output?.sequence) {
                const item = turn.ai_output?.sequence?.[itemIndex];
                if (item?.type === 'narration') {
                    item.content = newText;
                } else if (item?.type === 'reaction') {
                    const speakerEl = contentContainer.querySelector('.speaker-tag');
                    const speechEl = contentContainer.querySelector('p');
                    const newSpeaker = speakerEl ? speakerEl.innerText.trim() : '';
                    const newSpeech = speechEl ? speechEl.innerText.trim().replace(/^「|」$/g, '') : '';

                    if (newSpeaker && newSpeech) {
                        item.character_name = newSpeaker;
                        item.speech = newSpeech;
                    } else if (newText === '') {
                        turn.ai_output.sequence.splice(itemIndex, 1);
                    } else {
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
            player_input: { action: '' },
            ai_output: null,
            timestamp: new Date().toISOString()
        };
        const insertionIndex = turnIndex + 1;
        episode.turns.splice(insertionIndex, 0, newTurn);

    } else if (type === 'narration' || type === 'character') {
        const newItem = {
            type: type === 'narration' ? 'narration' : 'reaction',
            content: type === 'narration' ? '' : undefined,
            character_name: type === 'character' ? 'キャラクター名' : undefined,
            speech: type === 'character' ? '' : undefined,
        };

        if (turnIndex === -1) {
            const newTurn = {
                id: Date.now().toString(),
                player_input: null,
                ai_output: { sequence: [newItem] },
                timestamp: new Date().toISOString()
            };
            episode.turns.unshift(newTurn);
        } else {
            const targetPlayerTurn = episode.turns[turnIndex];

            if (!targetPlayerTurn.ai_output) {
                targetPlayerTurn.ai_output = { sequence: [] };
            } else if (!targetPlayerTurn.ai_output.sequence) {
                targetPlayerTurn.ai_output.sequence = [];
            }

            const targetItemIndex = itemIndex === -1 ? 0 : itemIndex;
            targetPlayerTurn.ai_output.sequence.splice(targetItemIndex, 0, newItem);
        }
    }

    saveDB();
    renderEpisodeEditor();
}

function handleDeleteClick(button) {
    if (!confirm("このバブルを削除しますか？")) {
        return;
    }

    const turnId = button.dataset.turnId;
    const itemIndex = button.dataset.itemIndex;

    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    const turnIndex = episode.turns.findIndex(t => t.id === turnId);
    if (turnIndex === -1) return;

    if (itemIndex !== undefined) {
        const turn = episode.turns[turnIndex];
        if (turn.ai_output && turn.ai_output.sequence) {
            turn.ai_output.sequence.splice(itemIndex, 1);
        }
    } else {
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

async function handlePlayerInput(shouldTriggerAi = false) {
    const playerInputValue = ui.playerInputEl.value.trim();
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);

    // ボタンを無効化
    ui.aiGenerateBtn.disabled = true;
    ui.sendOnlyBtn.disabled = true;

    try {
        if (!episode) {
            console.error("handlePlayerInput: Episode not found.");
            return; // ここで処理を終了
        }

        let turnForAi = null;

        // 1. プレイヤーの入力がある場合
        if (playerInputValue) {
            const lastTurn = episode.turns.length > 0 ? episode.turns[episode.turns.length - 1] : null;
            if (lastTurn && !lastTurn.ai_output) {
                lastTurn.player_input[currentInputMode] = playerInputValue;
                turnForAi = lastTurn;
            } else {
                const newTurn = { id: Date.now().toString(), player_input: { [currentInputMode]: playerInputValue }, ai_output: null, timestamp: new Date().toISOString() };
                episode.turns.push(newTurn);
                turnForAi = newTurn;
            }
            saveDB();
            renderEpisodeEditor();
            ui.playerInputEl.value = '';
            autoResizeTextarea();
            ui.playerInputEl.focus();
        } 
        // 2. プレイヤー入力がなく、AI生成が要求された場合
        else if (shouldTriggerAi) {
            const lastTurn = episode.turns.length > 0 ? episode.turns[episode.turns.length - 1] : null;
            if (lastTurn && !lastTurn.ai_output) {
                turnForAi = lastTurn;
            } else {
                const newTurn = { id: Date.now().toString(), player_input: {}, ai_output: null, timestamp: new Date().toISOString() };
                episode.turns.push(newTurn);
                turnForAi = newTurn;
                saveDB();
                renderEpisodeEditor();
            }
        }

        // 3. AI生成を実行
        if (shouldTriggerAi && turnForAi && !turnForAi.ai_output) {
            // AI生成前に、対象ターンのplayer_inputがnull/undefinedでないことを保証する
            if (!turnForAi.player_input) {
                turnForAi.player_input = {};
            }

            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.textContent = 'AIが物語を生成中です...';
            ui.playerInputEl.disabled = true;
            ui.globalLoadingOverlay.style.display = 'flex';
            await generateAiResponse(project, episode, turnForAi);
        }
    } finally {
        // 処理がどの経路を辿っても、必ずボタンを再度有効化する
        ui.playerInputEl.disabled = false;
        ui.aiGenerateBtn.disabled = false;
        ui.sendOnlyBtn.disabled = false;
        ui.playerInputEl.focus();
    }
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

            if (!importedProject.title || !importedProject.episodes) {
                throw new Error('無効なプロジェクトファイルです。');
            }

            importedProject.id = Date.now().toString();
            importedProject.lastUpdated = new Date().toISOString();

            db.projects.push(importedProject);
            saveDB();
            renderProjectList();
            alert(`「${importedProject.title}」をインポートしました。`);
        } catch (error) {
            alert(`ファイルのインポートに失敗しました: ${error.message}`);
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function showAiLoadingBubble() {
    // This function is a placeholder. You might want to show a temporary bubble in the UI.
    // For now, the global loading overlay is used.
}