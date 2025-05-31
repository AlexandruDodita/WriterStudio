/**
 * Modern Home Screen Application
 * Handles the beautiful welcome screen and project management
 */

// Import modern components
import { ThemeManager } from './components/Common/ThemeManager.js';
import { ModalManager } from './components/Common/ModalManager.js';
import { ToastManager } from './components/Common/ToastManager.js';

/**
 * Home Application Class
 * Manages the home screen functionality with modern UI patterns
 */
class HomeApp {
    constructor() {
        console.log('HomeApp constructor called');
        
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
            this.themeManager = new ThemeManager();
            console.log('ThemeManager initialized');
        } catch (error) {
            console.error('Failed to initialize ThemeManager:', error);
            this.themeManager = null;
        }
        
        try {
            this.modalManager = new ModalManager();
            console.log('ModalManager initialized');
        } catch (error) {
            console.error('Failed to initialize ModalManager:', error);
            this.modalManager = null;
        }
        
        try {
            this.toastManager = new ToastManager();
            console.log('ToastManager initialized');
        } catch (error) {
            console.error('Failed to initialize ToastManager:', error);
            this.toastManager = null;
        }
        
        // Initialize the app asynchronously
        this.initializeApp().catch(error => {
            console.error('Critical error during app initialization:', error);
        });
    }

    async initializeApp() {
        try {
            // Initialize theme system
            this.initializeTheme();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load recent projects
            await this.loadRecentProjects();
            
            // Setup default project location
            await this.setupDefaultLocation();
            
            // Show welcome animations
            this.startWelcomeAnimations();
            
            console.log('HomeApp initialized successfully');
            
            // Show welcome toast
            if (this.toastManager) {
                setTimeout(() => {
                    this.toastManager.show('Welcome to Writer\'s Studio! 🎉', 'success');
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to initialize HomeApp:', error);
            if (this.toastManager) {
                this.toastManager.show('Failed to initialize application', 'error');
            }
        }
    }

    initializeTheme() {
        // Initialize theme manager
        if (this.themeManager) {
            this.themeManager.initialize();
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle && this.themeManager) {
            themeToggle.addEventListener('click', () => {
                this.themeManager.toggle();
            });
        }

        // Create project button
        const createProjectBtn = document.getElementById('create-project');
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', () => {
                this.handleCreateProject();
            });
        }

        // Open project button  
        const openProjectBtn = document.getElementById('open-project');
        if (openProjectBtn) {
            openProjectBtn.addEventListener('click', () => {
                this.handleOpenProject();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Add subtle parallax effect to floating elements
        this.setupParallaxEffect();
    }

    setupParallaxEffect() {
        document.addEventListener('mousemove', (e) => {
            const floatingElements = document.querySelectorAll('.floating-element');
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            floatingElements.forEach((element, index) => {
                const speed = (index + 1) * 0.5;
                const xOffset = (x - 0.5) * speed * 10;
                const yOffset = (y - 0.5) * speed * 10;
                
                element.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            });
        });
    }

    async handleCreateProject() {
        try {
            if (!this.modalManager) {
                console.error('ModalManager not available');
                // Fallback: use native prompt
                const projectName = prompt('Enter a name for your new writing project:');
                if (!projectName) return;
                
                const useDefault = confirm('Create project in default location?');
                let projectLocation = '';
                
                try {
                    projectLocation = await this.electronAPI.getDefaultProjectsPath();
                } catch (error) {
                    console.error('Error getting default location:', error);
                    projectLocation = 'C:\\Users\\' + (process.env.USERNAME || 'User') + '\\WritersStudioProjects';
                }
                
                if (!useDefault) {
                    try {
                        const result = await this.electronAPI.selectDirectory();
                        if (result && !result.canceled && result.filePaths.length > 0) {
                            projectLocation = result.filePaths[0];
                        } else {
                            return;
                        }
                    } catch (error) {
                        console.error('Error selecting directory:', error);
                        alert('Failed to select directory');
                        return;
                    }
                }
                
                try {
                    const projectPath = await this.electronAPI.createProject(projectName, projectLocation);
                    alert('Project created successfully!');
                    setTimeout(async () => {
                        await this.electronAPI.openProject(projectPath);
                    }, 500);
                } catch (error) {
                    alert(`Failed to create project: ${error.message}`);
                }
                return;
            }

            // Get project name from user
            const projectName = await this.modalManager.showInput({
                title: 'Create New Project',
                message: 'Enter a name for your new writing project:',
                placeholder: 'My Amazing Novel',
                confirmText: 'Continue'
            });

            if (!projectName) {
                return; // User cancelled
            }

            // Get default location
            let defaultLocation = '';
            try {
                defaultLocation = await this.electronAPI.getDefaultProjectsPath();
            } catch (error) {
                console.error('Error getting default location:', error);
            }

            // Show location selector
            const shouldCustomizeLocation = await this.modalManager.showConfirm({
                title: 'Project Location',
                message: `Create project in default location?\n\n${defaultLocation}`,
                confirmText: 'Use Default',
                cancelText: 'Choose Different Location'
            });

            let projectLocation = defaultLocation;

            if (!shouldCustomizeLocation) {
                // User wants to choose custom location
                try {
                    const result = await this.electronAPI.selectDirectory();
                    if (result && !result.canceled && result.filePaths.length > 0) {
                        projectLocation = result.filePaths[0];
                    } else {
                        return; // User cancelled directory selection
                    }
                } catch (error) {
                    console.error('Error selecting directory:', error);
                    if (this.toastManager) {
                        this.toastManager.show('Failed to select directory', 'error');
                    } else {
                        alert('Failed to select directory');
                    }
                    return;
                }
            }

            // Show loading toast
            const loadingToast = this.toastManager ? this.toastManager.loading('Creating project...') : null;

            try {
                console.log(`Creating project: "${projectName}" at "${projectLocation}"`);
                const projectPath = await this.electronAPI.createProject(projectName, projectLocation);
                
                // Convert loading toast to success
                if (loadingToast && this.toastManager) {
                    this.toastManager.loadingSuccess(loadingToast, 'Project created successfully! 🎉');
                } else {
                    alert('Project created successfully!');
                }
                
                console.log(`Project created at: ${projectPath}, opening...`);
                
                // Small delay for better UX
                setTimeout(async () => {
                    try {
                        await this.electronAPI.openProject(projectPath);
                    } catch (error) {
                        console.error('Error opening project:', error);
                        if (this.toastManager) {
                            this.toastManager.show('Created project but failed to open it', 'warning');
                        } else {
                            alert('Created project but failed to open it');
                        }
                    }
                }, 1000);

            } catch (error) {
                console.error('Error creating project:', error);
                if (loadingToast && this.toastManager) {
                    this.toastManager.loadingError(loadingToast, `Failed to create project: ${error.message}`);
                } else {
                    alert(`Failed to create project: ${error.message}`);
                }
            }

        } catch (error) {
            console.error('Error in handleCreateProject:', error);
            if (this.toastManager) {
                this.toastManager.show('An unexpected error occurred', 'error');
            } else {
                alert('An unexpected error occurred');
            }
        }
    }

    async handleOpenProject() {
        try {
            if (!this.electronAPI) {
                this.toastManager.show('Application not properly initialized', 'error');
                return;
            }

            // Show loading state
            const loadingToast = this.toastManager.loading('Opening file dialog...');

            try {
                const result = await this.electronAPI.selectDirectory();
                this.toastManager.loadingSuccess(loadingToast, 'Directory selected');
                
                console.log('Selected directory for opening:', result);
                
                if (result && !result.canceled && result.filePaths.length > 0) {
                    const projectPath = result.filePaths[0];
                    console.log(`Selected project path: ${projectPath}, validating...`);

                    // Show validation loading
                    const validationToast = this.toastManager.loading('Validating project...');

                    try {
                        // Validate that this is a Writer's Studio project
                        const isValid = await this.electronAPI.validateProject(projectPath);
                        console.log(`Project validation result: ${isValid}`);

                        if (isValid) {
                            this.toastManager.loadingSuccess(validationToast, 'Valid project found! Opening...');
                            
                            console.log(`Opening project at: ${projectPath}`);
                            await this.electronAPI.openProject(projectPath);
                        } else {
                            this.toastManager.loadingError(validationToast, 'Not a valid Writer\'s Studio project');
                            
                            // Ask user if they want to create a new project in this location
                            const shouldCreate = await this.modalManager.showConfirm({
                                title: 'Invalid Project',
                                message: 'The selected folder is not a valid Writer\'s Studio project. Would you like to create a new project here instead?',
                                confirmText: 'Create New Project',
                                cancelText: 'Cancel'
                            });

                            if (shouldCreate) {
                                // Extract folder name as project name suggestion
                                const folderName = projectPath.split(/[/\\]/).pop() || 'New Project';
                                
                                const projectName = await this.modalManager.showInput({
                                    title: 'Create Project in Selected Folder',
                                    message: 'Enter a name for the new project:',
                                    placeholder: folderName,
                                    confirmText: 'Create'
                                });

                                if (projectName) {
                                    const createToast = this.toastManager.loading('Creating project...');
                                    try {
                                        const newProjectPath = await this.electronAPI.createProject(projectName, projectPath);
                                        this.toastManager.loadingSuccess(createToast, 'Project created successfully!');
                                        
                                        setTimeout(async () => {
                                            await this.electronAPI.openProject(newProjectPath);
                                        }, 1000);
                                    } catch (error) {
                                        this.toastManager.loadingError(createToast, `Failed to create project: ${error.message}`);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        this.toastManager.loadingError(validationToast, `Validation failed: ${error.message}`);
                    }
                } else {
                    this.toastManager.loadingError(loadingToast, 'No directory selected');
                }
            } catch (error) {
                this.toastManager.loadingError(loadingToast, `Failed to open dialog: ${error.message}`);
            }

        } catch (error) {
            console.error('Error in handleOpenProject:', error);
            if (this.toastManager) {
                this.toastManager.show('An unexpected error occurred', 'error');
            }
        }
    }

    async setupDefaultLocation() {
        try {
            if (this.electronAPI) {
                const defaultPath = await this.electronAPI.getDefaultProjectsPath();
                console.log('Default project path set:', defaultPath);
            }
        } catch (error) {
            console.error('Error setting up default location:', error);
        }
    }

    async loadRecentProjects() {
        try {
            if (this.electronAPI) {
                const recentProjects = await this.electronAPI.getRecentProjects();
                this.displayRecentProjects(recentProjects);
            }
        } catch (error) {
            console.error('Error loading recent projects:', error);
        }
    }

    displayRecentProjects(projects) {
        const container = document.getElementById('recent-projects-list');
        if (!container) return;

        if (!projects || projects.length === 0) {
            // Empty state is already shown in HTML
            return;
        }

        // Clear empty state
        container.innerHTML = '';

        // Create project cards
        projects.forEach((project, index) => {
            const projectCard = this.createRecentProjectCard(project);
            projectCard.style.animationDelay = `${(index + 1) * 0.1}s`;
            container.appendChild(projectCard);
        });
    }

    createRecentProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'recent-project-card';
        
        const projectName = project.name || project.path.split(/[/\\]/).pop() || 'Unknown Project';
        const lastModified = project.lastModified ? new Date(project.lastModified).toLocaleDateString() : 'Unknown';

        card.innerHTML = `
            <div class="project-info">
                <h4 class="project-name">${this.escapeHtml(projectName)}</h4>
                <p class="project-path">${this.escapeHtml(project.path)}</p>
                <span class="project-date">Last modified: ${lastModified}</span>
            </div>
            <div class="project-actions">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
                </svg>
            </div>
        `;

        card.addEventListener('click', async () => {
            try {
                const loadingToast = this.toastManager.loading('Opening project...');
                await this.electronAPI.openProject(project.path);
                this.toastManager.loadingSuccess(loadingToast, 'Project opened successfully!');
            } catch (error) {
                console.error('Error opening recent project:', error);
                this.toastManager.show(`Failed to open project: ${error.message}`, 'error');
            }
        });

        return card;
    }

    startWelcomeAnimations() {
        // Add entrance animations to elements
        const animatedElements = document.querySelectorAll('.hero-title, .hero-subtitle, .action-card, .feature-card');
        
        animatedElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100 + (index * 100));
        });
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: Create new project
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.handleCreateProject();
        }
        
        // Ctrl/Cmd + O: Open project
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            this.handleOpenProject();
        }
        
        // Ctrl/Cmd + T: Toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            if (this.themeManager) {
                this.themeManager.toggle();
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing HomeApp...');
    
    try {
        window.homeApp = new HomeApp();
        console.log('HomeApp instance created successfully');
    } catch (error) {
        console.error('Failed to create HomeApp instance:', error);
        
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
            <p>Failed to initialize Home Screen: ${error.message}</p>
            <p>Please check the console for more details.</p>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Export for testing
export { HomeApp };