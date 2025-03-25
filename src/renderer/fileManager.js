/**
 * File Manager Module
 * Handles file operations like opening, saving, and creating files
 */

import { showCustomDialog, showConfirmDialog } from './components/Common/Modal.js';
import { path } from './shared/utils.js';
import { 
    getCurrentProject,
    getCurrentFile, 
    setCurrentFile,
    getIsDirty,
    setIsDirty,
    getCurrentSection,
    loadProjectSection
} from './projectManager.js';
import { updateWordCount } from './components/Editor/StatusBar.js';
import { addFormField, addFormTextarea } from './formUtils.js';

/**
 * Open a file for editing
 * @param {string} filePath - Path to the file to open
 * @param {Object} electronAPI - Electron API for file operations
 * @param {Object} options - Additional options
 */
export async function openFile(filePath, electronAPI, options = {}) {
    try {
        console.log(`Opening file: ${filePath}`);
        
        // Check if we have unsaved changes
        if (getIsDirty() && getCurrentFile() !== filePath) {
            const shouldDiscard = await showConfirmDialog('Unsaved Changes', 'You have unsaved changes. Discard them?');
            if (!shouldDiscard) {
                return; // User cancelled
            }
        }
        
        // Read the file content
        const fileContent = await electronAPI.readFile(filePath);
        console.log(`File loaded: ${filePath}`);
        
        // Determine if this is a metadata file
        const isMetadata = filePath.endsWith('metadata.json');
        
        // Update the current file in the shared state
        setCurrentFile(filePath);
        
        // Clear any existing editors
        const existingEditor = document.getElementById('editor-content');
        if (existingEditor) {
            existingEditor.remove();
        }
        
        const existingMetadataEditor = document.getElementById('metadata-editor');
        if (existingMetadataEditor) {
            existingMetadataEditor.remove();
        }
        
        // Create the editor container if it doesn't exist
        let editorContainer = document.querySelector('.editor-container');
        if (!editorContainer) {
            editorContainer = document.createElement('div');
            editorContainer.className = 'editor-container';
            
            const editorArea = document.querySelector('.editor-area');
            if (!editorArea) {
                console.error('Editor area not found');
                return;
            }
            
            editorArea.appendChild(editorContainer);
        }
        
        // Display file info at the top
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `
            <h3>${path.basename(filePath)}</h3>
            <p>${filePath}</p>
        `;
        
        // Remove any existing file info
        const existingFileInfo = editorContainer.querySelector('.file-info');
        if (existingFileInfo) {
            existingFileInfo.remove();
        }
        
        editorContainer.appendChild(fileInfo);
        
        // Create appropriate editor based on file type
        if (isMetadata) {
            // For metadata files, create a form-based editor
            const metadataEditor = document.createElement('div');
            metadataEditor.id = 'metadata-editor';
            
            try {
                const metadata = JSON.parse(fileContent);
                
                const form = document.createElement('form');
                form.className = 'metadata-form';
                
                // Add fields based on metadata structure
                for (const [key, value] of Object.entries(metadata)) {
                    if (typeof value === 'string') {
                        if (key === 'description' || key === 'synopsis' || key === 'notes') {
                            addFormTextarea(form, key.charAt(0).toUpperCase() + key.slice(1), key, value);
                        } else {
                            addFormField(form, key.charAt(0).toUpperCase() + key.slice(1), key, value);
                        }
                    }
                }
                
                // Add save button
                const saveButton = document.createElement('button');
                saveButton.type = 'button';
                saveButton.className = 'save-button';
                saveButton.textContent = 'Save Metadata';
                saveButton.addEventListener('click', () => saveMetadata(form, filePath, electronAPI, metadata));
                
                form.appendChild(saveButton);
                metadataEditor.appendChild(form);
            } catch (error) {
                console.error('Error parsing metadata:', error);
                metadataEditor.innerHTML = `<div class="error">Error parsing metadata: ${error.message}</div>`;
            }
            
            editorContainer.appendChild(metadataEditor);
        } else {
            // For text files, create a text editor
            const editor = document.createElement('textarea');
            editor.id = 'editor-content';
            editor.value = fileContent;
            
            // Add event listeners
            editor.addEventListener('input', () => {
                setIsDirty(true);
                updateWordCount();
            });
            
            // Add editor to container
            editorContainer.appendChild(editor);
            
            // Add a status bar for text content
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            
            const wordCount = document.createElement('span');
            wordCount.textContent = 'Words: 0';
            
            const charCount = document.createElement('span');
            charCount.textContent = 'Characters: 0';
            
            statusBar.appendChild(wordCount);
            statusBar.appendChild(charCount);
            
            editorContainer.appendChild(statusBar);
            
            // Update word count
            updateWordCount();
        }
        
        // Set dirty flag to false as we just loaded the file
        setIsDirty(false);
    } catch (error) {
        console.error('Error opening file:', error);
        showCustomDialog('Error', `Failed to open file: ${error.message}`, null, { type: 'notification' });
    }
}

