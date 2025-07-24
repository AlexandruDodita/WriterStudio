/**
 * Modern WriterStudio Application
 * Main renderer process controller
 */

// Import modules using ES6 syntax
import { UIManager } from './components/Common/UIManager.js';
import { ThemeManager } from './components/Common/ThemeManager.js';
import { ModalManager } from './components/Common/ModalManager.js';
import { ToastManager } from './components/Common/ToastManager.js';
import Editor from './components/Editor/Editor.js';
import AttributesManager from './components/AttributesManager.js';

// Application state
const AppState = {
    currentProject: null,
    currentSection: 'chapters',
    isLoading: false,
    sectionData: {
        chapters: { items: [], count: 0 },
        characters: { items: [], count: 0 },
        lore: { items: [], count: 0 },
        notes: { items: [], count: 0 }
    }
};

// Section configurations
const SECTIONS = {
    chapters: {
        title: 'Book Chapters',
        description: 'Organize and write your story chapters',
        icon: 'book',
        emptyMessage: 'No chapters yet',
        emptyDescription: 'Start your writing journey by creating your first chapter',
        createLabel: 'Create Chapter'
    },
    characters: {
        title: 'Characters',
        description: 'Develop detailed character profiles and backgrounds',
        icon: 'user',
        emptyMessage: 'No characters yet',
        emptyDescription: 'Bring your story to life by creating memorable characters',
        createLabel: 'Create Character'
    },
    lore: {
        title: 'World Lore',
        description: 'Build your story\'s world, history, and mythology',
        icon: 'globe',
        emptyMessage: 'No lore entries yet',
        emptyDescription: 'Create a rich world with detailed lore and backstory',
        createLabel: 'Create Lore Entry'
    },
    notes: {
        title: 'Notes',
        description: 'General notes, ideas, and miscellaneous content',
        icon: 'notes',
        emptyMessage: 'No notes yet',
        emptyDescription: 'Capture your ideas and inspiration in notes',
        createLabel: 'Create Note'
    }
};

// Application initialization
class WriterStudioApp {
    constructor() {
        console.log('WriterStudioApp constructor called');
        
        // Check if electronAPI is available
        if (!window.electronAPI) {
            console.error('electronAPI is not available!');
            this.electronAPI = null;
        } else {
            this.electronAPI = window.electronAPI;
            console.log('electronAPI loaded successfully');
        }
        
        // Initialize components with error handling
        try {
            this.uiManager = new UIManager();
            console.log('UIManager initialized');
        } catch (error) {
            console.error('Failed to initialize UIManager:', error);
        }
        
        try {
            this.themeManager = new ThemeManager();
            console.log('ThemeManager initialized');
        } catch (error) {
            console.error('Failed to initialize ThemeManager:', error);
        }
        
        try {
            this.modalManager = new ModalManager(this.uiManager);
            console.log('ModalManager initialized');
        } catch (error) {
            console.error('Failed to initialize ModalManager:', error);
        }
        
        try {
            this.toastManager = new ToastManager(this.uiManager);
            console.log('ToastManager initialized');
        } catch (error) {
            console.error('Failed to initialize ToastManager:', error);
        }
        
        this.editor = new Editor(this.uiManager, {
            onSave: (content, text) => this._handleEditorSave(content, text),
            onSaveAs: (content, text) => this._handleEditorSaveAs(content, text)
        });
        this.attributesManager = new AttributesManager(this.electronAPI, this.toastManager);
        this.currentSection = 'home';
        this.currentProject = null;
        this.currentAttributes = {};
        
        // Initialize the app asynchronously
        this.initializeApp().catch(error => {
            console.error('Critical error during app initialization:', error);
        });
    }

