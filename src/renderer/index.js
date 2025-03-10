// Get DOM elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const wordCountEl = document.querySelector('.status-bar span:first-child');
const charCountEl = document.querySelector('.status-bar span:last-child');
const sidebarNav = document.querySelector('.sidebar nav ul');

// Current project and file state
let currentProject = null;
let currentFile = null;
let currentSection = 'editor'; // Default section (editor, characters, lore, notes)
let isDirty = false; // Track if changes need to be saved

// Parse query parameters to get project path
function getProjectPathFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const projectPath = urlParams.get('project');

    return projectPath ? decodeURIComponent(projectPath) : null;
}

// Theme toggle functionality
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';

function applyTheme() {
    document.body.classList.toggle('dark-theme', isDarkTheme);
    themeToggleBtn.textContent = isDarkTheme ? 'Light Theme' : 'Dark Theme';
    localStorage.setItem('darkTheme', isDarkTheme);
}

themeToggleBtn.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    applyTheme();
});

// Word and character count
function updateWordCount() {
    const editorContent = document.getElementById('editor-content');
    if (!editorContent) return;

    const text = editorContent.value;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const charCount = text.length;

    if (wordCountEl) wordCountEl.textContent = `Words: ${wordCount}`;
    if (charCountEl) charCountEl.textContent = `Characters: ${charCount}`;
}

// Initialize the app
function init() {
    // Get the electronAPI from the preload script
    const { electronAPI } = window;
    
    if (!electronAPI) {
        console.error('CRITICAL ERROR: electronAPI is not available from preload script');
        alert('Application initialization failed. electronAPI is not available.');
        return;
    }
    
    console.log('electronAPI loaded successfully:', Object.keys(electronAPI));
    
    // Apply saved theme
    applyTheme();

    // Set up sidebar navigation
    setupNavigation();

    // Get project path from URL
    const projectPath = getProjectPathFromUrl();
    if (projectPath) {
        loadProject(projectPath, electronAPI);
    }

    // Set up editor event listeners
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.addEventListener('input', () => {
            isDirty = true;
            updateWordCount();
        });
    }

    console.log('Writer\'s Studio initialized');
}

// Load project content
async function loadProject(projectPath, electronAPI) {
    if (!projectPath) return;

    try {
        currentProject = projectPath;

        // Update UI to show we're in a project
        document.title = `Writer's Studio - ${path.basename(projectPath)}`;

        // Load project sections based on the active section
        await loadProjectSection(currentSection, electronAPI);

    } catch (error) {
        console.error('Error loading project:', error);
        alert('Error loading project: ' + error.message);
    }
}

// Load specific section of the project
async function loadProjectSection(section, electronAPI) {
    console.log(`Loading project section: ${section}`);
    if (!electronAPI) {
        console.error('electronAPI is not available for loadProjectSection');
        return;
    }
    
    // Set the currentSection so we know which section we're in
    currentSection = section;

    // Highlight the active section in the sidebar
    const navItems = sidebarNav.querySelectorAll('a');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });

    // Clear current content if dirty
    if (isDirty && currentFile) {
        const shouldDiscard = confirm('You have unsaved changes. Discard them?');
        if (!shouldDiscard) return;
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
    isDirty = false;

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
    }
}

// Load chapters for the editor section
async function loadChapters(electronAPI) {
    try {
        const chapters = await electronAPI.getChapters(currentProject);

        // Update UI to show chapters
        displayFileList(chapters, 'chapter', electronAPI);

    } catch (error) {
        console.error('Error loading chapters:', error);
    }
}

