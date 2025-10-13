function initializeEventListeners() {

  // Back buttons
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.back-btn')) {
      const targetPage = e.target.closest('.back-btn').dataset.target;
      if (targetPage) {
        if (targetPage === 'project-list-page') {
          renderProjectList();
          showPage('projectList');
        } else if (targetPage === 'project-detail-page') {
          renderProjectDetail();
          showPage('projectDetail');
        }
      }
    }
  });

  // Footer menu buttons
  document.querySelectorAll('.app-menu-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPageId = btn.dataset.target.replace('-page', ''); // 'project-list-page' -> 'projectList'
      showPage(targetPageId);
    });
  });

  // Specific handler for the back button in the project detail footer
  if (ui.footerBackToProjectListBtn) {
    ui.footerBackToProjectListBtn.addEventListener('click', () => showPage('projectList'));
  }

  // --- Project List Page ---

  // New Project Button
  ui.newProjectBtn.addEventListener('click', () => {
    const title = prompt('新しい物語のタイトルを入力してください:', '無題の物語');
    if (title) {
      const newProject = {
        id: Date.now().toString(),
        title: title,
        world: '',
        episodes: [],
        characters: [],
        protagonist: { desc: '', pronoun: '' },
        ai_settings: { perspective: 'third' },
        lastUpdated: new Date().toISOString(),
      };
      db.projects.push(newProject);
      saveDB();
      renderProjectList();
    }
  });

  // Project cards container event delegation
  ui.projectCardsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;

    // Delete button
    if (e.target.closest('.delete-project-btn')) {
      const projectId = card.dataset.id;
      const project = db.projects.find(p => p.id === projectId);
      if (project && confirm(`「${project.title}」を削除しますか？この操作は元に戻せません。`)) {
        db.projects = db.projects.filter(p => p.id !== projectId);
        saveDB();
        renderProjectList();
      }
      return; // Prevent navigating to detail page
    }

    // Export button
    if (e.target.closest('.export-project-btn')) {
      const projectId = card.dataset.id;
      exportProject(projectId);
      return;
    }

    // Open project detail
    currentProjectId = card.dataset.id;
    renderProjectDetail();
    showPage('projectDetail');
  });

  // --- Project Detail Page ---

  // New Episode Button
  ui.newEpisodeBtn.addEventListener('click', () => {
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
        characters: '', // 旧仕様との互換性のため残す
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

  // Episode cards container event delegation
  ui.episodeCardsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.episode-card');
    if (!card) return;

    // Delete button
    if (e.target.closest('.delete-episode-btn')) {
      const episodeId = card.dataset.id;
      const project = db.projects.find(p => p.id === currentProjectId);
      const episode = project?.episodes.find(ep => ep.id === episodeId);
      if (episode && confirm(`「${episode.title}」を削除しますか？`)) {
        project.episodes = project.episodes.filter(ep => ep.id !== episodeId);
        saveDB();
        renderProjectDetail();
      }
      return;
    }

    // Open episode editor
    currentEpisodeId = card.dataset.id;
    renderEpisodeEditor();
    showPage('episodeEditor');
  });

  // Novel viewer button on episode card
  ui.episodeCardsContainer.addEventListener('click', (e) => {
    const viewerBtn = e.target.closest('.novel-viewer-btn');
    if (viewerBtn) {
      e.stopPropagation(); // Prevent navigating to editor
      const episodeId = viewerBtn.dataset.id;
      openNovelViewer(episodeId);
    }
  });

  // Edit Project Title
  ui.editProjectTitleBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;
    const newTitle = prompt('新しいプロジェクトタイトルを入力してください:', project.title.trim());
    if (newTitle && newTitle.trim() !== project.title) {
      project.title = newTitle.trim();
      project.lastUpdated = new Date().toISOString();
      saveDB();
      ui.projectTitleEl.textContent = project.title; // 画面上のタイトルを直接更新
      renderProjectList(); // 一覧にも変更を反映
    }
  });

  // Open Project Settings Modal
  ui.projectSettingsBtn.addEventListener('click', openProjectSettings);

  // --- Settings Modal ---
  ui.settingsModalOverlay.addEventListener('click', (e) => {
    if (e.target === ui.settingsModalOverlay) {
      ui.settingsModalOverlay.style.display = 'none';
    }
  });

  // Auto-save for settings
  [ui.worldSettingInput, ui.protagonistSettingInput, ui.protagonistPronounInput].forEach(input => {
    input.addEventListener('input', () => {
      const project = db.projects.find(p => p.id === currentProjectId);
      if (!project) return;
      project.world = ui.worldSettingInput.value;
      if (!project.protagonist) project.protagonist = {};
      project.protagonist.desc = ui.protagonistSettingInput.value;
      project.protagonist.pronoun = ui.protagonistPronounInput.value;
      saveDB();
    });
  });

  // Project settings character management
  ui.addProjectCharacterBtn.addEventListener('click', () => {
    characterModalContext = 'project';
    ui.characterNameInput.value = '';
    ui.characterDescInput.value = '';
    ui.characterModalOverlay.style.display = 'flex';
  });

  document.getElementById('project-character-list-container').addEventListener('click', (e) => {
    const item = e.target.closest('.character-list-item');
    if (item) {
      const charId = item.dataset.charId;
      const project = db.projects.find(p => p.id === currentProjectId);
      const character = project?.characters.find(c => c.id === charId);
      if (character) {
        document.querySelectorAll('.character-list-item.active').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        const detailArea = document.getElementById('project-character-detail-area');
        detailArea.style.display = 'block';
        detailArea.dataset.editingCharId = charId;

        document.getElementById('edit-char-name-input').value = character.name || '';
        document.getElementById('edit-char-faction-input').value = character.faction || '';
        document.getElementById('edit-char-desc-input').value = character.description || '';
      }
    }
  });

  // Auto-save for character details in project settings
  ['edit-char-name-input', 'edit-char-faction-input', 'edit-char-desc-input'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      const detailArea = document.getElementById('project-character-detail-area');
      const charId = detailArea.dataset.editingCharId;
      const project = db.projects.find(p => p.id === currentProjectId);
      const character = project?.characters.find(c => c.id === charId);
      if (character) {
        if (e.target.id === 'edit-char-name-input') character.name = e.target.value;
        if (e.target.id === 'edit-char-faction-input') character.faction = e.target.value;
        if (e.target.id === 'edit-char-desc-input') character.description = e.target.value;
        saveDB();
        renderProjectCharacterEditor(project); // Re-render list to reflect changes
        // Keep selection
        const newItem = document.querySelector(`.character-list-item[data-char-id="${charId}"]`);
        if (newItem) newItem.classList.add('active');
      }
    });
  });

  document.getElementById('delete-char-btn').addEventListener('click', (e) => {
    const charId = document.getElementById('project-character-detail-area').dataset.editingCharId;
    deleteCharacter(charId);
  });

  // --- Editor Page ---

  // Edit Episode Title
  ui.editEpisodeTitleBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;
    const newTitle = prompt('新しいエピソード名を入力してください:', episode.title);
    if (newTitle && newTitle.trim() !== episode.title) {
      episode.title = newTitle.trim();
      project.lastUpdated = new Date().toISOString();
      saveDB();
      renderEpisodeEditor(); // 編集画面のタイトルを更新
      renderProjectDetail(); // 詳細画面（エピソード一覧）も更新しておく
    }
  });

  // Header Menu Popover
  ui.headerMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.headerMenuPopover.style.display = ui.headerMenuPopover.style.display === 'block' ? 'none' : 'block';
  });

  // Character Management Modal
  ui.manageCharactersBtn.addEventListener('click', () => {
    ui.characterManagementModalOverlay.style.display = 'flex';
    ui.headerMenuPopover.style.display = 'none';
  });
  ui.closeCharacterManagementBtn.addEventListener('click', () => ui.characterManagementModalOverlay.style.display = 'none');
  ui.characterListPopover.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      updateActiveCharacters(e.target.dataset.name, e.target.checked);
    }
  });

  // Add Character Modal
  ui.addCharacterBtn.addEventListener('click', () => {
    characterModalContext = 'episode';
    ui.characterNameInput.value = '';
    ui.characterDescInput.value = '';
    ui.characterModalOverlay.style.display = 'flex';
    ui.headerMenuPopover.style.display = 'none';
  });
  ui.closeCharacterBtn.addEventListener('click', closeCharacterModal);
  ui.saveCharacterBtn.addEventListener('click', () => {
    const name = ui.characterNameInput.value.trim();
    const desc = ui.characterDescInput.value.trim();
    const faction = document.getElementById('character-faction-input').value.trim();

    if (!name) {
      alert('キャラクター名を入力してください。');
      return;
    }

    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    if (!project.characters) project.characters = [];
    project.characters.push({ id: Date.now().toString(), name, description: desc, faction });
    saveDB();

    if (characterModalContext === 'project') {
      renderProjectCharacterEditor(project);
    } else {
      const episode = project.episodes.find(e => e.id === currentEpisodeId);
      renderCharacterList(project, episode);
    }
    closeCharacterModal();
  });

  // AI Settings Modal
  ui.aiSettingsBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (project) {
      updatePerspectiveButtons(project.ai_settings?.perspective || 'third');
    }
    ui.aiSettingsModalOverlay.style.display = 'flex';
    ui.headerMenuPopover.style.display = 'none';
  });
  ui.closeAiSettingsBtn.addEventListener('click', () => ui.aiSettingsModalOverlay.style.display = 'none');
  ui.perspectiveButtons.addEventListener('click', (e) => {
    if (e.target.classList.contains('perspective-btn')) {
      updatePerspectiveButtons(e.target.dataset.perspective);
    }
  });
  ui.saveAiSettingsBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    const activeBtn = ui.perspectiveButtons.querySelector('.perspective-btn.active');
    if (project && activeBtn) {
      if (!project.ai_settings) project.ai_settings = {};
      project.ai_settings.perspective = activeBtn.dataset.perspective;
      saveDB();
      ui.aiSettingsModalOverlay.style.display = 'none';
    }
  });

  // --- Episode Completion ---
  ui.completeEpisodeBtn.addEventListener('click', async () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    const episode = project?.episodes.find(e => e.id === currentEpisodeId);
    if (!episode) return;

    if (confirm(`「${episode.title}」を完了しますか？\n完了するとAIがこのエピソードのあらすじを生成します。`)) {
      const loadingText = document.getElementById('loading-text');
      if (loadingText) {
        loadingText.textContent = 'AIがあらすじを生成中です...';
      }
      ui.globalLoadingOverlay.style.display = 'flex';

      const summary = await generateEpisodeSummary(project, episode);
      episode.summary = summary;
      saveDB();

      ui.globalLoadingOverlay.style.display = 'none';
      alert('エピソードを完了し、あらすじを保存しました。');
    }
  });

  // AI Generate Button
  ui.aiGenerateBtn.addEventListener('click', () => handlePlayerInput(true));

  // Send Only Button
  ui.sendOnlyBtn.addEventListener('click', () => handlePlayerInput(false));

  // --- Footer Menu Actions ---
  ui.importFileInput.addEventListener('change', handleImportFile);

  // --- Editor Page Chat Bubble Actions ---
  ui.chatContainer.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.bubble-edit-btn');
    const deleteBtn = e.target.closest('.bubble-delete-btn');
    const regenerateBtn = e.target.closest('.bubble-regenerate-btn');
    const addBubbleBtn = e.target.closest('.add-bubble-btn');

    if (editBtn) handleEditClick(editBtn);
    if (deleteBtn) handleDeleteClick(deleteBtn);
    if (regenerateBtn) handleRegenerateClick(regenerateBtn);
    if (addBubbleBtn) showInsertionMenu(addBubbleBtn);
  });

  // --- Editor Page Footer Controls ---
  ui.playerInputEl.addEventListener('input', (e) => {
    autoResizeTextarea(e);
    // ボタンの非活性化ロジックを削除し、常に入力できるようにします。
  });

  ui.lengthControlSlider.addEventListener('input', (e) => {
    ui.lengthValueDisplay.textContent = e.target.value;
  });

  ui.mainInputModeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.inputModeOptions.style.display = ui.inputModeOptions.style.display === 'block' ? 'none' : 'block';
  });

  ui.inputModeOptions.addEventListener('click', (e) => {
    const button = e.target.closest('.input-mode-btn');
    if (button) {
      currentInputMode = button.dataset.mode;
      ui.mainInputModeBtn.innerHTML = button.innerHTML;
      ui.inputModeOptions.style.display = 'none';
    }
  });

  // --- Global Click Listener for Popovers ---
  document.addEventListener('click', (event) => { // Renamed to event for clarity
    const target = event.target;
    // Close header menu if click is outside
    if (ui.headerMenuPopover.style.display === 'block' && !ui.headerMenuBtn.contains(target)) {
      ui.headerMenuPopover.style.display = 'none';
    }
    // Close input mode options if click is outside
    if (ui.inputModeOptions.style.display === 'block' && !ui.mainInputModeBtn.contains(target)) {
      ui.inputModeOptions.style.display = 'none';
    }
    // Close footer settings menu if click is outside
    document.querySelectorAll('#footer-menu-options, .footer-menu-options-clone').forEach(optionsNode => {
      const container = optionsNode.closest('#footer-menu-container, .footer-menu-container-clone');
      if (optionsNode.style.display === 'block' && container && !container.contains(target)) {
        optionsNode.style.display = 'none';
      }
    });
  });

  // --- Footer Settings Menu ---
  // Use event delegation on the body to handle original and cloned footer menus
  document.body.addEventListener('click', (event) => {
    const target = event.target;
    const actionBtn = target.closest('.app-menu-btn[data-action]');

    // Main settings button (original and clones)
    if (target.closest('#main-footer-menu-btn') || target.closest('.main-footer-menu-btn-clone')) {
      event.stopPropagation();
      const menuContainer = target.closest('#footer-menu-container, .footer-menu-container-clone');
      if (menuContainer) {
        const options = menuContainer.querySelector('#footer-menu-options, .footer-menu-options-clone');
        if (options) {
          options.style.display = options.style.display === 'block' ? 'none' : 'block';
        }
      }
    } else if (target.closest('#theme-toggle-btn') || target.closest('.theme-toggle-btn-clone')) {
      const isDarkMode = !document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      applySavedTheme();
    } else if (target.closest('#api-key-settings-btn') || target.closest('.api-key-settings-btn-clone')) {
      const currentKey = localStorage.getItem('GG_API_KEY') || '';
      const newKey = prompt('Gemini APIキーを入力してください:', currentKey);
      if (newKey !== null) {
        localStorage.setItem('GG_API_KEY', newKey);
        alert('APIキーを保存しました。');
      }
    } else if (actionBtn) {
      const action = actionBtn.dataset.action;
      switch (action) {
        case 'open-generator': openGeneratorModal(); break;
        case 'open-viewer': openViewerSelectionModal(); break;
        case 'import': ui.importFileInput.click(); break;
      }
    }
  });

  // --- Novel Viewer ---
  ui.closeNovelViewerBtn.addEventListener('click', () => {
    ui.novelViewerOverlay.style.display = 'none';
  });
  document.getElementById('novel-viewer').addEventListener('scroll', handleNovelScroll);
  ui.nextEpisodeBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    const currentEpisodeIndex = project.episodes.findIndex(e => e.id === currentViewingEpisodeId);
    const nextEpisode = project.episodes[currentEpisodeIndex + 1];
    if (nextEpisode) {
      openNovelViewer(nextEpisode.id);
    }
  });

  // --- Viewer Selection Modal ---
  ui.closeViewerSelectionBtn.addEventListener('click', () => ui.viewerSelectionModalOverlay.style.display = 'none');
  ui.viewerSelectionBackBtn.addEventListener('click', renderViewerProjectList);
  ui.viewerSelectionContent.addEventListener('click', (e) => {
    const projectItem = e.target.closest('[data-project-id]');
    const episodeItem = e.target.closest('[data-episode-id]');

    if (episodeItem) {
      openNovelViewer(episodeItem.dataset.episodeId);
    } else if (projectItem) {
      currentProjectId = projectItem.dataset.projectId;
      renderViewerEpisodeList(projectItem.dataset.projectId);
    }
  });

  // Add other event listeners as needed...
}