// Get DOM elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const wordCountEl = document.querySelector('.status-bar span:first-child');
const charCountEl = document.querySelector('.status-bar span:last-child');
const sidebarNav = document.querySelector('.sidebar nav ul');

// Import functions from modules
import { 
    getProjectPathFromUrl, 
    loadProject, 
    loadProjectSection, 
    loadChapters, 
    loadCharacters, 
    loadLoreItems, 
    loadNotes,
    getCurrentProject,
    getCurrentSection,
    setCurrentSection,
    setCurrentProject,
    getCurrentFile,
    setCurrentFile,
    getIsDirty,
    setIsDirty
} from './projectManager.js';
import { applyTheme, setupThemeToggle } from './context/ThemeContext.js';
import { updateWordCount } from './components/Editor/StatusBar.js';
import { displayFileList, getFileTypeTitle } from './components/Layout/MainContent.js';
import { capitalize, path } from './shared/utils.js';
import { 
    openFile, 
    saveCurrentFile, 
    saveMetadata, 
    createNewFile,
    createEnhancedEditor
} from './fileManager.js';
import { 
    showCustomDialog, 
    showConfirmDialog 
} from './components/Common/Modal.js';
import {
    addFormField,
    addFormTextarea,
    setDirtyState,
    getDirtyState
} from './formUtils.js';
import { setupNavigation } from './components/Layout/Sidebar.js';

// Initialize the app
function init() {
    try {
        console.log('Initializing Writer\'s Studio application...');
        
        // Check for DOM elements
        if (!themeToggleBtn) console.warn('Theme toggle button not found in DOM');
        if (!wordCountEl) console.warn('Word count element not found in DOM');
        if (!charCountEl) console.warn('Character count element not found in DOM');
        if (!sidebarNav) console.warn('Sidebar navigation not found in DOM');

        // Get the electronAPI from the preload script
        const { electronAPI } = window;
        
        if (!electronAPI) {
            console.error('CRITICAL ERROR: electronAPI is not available from preload script');
            showCustomDialog('Application Error', 'Application initialization failed. electronAPI is not available.', null, { type: 'notification' });
            return;
        }
        
        console.log('electronAPI loaded successfully:', Object.keys(electronAPI));
        
        // Apply saved theme and set up theme toggle
        console.log('Setting up theme...');
        applyTheme();
        setupThemeToggle(); 

        // Set up sidebar navigation
        console.log('Setting up navigation...');
        if (sidebarNav) {
            setupNavigation(sidebarNav, (section) => {
                console.log(`Navigation callback: setting current section to "${section}"`);
                setCurrentSection(section);
            });
        } else {
            console.error('Failed to set up navigation: sidebar nav element not found');
        }

        // Get project path from URL
        console.log('Getting project path from URL...');
        const projectPath = getProjectPathFromUrl();
        console.log(`Project path from URL: ${projectPath || 'none'}`);
        
        if (projectPath) {
            console.log(`Loading project: ${projectPath}`);
            loadProject(projectPath, electronAPI);
        } else {
            console.log('No project path in URL, skipping project load');
        }

        // Set up editor event listeners
        console.log('Setting up editor event listeners...');
        const editorContent = document.getElementById('editor-content');
        if (editorContent) {
            editorContent.addEventListener('input', () => {
                setIsDirty(true);
                updateWordCount();
            });
            console.log('Editor content listeners set up successfully');
        } else {
            console.warn('Editor content element not found, skipping event listener setup');
        }

        // Set up keyboard shortcuts
        console.log('Setting up keyboard shortcuts...');
        document.addEventListener('keydown', (e) => {
            // Ctrl+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                console.log('Ctrl+S pressed, saving current file');
                saveCurrentFile(electronAPI);
            }
        });

        console.log('Writer\'s Studio initialized successfully');
    } catch (error) {
        console.error('Error during application initialization:', error);
        showCustomDialog('Application Error', `Error initializing application: ${error.message}`, null, { type: 'notification' })
            .catch(err => console.error('Failed to show error dialog:', err));
    }
}

// Call init when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);