    async initializeApp() {
        try {
            this.setupEventListeners();
            this.themeManager.initialize();
            this.uiManager.registerComponent('modalManager', this.modalManager);
            this.uiManager.registerComponent('toastManager', this.toastManager);
            
            // Load and apply settings
            const settings = this._loadSettings();
            this._applySettings(settings);
            
            await this.loadProjectFromURL();
            
            // Defer the initial UI update slightly to ensure DOM is fully ready
            setTimeout(() => {
                this.updateUI();
                // Show welcome message if no project is loaded, after UI is initially set up
                if (!AppState.currentProject) {
                    this.showWelcomeMessage();
                }
                console.log('WriterStudio initialized successfully and initial UI updated');
            }, 0); // 0ms timeout pushes it to the next event loop cycle

        } catch (error) {
            console.error('Failed to initialize WriterStudio:', error);
            if (this.toastManager) { // Ensure toastManager is available
                 this.toastManager.show('Failed to initialize application: ' + error.message, 'error');
            }
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.themeManager.toggle();
            });
        }

        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Action buttons
        const createBtn = document.getElementById('create-new-btn');
        const emptyCreateBtn = document.getElementById('empty-create-btn');
        const importBtn = document.getElementById('import-btn');

        if (createBtn) {
            createBtn.addEventListener('click', () => this.handleCreateNew());
        }
        
        if (emptyCreateBtn) {
            emptyCreateBtn.addEventListener('click', () => this.handleCreateNew());
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.handleImport());
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        document.body.addEventListener('click', (event) => {
            if (event.target && event.target.matches('.action-edit-item')) {
                const itemName = event.target.dataset.itemName;
                const itemType = event.target.dataset.itemType;
                if (itemName && itemType) {
                    this.loadAndShowEditor(itemType, itemName);
                } else {
                    console.warn('Edit action triggered without itemName or itemType.');
                    this.toastManager.error('Cannot edit item: Missing identifier.');
                }
            }
        });
    }

    initializeTheme() {
        this.themeManager.initialize();
    }

    async loadProjectFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const projectPath = urlParams.get('project');
            
            if (projectPath) {
                await this.loadProject(decodeURIComponent(projectPath));
            }
        } catch (error) {
            console.error('Error loading project from URL:', error);
            this.toastManager.show('Failed to load project', 'error');
        }
    }

    async loadProject(projectPath) {
        console.log('loadProject called with:', projectPath);
        
        try {
            AppState.isLoading = true;
            this.updateLoadingState();

            if (!this.electronAPI) {
                throw new Error('Electron API not available');
            }
            
            const isValid = await this.electronAPI.validateProject(projectPath);
            if (!isValid) {
                throw new Error('Invalid project structure');
            }

            AppState.currentProject = projectPath;
            const projectName = projectPath.split(/[\\\/]/).pop() || 'Unknown Project';
            this.currentProject = { path: projectPath, name: projectName };
            
            // Initialize attributes manager with the project
            await this.attributesManager.initialize(projectPath);
            
            this.updateProjectInfo(projectPath);
            await this.loadSectionData(AppState.currentSection);
            
            console.log('Project loaded successfully');
            if (this.toastManager) {
                this.toastManager.show('Project loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            if (this.toastManager) {
                this.toastManager.show('Failed to load project: ' + error.message, 'error');
            }
            AppState.currentProject = null;
            this.currentProject = null;
        } finally {
            AppState.isLoading = false;
            this.updateLoadingState();
            this.updateUI();
            console.log('Final AppState:', AppState);
            console.log('Final this.currentProject:', this.currentProject);
        }
    }

    async switchSection(sectionId) {
        console.log(`Switching to section: ${sectionId}`);
        if (sectionId === AppState.currentSection && sectionId !== 'editor') return;

        if (sectionId === 'editor') {
            AppState.currentSection = sectionId;
            this.updateContentArea(null, 'editor');
            this.updateNavigationState();
        } else if (AppState.currentProject) {
            try {
                AppState.currentSection = sectionId;
                this.updateNavigationState();
                this.updateSectionHeader();
                await this.loadSectionData(sectionId);
                this.updateContentArea(AppState.sectionData[sectionId].items, sectionId);
            } catch (error) {
                console.error('Error switching section:', error);
                this.toastManager.error('Failed to load section: ' + error.message);
            }
        } else {
            console.warn('Cannot switch section, no project loaded.');
            this.toastManager.info('Please open a project to view sections.');
        }
    }

    async loadSectionData(section) {
        console.log('loadSectionData called for section:', section);
        console.log('Current project:', AppState.currentProject);
        console.log('ElectronAPI available:', !!this.electronAPI);
        
        if (!AppState.currentProject || !this.electronAPI) {
            console.warn('Cannot load section data: missing project or electronAPI');
            return;
        }

        try {
            let data = [];
            
            console.log(`Calling electronAPI.get${section.charAt(0).toUpperCase() + section.slice(1)}...`);
            
            switch (section) {
                case 'chapters':
                    data = await this.electronAPI.getChapters(AppState.currentProject);
                    break;
                case 'characters':
                    data = await this.electronAPI.getCharacters(AppState.currentProject);
                    break;
                case 'lore':
                    data = await this.electronAPI.getLoreItems(AppState.currentProject);
                    break;
                case 'notes':
                    data = await this.electronAPI.getNotes(AppState.currentProject);
                    break;
                default:
                    console.warn(`Unknown section: ${section}`);
                    return;
            }

            console.log(`Received ${section} data:`, data);

            AppState.sectionData[section] = {
                items: data || [],
                count: data ? data.length : 0
            };

            console.log(`Updated sectionData for ${section}:`, AppState.sectionData[section]);

        } catch (error) {
            console.error(`Error loading ${section} data:`, error);
            AppState.sectionData[section] = { items: [], count: 0 };
        }
    }

    updateProjectInfo(projectPath) {
        const projectNameEl = document.getElementById('project-name');
        const projectPathEl = document.getElementById('project-path');
        
        if (projectPath) {
            const projectName = projectPath.split(/[/\\]/).pop() || 'Unknown Project';
            if (projectNameEl) projectNameEl.textContent = projectName;
            if (projectPathEl) projectPathEl.textContent = projectPath;
        } else {
            if (projectNameEl) projectNameEl.textContent = 'No Project';
            if (projectPathEl) projectPathEl.textContent = '';
        }
    }

    updateNavigationState() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const section = item.dataset.section;
            if (section === AppState.currentSection) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    updateSectionHeader() {
        const config = SECTIONS[AppState.currentSection];
        const titleEl = document.getElementById('section-title');
        const descEl = document.getElementById('section-description');
        
        if (titleEl) titleEl.textContent = config.title;
        if (descEl) descEl.textContent = config.description;
    }

    updateContentArea(items, sectionId = AppState.currentSection) {
        const mainContentArea = document.getElementById('main-content-area');
        if (!mainContentArea) {
            console.error("Main content area (#main-content-area) not found!");
            return;
        }

        const contentGrid = document.getElementById('content-grid');
        const emptyStateElement = document.getElementById('empty-state');
        const contentHeader = mainContentArea.querySelector('.content-header');

        if (!contentGrid || !emptyStateElement || !contentHeader) {
            console.error("Critical UI elements (#content-grid, #empty-state, or .content-header) are missing within #main-content-area!");
            return;
        }

        contentGrid.innerHTML = ''; 
        this.uiManager.showLoading(contentGrid, 'Loading content...');

        Promise.resolve().then(() => {
            this.uiManager.hideLoading(contentGrid);
            contentHeader.style.display = '';

            if (sectionId === 'editor') {
                emptyStateElement.style.display = 'none';
                contentHeader.style.display = 'block'; // Keep header visible for editor
                
                // Set up the content grid for editor mode - simplified approach
                contentGrid.classList.remove('card-layout');
                contentGrid.classList.add('editor-mode');
                
                console.log('[DEBUG] Content grid classes after adding editor-mode:', contentGrid.className);
                console.log('[DEBUG] Content grid computed style:', window.getComputedStyle(contentGrid));
                
                console.log('[updateContentArea] Before editor.render. contentGrid:', contentGrid);
                this.editor.render(contentGrid);
                console.log('[updateContentArea] After editor.render. contentGrid contains editor:', contentGrid.contains(this.editor.editorElement));
                
                // Log editor element details
                if (this.editor.editorElement) {
                    console.log('[DEBUG] Editor element classes:', this.editor.editorElement.className);
                    console.log('[DEBUG] Editor element computed style:', window.getComputedStyle(this.editor.editorElement));
                }
            } else if (items && items.length > 0) {
                // Reset content grid to normal mode
                contentGrid.classList.remove('editor-mode');
                contentGrid.classList.add('card-layout');
                emptyStateElement.style.display = 'none';
                
                // Remove attributes dropdown from header when exiting editor mode
                this.cleanupEditorHeader();
                
                // Ensure contentGrid has the card-layout class if it's the direct grid container
                // This is an assumption; if card-layout is for a UL, the previous way was better.
                // Let's assume content-grid is the direct container of cards.
                contentGrid.classList.add('card-layout'); // Ensure this class is on the grid container

                items.forEach(item => {
                    const card = this.createContentCard(item, sectionId);
                    if (card) contentGrid.appendChild(card); // Append cards directly to contentGrid
                });
            } else if (AppState.currentProject) {
                contentGrid.classList.remove('editor-mode');
                contentGrid.style.display = 'none';
                contentGrid.classList.remove('card-layout'); // Remove if no cards
                emptyStateElement.style.display = 'flex';
                
                // Remove attributes dropdown from header when showing empty state
                this.cleanupEditorHeader();
                
                const emptyStateTitle = emptyStateElement.querySelector('h3');
                const emptyStateMsg = emptyStateElement.querySelector('p');
                const emptyStateBtn = emptyStateElement.querySelector('.action-btn span'); // Target span for text
                const emptyCreateBtn = document.getElementById('empty-create-btn'); // Actual button

                if (SECTIONS[sectionId]) {
                    if(emptyStateTitle) emptyStateTitle.textContent = SECTIONS[sectionId].emptyMessage;
                    if(emptyStateMsg) emptyStateMsg.textContent = SECTIONS[sectionId].emptyDescription;
                    if(emptyStateBtn && SECTIONS[sectionId].createLabel) emptyStateBtn.textContent = SECTIONS[sectionId].createLabel;
                    if(emptyCreateBtn) emptyCreateBtn.style.display = ''; // Show create button
                } else {
                    if(emptyStateTitle) emptyStateTitle.textContent = "No items found";
                    if(emptyStateMsg) emptyStateMsg.textContent = "There are no items to display here. Try creating one!";
                    if(emptyStateBtn) emptyStateBtn.textContent = "Create New";
                    if(emptyCreateBtn) emptyCreateBtn.style.display = '';
                }
            } else {
                contentGrid.classList.remove('editor-mode');
                contentGrid.style.display = 'none';
                contentGrid.classList.remove('card-layout'); // Remove if no cards
                emptyStateElement.style.display = 'flex';
                
                // Remove attributes dropdown from header when showing empty state
                this.cleanupEditorHeader();
                
                const emptyStateTitle = emptyStateElement.querySelector('h3');
                const emptyStateMsg = emptyStateElement.querySelector('p');
                const emptyCreateBtn = document.getElementById('empty-create-btn');

                if(emptyStateTitle) emptyStateTitle.textContent = "No Project Open";
                if(emptyStateMsg) emptyStateMsg.textContent = "Please open or create a project to see content.";
                if(emptyCreateBtn) emptyCreateBtn.style.display = 'none'; // Hide create button from empty state
            }
        });
    }

    renderContentCards(items) {
        const contentGrid = document.getElementById('content-grid');
        if (!contentGrid) return;

        items.forEach(item => {
            const card = this.createContentCard(item);
            contentGrid.appendChild(card);
        });
    }

    createContentCard(item, itemType) {
        console.log('Creating content card for item:', item);
        
        const card = this.uiManager.createElement('div', { className: 'card animate-fade-in' });
        
        // Handle different data structures from the API
        const displayName = item.displayName || item.name || 'Untitled';
        const lastModified = item.lastModified ? new Date(item.lastModified).toLocaleDateString() : 'Unknown';
        const wordCount = item.wordCount || 0;
        const description = item.description || item.synopsis || 'No description available';
        
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            const div = this.uiManager.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(displayName)}</h3>
                <div class="card-actions">
                    <button class="card-btn action-edit-item" data-item-name="${item.name}" data-item-type="${itemType}" title="Edit">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                        </svg>
                    </button>
                    <button class="card-btn action-delete-item" data-item-name="${item.name}" data-item-type="${itemType}" title="Delete">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-content">
                ${escapeHtml(description)}
            </div>
            <div class="card-meta">
                <span>Modified: ${lastModified}</span>
                <span>${wordCount} words</span>
            </div>
        `;

        // Add event listeners with error handling
        const cardElement = card; // Assuming 'card' is the root element of the card from innerHTML or createElement

        cardElement.addEventListener('click', (e) => {
            try {
                if (!e.target.closest('.card-btn')) {
                    this.openItem(item); // This remains for general card click to open (future feature)
                }
            } catch (error) {
                console.error('Error opening item:', error);
            }
        });

        const editBtn = cardElement.querySelector('.action-edit-item');
        const deleteBtn = cardElement.querySelector('.action-delete-item');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                try {
                    e.stopPropagation(); // Prevent card's general click handler
                    // Correctly call loadAndShowEditor with itemType and item.name
                    this.loadAndShowEditor(itemType, item.name);
                } catch (error) {
                    console.error('Error initiating edit for item:', item, error);
                    this.toastManager.error('Could not open editor for this item.');
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                try {
                    e.stopPropagation();
                    this.deleteItem(item);
                } catch (error) {
                    console.error('Error deleting item:', error);
                }
            });
        }

        return cardElement;
    }

    updateSectionCounts() {
        Object.keys(AppState.sectionData).forEach(section => {
            const countEl = document.getElementById(`${section}-count`);
            if (countEl) {
                countEl.textContent = AppState.sectionData[section].count.toString();
            }
        });
    }

    updateLoadingState() {
        // Update UI to show/hide loading indicators
        const createBtn = document.getElementById('create-new-btn');
        const importBtn = document.getElementById('import-btn');
        
        if (createBtn) {
            createBtn.disabled = AppState.isLoading;
        }
        
        if (importBtn) {
            importBtn.disabled = AppState.isLoading;
        }
    }

    updateUI() {
        this.updateNavigationState();
        this.updateSectionHeader();
        if (AppState.currentProject && AppState.sectionData[AppState.currentSection]) {
            this.updateContentArea(AppState.sectionData[AppState.currentSection].items, AppState.currentSection);
        } else {
            this.updateContentArea(null, AppState.currentSection);
        }
        this.updateSectionCounts();
        this.updateLoadingState();
    }

    // Event handlers
    async handleCreateNew() {
        try {
            if (!this.modalManager) {
                console.error('ModalManager not available');
                if (this.toastManager) {
                    this.toastManager.show('Modal system not initialized', 'error');
                }
                return;
            }

            const config = SECTIONS[AppState.currentSection];
            
            const result = await this.modalManager.showInput({
                title: `Create New ${config.createLabel}`,
                message: `Enter a name for your new ${AppState.currentSection.slice(0, -1)}:`,
                placeholder: `${config.createLabel} name...`,
                confirmText: 'Create'
            });

            if (result) {
                try {
                    // Create new item via Electron API
                    await this.createNewItem(AppState.currentSection, result);
                    if (this.toastManager) {
                        this.toastManager.show(`${config.createLabel} created successfully`, 'success');
                    }
                    
                    // Refresh current section
                    await this.loadSectionData(AppState.currentSection);
                    this.updateContentArea();
                } catch (error) {
                    console.error('Error creating new item:', error);
                    if (this.toastManager) {
                        this.toastManager.show('Failed to create new item: ' + error.message, 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Error in handleCreateNew:', error);
            if (this.toastManager) {
                this.toastManager.show('Failed to open create dialog', 'error');
            }
        }
    }

    async createNewItem(section, name) {
        if (!this.electronAPI || !AppState.currentProject) {
            throw new Error('No project loaded or Electron API unavailable');
        }

        switch (section) {
            case 'chapters':
                return await this.electronAPI.createChapter(AppState.currentProject, name);
            case 'characters':
                return await this.electronAPI.createCharacter(AppState.currentProject, name);
            case 'lore':
                return await this.electronAPI.createLoreItem(AppState.currentProject, name);
            case 'notes':
                return await this.electronAPI.createNote(AppState.currentProject, name);
            default:
                throw new Error(`Unknown section: ${section}`);
        }
    }

    async handleImport() {
        try {
            if (!AppState.currentProject) {
                this.toastManager.error('Please open a project before importing files');
                return;
            }

            // First select the folder
            const folderResult = await this.electronAPI.selectImportFolder();
            if (folderResult.canceled || !folderResult.filePaths.length) {
                return; // User cancelled folder selection
            }
            
            const importPath = folderResult.filePaths[0];
            
            // Show section selection dialog
            const confirmed = await this.modalManager.show({
                title: 'Import Files',
                content: `
                    <div class="import-dialog">
                        <p><strong>Selected folder:</strong> ${importPath}</p>
                        <p>Supported formats: .txt, .md, .docx, .odt</p>
                        
                        <div class="form-group">
                            <label for="target-section">Import to section:</label>
                            <select id="target-section" class="form-control">
                                <option value="chapters">Book Chapters</option>
                                <option value="characters">Characters</option>
                                <option value="lore">World Lore</option>
                                <option value="notes">Notes</option>
                            </select>
                        </div>
                    </div>
                `,
                confirmText: 'Import',
                cancelText: 'Cancel',
                size: 'medium'
            });

            if (!confirmed) {
                return; // User cancelled
            }

            // Get the selected section value
            const sectionSelect = document.querySelector('#target-section');
            const selectedSection = sectionSelect ? sectionSelect.value : 'chapters';

            // Perform import
            this.toastManager.info('Importing files...');
            const result = await this.electronAPI.importFolder(
                AppState.currentProject,
                importPath,
                selectedSection
            );

            if (result.success) {
                this.toastManager.success(result.message);
                
                // Refresh the current section if it matches the import target
                if (AppState.currentSection === selectedSection) {
                    await this.loadSectionData(AppState.currentSection);
                    this.updateContentArea();
                }
            } else {
                this.toastManager.error('Import failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error during import:', error);
            this.toastManager.error('Import failed: ' + error.message);
        }
    }

    async showSettings() {
        const confirmed = await this.modalManager.show({
            title: 'Settings',
            content: this._createSettingsContent(),
            size: 'large',
            confirmText: 'Save Settings',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            this._saveSettings();
        }
    }

    _createSettingsContent() {
        const currentTheme = this.themeManager.getThemePreference();
        const settings = this._loadSettings();
        
        return `
            <div class="settings-panel">
                <!-- Theme Settings -->
                <div class="settings-section">
                    <h3>Appearance</h3>
                    
                    <div class="form-group">
                        <label for="theme-select">Theme</label>
                        <select id="theme-select" class="form-control">
                            <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="auto" ${currentTheme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                        </select>
                    </div>
                </div>

                <!-- Character Settings -->
                <div class="settings-section">
                    <h3>Character Display</h3>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="character-colors-enabled" ${settings.characterColors?.enabled ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Enable character name color-coding
                        </label>
                        <p class="help-text">When enabled, character names will be displayed with assigned colors throughout the application.</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="character-hover-enabled" ${settings.characterHover?.enabled ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Show character details on hover
                        </label>
                        <p class="help-text">When enabled, hovering over character names will show a popup with character image and details.</p>
                    </div>
                    
                    <div class="character-color-preview" id="character-color-preview">
                        <h4>Character Color Assignments</h4>
                        <div class="color-assignments" id="color-assignments">
                            <!-- Character color assignments will be populated here -->
                        </div>
                        <button type="button" class="btn btn-secondary" id="manage-character-colors">
                            Manage Character Colors
                        </button>
                    </div>
                </div>

                <!-- Editor Settings -->
                <div class="settings-section">
                    <h3>Editor</h3>
                    
                    <div class="form-group">
                        <label for="auto-save-interval">Auto-save interval (minutes)</label>
                        <select id="auto-save-interval" class="form-control">
                            <option value="0" ${(settings.editor?.autoSaveInterval || 0) === 0 ? 'selected' : ''}>Disabled</option>
                            <option value="1" ${(settings.editor?.autoSaveInterval || 0) === 1 ? 'selected' : ''}>1 minute</option>
                            <option value="5" ${(settings.editor?.autoSaveInterval || 0) === 5 ? 'selected' : ''}>5 minutes</option>
                            <option value="10" ${(settings.editor?.autoSaveInterval || 0) === 10 ? 'selected' : ''}>10 minutes</option>
                            <option value="15" ${(settings.editor?.autoSaveInterval || 0) === 15 ? 'selected' : ''}>15 minutes</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="word-wrap-enabled" ${settings.editor?.wordWrap !== false ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Enable word wrap
                        </label>
                    </div>
                </div>

                <!-- Project Settings -->
                <div class="settings-section">
                    <h3>Project Management</h3>
                    
                    <div class="form-group">
                        <label for="default-project-location">Default project location</label>
                        <div class="input-group">
                            <input type="text" id="default-project-location" class="form-control" 
                                   value="${settings.project?.defaultLocation || ''}" readonly>
                            <button type="button" class="btn btn-secondary" id="select-project-location">
                                Browse...
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="backup-enabled" ${settings.project?.backupEnabled ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Enable automatic backups
                        </label>
                        <p class="help-text">Create automatic backups of your project files.</p>
                    </div>
                </div>

                <!-- Advanced Settings -->
                <div class="settings-section">
                    <h3>Advanced</h3>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="debug-mode" ${settings.advanced?.debugMode ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Enable debug mode
                        </label>
                        <p class="help-text">Show additional debugging information in the console.</p>
                    </div>
                    
                    <div class="form-group">
                        <button type="button" class="btn btn-danger" id="reset-settings">
                            Reset All Settings
                        </button>
                        <p class="help-text">Reset all settings to their default values.</p>
                    </div>
                </div>
            </div>
        `;
    }

    _loadSettings() {
        try {
            const settingsJson = localStorage.getItem('writerStudio_settings');
            return settingsJson ? JSON.parse(settingsJson) : this._getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this._getDefaultSettings();
        }
    }

    _getDefaultSettings() {
        return {
            characterColors: {
                enabled: true,
                assignments: {},
                autoAssign: true
            },
            characterHover: {
                enabled: true,
                showImage: true,
                showDescription: true
            },
            editor: {
                autoSaveInterval: 5,
                wordWrap: true,
                fontSize: 14
            },
            project: {
                defaultLocation: '',
                backupEnabled: false,
                maxBackups: 5
            },
            advanced: {
                debugMode: false
            }
        };
    }

    _saveSettings() {
        try {
            const settings = this._loadSettings();
            
            // Update theme
            const themeSelect = document.querySelector('#theme-select');
            if (themeSelect) {
                this.themeManager.setTheme(themeSelect.value);
            }
            
            // Update character settings
            const characterColorsEnabled = document.querySelector('#character-colors-enabled');
            const characterHoverEnabled = document.querySelector('#character-hover-enabled');
            
            if (characterColorsEnabled) {
                settings.characterColors.enabled = characterColorsEnabled.checked;
            }
            
            if (characterHoverEnabled) {
                settings.characterHover.enabled = characterHoverEnabled.checked;
            }
            
            // Update editor settings
            const autoSaveInterval = document.querySelector('#auto-save-interval');
            const wordWrapEnabled = document.querySelector('#word-wrap-enabled');
            
            if (autoSaveInterval) {
                settings.editor.autoSaveInterval = parseInt(autoSaveInterval.value);
            }
            
            if (wordWrapEnabled) {
                settings.editor.wordWrap = wordWrapEnabled.checked;
            }
            
            // Update project settings
            const defaultLocation = document.querySelector('#default-project-location');
            const backupEnabled = document.querySelector('#backup-enabled');
            
            if (defaultLocation) {
                settings.project.defaultLocation = defaultLocation.value;
            }
            
            if (backupEnabled) {
                settings.project.backupEnabled = backupEnabled.checked;
            }
            
            // Update advanced settings
            const debugMode = document.querySelector('#debug-mode');
            if (debugMode) {
                settings.advanced.debugMode = debugMode.checked;
            }
            
            // Save to localStorage
            localStorage.setItem('writerStudio_settings', JSON.stringify(settings, null, 2));
            
            this.toastManager.success('Settings saved successfully');
            
            // Apply settings
            this._applySettings(settings);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.toastManager.error('Failed to save settings');
        }
    }

    _applySettings(settings) {
        // Apply character color settings
        if (settings.characterColors?.enabled) {
            this._enableCharacterColors();
        } else {
            this._disableCharacterColors();
        }
        
        // Apply character hover settings
        if (settings.characterHover?.enabled) {
            this._enableCharacterHover();
        } else {
            this._disableCharacterHover();
        }
        
        // Apply editor settings
        if (this.editor && settings.editor) {
            if (settings.editor.wordWrap !== undefined) {
                this._setEditorWordWrap(settings.editor.wordWrap);
            }
        }
    }

    _enableCharacterColors() {
        document.body.classList.add('character-colors-enabled');
        // Implementation for character color functionality
    }

    _disableCharacterColors() {
        document.body.classList.remove('character-colors-enabled');
    }

    _enableCharacterHover() {
        document.body.classList.add('character-hover-enabled');
        this._setupCharacterHover();
    }

    _disableCharacterHover() {
        document.body.classList.remove('character-hover-enabled');
        this._teardownCharacterHover();
    }

    _setupCharacterHover() {
        // Add event listeners for character name hover functionality
        document.addEventListener('mouseover', this._handleCharacterHover.bind(this));
        document.addEventListener('mouseout', this._handleCharacterHoverOut.bind(this));
    }

    _teardownCharacterHover() {
        document.removeEventListener('mouseover', this._handleCharacterHover.bind(this));
        document.removeEventListener('mouseout', this._handleCharacterHoverOut.bind(this));
    }

    _handleCharacterHover(event) {
        const characterElement = event.target.closest('[data-character]');
        if (characterElement) {
            this._showCharacterPopup(characterElement);
        }
    }

    _handleCharacterHoverOut(event) {
        const popup = document.querySelector('.character-popup');
        if (popup && !popup.contains(event.relatedTarget)) {
            popup.remove();
        }
    }

    _showCharacterPopup(characterElement) {
        const characterName = characterElement.dataset.character;
        
        // Remove existing popup
        const existingPopup = document.querySelector('.character-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'character-popup';
        popup.innerHTML = `
            <div class="character-popup-content">
                <h4>${characterName}</h4>
                <div class="character-image">
                    <img src="/path/to/character/image.jpg" alt="${characterName}" 
                         onerror="this.style.display='none'">
                </div>
                <div class="character-description">
                    <p>Character description will be loaded here...</p>
                </div>
            </div>
        `;
        
        // Position popup
        const rect = characterElement.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        popup.style.left = (rect.left + window.scrollX) + 'px';
        popup.style.zIndex = '10000';
        
        document.body.appendChild(popup);
        
        // Load character data
        this._loadCharacterPopupData(characterName, popup);
    }

    async _loadCharacterPopupData(characterName, popup) {
        try {
            if (!AppState.currentProject) return;
            
            const characterData = await this.electronAPI.getItemDetails(
                AppState.currentProject,
                'characters',
                characterName
            );
            
            if (characterData) {
                const descriptionElement = popup.querySelector('.character-description p');
                if (descriptionElement && characterData.description) {
                    descriptionElement.textContent = characterData.description.substring(0, 200) + 
                        (characterData.description.length > 200 ? '...' : '');
                }
                
                // TODO: Load character image
                // const imageElement = popup.querySelector('.character-image img');
                // if (imageElement && characterData.imagePath) {
                //     imageElement.src = characterData.imagePath;
                // }
            }
        } catch (error) {
            console.error('Error loading character data for popup:', error);
        }
    }

    _setEditorWordWrap(enabled) {
        if (this.editor && this.editor.contentArea) {
            this.editor.contentArea.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
        }
    }

    /**
     * Create a character name element with color coding and hover functionality
     * @param {string} characterName - The name of the character
     * @param {Object} options - Additional options
     * @returns {HTMLElement} The character element
     */
    createCharacterElement(characterName, options = {}) {
        const settings = this._loadSettings();
        const span = document.createElement('span');
        span.textContent = characterName;
        span.dataset.character = characterName;
        
        if (settings.characterColors?.enabled) {
            const colorClass = this._getCharacterColor(characterName);
            span.classList.add(colorClass);
        }
        
        if (settings.characterHover?.enabled) {
            span.classList.add('character-hoverable');
        }
        
        return span;
    }

    /**
     * Get or assign a color class to a character
     * @param {string} characterName - The name of the character
     * @returns {string} The CSS class name for the character color
     */
    _getCharacterColor(characterName) {
        const settings = this._loadSettings();
        
        // Check if character already has an assigned color
        if (settings.characterColors.assignments[characterName]) {
            return settings.characterColors.assignments[characterName];
        }
        
        // Auto-assign a color if enabled
        if (settings.characterColors.autoAssign) {
            const availableColors = [
                'character-color-1', 'character-color-2', 'character-color-3', 'character-color-4',
                'character-color-5', 'character-color-6', 'character-color-7', 'character-color-8'
            ];
            
            const usedColors = Object.values(settings.characterColors.assignments);
            const availableColorsList = availableColors.filter(color => !usedColors.includes(color));
            
            // If all colors are used, cycle through them
            const colorIndex = Object.keys(settings.characterColors.assignments).length % availableColors.length;
            const assignedColor = availableColorsList.length > 0 ? 
                availableColorsList[0] : availableColors[colorIndex];
            
            // Save the assignment
            settings.characterColors.assignments[characterName] = assignedColor;
            localStorage.setItem('writerStudio_settings', JSON.stringify(settings, null, 2));
            
            return assignedColor;
        }
        
        return '';
    }

    /**
     * Process text and wrap character names with color-coded elements
     * @param {string} text - The text to process
     * @param {Array} characterNames - Array of character names to look for
     * @returns {string} HTML string with character names wrapped
     */
    processTextForCharacterNames(text, characterNames = []) {
        if (!characterNames.length) {
            return text;
        }
        
        const settings = this._loadSettings();
        if (!settings.characterColors?.enabled && !settings.characterHover?.enabled) {
            return text;
        }
        
        let processedText = text;
        
        // Sort by length (longest first) to avoid partial matches
        const sortedNames = [...characterNames].sort((a, b) => b.length - a.length);
        
        sortedNames.forEach(name => {
            const regex = new RegExp(`\\b${this._escapeRegex(name)}\\b`, 'gi');
            processedText = processedText.replace(regex, (match) => {
                const colorClass = settings.characterColors?.enabled ? this._getCharacterColor(match) : '';
                const hoverClass = settings.characterHover?.enabled ? 'character-hoverable' : '';
                const classes = [colorClass, hoverClass].filter(c => c).join(' ');
                
                return `<span class="${classes}" data-character="${match}">${match}</span>`;
            });
        });
        
        return processedText;
    }

    /**
     * Escape special regex characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    _escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get list of character names from current project
     * @returns {Promise<Array>} Array of character names
     */
    async _getProjectCharacterNames() {
        try {
            if (!AppState.currentProject) return [];
            
            const characters = await this.electronAPI.getCharacters(AppState.currentProject);
            return characters.map(char => char.name || char.displayName).filter(name => name);
        } catch (error) {
            console.error('Error getting character names:', error);
            return [];
        }
    }

    /**
     * Handle editor save action
     * @param {string} content - HTML content
     * @param {string} text - Plain text content
     */
    _handleEditorSave(content, text) {
        // This will be called by the editor's save button
        // The actual save logic is handled in saveEditorData
        console.log('Editor save triggered from toolbar');
        
        // Try to find the current item being edited
        const sectionTitle = document.getElementById('section-title');
        if (sectionTitle && sectionTitle.textContent.startsWith('Editing:')) {
            // Extract item info from the title
            const titleText = sectionTitle.textContent;
            const match = titleText.match(/Editing: (.+) \((.+)\)/);
            if (match) {
                const itemName = match[1];
                const itemType = match[2];
                this.saveEditorData(itemType, itemName);
            }
        }
    }

    /**
     * Handle editor save as action
     * @param {string} content - HTML content  
     * @param {string} text - Plain text content
     */
    async _handleEditorSaveAs(content, text) {
        try {
            const newName = await this.modalManager.showInput({
                title: 'Save As',
                message: 'Enter a new name for this item:',
                placeholder: 'New item name...'
            });

            if (newName) {
                // Create a new item with the content
                const currentSection = AppState.currentSection === 'editor' ? 'chapters' : AppState.currentSection;
                await this.createNewItem(currentSection, newName);
                
                // Save the content to the new item
                await this.saveEditorData(currentSection, newName);
                
                this.toastManager.success(`Saved as "${newName}"`);
            }
        } catch (error) {
            console.error('Error in save as:', error);
            this.toastManager.error('Failed to save as new item');
        }
    }

    showWelcomeMessage() {
        this.toastManager.show('Welcome to WriterStudio! Open a project to get started.', 'info');
    }

    async openItem(item) {
        // TODO: Implement item opening logic
        console.log('Opening item:', item);
        this.toastManager.show('Item editor coming soon', 'info');
    }

    async editItem(item) {
        // TODO: Implement item editing logic
        console.log('Editing item:', item);
        this.toastManager.show('Item editor coming soon', 'info');
    }

    async deleteItem(item) {
        console.log('Delete item called for:', item);
        
        if (!this.modalManager) {
            console.error('ModalManager not available for delete confirmation');
            if (this.toastManager) {
                this.toastManager.show('Cannot delete: Modal system not available', 'error');
            }
            return;
        }

        try {
            const confirmed = await this.modalManager.showConfirm({
                title: 'Delete Item',
                message: `Are you sure you want to delete "${item.displayName || item.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                confirmVariant: 'danger'
            });

            if (confirmed) {
                console.log('User confirmed deletion, proceeding...');
                
                try {
                    // Call the appropriate delete API based on the item type
                    const result = await this.deleteItemByType(item);
                    console.log('Delete operation result:', result);
                    
                    if (result && result.success !== false) {
                        console.log('Delete successful, refreshing UI...');
                        if (this.toastManager) {
                            this.toastManager.show('Item deleted successfully', 'success');
                        }
                        
                        // Refresh current section
                        await this.loadSectionData(AppState.currentSection);
                        this.updateContentArea();
                    } else {
                        throw new Error(result?.message || 'Delete operation failed');
                    }
                } catch (error) {
                    console.error('Error deleting item:', error);
                    if (this.toastManager) {
                        this.toastManager.show('Failed to delete item: ' + error.message, 'error');
                    }
                }
            } else {
                console.log('User cancelled deletion');
            }
        } catch (error) {
            console.error('Error in deleteItem:', error);
            if (this.toastManager) {
                this.toastManager.show('Failed to delete item: ' + error.message, 'error');
            }
        }
    }

    async deleteItemByType(item) {
        if (!this.electronAPI || !AppState.currentProject) {
            throw new Error('No project loaded or Electron API unavailable');
        }

        console.log(`Deleting ${item.type} with path: ${item.path}`);

        switch (item.type) {
            case 'chapter':
                return await this.electronAPI.deleteChapter(AppState.currentProject, item.path);
            case 'character':
                return await this.electronAPI.deleteCharacter(AppState.currentProject, item.path);
            case 'lore':
                return await this.electronAPI.deleteLoreItem(AppState.currentProject, item.path);
            case 'note':
                return await this.electronAPI.deleteNote(AppState.currentProject, item.path);
            default:
                throw new Error(`Unknown item type: ${item.type}`);
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: Create new item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.handleCreateNew();
        }
        
        // Ctrl/Cmd + T: Toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.themeManager.toggle();
        }
        
        // Number keys 1-4: Switch sections
        if (e.key >= '1' && e.key <= '4') {
            const sections = ['chapters', 'characters', 'lore', 'notes'];
            const sectionIndex = parseInt(e.key) - 1;
            if (sections[sectionIndex]) {
                this.switchSection(sections[sectionIndex]);
            }
        }
    }

    async loadAndShowEditor(itemType, itemName) {
        if (!this.currentProject || !this.currentProject.path) {
            this.toastManager.error("No project loaded. Cannot edit item.");
            return;
        }
        console.log(`Attempting to edit item: ${itemName} of type: ${itemType}`);
        this.toastManager.info(`Loading ${itemName} for editing...`);

        // This call will ensure updateContentArea renders the editor shell into #content-grid
        await this.switchSection('editor'); 

        try {
            const itemData = await this.fetchItemData(itemType, itemName);
            
            // The editor should already be in the DOM within #content-grid thanks to switchSection calling updateContentArea.
            // We might want to update a specific title *within* the editor or above it, but not clear #content-grid.

            // Let's find the content-grid where the editor was rendered.
            const contentGrid = document.getElementById('content-grid');
            if (!contentGrid || !contentGrid.contains(this.editor.editorElement)) {
                // This case should ideally not happen if switchSection('editor') worked correctly.
                console.error("Editor element not found in content-grid after switching to editor section. Re-rendering.");
                contentGrid.innerHTML = ''; // Clear it just in case it's in a weird state
                this.editor.render(contentGrid); // Force render if not found
            }

            // Update the main section header to reflect editing mode, or add a sub-header.
            // For now, let's ensure the main section title reflects that we are editing.
            const sectionTitleEl = document.getElementById('section-title');
            if(sectionTitleEl) sectionTitleEl.textContent = `Editing: ${itemName} (${itemType})`;
            // The description in the header can be cleared or updated too.
            const sectionDescEl = document.getElementById('section-description');
            if(sectionDescEl) sectionDescEl.textContent = `Modifying ${itemType.slice(0,-1)} details.`;
            
            // Add attributes dropdown to header actions
            this.setupAttributesDropdown(itemType, itemData?.attributes || {});


            if (itemData) {
                this.editor.loadData(itemData);
                this.toastManager.success(`${itemName} loaded successfully.`);
            } else {
                this.toastManager.warn(`Creating new ${itemType}: ${itemName}.`);
                this.editor.loadData({}); // Load empty for new item
            }
            
            if (this.editor.saveButton) {
                // Re-wire the save button to ensure it has the correct context and a fresh listener
                const oldSaveButton = this.editor.saveButton;
                const newSaveButton = oldSaveButton.cloneNode(true); // Clone to remove old listeners
                
                // Ensure the button is part of the editorElement if it was re-rendered or is complex
                // This assumes saveButton is a direct child or accessible for replacement.
                if (oldSaveButton.parentNode) {
                    oldSaveButton.parentNode.replaceChild(newSaveButton, oldSaveButton);
                } else if (this.editor.editorElement && !this.editor.editorElement.contains(newSaveButton)) {
                    // If save button wasn't in DOM but editorElement is, try appending to editorElement.
                    // This scenario is less likely if _buildEditorUI is robust.
                    this.editor.editorElement.appendChild(newSaveButton);
                }
                this.editor.saveButton = newSaveButton; // Update the reference
                this.editor.saveButton.onclick = () => this.saveEditorData(itemType, itemName);
            } else {
                console.error("Editor save button not found on instance!");
            }

        } catch (error) {
            console.error(`Error loading item ${itemName} for editing:`, error);
            this.toastManager.error(`Error loading ${itemName}: ${error.message}`);
            // Optionally switch back to the previous section if editing fails to load
            // this.switchSection(AppState.currentSection); // AppState.currentSection would be 'editor' here, need previous.
        }
    }

    /**
     * Fetches item data using IPC.
     * @param {string} itemType - Type of item (e.g., 'chapters')
     * @param {string} itemName - Name of item
     * @returns {Promise<object|null>}
     */
    async fetchItemData(itemType, itemName) {
        console.log(`Fetching data for ${itemType}/${itemName} from main process.`);
        if (!window.electronAPI || !window.electronAPI.getItemDetails) {
            this.toastManager.error('Electron API for fetching item details is not available.');
            throw new Error('IPC bridge not available for getItemDetails.');
        }
        if (!this.currentProject || !this.currentProject.path) {
            this.toastManager.error('Cannot fetch item data: No project is currently open.');
            throw new Error('No project open.');
        }

        try {
            const data = await window.electronAPI.getItemDetails(this.currentProject.path, itemType, itemName);
            console.log('Received item data from main process:', data);
            return data;
        } catch (error) {
            console.error(`Error fetching item data for ${itemType}/${itemName} via IPC:`, error);
            // If file not found, it could be a new item. Return null to indicate this.
            // The main process might throw an error that doesn't distinguish ENOENT, so this check might be fragile.
            // For now, we assume any error means data isn't there or is inaccessible.
            this.toastManager.warn(`Could not fetch details for ${itemName}. It might be a new item.`);
            return null; // Or an empty structure: { content: '', description: '', attributes: {} }
        }
    }

    /**
     * Saves the current data from the editor using IPC.
     * @param {string} itemType - The type of the item being edited.
     * @param {string} itemName - The name of the item being edited.
     */
    /**
     * Setup attributes dropdown in the header for editor mode
     */
    setupAttributesDropdown(itemType, currentAttributes) {
        const headerActions = document.querySelector('.content-header .header-actions');
        if (!headerActions) return;

        // Remove existing attributes dropdown if present
        const existingDropdown = headerActions.querySelector('.attributes-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Store current attributes for saving
        this.currentAttributes = { ...currentAttributes };

        // Create and add new attributes dropdown
        const attributesDropdown = this.attributesManager.createAttributeDropdown(
            itemType,
            this.currentAttributes,
            (updatedAttributes) => {
                this.currentAttributes = updatedAttributes;
                console.log('Attributes updated:', this.currentAttributes);
            }
        );

        headerActions.appendChild(attributesDropdown);
    }

    /**
     * Clean up editor-specific elements from header when exiting editor mode
     */
    cleanupEditorHeader() {
        const headerActions = document.querySelector('.content-header .header-actions');
        if (!headerActions) return;

        // Remove attributes dropdown
        const attributesDropdown = headerActions.querySelector('.attributes-dropdown');
        if (attributesDropdown) {
            attributesDropdown.remove();
        }

        // Reset current attributes
        this.currentAttributes = {};
    }

    async saveEditorData(itemType, itemName) {
        if (!this.currentProject || !this.currentProject.path) {
            this.toastManager.error("No project loaded. Cannot save item.");
            return;
        }
        if (!this.editor) {
            this.toastManager.error("Editor instance not available. Cannot save.");
            return;
        }

        const editorData = this.editor.getData();
        if (!editorData) {
            this.toastManager.error("Could not retrieve data from editor.");
            return;
        }

        // Include current attributes from the dropdown
        editorData.attributes = this.currentAttributes || {};

        console.log(`Saving data for ${itemType}/${itemName}:`, editorData);
        this.toastManager.info(`Saving ${itemName}...`);

        if (!window.electronAPI || !window.electronAPI.saveItemDetails) {
            this.toastManager.error('Electron API for saving item details is not available.');
            throw new Error('IPC bridge not available for saveItemDetails.');
        }

        try {
            const result = await window.electronAPI.saveItemDetails(this.currentProject.path, itemType, itemName, editorData);
            if (result && result.success) {
                this.toastManager.success(`${itemName} saved successfully!`);
                // Optionally, refresh project data or the specific section list
                // await this.loadSectionData(itemType); // Example: reload the current section data
                // this.updateContentArea(); // And refresh the UI if you have a list view
            } else {
                this.toastManager.error(`Failed to save ${itemName}: ${result ? result.message : 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`Error saving item ${itemName} via IPC:`, error);
            this.toastManager.error(`Error saving ${itemName}: ${error.message}`);
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    try {
        console.log('Initializing WriterStudio...');
        window.writerStudio = new WriterStudioApp();
        console.log('WriterStudio instance created');
    } catch (error) {
        console.error('Failed to create WriterStudio instance:', error);
        
        // Show error in UI if possible
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Application Error</h3>
            <p>Failed to initialize WriterStudio: ${error.message}</p>
            <p>Please check the console for more details.</p>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Export for testing
export { WriterStudioApp, AppState, SECTIONS };