// Load characters
async function loadCharacters(electronAPI) {
    try {
        const characters = await electronAPI.getCharacters(currentProject);

        // Update UI to show characters
        displayFileList(characters, 'character', electronAPI);

    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

// Load lore items
async function loadLoreItems(electronAPI) {
    try {
        const loreItems = await electronAPI.getLoreItems(currentProject);

        // Update UI to show lore items
        displayFileList(loreItems, 'lore', electronAPI);

    } catch (error) {
        console.error('Error loading lore items:', error);
    }
}

// Load notes
async function loadNotes(electronAPI) {
    try {
        const notes = await electronAPI.getNotes(currentProject);

        // Update UI to show notes
        displayFileList(notes, 'note', electronAPI);

    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

// Display a list of files in the UI
function displayFileList(files, fileType, electronAPI) {
    console.log(`Displaying file list for ${fileType}:`, files);
    
    // Remove any existing editor container
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer) {
        editorContainer.remove();
    }
    
    // Create container for file list if it doesn't exist
    let fileListContainer = document.querySelector('.file-list');
    if (!fileListContainer) {
        fileListContainer = document.createElement('div');
        fileListContainer.className = 'file-list';
        document.querySelector('.editor-area').prepend(fileListContainer);
    }

    // Clear existing file list
    fileListContainer.innerHTML = '';
    fileListContainer.style.display = 'block';
    
    // Set a data attribute to indicate the current section
    fileListContainer.setAttribute('data-section', fileType);

    // Create header with "create new" button
    const header = document.createElement('div');
    header.className = 'file-list-header';

    const title = document.createElement('h3');
    title.textContent = getFileTypeTitle(fileType);

    const createButton = document.createElement('button');
    createButton.textContent = `New ${capitalize(fileType)}`;
    createButton.addEventListener('click', () => createNewFile(fileType, electronAPI));

    header.appendChild(title);
    header.appendChild(createButton);
    fileListContainer.appendChild(header);

    // Create list of files
    if (!files || files.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = `No ${fileType}s found. Create one to get started.`;
        fileListContainer.appendChild(emptyMessage);
    } else {
        const filesList = document.createElement('ul');

        files.forEach(file => {
            const fileItem = document.createElement('li');

            const fileLink = document.createElement('a');
            fileLink.href = '#';
            fileLink.textContent = file.name;
            
            // Store file path as data attribute for easier access
            fileLink.setAttribute('data-path', file.path);
            fileLink.setAttribute('data-type', file.type);
            
            fileLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Determine which file to open based on the type and implementation
                let filePath;
                
                if (file.type === 'chapter') {
                    // For chapters, first open the metadata
                    filePath = file.metadataPath;
                } else if (file.type === 'character') {
                    // For characters, first open the metadata
                    filePath = file.metadataPath;
                } else if (file.type === 'lore') {
                    // For lore items, first open the metadata
                    filePath = file.metadataPath;
                } else if (file.type === 'note') {
                    // For notes, first open the metadata
                    filePath = file.metadataPath;
                } else {
                    // Fallback to the main path
                    filePath = file.path;
                }
                
                openFile(filePath, electronAPI);
            });

            fileItem.appendChild(fileLink);
            
            // Add subfiles for all content types
            if (file.path) {
                // Create a subfiles container
                const subfilesList = document.createElement('ul');
                subfilesList.className = 'subfiles';
                
                // Add appropriate subfiles based on type
                if (file.type === 'chapter') {
                    // Add the content file
                    const contentFile = document.createElement('li');
                    contentFile.className = 'subfile';
                    
                    const contentLink = document.createElement('a');
                    contentLink.href = '#';
                    contentLink.className = 'subfile-link';
                    contentLink.textContent = 'Content';
                    contentLink.setAttribute('data-path', file.contentPath);
                    
                    contentLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(file.contentPath, electronAPI);
                    });
                    
                    contentFile.appendChild(contentLink);
                    subfilesList.appendChild(contentFile);
                    
                    // Add the description file for chapters
                    const descriptionFile = document.createElement('li');
                    descriptionFile.className = 'subfile';
                    
                    const descriptionLink = document.createElement('a');
                    descriptionLink.href = '#';
                    descriptionLink.className = 'subfile-link';
                    descriptionLink.textContent = 'Short Description';
                    descriptionLink.setAttribute('data-path', file.descriptionPath);
                    
                    descriptionLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(file.descriptionPath, electronAPI);
                    });
                    
                    descriptionFile.appendChild(descriptionLink);
                    subfilesList.appendChild(descriptionFile);
                } else if (file.type === 'character') {
                    // Add the profile file
                    const profileFile = document.createElement('li');
                    profileFile.className = 'subfile';
                    
                    const profileLink = document.createElement('a');
                    profileLink.href = '#';
                    profileLink.className = 'subfile-link';
                    profileLink.textContent = 'Profile';
                    
                    const profilePath = path.join(file.path, 'profile.txt');
                    profileLink.setAttribute('data-path', profilePath);
                    
                    profileLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(profilePath, electronAPI);
                    });
                    
                    profileFile.appendChild(profileLink);
                    subfilesList.appendChild(profileFile);
                } else if (file.type === 'lore') {
                    // Add the content file
                    const contentFile = document.createElement('li');
                    contentFile.className = 'subfile';
                    
                    const contentLink = document.createElement('a');
                    contentLink.href = '#';
                    contentLink.className = 'subfile-link';
                    contentLink.textContent = 'Content';
                    
                    const contentPath = path.join(file.path, 'content.txt');
                    contentLink.setAttribute('data-path', contentPath);
                    
                    contentLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(contentPath, electronAPI);
                    });
                    
                    contentFile.appendChild(contentLink);
                    subfilesList.appendChild(contentFile);
                } else if (file.type === 'note') {
                    // Add the content file
                    const contentFile = document.createElement('li');
                    contentFile.className = 'subfile';
                    
                    const contentLink = document.createElement('a');
                    contentLink.href = '#';
                    contentLink.className = 'subfile-link';
                    contentLink.textContent = 'Content';
                    
                    contentLink.setAttribute('data-path', file.contentPath);
                    
                    contentLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openFile(file.contentPath, electronAPI);
                    });
                    
                    contentFile.appendChild(contentLink);
                    subfilesList.appendChild(contentFile);
                }
                
                // Add images folder link for all types
                const imagesFolder = document.createElement('li');
                imagesFolder.className = 'subfile folder';
                
                const imagesLink = document.createElement('a');
                imagesLink.href = '#';
                imagesLink.className = 'subfile-link folder-link';
                imagesLink.textContent = 'Images';
                
                // We'll implement image management functionality later
                imagesLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('Image management will be implemented in a future update.');
                });
                
                imagesFolder.appendChild(imagesLink);
                subfilesList.appendChild(imagesFolder);
                
                // Add the subfiles list to the main file item
                fileItem.appendChild(subfilesList);
            }
            
            filesList.appendChild(fileItem);
        });

        fileListContainer.appendChild(filesList);
    }
}