/**
 * Save the current file
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function saveCurrentFile(electronAPI) {
    try {
        const currentFile = getCurrentFile();
        
        if (!currentFile) {
            console.warn('No file is currently open');
            return;
        }
        
        console.log(`Saving file: ${currentFile}`);
        
        // Determine content based on editor type
        const isMetadata = currentFile.endsWith('metadata.json');
        
        if (isMetadata) {
            // For metadata, get form values and convert to JSON
            const form = document.querySelector('.metadata-form');
            if (!form) {
                console.error('Metadata form not found');
                return;
            }
            
            // Call saveMetadata instead of duplicating code
            await saveMetadata(form, currentFile, electronAPI);
        } else {
            // For text files, get content from textarea
            const editor = document.getElementById('editor-content');
            if (!editor) {
                console.error('Editor not found');
                return;
            }
            
            const content = editor.value;
            
            // Save the file via electronAPI
            await electronAPI.writeFile(currentFile, content);
            console.log(`File saved: ${currentFile}`);
            
            // Mark as not dirty after save
            setIsDirty(false);
            
            // Show a brief notification
            const notification = document.createElement('div');
            notification.className = 'save-notification';
            notification.textContent = 'File saved';
            document.body.appendChild(notification);
            
            // Remove notification after a delay
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }, 2000);
        }
    } catch (error) {
        console.error('Error saving file:', error);
        showCustomDialog('Error', `Failed to save file: ${error.message}`, null, { type: 'notification' });
    }
}

/**
 * Save metadata from form
 * @param {HTMLFormElement} form - The form containing metadata fields
 * @param {string} filePath - Path to the metadata file
 * @param {Object} electronAPI - Electron API for file operations
 * @param {Object} existingMetadata - Existing metadata to update
 */
export async function saveMetadata(form, filePath, electronAPI, existingMetadata = null) {
    try {
        console.log(`Saving metadata to: ${filePath}`);
        
        // Get existing metadata or create new object
        const metadata = existingMetadata || {};
        
        // Collect all form input values
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.type !== 'button') { // Skip buttons
                metadata[input.name] = input.value;
            }
        });
        
        // Convert to JSON and save
        const jsonContent = JSON.stringify(metadata, null, 2);
        await electronAPI.writeFile(filePath, jsonContent);
        
        console.log(`Metadata saved to: ${filePath}`);
        
        // Mark as not dirty after save
        setIsDirty(false);
        
        // Show a brief notification
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.textContent = 'Metadata saved';
        document.body.appendChild(notification);
        
        // Remove notification after a delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 2000);
    } catch (error) {
        console.error('Error saving metadata:', error);
        showCustomDialog('Error', `Failed to save metadata: ${error.message}`, null, { type: 'notification' });
    }
}

/**
 * Create a new file based on the current section
 * @param {string} fileType - Type of file to create ('chapter', 'character', etc.)
 * @param {Object} electronAPI - Electron API for file operations
 */
export async function createNewFile(fileType, electronAPI) {
    try {
        const currentProject = getCurrentProject();
        
        console.log(`Creating new file of type: ${fileType} in project: ${currentProject}`);
        
        if (!currentProject) {
            showCustomDialog('Error', 'No project is currently open.', null, { type: 'notification' });
            return;
        }
        
        let itemName;
        let result;
        
        // Display appropriate dialog based on file type
        switch (fileType) {
            case 'chapter':
                itemName = await showCustomDialog('New Chapter', 'Enter a name for the new chapter:', 'New Chapter');
                if (itemName && itemName.trim()) {
                    result = await electronAPI.createChapter(currentProject, itemName);
                }
                break;
                
            case 'character':
                itemName = await showCustomDialog('New Character', 'Enter a name for the new character:', 'New Character');
                if (itemName && itemName.trim()) {
                    result = await electronAPI.createCharacter(currentProject, itemName);
                }
                break;
                
            case 'lore':
                itemName = await showCustomDialog('New Lore Item', 'Enter a name for the new lore item:', 'New Lore Item');
                if (itemName && itemName.trim()) {
                    result = await electronAPI.createLoreItem(currentProject, itemName);
                }
                break;
                
            case 'note':
                itemName = await showCustomDialog('New Note', 'Enter a name for the new note:', 'New Note');
                if (itemName && itemName.trim()) {
                    result = await electronAPI.createNote(currentProject, itemName);
                }
                break;
                
            default:
                console.error(`Unknown file type: ${fileType}`);
                showCustomDialog('Error', `Unknown file type: ${fileType}`, null, { type: 'notification' });
                return;
        }
        
        if (result) {
            console.log(`Created new ${fileType}: ${itemName}`);
            
            // Refresh the section to show the new item
            const section = getCurrentSection();
            await loadProjectSection(section, electronAPI);
            
            // Show success notification
            showCustomDialog('Success', `New ${fileType} "${itemName}" created successfully.`, null, { type: 'notification' });
        }
    } catch (err) {
        console.error(`Error creating ${fileType}:`, err);
        if (err.message !== 'Dialog cancelled') {
            showCustomDialog('Error', `Failed to create ${fileType}: ${err.message}`, null, { type: 'notification' });
        }
    }
}

/**
 * Create enhanced editor interface with title and navigation
 * @param {string} fileType - Type of file being edited
 * @param {Array} files - Array of file objects 
 * @param {number} currentIndex - Index of current file in files array
 * @param {Object} electronAPI - Electron API for file operations
 */
export function createEnhancedEditor(fileType, files, currentIndex, electronAPI) {
    // Placeholder - to be fully implemented
    console.log(`Creating enhanced editor for ${fileType} at index ${currentIndex}`);
    return {
        titleInput: null,
        editorContent: null,
        metadataEditor: null
    };
} 