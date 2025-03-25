/**
 * Project Manager Module
 * Handles loading and managing project content
 */

// Importing from other files
import { showCustomDialog, showConfirmDialog } from './components/Common/Modal.js';
import { displayFileList } from './components/Layout/MainContent.js';
import { path } from './shared/utils.js';

// Global state that will need to be managed differently in a modular architecture
let currentProject = null;
let currentSection = 'editor';
let currentFile = null;
let isDirty = false;

// Getters and setters for state
export function getCurrentProject() {
    return currentProject;
}

export function setCurrentProject(project) {
    currentProject = project;
}

export function getCurrentSection() {
    return currentSection;
}

export function setCurrentSection(section) {
    currentSection = section;
}

export function getCurrentFile() {
    return currentFile;
}

export function setCurrentFile(file) {
    currentFile = file;
}

export function getIsDirty() {
    return isDirty;
}

export function setIsDirty(value) {
    isDirty = value;
}

/**
 * Extracts the project path from the URL query parameters
 * @returns {string|null} The decoded project path or null if not found
 */
export function getProjectPathFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const projectPath = urlParams.get('project');

    return projectPath ? decodeURIComponent(projectPath) : null;
}

/**
 * Loads a project and initializes the UI
 * @param {string} projectPath - Path to the project directory
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function loadProject(projectPath, electronAPI) {
    if (!projectPath) return;

    try {
        currentProject = projectPath;

        // Update UI to show we're in a project
        document.title = `Writer's Studio - ${path.basename(projectPath)}`;

        // Load project sections based on the active section
        await loadProjectSection(currentSection, electronAPI);

    } catch (error) {
        console.error('Error loading project:', error);
        showCustomDialog('Error Loading Project', 'Error loading project: ' + error.message, null, { type: 'notification' });
    }
}

/**
 * Loads a specific section of the project (chapters, characters, etc.)
 * @param {string} section - The section to load ('editor', 'characters', 'lore', 'notes')
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function loadProjectSection(section, electronAPI) {
    console.log(`Loading project section: ${section}`);
    if (!electronAPI) {
        console.error('electronAPI is not available for loadProjectSection');
        return;
    }
    
    // Set the currentSection so we know which section we're in
    const previousSection = currentSection;
    currentSection = section;

    // Highlight the active section in the sidebar
    const navItems = document.querySelector('.sidebar nav ul').querySelectorAll('a');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });

    // Check for unsaved changes
    if (isDirty && currentFile) {
        const shouldDiscard = await showConfirmDialog('Unsaved Changes', 'You have unsaved changes. Discard them?');
        if (!shouldDiscard) {
            // Revert back to previous section if user cancels
            currentSection = previousSection;
            
            // Reset sidebar selection
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-section') === previousSection) {
                    item.classList.add('active');
                }
            });
            
            return;
        }
        
        // If user agrees to discard changes, clear the dirty flag
        isDirty = false;
    }

    // Remove any existing editor container
    const existingEditorContainer = document.querySelector('.editor-container');
    if (existingEditorContainer) {
        existingEditorContainer.remove();
    }
    
    // Hide or show appropriate editors
    const metadataEditor = document.getElementById('metadata-editor');
    if (metadataEditor) {
        metadataEditor.remove();
    }
    const editorContentEl = document.getElementById('editor-content');
    if (editorContentEl) {
        editorContentEl.remove();
    }
    
    currentFile = null;

    try {
        console.log(`Attempting to load ${section} content...`);
        switch (section) {
            case 'editor':
                await loadChapters(electronAPI);
                break;
            case 'characters':
                await loadCharacters(electronAPI);
                break;
            case 'lore':
                await loadLoreItems(electronAPI);
                break;
            case 'notes':
                await loadNotes(electronAPI);
                break;
            default:
                console.error(`Unknown section: ${section}`);
        }
    } catch (error) {
        console.error(`Error loading ${section}:`, error);
        showCustomDialog('Error Loading Section', 'Error loading section: ' + error.message, null, { type: 'notification' });
    }
}

/**
 * Loads book chapters for the editor section
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function loadChapters(electronAPI) {
    try {
        const chapters = await electronAPI.getChapters(currentProject);

        // Update UI to show chapters
        displayFileList(chapters, 'chapter', electronAPI);

    } catch (error) {
        console.error('Error loading chapters:', error);
        showCustomDialog('Error Loading Chapters', 'Error loading chapters: ' + error.message, null, { type: 'notification' });
    }
}

/**
 * Loads characters for the characters section
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function loadCharacters(electronAPI) {
    try {
        const characters = await electronAPI.getCharacters(currentProject);

        // Update UI to show characters
        displayFileList(characters, 'character', electronAPI);

    } catch (error) {
        console.error('Error loading characters:', error);
        showCustomDialog('Error Loading Characters', 'Error loading characters: ' + error.message, null, { type: 'notification' });
    }
}

/**
 * Loads lore items for the world lore section
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function loadLoreItems(electronAPI) {
    try {
        const loreItems = await electronAPI.getLoreItems(currentProject);

        // Update UI to show lore items
        displayFileList(loreItems, 'lore', electronAPI);

    } catch (error) {
        console.error('Error loading lore items:', error);
        showCustomDialog('Error Loading Lore Items', 'Error loading lore items: ' + error.message, null, { type: 'notification' });
    }
}

/**
 * Loads notes for the notes section
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function loadNotes(electronAPI) {
    try {
        const notes = await electronAPI.getNotes(currentProject);

        // Update UI to show notes
        displayFileList(notes, 'note', electronAPI);

    } catch (error) {
        console.error('Error loading notes:', error);
        showCustomDialog('Error Loading Notes', 'Error loading notes: ' + error.message, null, { type: 'notification' });
    }
} 