// Get title for file list based on file type
function getFileTypeTitle(fileType) {
    switch (fileType) {
        case 'chapter': return 'Book Chapters';
        case 'character': return 'Characters';
        case 'lore': return 'World Lore';
        case 'note': return 'Notes';
        default: return capitalize(fileType) + 's';
    }
}

// Create a custom dialog to replace prompt()
function showCustomDialog(title, message, defaultValue = '') {
    return new Promise((resolve, reject) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'custom-dialog-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = title;
        header.appendChild(headerTitle);
        
        // Create body
        const body = document.createElement('div');
        body.className = 'custom-dialog-body';
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        body.appendChild(messageElement);
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'custom-dialog-input';
        input.value = defaultValue;
        body.appendChild(input);
        
        // Create actions
        const actions = document.createElement('div');
        actions.className = 'custom-dialog-actions';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'custom-dialog-btn';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
            reject(new Error('Dialog cancelled'));
        });
        
        const confirmButton = document.createElement('button');
        confirmButton.className = 'custom-dialog-btn custom-dialog-btn-primary';
        confirmButton.textContent = 'Create';
        confirmButton.addEventListener('click', () => {
            const value = input.value.trim();
            if (value) {
                document.body.removeChild(overlay);
                resolve(value);
            } else {
                input.focus();
            }
        });
        
        actions.appendChild(cancelButton);
        actions.appendChild(confirmButton);
        
        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Focus input
        setTimeout(() => input.focus(), 0);
        
        // Handle Enter and Escape keys
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                confirmButton.click();
            } else if (e.key === 'Escape') {
                cancelButton.click();
            }
        });
    });
}

