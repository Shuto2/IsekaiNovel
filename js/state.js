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