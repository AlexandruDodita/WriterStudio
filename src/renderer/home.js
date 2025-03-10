// Get DOM elements
let createProjectBtn, openProjectBtn, createProjectModal, closeModalBtn;
let cancelCreateBtn, confirmCreateBtn, projectNameInput, projectLocationInput, browseLocationBtn;

// Function to initialize all DOM elements and event listeners
function initializeApp() {
    console.log('Initializing application...');
    
    try {
        // Check if electronAPI is available from the preload script
        const electronAPI = window.electronAPI;
        
        if (!electronAPI) {
            console.error('CRITICAL ERROR: electronAPI is not available from preload script');
            displayError('Application initialization failed. electronAPI is not available.');
            return false;
        }
        
        console.log('electronAPI loaded successfully:', Object.keys(electronAPI));
        
        // Get DOM elements
        createProjectBtn = document.getElementById('create-project');
        openProjectBtn = document.getElementById('open-project');
        createProjectModal = document.getElementById('create-project-modal');
        closeModalBtn = document.querySelector('.close-btn');
        cancelCreateBtn = document.getElementById('cancel-create');
        confirmCreateBtn = document.getElementById('confirm-create');
        projectNameInput = document.getElementById('project-name');
        projectLocationInput = document.getElementById('project-location');
        browseLocationBtn = document.getElementById('browse-location');
        
        // Verify all DOM elements exist
        const elements = [
            { name: 'createProjectBtn', el: createProjectBtn },
            { name: 'openProjectBtn', el: openProjectBtn },
            { name: 'createProjectModal', el: createProjectModal },
            { name: 'closeModalBtn', el: closeModalBtn },
            { name: 'cancelCreateBtn', el: cancelCreateBtn },
            { name: 'confirmCreateBtn', el: confirmCreateBtn },
            { name: 'projectNameInput', el: projectNameInput },
            { name: 'projectLocationInput', el: projectLocationInput },
            { name: 'browseLocationBtn', el: browseLocationBtn }
        ];
        
        const missingElements = elements.filter(item => !item.el);
        
        if (missingElements.length > 0) {
            const missing = missingElements.map(item => item.name).join(', ');
            console.error(`CRITICAL ERROR: Could not find these DOM elements: ${missing}`);
            displayError(`Application initialization failed. Missing elements: ${missing}`);
            return false;
        }
        
        console.log('All DOM elements found successfully');
        
        // Setup event listeners
        setupEventListeners(electronAPI);
        
        // Set default project location
        electronAPI.getDefaultProjectsPath().then(path => {
            console.log('Default project path:', path);
            projectLocationInput.value = path;
        }).catch(err => {
            console.error('Error getting default project path:', err);
        });
        
        return true;
    } catch (error) {
        console.error('Error during initialization:', error);
        displayError(`Application initialization failed: ${error.message}`);
        return false;
    }
}

// Function to set up all event listeners
function setupEventListeners(electronAPI) {
    console.log('Setting up event listeners...');
    
    // Event listeners for project creation
    createProjectBtn.addEventListener('click', () => {
        console.log('Create project button clicked');
        createProjectModal.style.display = 'block';
    });
    
    // Close modal when clicking on X or Cancel
    closeModalBtn.addEventListener('click', () => {
        console.log('Close modal button clicked');
        createProjectModal.style.display = 'none';
    });
    
    cancelCreateBtn.addEventListener('click', () => {
        console.log('Cancel create button clicked');
        createProjectModal.style.display = 'none';
    });
    
    // Close modal if clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === createProjectModal) {
            console.log('Clicked outside modal');
            createProjectModal.style.display = 'none';
        }
    });
    
    // Browse for project location
    browseLocationBtn.addEventListener('click', async () => {
        console.log('Browse location button clicked');
        try {
            const result = await electronAPI.selectDirectory();
            console.log('Selected directory result:', result);
            if (result && !result.canceled && result.filePaths.length > 0) {
                projectLocationInput.value = result.filePaths[0];
                console.log('Updated location input with path:', result.filePaths[0]);
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
            displayError(`Error selecting directory: ${error.message}`);
        }
    });
    
    // Create new project
    confirmCreateBtn.addEventListener('click', async () => {
        console.log('Confirm create button clicked');
        const projectName = projectNameInput.value.trim();
        const projectLocation = projectLocationInput.value;
    
        if (!projectName) {
            displayError('Please enter a project name');
            return;
        }
    
        try {
            console.log(`Creating project: "${projectName}" at "${projectLocation}"`);
            const projectPath = await electronAPI.createProject(projectName, projectLocation);
    
            console.log(`Project created at: ${projectPath}, opening...`);
            if (projectPath) {
                // Open the project
                await electronAPI.openProject(projectPath);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            displayError(`Error creating project: ${error.message}`);
        }
    });
    
    // Open existing project
    openProjectBtn.addEventListener('click', async () => {
        console.log('Open project button clicked');
        try {
            const result = await electronAPI.selectDirectory();
            console.log('Selected directory for opening:', result);
            if (result && !result.canceled && result.filePaths.length > 0) {
                const projectPath = result.filePaths[0];
                console.log(`Selected project path: ${projectPath}, validating...`);
    
                // Validate that this is a Writer's Studio project
                const isValid = await electronAPI.validateProject(projectPath);
                console.log(`Project validation result: ${isValid}`);
    
                if (isValid) {
                    console.log(`Opening project at: ${projectPath}`);
                    await electronAPI.openProject(projectPath);
                } else {
                    displayError('The selected folder is not a valid Writer\'s Studio project');
                }
            }
        } catch (error) {
            console.error('Error opening project:', error);
            displayError(`Error opening project: ${error.message}`);
        }
    });
    
    console.log('All event listeners set up successfully');
}

// Function to display errors to the user
function displayError(message) {
    console.error('ERROR:', message);
    alert(message);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing application...');
    const success = initializeApp();
    console.log('Application initialization result:', success ? 'SUCCESS' : 'FAILED');
});