// Create enhanced editor interface with title and navigation
function createEnhancedEditor(fileType, files, currentIndex, electronAPI) {
    console.log(`Creating enhanced editor for ${fileType} at index ${currentIndex}`);
    
    // Clear any existing file list
    const fileListContainer = document.querySelector('.file-list');
    if (fileListContainer) {
        fileListContainer.style.display = 'none';
    }
    
    // Create editor container if it doesn't exist
    let editorContainer = document.querySelector('.editor-container');
    if (!editorContainer) {
        editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';
        document.querySelector('.editor-area').appendChild(editorContainer);
    } else {
        // Clear existing content
        editorContainer.innerHTML = '';
    }
    
    editorContainer.style.display = 'block';
    
    // Create editor header
    const editorHeader = document.createElement('div');
    editorHeader.className = 'editor-header';
    
    // Title section
    const titleContainer = document.createElement('div');
    titleContainer.className = 'editor-title-container';
    
    const titleLabel = document.createElement('span');
    titleLabel.className = 'editor-title-label';
    titleLabel.textContent = 'Title:';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'editor-title-input';
    titleInput.value = files[currentIndex]?.name || '';
    
    // Store the original file path and name for reference
    const originalPath = files[currentIndex]?.path || '';
    const originalName = files[currentIndex]?.name || '';
    
    titleInput.setAttribute('data-original-path', originalPath);
    titleInput.setAttribute('data-original-name', originalName);
    
    // Add event listener for title changes
    titleInput.addEventListener('change', async () => {
        const newName = titleInput.value.trim();
        const originalPath = titleInput.getAttribute('data-original-path');
        const originalName = titleInput.getAttribute('data-original-name');
        
        if (!newName) {
            titleInput.value = originalName; // Reset to original if empty
            return;
        }
        
        if (newName === originalName) return; // No change
        
        try {
            // Check if the name already exists
            const parentDir = path.dirname(originalPath);
            
            const { exists } = await electronAPI.checkNameExists(
                parentDir, 
                newName, 
                fileType
            );
            
            if (exists) {
                showCustomDialog(
                    'Duplicate Name', 
                    `A ${fileType} with the name "${newName}" already exists. Please choose a different name.`,
                    newName
                ).then(uniqueName => {
                    // Try again with the new name
                    titleInput.value = uniqueName;
                    // Trigger change event manually
                    const event = new Event('change');
                    titleInput.dispatchEvent(event);
                }).catch(err => {
                    // User cancelled, revert to original name
                    titleInput.value = originalName;
                });
                return;
            }
            
            // Perform the rename
            const result = await electronAPI.renameFile(originalPath, newName);
            
            if (result.success) {
                console.log(`Successfully renamed from "${originalName}" to "${newName}"`);
                console.log(`Old path: ${originalPath}, New path: ${result.path}`);
                
                // Update the title input's data attributes
                titleInput.setAttribute('data-original-path', result.path);
                titleInput.setAttribute('data-original-name', newName);
                
                // Update the current file object in the files array
                files[currentIndex].name = newName;
                if (result.path && result.path !== originalPath) {
                    files[currentIndex].path = result.path;
                    
                    // Update the related paths based on file type
                    if (fileType === 'chapter' || fileType === 'note' || fileType === 'character' || fileType === 'lore') {
                        files[currentIndex].metadataPath = path.join(result.path, 'metadata.json');
                        
                        if (fileType === 'chapter') {
                            files[currentIndex].contentPath = path.join(result.path, 'content.txt');
                            files[currentIndex].descriptionPath = path.join(result.path, 'description.txt');
                        } else if (fileType === 'note') {
                            files[currentIndex].contentPath = path.join(result.path, 'content.txt');
                        }
                    }
                    
                    // IMPORTANT: Update the global currentFile variable to prevent saving to the old path
                    if (currentFile.startsWith(originalPath)) {
                        // Calculate the relative path within the item directory
                        const relativePath = currentFile.substring(originalPath.length);
                        // Update with new base path
                        currentFile = result.path + relativePath;
                        console.log(`Updated global currentFile to: ${currentFile}`);
                    }
                }
                
                // Update the file selector
                const fileSelect = document.querySelector('.file-selector select');
                if (fileSelect) {
                    const option = fileSelect.options[currentIndex];
                    if (option) {
                        option.textContent = newName;
                    }
                }
            }
        } catch (error) {
            console.error('Error renaming file:', error);
            // Show error dialog and revert to original name
            showCustomDialog(
                'Rename Error',
                `Error renaming to "${newName}": ${error.message}`,
                originalName
            ).then(newName => {
                titleInput.value = newName;
            }).catch(() => {
                titleInput.value = originalName;
            });
        }
    });
    
    titleContainer.appendChild(titleLabel);
    titleContainer.appendChild(titleInput);
    
    // Navigation controls
    const navControls = document.createElement('div');
    navControls.className = 'editor-nav-controls';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'nav-button prev-button';
    prevButton.innerHTML = '&larr;';
    prevButton.title = 'Previous';
    prevButton.disabled = currentIndex <= 0;
    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            // Check for unsaved changes
            if (isDirty) {
                const shouldSave = confirm('You have unsaved changes. Save them?');
                if (shouldSave) {
                    saveCurrentFile(electronAPI).then(() => {
                        // Open the previous file
                        const prevFile = files[currentIndex - 1];
                        const filePath = prevFile.metadataPath || prevFile.path;
                        openFile(filePath, electronAPI, { files, currentIndex: currentIndex - 1, fileType });
                    });
                } else {
                    // Discard changes and open the previous file
                    const prevFile = files[currentIndex - 1];
                    const filePath = prevFile.metadataPath || prevFile.path;
                    openFile(filePath, electronAPI, { files, currentIndex: currentIndex - 1, fileType });
                }
            } else {
                // No unsaved changes, open the previous file
                const prevFile = files[currentIndex - 1];
                const filePath = prevFile.metadataPath || prevFile.path;
                openFile(filePath, electronAPI, { files, currentIndex: currentIndex - 1, fileType });
            }
        }
    });
    
    // File selector
    const fileSelector = document.createElement('div');
    fileSelector.className = 'file-selector';
    
    const fileSelect = document.createElement('select');
    files.forEach((file, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = file.name;
        if (index === currentIndex) {
            option.selected = true;
        }
        fileSelect.appendChild(option);
    });
    
    fileSelect.addEventListener('change', () => {
        const selectedIndex = parseInt(fileSelect.value);
        if (selectedIndex !== currentIndex) {
            // Check for unsaved changes
            if (isDirty) {
                const shouldSave = confirm('You have unsaved changes. Save them?');
                if (shouldSave) {
                    saveCurrentFile(electronAPI).then(() => {
                        // Open the selected file
                        const selectedFile = files[selectedIndex];
                        const filePath = selectedFile.metadataPath || selectedFile.path;
                        openFile(filePath, electronAPI, { files, currentIndex: selectedIndex, fileType });
                    });
                } else {
                    // Discard changes and open the selected file
                    const selectedFile = files[selectedIndex];
                    const filePath = selectedFile.metadataPath || selectedFile.path;
                    openFile(filePath, electronAPI, { files, currentIndex: selectedIndex, fileType });
                }
            } else {
                // No unsaved changes, open the selected file
                const selectedFile = files[selectedIndex];
                const filePath = selectedFile.metadataPath || selectedFile.path;
                openFile(filePath, electronAPI, { files, currentIndex: selectedIndex, fileType });
            }
        }
    });
    
    fileSelector.appendChild(fileSelect);
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'nav-button next-button';
    nextButton.innerHTML = '&rarr;';
    nextButton.title = 'Next';
    nextButton.disabled = currentIndex >= files.length - 1;
    nextButton.addEventListener('click', () => {
        if (currentIndex < files.length - 1) {
            // Check for unsaved changes
            if (isDirty) {
                const shouldSave = confirm('You have unsaved changes. Save them?');
                if (shouldSave) {
                    saveCurrentFile(electronAPI).then(() => {
                        // Open the next file
                        const nextFile = files[currentIndex + 1];
                        const filePath = nextFile.metadataPath || nextFile.path;
                        openFile(filePath, electronAPI, { files, currentIndex: currentIndex + 1, fileType });
                    });
                } else {
                    // Discard changes and open the next file
                    const nextFile = files[currentIndex + 1];
                    const filePath = nextFile.metadataPath || nextFile.path;
                    openFile(filePath, electronAPI, { files, currentIndex: currentIndex + 1, fileType });
                }
            } else {
                // No unsaved changes, open the next file
                const nextFile = files[currentIndex + 1];
                const filePath = nextFile.metadataPath || nextFile.path;
                openFile(filePath, electronAPI, { files, currentIndex: currentIndex + 1, fileType });
            }
        }
    });
    
    navControls.appendChild(prevButton);
    navControls.appendChild(fileSelector);
    navControls.appendChild(nextButton);
    
    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'editor-action-buttons';
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.className = 'action-button save-button';
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => {
        saveCurrentFile(electronAPI);
    });
    
    // New button
    const newButton = document.createElement('button');
    newButton.className = 'action-button new-button';
    newButton.textContent = 'New';
    newButton.addEventListener('click', () => {
        createNewFile(fileType, electronAPI);
    });
    
    // Delete button (to be implemented)
    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-button delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        alert('Delete functionality will be implemented in a future update.');
    });
    
    actionButtons.appendChild(saveButton);
    actionButtons.appendChild(newButton);
    actionButtons.appendChild(deleteButton);
    
    // Assemble header
    editorHeader.appendChild(titleContainer);
    editorHeader.appendChild(navControls);
    editorHeader.appendChild(actionButtons);
    
    // Add header to container
    editorContainer.appendChild(editorHeader);
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';
    
    // Get existing editor content element or create it if it doesn't exist
    let editorContent = document.getElementById('editor-content');
    if (!editorContent) {
        editorContent = document.createElement('textarea');
        editorContent.id = 'editor-content';
        editorContent.className = 'editor-content';
        editorContent.placeholder = 'Start writing here...';
        editorContent.addEventListener('input', () => {
            isDirty = true;
            updateWordCount();
        });
    }
    
    // Create metadata editor area (div for metadata editing)
    const metadataEditor = document.createElement('div');
    metadataEditor.id = 'metadata-editor';
    metadataEditor.className = 'metadata-editor';
    
    // Add editor elements to content area
    contentArea.appendChild(editorContent);
    contentArea.appendChild(metadataEditor);
    
    // Add content area to container
    editorContainer.appendChild(contentArea);
    
    // Add word count display
    const wordCountDisplay = document.createElement('div');
    wordCountDisplay.id = 'word-count';
    wordCountDisplay.className = 'word-count';
    wordCountDisplay.textContent = 'Words: 0';
    editorContainer.appendChild(wordCountDisplay);
    
    // Return references to important elements
    return {
        titleInput,
        editorContent,
        metadataEditor
    };
}

