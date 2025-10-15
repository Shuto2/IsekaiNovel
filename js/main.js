// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all event listeners
  initializeEventListeners();
  // Load data from localStorage
  loadDB();
  // Apply saved theme
  applySavedTheme();
  // Render the initial page
  showPage('projectList', { render: true });
});

function showPage(pageId, options = {}) {
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
  });
  document.getElementById(pageId).style.display = 'block';

  if (options.render) {
    if (pageId === 'projectList') renderProjectList();
    if (pageId === 'projectDetail') renderProjectDetail();
    if (pageId === 'episodeEditor') renderEpisodeEditor();
  }

  // --- 背景生成ロジック (第2話以降) ---
  if (pageId === 'episodeEditor') {
    const episode = getCurrentEpisode();
    // 第2話以降で、まだターンが存在しない（=エピソードを開いた直後）場合
    if (episode && episode.turns.length === 0 && db.projects.find(p => p.id === currentProjectId)?.episodes.findIndex(e => e.id === episode.id) > 0) {
      const situation = `これから始まる物語の舞台は「${episode.title}」です。${episode.summary || 'どのような状況から始まるでしょうか？'}`;
      generateBackgroundImage(situation);
    }
  }
}