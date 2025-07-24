/**
 * Modern WriterStudio Application
 * Main renderer process controller
 */

// Import modules using ES6 syntax
import { UIManager } from './components/Common/UIManager.js';
import { ThemeManager } from './components/Common/ThemeManager.js';
import { ModalManager } from './components/Common/ModalManager.js';
import { ToastManager } from './components/Common/ToastManager.js';
import { SettingsManager } from './components/Common/SettingsManager.js';
import { CharacterPreview } from './components/Common/CharacterPreview.js';
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
        
        try {
            this.settingsManager = new SettingsManager(this.electronAPI, this.themeManager);
            console.log('SettingsManager initialized');
        } catch (error) {
            console.error('Failed to initialize SettingsManager:', error);
        }
        
        try {
            this.characterPreview = new CharacterPreview(this.electronAPI, this.settingsManager);
            console.log('CharacterPreview initialized');
        } catch (error) {
            console.error('Failed to initialize CharacterPreview:', error);
        }
        
        this.editor = new Editor(this.uiManager, {
            onSave: (content) => {
                if (this.currentEditingItem) {
                    this.saveEditorData(this.currentEditingItem.type, this.currentEditingItem.name);
                }
            }
        });
        this.attributesManager = new AttributesManager(this.electronAPI, this.toastManager);
        this.currentSection = 'home';
        this.currentProject = null;
        this.currentAttributes = {};
        this.currentEditingItem = null; // Track what's being edited
        
        // Initialize the app asynchronously
        this.initializeApp().catch(error => {
            console.error('Critical error during app initialization:', error);
        });
    }

    async initializeApp() {
        console.log('Initializing application...');
        
        try {
            // Setup event listeners first
            this.setupEventListeners();
            
            // Apply saved theme from settings
            if (this.settingsManager && this.themeManager) {
                const savedTheme = this.settingsManager.settings.theme;
                this.themeManager.setTheme(savedTheme);
            }
            
            // Apply saved theme preference (legacy - can be removed)
            // this.themeManager.applySavedTheme();
            
            // Check for project in URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const projectPath = urlParams.get('project');
            
            if (projectPath) {
                await this.loadProject(decodeURIComponent(projectPath));
            }
            
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
        
        // Import button
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog());
        }

        // Create new button (generic)
        const createNewBtn = document.getElementById('create-new-btn');

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

    handleImport() {
        this.toastManager.show('Import functionality coming soon', 'info');
    }

    showSettings() {
        if (this.settingsManager) {
            this.settingsManager.showSettingsModal(this.modalManager);
        } else {
            this.modalManager.show({
                title: 'Settings',
                content: '<p>Settings system not initialized</p>',
                size: 'large'
            });
        }
    }

    async showImportDialog() {
        if (!this.currentProject || !this.currentProject.path) {
            this.toastManager.error('Please open a project first');
            return;
        }

        const currentSection = AppState.currentSection;
        if (currentSection === 'editor') {
            this.toastManager.warning('Cannot import while in editor mode');
            return;
        }

        const sectionConfig = SECTIONS[currentSection];
        
        const result = await new Promise((resolve) => {
            const modal = this.modalManager.show({
                title: `Import to ${sectionConfig.title}`,
                content: `
                    <div class="import-options">
                        <p>Choose import method:</p>
                        <div class="option-group">
                            <button class="option-btn" data-choice="files">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                <span>Select Files</span>
                                <small>Choose individual .docx, .odt, .txt files</small>
                            </button>
                            <button class="option-btn" data-choice="folder">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                                    <path d="M10,4H4C2.89,4 2,4.89 2,5V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V7C22,5.89 21.1,5 20,5H12L10,4Z"/>
                                </svg>
                                <span>Select Folder</span>
                                <small>Import all documents from a folder</small>
                            </button>
                        </div>
                    </div>
                `,
                size: 'medium',
                customClass: 'import-dialog',
                showCancel: true,
                confirmText: 'Cancel',
                onConfirm: () => false
            });

            // Wait a bit for modal to be rendered
            setTimeout(() => {
                const modalEl = document.querySelector('.modal.import-dialog');
                if (modalEl) {
                    const buttons = modalEl.querySelectorAll('.option-btn');
                    buttons.forEach(btn => {
                        btn.addEventListener('click', () => {
                            const choice = btn.dataset.choice;
                            // Close the modal and resolve with the choice
                            const modalId = modalEl.id;
                            if (modalId && this.modalManager.activeModals.has(modalId)) {
                                this.modalManager.closeModal(modalId, choice);
                            }
                            resolve(choice);
                        });
                    });
                }
            }, 100);

            // Handle modal promise
            modal.then((result) => {
                if (!result) resolve(null);
            }).catch(() => resolve(null));
        });

        if (!result) return;
        
        const importChoice = result;

        try {
            let filePaths = [];

            if (importChoice === 'files') {
                result = await this.electronAPI.selectImportFiles();
                if (!result.canceled && result.filePaths) {
                    filePaths = result.filePaths;
                }
            } else if (importChoice === 'folder') {
                result = await this.electronAPI.selectImportFolder();
                if (!result.canceled && result.filePaths && result.filePaths[0]) {
                    // Get all document files from the folder
                    const folderPath = result.filePaths[0];
                    filePaths = await this.electronAPI.readDirectory(folderPath);
                }
            }

            if (filePaths.length > 0) {
                this.toastManager.info(`Importing ${filePaths.length} file(s)...`);
                
                const importResults = await this.electronAPI.processImportFiles(
                    this.currentProject.path,
                    filePaths,
                    currentSection
                );

                const successful = importResults.filter(r => r.success).length;
                const failed = importResults.filter(r => !r.success).length;

                if (successful > 0) {
                    this.toastManager.success(`Successfully imported ${successful} file(s)`);
                    // Refresh the current section
                    await this.loadSectionData(currentSection);
                    this.updateContentArea();
                }

                if (failed > 0) {
                    const errors = importResults
                        .filter(r => !r.success)
                        .map(r => `${r.fileName}: ${r.error}`)
                        .join('\n');
                    
                    this.modalManager.show({
                        title: 'Import Errors',
                        content: `<p>Failed to import ${failed} file(s):</p><pre>${errors}</pre>`,
                        confirmText: 'OK',
                        showCancel: false
                    });
                }
            }
        } catch (error) {
            console.error('Import error:', error);
            this.toastManager.error(`Import failed: ${error.message}`);
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
        
        // Track what's being edited
        this.currentEditingItem = { type: itemType, name: itemName };

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