// Open a file for editing
async function openFile(filePath, electronAPI, options = {}) {
    try {
        console.log(`Opening file: ${filePath}`);
        
        // Check for unsaved changes
        if (isDirty && currentFile) {
            const shouldSave = confirm('You have unsaved changes. Save them?');
            if (shouldSave) {
                await saveCurrentFile(electronAPI);
            }
        }
        
        // Get file type from path or options
        let fileType = options.fileType;
        if (!fileType) {
            if (filePath.includes('Book Chapters')) {
                fileType = 'chapter';
            } else if (filePath.includes('Characters')) {
                fileType = 'character';
            } else if (filePath.includes('World Lore')) {
                fileType = 'lore';
            } else if (filePath.includes('Notes')) {
                fileType = 'note';
            }
        }

        // Determine if this is a metadata file or content file
        const isMetadataFile = filePath.endsWith('metadata.json');
        const isContentFile = filePath.endsWith('content.txt');
        const isDescriptionFile = filePath.endsWith('description.txt');
        const isProfileFile = filePath.endsWith('profile.txt');
        
        // Get the content to display
        let content;
        if (isMetadataFile) {
            // For metadata files, read as JSON
            content = await electronAPI.readFile(filePath);
        } else {
            // For text files, read as text
            content = await electronAPI.readFile(filePath);
        }
        
        // Get files list if not provided
        let files = options.files;
        let currentIndex = options.currentIndex || 0;
        
        if (!files) {
            // Determine which function to call based on file type
            switch (fileType) {
                case 'chapter':
                    files = await electronAPI.getChapters(currentProject);
                    break;
                case 'character':
                    files = await electronAPI.getCharacters(currentProject);
                    break;
                case 'lore':
                    files = await electronAPI.getLoreItems(currentProject);
                    break;
                case 'note':
                    files = await electronAPI.getNotes(currentProject);
                    break;
                default:
                    files = [];
            }
            
            // Find the current file index
            currentIndex = files.findIndex(file => {
                // Match any of the possible file paths
                if (file.path === filePath) return true;
                if (file.metadataPath === filePath) return true;
                if (file.contentPath === filePath) return true;
                if (file.descriptionPath === filePath) return true;
                if (file.profilePath === filePath) return true;
                return false;
            });
            
            if (currentIndex === -1) currentIndex = 0;
        }
        
        // Create enhanced editor interface
        const { titleInput, editorContent, metadataEditor } = createEnhancedEditor(
            fileType, 
            files, 
            currentIndex, 
            electronAPI
        );
        
        // Set the current file variable
        currentFile = filePath;
        console.log(`Set currentFile to: ${currentFile}`);
        
        // Determine which part to display based on file type and path
        if (isMetadataFile && typeof content === 'object' && content !== null) {
            // This is a JSON file (metadata)
            // Display metadata in a structured way
            titleInput.value = content.name || '';
            
            // Hide text editor, show metadata editor
            editorContent.style.display = 'none';
            metadataEditor.style.display = 'block';
            
            // Clear previous content
            metadataEditor.innerHTML = '';
            
            // Create form for metadata
            const form = document.createElement('form');
            form.className = 'metadata-form';
            
            // Add basic fields (skip name as it's in the title input)
            
            if (content.description !== undefined) {
                addFormTextarea(form, 'Description', 'description', content.description || '');
            }
            
            // Add category if it exists (for lore items)
            if (content.category !== undefined) {
                addFormField(form, 'Category', 'category', content.category || '');
            }
            
            // Add attributes section if it exists and this is a character (not lore)
            if (content.attributes && typeof content.attributes === 'object' && fileType === 'character') {
                const attributesSection = document.createElement('div');
                attributesSection.className = 'attributes-section';
                
                const attributesTitle = document.createElement('h3');
                attributesTitle.textContent = 'Attributes';
                attributesSection.appendChild(attributesTitle);
                
                // Add existing attributes
                for (const [key, value] of Object.entries(content.attributes)) {
                    addFormField(attributesSection, key, `attributes.${key}`, value);
                }
                
                // Add button to add new attribute
                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.textContent = 'Add Attribute';
                addButton.className = 'action-button';
                addButton.addEventListener('click', () => {
                    showCustomDialog('Add Attribute', 'Enter the attribute name:', '')
                        .then(attributeName => {
                            if (attributeName && attributeName.trim()) {
                                addFormField(attributesSection, attributeName, `attributes.${attributeName}`, '');
                            }
                        })
                        .catch(err => console.log('Dialog cancelled'));
                });
                
                attributesSection.appendChild(addButton);
                form.appendChild(attributesSection);
            }
            
            // Add save button
            const saveMetadataButton = document.createElement('button');
            saveMetadataButton.textContent = 'Save Metadata';
            saveMetadataButton.type = 'button';
            saveMetadataButton.className = 'save-metadata-btn';
            saveMetadataButton.addEventListener('click', async () => {
                // Get the name from the title input
                const nameValue = titleInput.value.trim();
                if (!nameValue) {
                    alert('Please enter a name');
                    titleInput.focus();
                    return;
                }
                
                // Update the name in the metadata before saving
                content.name = nameValue;
                
                await saveMetadata(form, filePath, electronAPI, content);
            });
            
            form.appendChild(saveMetadataButton);
            metadataEditor.appendChild(form);
        } else {
            // This is a text file (content, description, or profile)
            // Update title from the file's metadata
            titleInput.value = files[currentIndex]?.name || '';
            
            // Set placeholder depending on the file type
            if (isDescriptionFile) {
                editorContent.placeholder = "What is your plan for this chapter?";
            } else if (isContentFile && fileType === 'chapter') {
                editorContent.placeholder = "Start writing your chapter content here...";
            } else if (isContentFile && fileType === 'note') {
                editorContent.placeholder = "Write your note here...";
            } else if (isProfileFile) {
                editorContent.placeholder = "Describe this character...";
            } else {
                editorContent.placeholder = "Start writing here...";
            }
            
            // Update editor with text content
            editorContent.value = content;
            
            // Hide metadata editor, show text editor
            metadataEditor.style.display = 'none';
            editorContent.style.display = 'block';
        }
        
        isDirty = false;

        // Update word count
        updateWordCount();

    } catch (error) {
        console.error('Error opening file:', error);
        alert('Error opening file: ' + error.message);
    }
}

