// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all event listeners
  initializeEventListeners();
  // Load data from localStorage
  loadDB();
  // Apply saved theme
  applySavedTheme();
  // Render the initial page
  renderProjectList();
  showPage('projectList');
});