/**
 * Modern WriterStudio Application
 * Main renderer process controller
 */

// Import modules using ES6 syntax
import { UIManager } from './components/Common/UIManager.js';
import { ThemeManager } from './components/Common/ThemeManager.js';
import { ModalManager } from './components/Common/ModalManager.js';
import { ToastManager } from './components/Common/ToastManager.js';

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
            this.modalManager = new ModalManager();
            console.log('ModalManager initialized');
        } catch (error) {
            console.error('Failed to initialize ModalManager:', error);
        }
        
        try {
            this.toastManager = new ToastManager();
            console.log('ToastManager initialized');
        } catch (error) {
            console.error('Failed to initialize ToastManager:', error);
        }
        
        // Initialize the app asynchronously
        this.initializeApp().catch(error => {
            console.error('Critical error during app initialization:', error);
        });
    }

    async initializeApp() {
        try {
            this.setupEventListeners();
            this.initializeTheme();
            await this.loadProjectFromURL();
            this.updateUI();
            
            // Show welcome message if no project is loaded
            if (!AppState.currentProject) {
                this.showWelcomeMessage();
            }
            
            console.log('WriterStudio initialized successfully');
        } catch (error) {
            console.error('Failed to initialize WriterStudio:', error);
            this.toastManager.show('Failed to initialize application', 'error');
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

            // Validate project path
            if (!this.electronAPI) {
                throw new Error('Electron API not available');
            }
            
            console.log('Validating project path...');
            const isValid = await this.electronAPI.validateProject(projectPath);
            console.log('Project validation result:', isValid);
            
            if (!isValid) {
                throw new Error('Invalid project structure');
            }

            // Load project data
            AppState.currentProject = projectPath;
            console.log('AppState.currentProject set to:', AppState.currentProject);
            
            // Update project info in UI
            this.updateProjectInfo(projectPath);
            console.log('Project info updated in UI');
            
            // Load current section data
            console.log('Loading section data for:', AppState.currentSection);
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
        } finally {
            AppState.isLoading = false;
            this.updateLoadingState();
            this.updateUI();
            console.log('Final AppState:', AppState);
        }
    }

    async switchSection(section) {
        if (section === AppState.currentSection) return;

        try {
            AppState.currentSection = section;
            
            // Update navigation active state
            this.updateNavigationState();
            
            // Update section header
            this.updateSectionHeader();
            
            // Load section data
            await this.loadSectionData(section);
            
            // Update content area
            this.updateContentArea();
            
        } catch (error) {
            console.error('Error switching section:', error);
            this.toastManager.show('Failed to load section', 'error');
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

    updateContentArea() {
        const contentGrid = document.getElementById('content-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!contentGrid || !emptyState) return;

        const sectionData = AppState.sectionData[AppState.currentSection];
        const config = SECTIONS[AppState.currentSection];

        // Clear existing content except empty state
        const existingCards = contentGrid.querySelectorAll('.card');
        existingCards.forEach(card => card.remove());

        if (sectionData.items.length === 0) {
            // Show empty state
            emptyState.style.display = 'flex';
            emptyState.querySelector('h3').textContent = config.emptyMessage;
            emptyState.querySelector('p').textContent = config.emptyDescription;
            emptyState.querySelector('.action-btn span').textContent = config.createLabel;
        } else {
            // Hide empty state and show content cards
            emptyState.style.display = 'none';
            this.renderContentCards(sectionData.items);
        }

        // Update counts in navigation
        this.updateSectionCounts();
    }

    renderContentCards(items) {
        const contentGrid = document.getElementById('content-grid');
        if (!contentGrid) return;

        items.forEach(item => {
            const card = this.createContentCard(item);
            contentGrid.appendChild(card);
        });
    }

    createContentCard(item) {
        console.log('Creating content card for item:', item);
        
        const card = document.createElement('div');
        card.className = 'card animate-fade-in';
        
        // Handle different data structures from the API
        const displayName = item.displayName || item.name || 'Untitled';
        const lastModified = item.lastModified ? new Date(item.lastModified).toLocaleDateString() : 'Unknown';
        const wordCount = item.wordCount || 0;
        const description = item.description || item.synopsis || 'No description available';
        
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(displayName)}</h3>
                <div class="card-actions">
                    <button class="card-btn" data-action="edit" title="Edit">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                        </svg>
                    </button>
                    <button class="card-btn" data-action="delete" title="Delete">
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
        card.addEventListener('click', (e) => {
            try {
                if (!e.target.closest('.card-btn')) {
                    this.openItem(item);
                }
            } catch (error) {
                console.error('Error opening item:', error);
            }
        });

        const editBtn = card.querySelector('[data-action="edit"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                try {
                    e.stopPropagation();
                    this.editItem(item);
                } catch (error) {
                    console.error('Error editing item:', error);
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

        return card;
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
        this.updateContentArea();
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
        this.modalManager.show({
            title: 'Settings',
            content: '<p>Settings panel coming soon...</p>',
            size: 'large'
        });
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