// Save metadata from form
async function saveMetadata(form, filePath, electronAPI, existingMetadata = null) {
    try {
        // Get current metadata or use the provided one
        const currentMetadata = existingMetadata || await electronAPI.readFile(filePath);
        
        // Determine if this is a lore item
        const isLoreItem = filePath.includes('World Lore');
        
        // Create updated metadata object
        const updatedMetadata = { ...currentMetadata };
        
        // Update basic fields (name should already be updated from title input)
        const descriptionEl = form.querySelector('[name="description"]');
        if (descriptionEl) {
            updatedMetadata.description = descriptionEl.value;
        }
        
        const categoryEl = form.querySelector('[name="category"]');
        if (categoryEl) {
            updatedMetadata.category = categoryEl.value;
        }
        
        // Update attributes only for characters, not for lore items
        if (!isLoreItem) {
            updatedMetadata.attributes = updatedMetadata.attributes || {};
            
            const attributeInputs = form.querySelectorAll('[name^="attributes."]');
            attributeInputs.forEach(input => {
                const attributeName = input.name.replace('attributes.', '');
                updatedMetadata.attributes[attributeName] = input.value;
            });
        }
        
        // Update last modified date
        updatedMetadata.lastModified = new Date().toISOString();
        
        // Save the updated metadata
        await electronAPI.saveFile(updatedMetadata, filePath);
        
        // Reset dirty flag
        isDirty = false;
        
        console.log('Metadata saved successfully');
    } catch (error) {
        console.error('Error saving metadata:', error);
        alert('Error saving metadata: ' + error.message);
    }
}

