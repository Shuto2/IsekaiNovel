function initializeEventListeners() {
  // Page Navigation
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.target.closest('.back-btn');
      if (!button) return;

      // data-target属性がないボタン（ジェネレーターの戻るボタンなど）は何もしない
      if (!button.dataset.target) return;

      const targetPageId = button.dataset.target.replace('-page', '').replace(/-(\w)/g, (match, letter) => letter.toUpperCase());

      if (targetPageId === 'projectList') {
        currentProjectId = null;
        renderProjectList();
      } else if (targetPageId === 'projectDetail') {
        currentEpisodeId = null;
        renderProjectDetail();
      }
      showPage(targetPageId);
    });
  });

  if (ui.footerBackToProjectListBtn) {
    ui.footerBackToProjectListBtn.addEventListener('click', () => {
      currentProjectId = null;
      renderProjectList();
      showPage('projectList');
    });
  }

  // App Menu Navigation
  document.querySelectorAll('.app-menu').forEach(menu => {
    menu.addEventListener('click', (e) => {
      const button = e.target.closest('button.app-menu-btn');

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
        ui.importFileInput.click();
      } else if (button.dataset.action === 'open-viewer') {
        openViewerSelectionModal();
      } else if (button.dataset.action === 'open-generator') {
        openGeneratorModal();
      }
    });
  });

  // Project List Page
  ui.newProjectBtn.addEventListener('click', () => {
    const title = prompt("新しいプロジェクトのタイトルを入力してください:", "無題の物語");
    if (title) {
      const newProject = {
        id: Date.now().toString(),
        title: title,
        episodes: [],
        world: '',
        characters: [],
        protagonist: { desc: '', pronoun: '' },
        lastUpdated: new Date().toISOString(),
      };
      db.projects.push(newProject);
      saveDB();
      renderProjectList();
    }
  });

  ui.projectCardsContainer.addEventListener('click', (e) => {
    if (ui.pages.projectList.style.display === 'none') return;

    const deleteBtn = e.target.closest('.delete-project-btn');
    if (deleteBtn) {
      const projectId = deleteBtn.dataset.id;
      if (confirm("本当にこのプロジェクトを削除しますか？元に戻せません。")) {
        db.projects = db.projects.filter(p => p.id !== projectId);
        saveDB();
        renderProjectList();
      }
      return;
    }

    const exportBtn = e.target.closest('.export-project-btn');
    if (exportBtn) {
      exportProject(exportBtn.dataset.id);
      return;
    }

    const card = e.target.closest('.project-card');
    if (card) {
      currentProjectId = card.dataset.id;
      renderProjectDetail();
      showPage('projectDetail');
    }
  });

  // Project Detail Page
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

  if (ui.episodeCardsContainer) {
    ui.episodeCardsContainer.addEventListener('click', (e) => {
      if (ui.pages.projectDetail.style.display === 'none') return;

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

      // カード自体がクリックされた場合の処理
      const card = e.target.closest('.episode-card');
      if (card) {
        currentEpisodeId = card.dataset.id;
        renderEpisodeEditor();
        currentViewingEpisodeId = currentEpisodeId;
        showPage('episodeEditor');
        return;
      }
    });
  }

  // Theme Toggle
  ui.themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDarkMode = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      updateThemeIcon(isDarkMode);
  });

  // API Key Settings
  ui.apiKeySettingsBtn.addEventListener('click', () => {
    const currentKey = localStorage.getItem('GG_API_KEY') || '';
    const newKey = prompt('Google Generative Language API Key を入力してください:', currentKey);

    if (newKey !== null) {
      localStorage.setItem('GG_API_KEY', newKey);
      alert('APIキーを保存しました。');
    }
  });

  // File Import
  ui.importFileInput.addEventListener('change', handleImportFile);

  // Project Settings Modal
  if (ui.projectSettingsBtn) {
    ui.projectSettingsBtn.addEventListener('click', () => {
      if (ui.pages.projectDetail.style.display === 'none') return;
      openProjectSettings();
    });
  }
  ui.settingsModalOverlay.addEventListener('click', (e) => {
      if (e.target === ui.settingsModalOverlay) ui.settingsModalOverlay.style.display = 'none';
  });

  const autoSaveProjectSettings = () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    project.world = ui.worldSettingInput.value.trim();
    if (!project.protagonist) project.protagonist = {};
    project.protagonist.desc = ui.protagonistSettingInput.value.trim();
    project.protagonist.pronoun = ui.protagonistPronounInput.value.trim();
    project.lastUpdated = new Date().toISOString();
    saveDB();
  };
  ui.worldSettingInput.addEventListener('input', autoSaveProjectSettings);
  ui.protagonistSettingInput.addEventListener('input', autoSaveProjectSettings);
  ui.protagonistPronounInput.addEventListener('input', autoSaveProjectSettings);

  // Character Editor in Project Settings
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
      deleteCharacter(charId);
      return;
    }

    saveDB();
    activeItem.textContent = character.name;

    if (e.target.id === 'edit-char-faction-input' && oldFaction !== character.faction) {
      renderProjectCharacterEditor(project);
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

  ui.addProjectCharacterBtn.addEventListener('click', () => {
    const project = db.projects.find(p => p.id === currentProjectId);
    if (!project) return;

    const newChar = {
        id: Date.now().toString() + Math.random(),
        name: '新しいキャラクター',
        description: '',
        faction: ''
    };
    if (!project.characters) project.characters = [];
    project.characters.push(newChar);
    saveDB();
    renderProjectCharacterEditor(project);

    setTimeout(() => {
        const newItemEl = document.querySelector(`.character-list-item[data-char-id="${newChar.id}"]`);
        if (newItemEl) newItemEl.click();
    }, 0);
  });

  document.getElementById('project-character-list-container').addEventListener('click', (e) => {
      const listItem = e.target.closest('.character-list-item');
      if (!listItem) return;

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

  // Title Editing
  ui.editProjectTitleBtn.addEventListener('click', () => {
      const project = db.projects.find(p => p.id === currentProjectId);
      if (!project) return;
      const newTitle = prompt("新しいプロジェクトタイトルを入力してください:", project.title);
      if (newTitle && newTitle.trim() !== project.title) {
          project.title = newTitle.trim();
          project.lastUpdated = new Date().toISOString();
          saveDB();
          ui.projectTitleEl.textContent = project.title;
          renderProjectList();
      }
  });

  ui.editEpisodeTitleBtn.addEventListener('click', () => {
      const project = db.projects.find(p => p.id === currentProjectId);
      const episode = project?.episodes.find(e => e.id === currentEpisodeId);
      if (!episode) return;
      const newTitle = prompt("新しいエピソード名を入力してください:", episode.title);
      if (newTitle && newTitle.trim() !== episode.title) {
          episode.title = newTitle.trim();
          project.lastUpdated = new Date().toISOString();
          saveDB();
          ui.episodeTitleEl.textContent = episode.title;
          renderProjectDetail();
      }
  });

  // Novel Viewer
  document.getElementById('novel-viewer').addEventListener('scroll', handleNovelScroll);
  ui.nextEpisodeBtn.addEventListener('click', () => {
      const project = db.projects.find(p => p.id === currentProjectId);
      if (!project) return;
      const currentEpisodeIndex = project.episodes.findIndex(e => e.id === currentViewingEpisodeId);
      if (currentEpisodeIndex !== -1 && currentEpisodeIndex < project.episodes.length - 1) {
          const nextEpisode = project.episodes[currentEpisodeIndex + 1];
          openNovelViewer(nextEpisode.id);
      } else {
          ui.nextEpisodeBtn.style.display = 'none';
      }
  });
  ui.closeNovelViewerBtn.addEventListener('click', () => {
    ui.novelViewerOverlay.style.display = 'none';
  });

  // Viewer Selection Modal
  ui.viewerSelectionContent.addEventListener('click', (e) => {
      const item = e.target.closest('.viewer-selection-list-item');
      if (!item) return;
      if (item.dataset.projectId) {
          renderViewerEpisodeList(item.dataset.projectId);
      } else if (item.dataset.episodeId) {
          currentProjectId = viewerSelectionProjectId;
          openNovelViewer(item.dataset.episodeId);
      }
  });
  ui.viewerSelectionBackBtn.addEventListener('click', renderViewerProjectList);
  ui.closeViewerSelectionBtn.addEventListener('click', () => {
    ui.viewerSelectionModalOverlay.style.display = 'none';
  });
  ui.viewerSelectionModalOverlay.addEventListener('click', (e) => {
    if (e.target === ui.viewerSelectionModalOverlay) ui.viewerSelectionModalOverlay.style.display = 'none';
  });

  // Character Management
  ui.characterListPopover.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
          const charName = e.target.dataset.name;
          updateActiveCharacters(charName, e.target.checked);
      }
  });
  ui.addCharacterBtn.addEventListener('click', () => {
      ui.headerMenuPopover.style.display = 'none';
      characterModalContext = 'episode';
      ui.characterNameInput.value = '';
      ui.characterDescInput.value = '';
      ui.characterModalOverlay.style.display = 'flex';
      ui.characterNameInput.focus();
  });
  ui.manageCharactersBtn.addEventListener('click', (e) => {
      ui.headerMenuPopover.style.display = 'none';
      const project = db.projects.find(p => p.id === currentProjectId);
      const episode = project?.episodes.find(e => e.id === currentEpisodeId);
      if (!project || !episode) return;
      renderCharacterList(project, episode);
      ui.characterManagementModalOverlay.style.display = 'flex';
  });
  ui.closeCharacterManagementBtn.addEventListener('click', () => ui.characterManagementModalOverlay.style.display = 'none');

  // AI Settings Modal
  ui.aiSettingsBtn.addEventListener('click', () => {
      ui.headerMenuPopover.style.display = 'none';
      const project = db.projects.find(p => p.id === currentProjectId);
      if (!project) return;
      if (!project.ai_settings) project.ai_settings = { perspective: 'third' };
      if (!project.protagonist) project.protagonist = { desc: '', pronoun: '' };
      updatePerspectiveButtons(project.ai_settings.perspective);
      ui.aiSettingsModalOverlay.style.display = 'flex';
  });
  ui.perspectiveButtons.addEventListener('click', (e) => {
      if (e.target.classList.contains('perspective-btn')) {
          const newPerspective = e.target.dataset.perspective;
          updatePerspectiveButtons(newPerspective);
      }
  });
  ui.saveAiSettingsBtn.addEventListener('click', () => {
      const project = db.projects.find(p => p.id === currentProjectId);
      if (!project) return;
      const activeButton = ui.perspectiveButtons.querySelector('.perspective-btn.active');
      if (activeButton) {
          project.ai_settings.perspective = activeButton.dataset.perspective;
      }
      saveDB();
      ui.aiSettingsModalOverlay.style.display = 'none';
      alert('AI設定を保存しました。');
  });
  ui.closeAiSettingsBtn.addEventListener('click', () => {
    ui.aiSettingsModalOverlay.style.display = 'none';
  });

  // Character Modal
  ui.closeCharacterBtn.addEventListener('click', closeCharacterModal);
  ui.saveCharacterBtn.addEventListener('click', () => {
      const charName = ui.characterNameInput.value.trim();
      const charDesc = ui.characterDescInput.value.trim();
      if (!charName || !charDesc) {
          alert('キャラクター名と説明の両方を入力してください。');
          return;
      }
      const project = db.projects.find(p => p.id === currentProjectId);
      if (!project) return;

      const newChar = {
          id: Date.now().toString() + Math.random(),
          name: charName,
          description: charDesc,
          faction: ''
      };
      if (!project.characters) project.characters = [];
      project.characters.push(newChar);

      if (ui.settingsModalOverlay.style.display === 'flex') renderProjectCharacterEditor(project);

      saveDB();
      closeCharacterModal();
  });

  // Popover/Menu Toggles
  document.addEventListener('click', (e) => {
      if (ui.headerMenuPopover && !ui.headerMenuPopover.contains(e.target) && !ui.headerMenuBtn.contains(e.target)) {
          ui.headerMenuPopover.style.display = 'none';
      }
      if (ui.footerMenuContainer && !ui.footerMenuContainer.contains(e.target)) {
          ui.footerMenuOptions.style.display = 'none';
      }
      if (ui.inputModeContainer && !ui.inputModeContainer.contains(e.target)) {
          ui.inputModeOptions.style.display = 'none';
      }
  });
  ui.headerMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = ui.headerMenuPopover.style.display === 'block';
      ui.headerMenuPopover.style.display = isVisible ? 'none' : 'block';
  });
  ui.mainFooterMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = ui.footerMenuOptions.style.display === 'flex';
      ui.footerMenuOptions.style.display = isVisible ? 'none' : 'flex';
  });

  // Input Bar
  ui.mainInputModeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = ui.inputModeOptions.style.display === 'flex';
      ui.inputModeOptions.style.display = isVisible ? 'none' : 'flex';
  });
  ui.inputModeOptions.addEventListener('click', (e) => {
      const button = e.target.closest('.input-mode-btn');
      if (button) {
          currentInputMode = button.dataset.mode;
          const newIcon = button.querySelector('.material-symbols-outlined').textContent;
          ui.mainInputModeBtn.querySelector('.material-symbols-outlined').textContent = newIcon;
          ui.inputModeOptions.style.display = 'none';
      }
  });
  ui.lengthControlSlider.addEventListener('input', () => {
      ui.lengthValueDisplay.textContent = ui.lengthControlSlider.value;
  });
  ui.playerInputEl.addEventListener('input', autoResizeTextarea);
  ui.aiGenerateBtn.addEventListener('click', () => handlePlayerInput(true));
  ui.sendOnlyBtn.addEventListener('click', () => handlePlayerInput(false));

  // Chat Container Interactions
  ui.chatContainer.addEventListener('change', (e) => {
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
  ui.chatContainer.addEventListener('click', async (e) => {
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
}