// Save the current file
async function saveCurrentFile(electronAPI) {
    if (!currentFile) return;

    try {
        console.log(`Saving file: ${currentFile}`);
        
        // Get the current section/type based on the file path
        let fileType = '';
        if (currentFile.includes('Book Chapters')) {
            fileType = 'chapter';
        } else if (currentFile.includes('Characters')) {
            fileType = 'character';
        } else if (currentFile.includes('World Lore')) {
            fileType = 'lore';
        } else if (currentFile.includes('Notes')) {
            fileType = 'note';
        }
        
        // Check if we're editing a JSON metadata file or a text file
        if (currentFile.endsWith('metadata.json')) {
            // Metadata is saved via the metadata editor's save button
            // So we don't need to do anything here
            console.log('Metadata files are saved via their own interface');
            return;
        }
        
        // For text files, save the content from the editor
        const editorContentEl = document.getElementById('editor-content');
        if (!editorContentEl) {
            throw new Error('Editor content element not found');
        }
        
        // Get the title input which contains the current item name
        const titleInput = document.querySelector('.editor-title-input');
        
        // Save the content to the actual file
        await electronAPI.saveFile(editorContentEl.value, currentFile);
        console.log(`Saved content to ${currentFile}`);
        
        // If title input was found and this is a text file,
        // update the metadata to ensure names stay in sync
        if (titleInput && (fileType === 'chapter' || fileType === 'note' || 
                           fileType === 'character' || fileType === 'lore')) {
            // Get the current folder path (parent directory)
            const itemDir = path.dirname(currentFile);
            
            // Get the metadata path
            const metadataPath = path.join(itemDir, 'metadata.json');
            
            try {
                // Read current metadata
                const metadata = await electronAPI.readFile(metadataPath);
                
                // Update the last modified date
                metadata.lastModified = new Date().toISOString();
                
                // Save the updated metadata
                await electronAPI.saveFile(metadata, metadataPath);
                console.log(`Updated metadata at ${metadataPath}`);
            } catch (metadataError) {
                console.error('Error updating metadata:', metadataError);
            }
        }
        
        isDirty = false;
        console.log(`File saved successfully to ${currentFile}`);
        
    } catch (error) {
        console.error('Error saving file:', error);
        alert('Error saving file: ' + error.message);
    }
}

// Set up keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
    }
});

// Helper function to capitalize the first letter of a string
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Extract path module from file paths
const path = {
    basename: (filePath, ext) => {
        let base = filePath.split(/[\\/]/).pop();
        if (ext && base.endsWith(ext)) {
            base = base.slice(0, -ext.length);
        }
        return base;
    },
    dirname: (filePath) => {
        return filePath.replace(/\\/g, '/').replace(/\/[^\/]*$/, '');
    },
    join: (...paths) => {
        return paths.join('/').replace(/\/+/g, '/');
    },
    extname: (filePath) => {
        const base = filePath.split(/[\\/]/).pop();
        const match = base.match(/\.[^\.]*$/);
        return match ? match[0] : '';
    }
};

// Set up sidebar navigation
function setupNavigation() {
    const navItems = sidebarNav.querySelectorAll('a');
    console.log('Setting up navigation with items:', navItems.length);

    navItems.forEach(item => {
        let section;
        const itemText = item.textContent.toLowerCase().trim();
        
        if (itemText === 'editor') section = 'editor';
        else if (itemText === 'characters') section = 'characters';
        else if (itemText === 'world lore') section = 'lore';
        else if (itemText === 'notes') section = 'notes';
        else section = 'editor'; // Default fallback
        
        item.setAttribute('data-section', section);
        console.log(`Nav item ${itemText} assigned section: ${section}`);

        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = item.getAttribute('data-section');
            console.log(`Navigation: Clicked on section: ${sectionName}`);
            
            try {
                const { electronAPI } = window;
                if (!electronAPI) {
                    console.error('electronAPI is not available');
                    alert('Unable to navigate: Application API is not available');
                    return;
                }
                
                // Update the section
                currentSection = sectionName;
                console.log(`Navigation: Changed current section to: ${currentSection}`);
                
                // Load the section content
                loadProjectSection(sectionName, electronAPI);
            } catch (error) {
                console.error('Error during navigation:', error);
            }
        });
    });
}

// Add a field to the form
function addFormField(form, label, name, value) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = name;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = name;
    input.name = name;
    input.value = value;
    input.addEventListener('change', () => isDirty = true);
    
    formGroup.appendChild(labelEl);
    formGroup.appendChild(input);
    form.appendChild(formGroup);
    
    return input; // Return the input element for reference
}

// Add a textarea to the form
function addFormTextarea(form, label, name, value) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = name;
    
    const textarea = document.createElement('textarea');
    textarea.id = name;
    textarea.name = name;
    textarea.value = value;
    textarea.rows = 4;
    textarea.addEventListener('change', () => isDirty = true);
    
    formGroup.appendChild(labelEl);
    formGroup.appendChild(textarea);
    form.appendChild(formGroup);
    
    return textarea; // Return the textarea element for reference
}

// Create a new file based on the current section
async function createNewFile(fileType, electronAPI) {
    try {
        console.log(`Creating new file in section: ${currentSection}, file type: ${fileType}`);
        
        // Use the current section to determine file type if not explicitly provided
        if (!fileType) {
            switch (currentSection) {
                case 'editor': fileType = 'chapter'; break;
                case 'characters': fileType = 'character'; break;
                case 'lore': fileType = 'lore'; break;
                case 'notes': fileType = 'note'; break;
                default: 
                    console.error(`Unknown section: ${currentSection}`);
                    return;
            }
            console.log(`Determined file type based on section: ${fileType}`);
        }
        
        // Get the directory path based on file type
        let sectionDir;
        let namePrefix;
        
        switch (fileType) {
            case 'chapter':
                sectionDir = path.join(currentProject, 'Book Chapters');
                namePrefix = 'Chapter';
                break;
            case 'character':
                sectionDir = path.join(currentProject, 'Characters');
                namePrefix = 'Character';
                break;
            case 'lore':
                sectionDir = path.join(currentProject, 'World Lore');
                namePrefix = 'Lore Item';
                break;
            case 'note':
                sectionDir = path.join(currentProject, 'Notes');
                namePrefix = 'Note';
                break;
            default:
                console.error(`Unknown file type: ${fileType}`);
                return;
        }
        
        console.log(`Creating new ${fileType} in directory: ${sectionDir}`);
        
        // Get next available name suggestion
        const { nextName } = await electronAPI.getNextAvailableName(sectionDir, namePrefix, fileType);
        
        // Use custom dialog with the suggested name
        let name;
        try {
            name = await showCustomDialog(
                `Create New ${capitalize(fileType)}`,
                `Enter a name for the new ${fileType}:`,
                nextName
            );
        } catch (dialogError) {
            console.log('Dialog cancelled:', dialogError);
            return; // User cancelled the dialog
        }
        
        if (!name || !name.trim()) return;
        
        // Check if the name already exists
        const { exists } = await electronAPI.checkNameExists(sectionDir, name, fileType);
        if (exists) {
            // Show error and prompt again
            const customMessage = `A ${fileType} with the name "${name}" already exists. Please choose a different name:`;
            try {
                const uniqueName = await showCustomDialog(
                    'Duplicate Name',
                    customMessage,
                    `${namePrefix} (copy)`
                );
                
                if (!uniqueName || !uniqueName.trim() || uniqueName === name) {
                    return; // User cancelled or didn't change the name
                }
                
                // Check again to be sure
                const { exists: stillExists } = await electronAPI.checkNameExists(sectionDir, uniqueName, fileType);
                if (stillExists) {
                    throw new Error(`A ${fileType} with the name "${uniqueName}" still exists. Please try with a different name.`);
                }
                
                name = uniqueName;
            } catch (dialogError) {
                console.log('Dialog cancelled:', dialogError);
                return; // User cancelled the dialog
            }
        }

        console.log(`Creating new ${fileType} with name: ${name}`);

        // Create file based on type
        let filePath;
        switch (fileType) {
            case 'chapter':
                filePath = await electronAPI.createChapter(currentProject, name);
                break;
            case 'character':
                filePath = await electronAPI.createCharacter(currentProject, name);
                break;
            case 'lore':
                filePath = await electronAPI.createLoreItem(currentProject, name);
                break;
            case 'note':
                filePath = await electronAPI.createNote(currentProject, name);
                break;
        }

        console.log(`Created new ${fileType} at: ${filePath}`);
        if (filePath) {
            // Reload the current section
            await loadProjectSection(currentSection, electronAPI);

            // Open the newly created file
            // For characters and lore items, we want to open the metadata first
            let fileToOpen = filePath;
            if (fileType === 'character' || fileType === 'lore') {
                fileToOpen = path.join(filePath, 'metadata.json');
            }
            
            openFile(fileToOpen, electronAPI);
        }

    } catch (error) {
        console.error(`Error creating ${fileType}:`, error);
        alert(`Error creating ${fileType}: ${error.message}`);
    }
}

// Call init when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);